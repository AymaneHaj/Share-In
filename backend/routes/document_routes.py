from flask import Blueprint, request
from controllers.document_controller import (
    create_document, get_user_documents, get_document, update_document_data, 
    get_field_schema, delete_user_document, update_user_document_data
)
from middleware.auth_middleware import auth_required

document_bp = Blueprint('documents', __name__)

@document_bp.route('/upload', methods=['POST'])
@auth_required
def upload_document(): return create_document()

@document_bp.route('', methods=['GET'])
@auth_required
def list_documents(): return get_user_documents()

@document_bp.route('/schema', methods=['GET'])
def field_schema(): return get_field_schema()

@document_bp.route('/<document_id>/confirm', methods=['PUT'])
@auth_required
def confirm_document_data(document_id): return update_document_data(document_id)

@document_bp.route('/<document_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def document_operations(document_id):
    if request.method == 'GET':
        return get_document(document_id)
    elif request.method == 'PUT':
        return update_user_document_data(document_id)
    elif request.method == 'DELETE':
        return delete_user_document(document_id)
