# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from mongoengine import connect
import os
from config import config
from routes.auth_routes import auth_bp
from routes.document_routes import document_bp
from routes.admin_routes import admin_bp
from flask_jwt_extended import JWTManager
from worker import celery # <-- Import from new 'worker.py'

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])


    # Configure CORS
    CORS(app, 
        resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}}, 
        supports_credentials=True, 
        expose_headers=["Authorization"], 
        allow_headers=["Content-Type", "Authorization"]
    )

    # --- NEW CELERY CONFIG ---
    # Update Celery config with Flask's config
    celery.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
        document_force_execv=True,  # Critical for Windows compatibility
        worker_pool='solo'  # Use solo pool on Windows instead of prefork
    )
    # Add Flask app context to all Celery documents
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    celery.Task = ContextTask
    # --- END NEW CONFIG ---
    
    jwt = JWTManager(app)
    
    # Connect to MongoDB
    try:
        # First disconnect from any existing connections
        from mongoengine.connection import disconnect
        disconnect(alias='default')
        
        # Now establish a new connection
        connect(
            db=app.config['MONGO_DB_NAME'],
            host=app.config['MONGO_URI'],
            ssl=True,
            ssl_cert_reqs=None,  # Don't verify the certificate
            tls=True,
            tlsAllowInvalidCertificates=True,
            alias='default'
        )
        print(f"✓ Connected to MongoDB: {app.config['MONGO_DB_NAME']}")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(document_bp, url_prefix='/api/documents')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Health check route
    @app.route('/')
    def health_check():
        return jsonify({
            "message": "Flask document API is running!",
            "status": "healthy"
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app

# Create app instance
app = create_app()

if __name__ == "__main__":
    # Get configuration
    debug_mode = app.config.get('DEBUG', True)
    port = int(os.environ.get('PORT', 5000))
    
    print("🚀 Starting Flask document API...")
    print(f"📍 Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"🔧 Debug mode: {debug_mode}")
    print(f"🌐 Server: http://localhost:{port}")
    
    app.run(
        debug=debug_mode,
        port=port,
        host='0.0.0.0'
    )
