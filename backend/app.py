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
        from mongoengine.connection import disconnect, get_connection
        try:
            disconnect(alias='default')
        except:
            pass
        
        mongo_uri = app.config['MONGO_URI']
        mongo_db_name = app.config['MONGO_DB_NAME']
        
        # Check if this is MongoDB Atlas (SRV format)
        is_atlas = 'mongodb+srv://' in mongo_uri or '.mongodb.net' in mongo_uri
        
        if is_atlas:
            # For MongoDB Atlas, build the URI with database name
            # Format: mongodb+srv://user:pass@cluster.net/dbname?options
            if '?' in mongo_uri:
                # URI has query params
                base_uri = mongo_uri.split('?')[0]
                # Check if database name is already in the URI
                if '/' in base_uri.split('@')[-1] and base_uri.split('@')[-1].split('/')[-1]:
                    # Database name already present, use as is but update query params
                    final_uri = f"{base_uri}?retryWrites=true&w=majority"
                else:
                    # Add database name before query params
                    if not base_uri.endswith('/'):
                        base_uri += '/'
                    final_uri = f"{base_uri}{mongo_db_name}?retryWrites=true&w=majority"
            else:
                # No query params, check if database name is present
                if '/' in mongo_uri.split('@')[-1] and mongo_uri.split('@')[-1].split('/')[-1]:
                    # Database name already present
                    final_uri = f"{mongo_uri}?retryWrites=true&w=majority"
                else:
                    # Add database name and query params
                    if not mongo_uri.endswith('/'):
                        mongo_uri += '/'
                    final_uri = f"{mongo_uri}{mongo_db_name}?retryWrites=true&w=majority"
            
            print(f"🔗 Connecting to MongoDB Atlas...")
            print(f"📍 Database: {mongo_db_name}")
            print(f"🔗 URI: {final_uri.split('@')[0]}@***")
            
            # Connect to MongoDB Atlas using the full URI
            # For Windows, we need to handle SSL properly
            try:
                import certifi
                # Use certifi for SSL certificates on Windows
                connect(
                    host=final_uri,
                    alias='default',
                    tlsCAFile=certifi.where(),
                    tlsAllowInvalidCertificates=False
                )
            except ImportError:
                # If certifi is not available, try without explicit CA file
                connect(host=final_uri, alias='default')
            except Exception as ssl_error:
                # If SSL with certifi fails, the problem is likely IP whitelist or credentials
                print(f"⚠ Warning: SSL connection failed. This is usually caused by:")
                print(f"   1. IP not whitelisted in MongoDB Atlas Network Access")
                print(f"   2. Incorrect username/password")
                print(f"   3. Network/firewall blocking the connection")
                raise ssl_error
        else:
            # Local MongoDB connection
            print(f"🔗 Connecting to local MongoDB...")
            print(f"📍 Database: {mongo_db_name}")
            connect(db=mongo_db_name, host=mongo_uri, alias='default')
        
        # Verify connection
        try:
            conn = get_connection(alias='default')
            server_info = conn.server_info()
            print(f"✓ Connected successfully to MongoDB!")
            print(f"✓ Server version: {server_info.get('version', 'unknown')}")
            print(f"✓ Database: {mongo_db_name}")
        except Exception as verify_error:
            error_str = str(verify_error)
            print(f"⚠ MongoDB connection verification failed")
            if 'SSL handshake' in error_str or 'TLSV1_ALERT' in error_str:
                print(f"⚠ This error is usually caused by IP not whitelisted in MongoDB Atlas")
                print(f"⚠ Please add your IP in MongoDB Atlas → Network Access")
                print(f"⚠ Server will start but database operations may fail")
                print(f"⚠ See backend/check_ip_whitelist.md for detailed instructions")
            else:
                print(f"⚠ Error: {error_str}")
                print(f"⚠ Server will start but database operations may fail")
            # Don't raise exception - allow server to start in degraded mode
            
    except Exception as e:
        import traceback
        print(f"✗ MongoDB connection failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        masked_uri = mongo_uri.split('@')[0] + '@***' if '@' in mongo_uri else mongo_uri
        print(f"URI used: {masked_uri}")
        print(f"Database name: {mongo_db_name}")
        print(f"\n💡 Vérifiez:")
        print(f"  1. Votre IP est dans la whitelist MongoDB Atlas (Network Access)")
        print(f"  2. Le username/password sont corrects")
        print(f"  3. Le fichier .env contient MONGO_URI et MONGO_DB_NAME")
    
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
