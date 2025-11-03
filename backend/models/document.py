"""
document Model using MongoEngine for Document Extraction documents
MongoDB document schema for managing document extraction documents.
"""
from mongoengine import Document, StringField, DateTimeField, ReferenceField, DictField, ListField
from datetime import datetime
from .user import User

class Document(Document):
    """Document document schema for document extraction documents"""
    
    # Schema fields
    document_type = StringField(required=True, choices=["cin", "driving_license", "vehicle_registration"])
    image_path_recto = StringField(required=True)
    image_path_verso = StringField()
    user = ReferenceField(User, required=True)  
    status = StringField(
        default="pending", 
        choices=["pending", "processing", "completed", "failed", "confirmed"]
    )
    extracted_data = DictField()
    error_messages = ListField(StringField())
    original_filename = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    completed_at = DateTimeField()
    
    # MongoDB collection settings
    meta = {
        'collection': 'documents',
        'indexes': [
            'user',
            'status',
            'document_type',
            'created_at',
            ('user', 'status'),
            ('user', 'document_type'),
            ('user', 'created_at')
        ]
    }
    
    def update_status(self, new_status, error_message=None):
        """Update document status and related fields"""
        self.status = new_status
        self.updated_at = datetime.utcnow()
        
        if error_message:
            self.error_messages.append(error_message)
        
        if new_status == 'completed' or new_status == 'confirmed':
            self.completed_at = datetime.utcnow()
        
        self.save()