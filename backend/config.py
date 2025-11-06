"""
Configuration file for Flask application.
Handles environment variables and application settings.
"""
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class with common settings."""

    # --- NEW: Cloudinary settings ---
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

    # --- OpenAI settings ---
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_BASE_URL = os.environ.get('OPENAI_BASE_URL', 'https://models.github.ai/inference')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'openai/gpt-4.1')

    # File Upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    # Accept all common image formats
    ALLOWED_EXTENSIONS = {
        'png', 'jpg', 'jpeg', 'jpe', 'jfif',  # JPEG variants
        'webp', 'gif', 'bmp', 'tiff', 'tif',  # Other common formats
        'svg', 'ico', 'heic', 'heif',         # Additional formats
        'avif', 'jp2', 'j2k', 'jpx'           # Modern formats
    }
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # MongoDB settings
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/flask_document_app'
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'flask_document_app'
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
    
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    #--- Celery (Redis Broker) settings (Still needed!) ---
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    JWT_COOKIE_SECURE = False

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    JWT_COOKIE_SECURE = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
