# backend/controllers/admin_controller.py
from flask import request, jsonify
from models.document import Document
from models.user import User
from controllers.document_controller import document_to_json
from datetime import datetime

def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        total_users = User.objects().count()
        total_documents = Document.objects().count()
        
        # Documents by type
        documents_by_type = {}
        for doc_type in ['cin', 'driving_license', 'vehicle_registration']:
            count = Document.objects(document_type=doc_type).count()
            documents_by_type[doc_type] = count
        
        # Documents by status
        documents_by_status = {}
        for status in ['pending', 'processing', 'completed', 'failed', 'confirmed']:
            count = Document.objects(status=status).count()
            documents_by_status[status] = count
        
        # Recent documents (last 10)
        recent_documents = Document.objects().order_by('-created_at').limit(10)
        recent_docs_list = [document_to_json(doc) for doc in recent_documents]
        
        return jsonify({
            'total_users': total_users,
            'total_documents': total_documents,
            'documents_by_type': documents_by_type,
            'documents_by_status': documents_by_status,
            'recent_documents': recent_docs_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_all_documents():
    """Get all documents with pagination and filters (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        document_type = request.args.get('document_type')
        status = request.args.get('status')
        user_id = request.args.get('user_id')
        
        # Build query
        query = {}
        if document_type:
            query['document_type'] = document_type
        if status:
            query['status'] = status
        if user_id:
            query['user'] = user_id
        
        # Get paginated documents manually
        skip = (page - 1) * per_page
        
        if query:
            documents_query = Document.objects(**query).order_by('-created_at')
        else:
            documents_query = Document.objects().order_by('-created_at')
        
        # Get total count
        total = documents_query.count()
        
        # Get paginated items
        documents = documents_query.skip(skip).limit(per_page)
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
        
        # Get user info for each document
        documents_list = []
        for doc in documents:
            try:
                doc_dict = document_to_json(doc)
                # Add user info
                try:
                    if hasattr(doc.user, 'id'):
                        user = User.objects(id=doc.user.id).first()
                        if user:
                            doc_dict['user'] = {
                                'id': str(user.id),
                                'name': user.name,
                                'email': user.email
                            }
                        else:
                            doc_dict['user'] = None
                    else:
                        doc_dict['user'] = None
                except Exception as user_error:
                    print(f"Error getting user for document {doc.id}: {user_error}")
                    doc_dict['user'] = None
                
                documents_list.append(doc_dict)
            except Exception as doc_error:
                print(f"Error serializing document {doc.id}: {doc_error}")
                continue
        
        return jsonify({
            'documents': documents_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_admin_document(document_id):
    """Get a specific document by ID (admin only)"""
    try:
        document = Document.objects(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        doc_dict = document_to_json(document)
        
        # Add user info
        try:
            user = User.objects(id=document.user.id).first()
            if user:
                doc_dict['user'] = {
                    'id': str(user.id),
                    'name': user.name,
                    'email': user.email
                }
        except:
            doc_dict['user'] = None
        
        return jsonify(doc_dict), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_admin_document(document_id):
    """Update a document (admin only)"""
    try:
        document = Document.objects(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'extracted_data' in data:
            document.extracted_data = data['extracted_data']
        
        if 'status' in data:
            new_status = data['status']
            if new_status in ['pending', 'processing', 'completed', 'failed', 'confirmed']:
                document.update_status(new_status)
        
        document.save()
        
        return jsonify({
            'message': 'Document updated successfully',
            'document': document_to_json(document)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def delete_admin_document(document_id):
    """Delete a document (admin only)"""
    try:
        document = Document.objects(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        document.delete()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_all_users():
    """Get all users (admin only)"""
    try:
        users = User.objects().order_by('-created_at')
        users_list = []
        for user in users:
            users_list.append({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            })
        
        return jsonify({'users': users_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
