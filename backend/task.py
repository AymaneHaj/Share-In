# backend/task.py
from worker import celery  # <-- Import from the new 'worker.py'
from models.document import Document
# This file needs to exist: backend/services/ai_processor.py
from services.ai_processor import structured_intelligence 
import os

@celery.task(name='task.run_ai_extraction')
def run_ai_extraction(document_id: str):
    """
    Celery task to run AI extraction in the background.
    """
    try:
        print(f"🚀 Starting AI document for document ID: {document_id}")
        document = Document.objects.get(id=document_id)  # Changed from .first() to .get()
        if not document:
            print(f"❌ Error: document {document_id} not found.")
            return

        # Mark as processing as soon as the worker picks it up
        if document.status != 'processing':
            document.update_status('processing')

        if not document.image_path_recto:
            document.update_status('failed', 'Missing image_path_recto.')
            return

        # Call AI service with image URL and document type
        result_object = structured_intelligence(
            image_path_recto=document.image_path_recto, 
            image_path_verso=document.image_path_verso, 
            document_type=document.document_type
        )


        if result_object:
            # Already normalized by the AI schema
            document.extracted_data = result_object
            document.update_status('completed')
            print(f"✅ Success: document {document_id} completed.")
        else:
            document.update_status('failed', error_message="AI failed to extract data.")
            print(f"❌ Failed: AI could not process document {document_id}.")
    
    except Exception as e:
        print(f"❌ CRITICAL ERROR for document {document_id}: {str(e)}")
        # Try to update document status even if AI fails badly
        try:
            document = Document.objects.get(id=document_id)  # Changed from .first() to .get()
            if document:
                document.update_status('failed', error_message=f"System error: {str(e)}")
        except Exception as inner_e:
            print(f"❌ Error updating document status: {inner_e}")
