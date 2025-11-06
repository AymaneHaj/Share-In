# backend/services/cloudinary_service.py
import cloudinary
import cloudinary.uploader
from flask import current_app

def configure_cloudinary():
    """Initializes Cloudinary configuration from Flask app config"""
    cloudinary.config(
        cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=current_app.config['CLOUDINARY_API_KEY'],
        api_secret=current_app.config['CLOUDINARY_API_SECRET'],
        secure=True  # Always use HTTPS URLs
    )

def upload_to_cloudinary(file_to_upload, folder="document_uploads"):
    """
    Uploads a file-like object to Cloudinary and returns the secure URL.
    Supports all common image formats.
    
    :param file_to_upload: The file object (e.g., request.files['file'])
    :param folder: The Cloudinary folder to upload into
    :return: Secure URL of the uploaded file, or None on failure
    """
    try:
        # Configure Cloudinary (it's safe to call this multiple times)
        configure_cloudinary()
        
        # Get filename for better format detection
        filename = getattr(file_to_upload, 'filename', '')
        
        # Upload the file with explicit image resource type
        # Cloudinary will handle format conversion if needed
        upload_result = cloudinary.uploader.upload(
            file_to_upload,
            folder=folder,
            resource_type="image",  # Explicitly set as image to support all image formats
            format="auto",  # Let Cloudinary optimize the format
            flags="immutable_cache"  # Cache optimization
        )
        
        # Return the secure (https) URL
        return upload_result.get('secure_url')
        
    except Exception as e:
        print(f"❌ Error uploading to Cloudinary: {e}")
        print(f"   File: {getattr(file_to_upload, 'filename', 'unknown')}")
        return None
