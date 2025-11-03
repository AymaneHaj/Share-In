"""
Authentication Controller Functions
Handles user authentication with JWT tokens and session management.
"""
from flask import request, jsonify, make_response, current_app
from datetime import datetime, timedelta
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies  
)
from models import User

def register():
    """Register a new user"""
    try:
        print("Content-Type:", request.headers.get('Content-Type'))  # Debug log
        print("Raw data:", request.get_data())  # Debug log
        data = request.get_json()
        print(f"Registration attempt with data: {data}")  # Debug log
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'name']
        for field in required_fields:
            if not data.get(field):
                print(f"Missing required field: {field}")  # Debug log
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.objects(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if User.objects(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Create new user
        user = User(
            username=data['username'].strip(),
            email=data['email'].lower().strip(),
            name=data['name'].strip()
        )
        user.set_password(data['password'])
        user.save()
        
        # Generate access and refresh tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Create response
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        import traceback
        print(f"Registration error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

def login():
    """Login user and return tokens"""
    try:
        data = request.get_json()
        print(f"Login attempt with email: {data.get('email')}")  # Debug log
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            print("Missing email or password")  # Debug log
            return jsonify({'error': 'Email and password are required'}), 400

        # Find user
        user = User.objects(email=data['email']).first()
        if not user:
            print(f"User not found with email: {data.get('email')}")  # Debug log
            return jsonify({'error': 'Invalid username or password'}), 401
            
        if not user.check_password(data['password']):
            print(f"Invalid password for user: {data.get('email')}")  # Debug log
            return jsonify({'error': 'Invalid username or password'}), 401
            
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def logout():
    """Logs out the user by clearing the JWT cookie."""
    try:
        response = jsonify({'message': 'Logout successful'})
        unset_jwt_cookies(response)
        return response, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@jwt_required()
def get_current_user():
    """Get current authenticated user info"""
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'name': user.name,
            'role': user.role
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jwt_required()
def change_password():
    """Change user's password"""
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.get_json()
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current and new passwords are required'}), 400
            
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        user.set_password(data['new_password'])
        user.save()
        
        return jsonify({'message': 'Password updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
