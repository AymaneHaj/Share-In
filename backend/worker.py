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
    connect(
        db=mongo_db_name,
        host=mongo_uri
    )
    print(f"✓ Celery worker connected to MongoDB: {mongo_db_name}")
except Exception as e:
    print(f"✗ Celery worker MongoDB connection failed: {e}")

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