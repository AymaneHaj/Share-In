from mongoengine import Document, StringField, DateTimeField, BooleanField
from datetime import datetime
import bcrypt

class User(Document):
    """User document schema (Employee)"""
    
    username = StringField(required=True, unique=True, min_length=3, max_length=50)
    email = StringField(required=True, unique=True)
    password_hash = StringField(required=True)
    name = StringField(required=True, max_length=100)
    role = StringField(default='user', choices=['user', 'admin'])
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'users',
        'indexes': [
            'email',
            'username', 
            'created_at'
        ]
    }
    
    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
