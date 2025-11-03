"""
Authentication Middleware
JWT token verification middleware for protected routes using Flask-JWT-Extended.
"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User

def auth_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.objects(id=user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 401
            
            # Add user to request context
            request.current_user = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

def admin_required(f):
    """Decorator to require admin role for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.objects(id=user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 401
            
            if user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Add user to request context
            request.current_user = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function
