"""
Models Package using MongoEngine
Simple schema imports for User and document documents.
"""

from .user import User
from .document import Document

__all__ = ['User', 'Document']