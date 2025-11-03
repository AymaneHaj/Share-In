# backend/routes/admin_routes.py
from flask import Blueprint
from controllers.admin_controller import (
    get_admin_stats,
    get_all_documents,
    get_admin_document,
    update_admin_document,
    delete_admin_document,
    get_all_users
)
from middleware.auth_middleware import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def admin_stats(): return get_admin_stats()

@admin_bp.route('/documents', methods=['GET'])
@admin_required
def admin_all_documents(): return get_all_documents()

@admin_bp.route('/documents/<document_id>', methods=['GET'])
@admin_required
def admin_get_document(document_id): return get_admin_document(document_id)

@admin_bp.route('/documents/<document_id>', methods=['PUT'])
@admin_required
def admin_update_document(document_id): return update_admin_document(document_id)

@admin_bp.route('/documents/<document_id>', methods=['DELETE'])
@admin_required
def admin_delete_document(document_id): return delete_admin_document(document_id)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def admin_all_users(): return get_all_users()
