from celery import Celery
import os
import dotenv
from flask import Flask

from config import config
# --- ---

dotenv.load_dotenv()

# Create Flask app for worker context
flask_app = Flask(__name__)

config_name = os.environ.get('FLASK_CONFIG', 'default')
flask_app.config.from_object(config[config_name])
# --- ---

mongo_uri = flask_app.config.get('MONGO_URI')
mongo_db_name = flask_app.config.get('MONGO_DB_NAME')

try:
    from mongoengine import connect
    from mongoengine.connection import disconnect, get_connection
    
    try:
        disconnect(alias='default')
    except:
        pass
    
    # Check if this is MongoDB Atlas (SRV format)
    is_atlas = 'mongodb+srv://' in mongo_uri or '.mongodb.net' in mongo_uri
    
    if is_atlas:
        # For MongoDB Atlas, build the URI with database name
        if '?' in mongo_uri:
            base_uri = mongo_uri.split('?')[0]
            # Check if database name is already in the URI
            if '/' in base_uri.split('@')[-1] and base_uri.split('@')[-1].split('/')[-1]:
                # Database name already present
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
            raise ssl_error
    else:
        # Local MongoDB connection
        connect(db=mongo_db_name, host=mongo_uri, alias='default')
    
    # Verify connection
    try:
        conn = get_connection(alias='default')
        conn.server_info()
        print(f"✓ Celery worker connected to MongoDB: {mongo_db_name}")
    except Exception as verify_error:
        error_str = str(verify_error)
        print(f"⚠ Celery worker MongoDB connection verification failed")
        if 'SSL handshake' in error_str or 'TLSV1_ALERT' in error_str:
            print(f"⚠ This error is usually caused by IP not whitelisted in MongoDB Atlas")
            print(f"⚠ Please add your IP in MongoDB Atlas → Network Access")
            print(f"⚠ Celery worker will continue but may not work properly until MongoDB is connected")
        else:
            print(f"⚠ Error: {error_str}")
            print(f"⚠ Celery worker will continue but may not work properly until MongoDB is connected")
        
except Exception as e:
    import traceback
    print(f"✗ Celery worker MongoDB connection failed: {e}")
    print(f"Traceback: {traceback.format_exc()}")

# This creates the Celery app instance
celery = Celery(
    'task',
    broker=flask_app.config.get('CELERY_BROKER_URL'),
    backend=flask_app.config.get('CELERY_RESULT_BACKEND'),
    include=['task']
)

# Update Celery config to include Flask app
class FlaskTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            return self.run(*args, **kwargs)

celery.Task = FlaskTask

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    task_force_execv=True,  # Critical for Windows compatibility
    worker_pool='solo'      # Use solo pool on Windows instead of prefork
)
