"""
Authentication Routes Blueprint
Routes for user authentication: register, login, logout, profile management.
"""
from flask import Blueprint, jsonify
from controllers.auth_controller import register, login, get_current_user, change_password, logout
from middleware.auth_middleware import auth_required
from models.user import User

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__)

# Debug endpoint to clear users (DEVELOPMENT ONLY)
@auth_bp.route('/debug/clear-users', methods=['POST'])
def clear_users():
    """Clear all users from the database (DEVELOPMENT ONLY)"""
    try:
        User.objects.delete()
        return jsonify({'message': 'All users cleared successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Public routes (no authentication required)
@auth_bp.route('/register', methods=['POST'])
def register_route():
    """Register a new user"""
    return register()

@auth_bp.route('/login', methods=['POST'])
def login_route():
    """Login user"""
    return login()

@auth_bp.route('/logout', methods=['POST'])
def logout_route():
    return logout()


# Protected routes (authentication required)
@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_current_user_route():
    """Get current user information"""
    return get_current_user()

@auth_bp.route('/change-password', methods=['PUT'])
@auth_required
def change_password_route():
    """Change user password"""
    return change_password()
