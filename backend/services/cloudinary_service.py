# backend/services/cloudinary_service.py
import cloudinary
import cloudinary.uploader
from flask import current_app

def configure_cloudinary():
    """Initializes Cloudinary configuration from Flask app config"""
    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = current_app.config.get('CLOUDINARY_API_KEY')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET')
    
    # Validate that all required config values are present
    if not cloud_name or not api_key or not api_secret:
        missing = []
        if not cloud_name:
            missing.append('CLOUDINARY_CLOUD_NAME')
        if not api_key:
            missing.append('CLOUDINARY_API_KEY')
        if not api_secret:
            missing.append('CLOUDINARY_API_SECRET')
        raise ValueError(f"Missing Cloudinary configuration: {', '.join(missing)}")
    
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
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
            flags="immutable_cache"  # Cache optimization
        )
        
        # Return the secure (https) URL
        return upload_result.get('secure_url')
        
    except ValueError as e:
        # Configuration error
        print(f"❌ Cloudinary configuration error: {e}")
        return None
    except Exception as e:
        # Log detailed error information
        error_type = type(e).__name__
        error_message = str(e)
        filename = getattr(file_to_upload, 'filename', 'unknown')
        file_size = getattr(file_to_upload, 'content_length', 'unknown')
        
        print(f"❌ Error uploading to Cloudinary:")
        print(f"   Error Type: {error_type}")
        print(f"   Error Message: {error_message}")
        print(f"   File: {filename}")
        print(f"   File Size: {file_size} bytes")
        
        # Import traceback for detailed error logging
        import traceback
        print(f"   Traceback:")
        traceback.print_exc()
        
        return None
