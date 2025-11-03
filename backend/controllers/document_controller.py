# backend/controllers/document_controller.py
import os
import base64
from flask import request, jsonify, current_app
from datetime import datetime
from models.document import Document
from models.user import User
# Import the AI function from its new location
from task import run_ai_extraction
from services.cloudinary_service import upload_to_cloudinary
import traceback

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def document_to_json(document: Document) -> dict:
    """Helper function to serialize document object"""
    try:
        return {
            'id': str(document.id),
            'document_type': document.document_type,
            'original_filename': document.original_filename,
            'image_path_recto': document.image_path_recto,
            'image_path_verso': document.image_path_verso,
            'status': document.status,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
            'completed_at': document.completed_at.isoformat() if document.completed_at else None,
            'extracted_data': document.extracted_data if document.status == 'completed' or document.status == 'confirmed' else None,
            'error_messages': document.error_messages if document.error_messages else None
        }
    except Exception as e:
        traceback.print_exc()
        raise e

def create_document():
    try:
        user = getattr(request, 'current_user', None)
        if not user: return jsonify({'error': 'User not authenticated'}), 401
        
        document_type = request.form.get('document_type')
        
        if not document_type:
            return jsonify({'error': 'document_type is required'}), 400
        
        # Validate document type
        valid_types = ['cin', 'driving_license', 'vehicle_registration']
        if document_type not in valid_types:
            return jsonify({
                'error': f'Invalid document_type. Must be one of: {", ".join(valid_types)}'
            }), 400
        
        upload_folder = f"uploads/{user.id}/{document_type}"

        cloud_url_recto = None
        cloud_url_verso = None
        original_filename = ""

        # All document types: recto required, verso optional
        # Check for recto file (required)
        if 'file_recto' not in request.files:
            # Fallback: accept 'file' for backward compatibility
            if 'file' in request.files:
                file_recto = request.files['file']
            else:
                return jsonify({'error': 'Recto (Front) file is required'}), 400
        else:
            file_recto = request.files['file_recto']
        
        if not file_recto or file_recto.filename == '':
            return jsonify({'error': 'Recto (Front) file is required'}), 400
            
        if not allowed_file(file_recto.filename):
            return jsonify({'error': 'Invalid recto file format. Only image files are allowed.'}), 400
        
        cloud_url_recto = upload_to_cloudinary(file_recto, folder=upload_folder)
        if not cloud_url_recto:
            return jsonify({'error': 'Cloudinary upload failed for recto file'}), 500
        
        # Verso is optional for all document types
        cloud_url_verso = None
        if 'file_verso' in request.files:
            file_verso = request.files['file_verso']
            if file_verso and file_verso.filename != '':
                if not allowed_file(file_verso.filename):
                    return jsonify({'error': 'Invalid verso file format. Only image files are allowed.'}), 400
                
                cloud_url_verso = upload_to_cloudinary(file_verso, folder=upload_folder)
                if not cloud_url_verso:
                    return jsonify({'error': 'Cloudinary upload failed for verso file'}), 500
                
                original_filename = f"{file_recto.filename}, {file_verso.filename}"
            else:
                # Verso field present but empty - treat as optional
                original_filename = file_recto.filename
                cloud_url_verso = None
        else:
            # No verso file provided - that's fine, it's optional
            original_filename = file_recto.filename
            cloud_url_verso = None

        # --- Create document in DB ---
        document = Document(
            document_type=document_type,
            user=user.id,
            original_filename=original_filename,
            image_path_recto=cloud_url_recto,
            image_path_verso=cloud_url_verso,
            status='pending'
        )
        document.save()

        # --- Queue Celery document ---
        run_ai_extraction.delay(str(document.id)) 

        # Return response matching DocumentResult interface
        response_data = {
            'id': str(document.id),
            'document_id': str(document.id),  # Keep both for compatibility
            'document_type': document.document_type,
            'status': document.status,
            'original_filename': document.original_filename,
            'image_path_recto': cloud_url_recto,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
        }
        
        # Include verso URL if it exists (for CIN, it's the same image)
        if cloud_url_verso:
            response_data['image_path_verso'] = cloud_url_verso
        
        return jsonify(response_data), 202
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Failed to create document: {str(e)}"}), 500
    


def get_user_documents():
    """Get all documents for the current user"""
    try:
        user = getattr(request, 'current_user', None)
        if not user:
            return jsonify({'error': 'User not authenticated'}), 401
            
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Build query
        query = {'user': user.id}
        
        # Get paginated documents manually
        skip = (page - 1) * per_page
        documents_query = Document.objects(**query).order_by('-created_at')
        
        # Get total count
        total = documents_query.count()
        
        # Get paginated items
        documents = documents_query.skip(skip).limit(per_page)
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
        
        documents_list = [document_to_json(document) for document in documents]

        return jsonify({
            'documents': documents_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_field_schema():
    """Return grouped field schema per document type for the frontend UI"""
    schema = {
        'vehicle_registration': [
            {
                'title': 'Recto',
                'fields': [
                    {'key': 'registration_number', 'label': "Numéro d'immatriculation"},
                    {'key': 'owner_name_fr', 'label': 'Propriétaire (Français)'},
                    {'key': 'owner_name_ar', 'label': 'Propriétaire (العربية)'},
                    {'key': 'owner_address_fr', 'label': 'Adresse (Français)'},
                    {'key': 'owner_address_ar', 'label': 'Adresse (العربية)'},
                    {'key': 'usage', 'label': 'Usage'},
                    {'key': 'first_registration_date', 'label': '1ère Mise en Circulation'},
                    {'key': 'first_registration_morocco_date', 'label': 'M.C. au Maroc'},
                    {'key': 'expiry_date', 'label': 'Fin de validité'},
                    {'key': 'vin', 'label': 'N° de châssis (VIN)'},
                    {'key': 'make', 'label': 'Marque'},
                    {'key': 'model', 'label': 'Modèle'},
                ],
            }
        ],
        'driving_license': [
            {
                'title': 'Recto',
                'fields': [
                    {'key': 'first_name', 'label': 'Prénom'},
                    {'key': 'last_name', 'label': 'Nom'},
                    {'key': 'birth_date', 'label': 'Date de naissance'},
                    {'key': 'birth_place_fr', 'label': 'Lieu de naissance (Français)'},
                    {'key': 'birth_place_ar', 'label': 'Lieu de naissance (العربية)'},
                    {'key': 'cin_number', 'label': 'N° de la C.I.N.'},
                    {'key': 'address_fr', 'label': 'Adresse (Français)'},
                    {'key': 'address_ar', 'label': 'Adresse (العربية)'},
                    {'key': 'license_number', 'label': 'Permis N°'},
                    {'key': 'issue_date', 'label': 'Date de délivrance'},
                    {'key': 'issue_place', 'label': 'Lieu de délivrance'},
                    {'key': 'categories', 'label': 'Catégories'},
                    {'key': 'expiry_date', 'label': 'Date de fin de validité'},
                ],
            }
        ],
        'cin': [
            {
                'title': 'Recto',
                'fields': [
                    {'key': 'card_number', 'label': 'N° de la carte'},
                    {'key': 'last_name_fr', 'label': 'Nom (Français)'},
                    {'key': 'last_name_ar', 'label': 'Nom (العربية)'},
                    {'key': 'first_name_fr', 'label': 'Prénom (Français)'},
                    {'key': 'first_name_ar', 'label': 'Prénom (العربية)'},
                    {'key': 'birth_date', 'label': 'Date de naissance'},
                    {'key': 'birth_place_fr', 'label': 'Lieu de naissance (Français)'},
                    {'key': 'birth_place_ar', 'label': 'Lieu de naissance (العربية)'},
                    {'key': 'expiry_date', 'label': 'Date de fin de validité'},
                    {'key': 'sex', 'label': 'Sexe'},
                ],
            },
            {
                'title': 'Verso',
                'fields': [
                    {'key': 'father_name_fr', 'label': 'Nom du Père (Français)'},
                    {'key': 'father_name_ar', 'label': 'Nom du Père (العربية)'},
                    {'key': 'mother_name_fr', 'label': 'Nom de la Mère (Français)'},
                    {'key': 'mother_name_ar', 'label': 'Nom de la Mère (العربية)'},
                    {'key': 'address_fr', 'label': 'Adresse (Français)'},
                    {'key': 'address_ar', 'label': 'Adresse (العربية)'},
                    {'key': 'can_number', 'label': 'N° de Série / CAN (Optionnel)'},
                ],
            },
        ],
    }
    return jsonify(schema), 200

def get_document(document_id):
    """Get a specific document by ID"""
    try:
        user = getattr(request, 'current_user', None)
        if not user:
            return jsonify({'error': 'User not authenticated'}), 401
            
        # Find document
        document = Document.objects(id=document_id, user=user.id).first()
        if not document:
            return jsonify({'error': 'document not found'}), 404
            
        return jsonify(document_to_json(document)), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def update_document_data(document_id):
    """
    Updates a document with the user-validated data from the frontend.
    """
    try:
        # ... (l-code dyal l-user o l-check) ...
        user = getattr(request, 'current_user', None)
        if not user: return jsonify({'error': 'User not authenticated'}), 401
        document = Document.objects(id=document_id, user=user.id).first()
        if not document: return jsonify({'error': 'document not found'}), 404

        # Only allow confirmation when extraction is completed
        if document.status not in ['completed']:
            return jsonify({'error': f'Cannot confirm document with status {document.status}'}), 400

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Persist user-reviewed data and mark as confirmed
        document.extracted_data = data
        document.update_status('confirmed')

        return jsonify({
            'message': 'document confirmed successfully',
            'document': document_to_json(document)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
