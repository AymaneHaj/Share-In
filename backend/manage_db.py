from mongoengine import connect, disconnect
from models.user import User
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Security check: Only allow running in development environment
if os.environ.get('FLASK_ENV') != 'development':
    print("ERROR: This script can only be run in development environment")
    print("Set FLASK_ENV=development to run this script")
    sys.exit(1)

def clear_users():
    """Clear all users from the database"""
    try:
        print("Starting user cleanup...")
        print(f"MongoDB URI: {os.environ.get('MONGO_URI')}")
        print(f"Database name: {os.environ.get('MONGO_DB_NAME')}")
        
        # First disconnect any existing connections
        print("Disconnecting from any existing connections...")
        disconnect(alias='default')
        
        # Connect to MongoDB
        print("Connecting to MongoDB...")
        connect(
            db=os.environ.get('MONGO_DB_NAME'),
            host=os.environ.get('MONGO_URI'),
            ssl=True,
            ssl_cert_reqs=None,
            tls=True,
            tlsAllowInvalidCertificates=True,
            alias='default'
        )
        print("Successfully connected to MongoDB")
        
        # Delete all users
        print("Deleting users...")
        count = User.objects.delete()
        print(f"Successfully deleted {count} users from the database")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    clear_users()