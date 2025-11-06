# backend/services/ai_processor.py

from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError, field_validator
import json
import os
from datetime import datetime
from typing import Optional, List
from flask import current_app


# --- Type-Specific Schemas with light validation ---

def _normalize_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    v = value.strip().replace("-", "/").replace(".", "/")
    return v


class VehicleRegistrationSchema(BaseModel):
    registration_number: Optional[str] = Field(None, description="Numéro d'immatriculation")
    owner_name_fr: Optional[str] = None
    owner_name_ar: Optional[str] = None
    owner_address_fr: Optional[str] = None
    owner_address_ar: Optional[str] = None
    usage: Optional[str] = None
    first_registration_date: Optional[str] = None
    first_registration_morocco_date: Optional[str] = None
    expiry_date: Optional[str] = None
    vin: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None

    @field_validator('first_registration_date', 'first_registration_morocco_date', 'expiry_date')
    @classmethod
    def normalize_dates(cls, v: Optional[str]):
        return _normalize_date(v)


class DrivingLicenseSchema(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    birth_place_fr: Optional[str] = None
    birth_place_ar: Optional[str] = None
    cin_number: Optional[str] = None
    address_fr: Optional[str] = None
    address_ar: Optional[str] = None
    license_number: Optional[str] = None
    issue_date: Optional[str] = None
    issue_place: Optional[str] = None
    categories: Optional[List[str]] = None
    expiry_date: Optional[str] = None

    @field_validator('birth_date', 'issue_date', 'expiry_date')
    @classmethod
    def normalize_dates(cls, v: Optional[str]):
        return _normalize_date(v)


class CINSchema(BaseModel):
    card_number: Optional[str] = None
    last_name_fr: Optional[str] = None
    last_name_ar: Optional[str] = None
    first_name_fr: Optional[str] = None
    first_name_ar: Optional[str] = None
    birth_date: Optional[str] = None
    birth_place_fr: Optional[str] = None
    birth_place_ar: Optional[str] = None
    expiry_date: Optional[str] = None
    sex: Optional[str] = None
    father_name_fr: Optional[str] = None
    father_name_ar: Optional[str] = None
    mother_name_fr: Optional[str] = None
    mother_name_ar: Optional[str] = None
    address_fr: Optional[str] = None
    address_ar: Optional[str] = None
    can_number: Optional[str] = None

    @field_validator('birth_date', 'expiry_date')
    @classmethod
    def normalize_dates(cls, v: Optional[str]):
        return _normalize_date(v)


# --- AI Extraction Function (Fixed) ---
def structured_intelligence(image_path_recto: str, document_type: str, image_path_verso: Optional[str] = None) -> dict | None:
    """
    Takes an image URL AND a document type,
    calls OpenAI with the UNIFIED schema,
    and returns a validated Pydantic object.
    
    Handles both single (recto) and double (recto/verso) images.
    """

    try:
        API_KEY = current_app.config.get('OPENAI_API_KEY')
        BASE_URL = current_app.config.get('OPENAI_BASE_URL')
        MODEL = current_app.config.get('OPENAI_MODEL')
        
        # Validate that all required config values are present
        if not API_KEY or not BASE_URL or not MODEL:
            missing = []
            if not API_KEY:
                missing.append('OPENAI_API_KEY')
            if not BASE_URL:
                missing.append('OPENAI_BASE_URL')
            if not MODEL:
                missing.append('OPENAI_MODEL')
            print(f"❌ Error: OpenAI config not set in Flask app. Missing: {', '.join(missing)}")
            return None
    except Exception as e:
        print(f"❌ Error: Failed to get OpenAI config. Error: {e}")
        return None

    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    
    # --- MODIFIED: Dynamic System Prompt ---
    system_prompt = (
        f"You are an expert OCR assistant for Moroccan documents. "
        f"The user uploaded a **{document_type}**. "
        f"Extract all visible fields and fit them into the provided JSON schema. "
        f"Only fill the fields relevant to the **{document_type}** and leave the others as null.\n\n"
        f"**CRITICAL EXTRACTION RULES:**\n"
        f"1. Extract text EXACTLY as it appears on the document. Do NOT add, remove, or modify any characters.\n"
        f"2. Do NOT add any extra letters like 'i', 'e', or any other characters that are not visible in the image.\n"
        f"3. Copy the text character-by-character as it appears, preserving the original spelling.\n\n"
        f"**CRITICAL INSTRUCTION FOR ARABIC:**\n"
        f"- Pay extremely close attention to Arabic text. Your OCR may drop letters, but DO NOT add letters that are not there.\n"
        f"- Double-check for missing 'ا' (Alif) or 'ل' (Lam), especially at the beginning of names (e.g., 'ال' prefix).\n"
        f"- If the text is 'سم' it should likely be 'إسم'. If it is 'يوسف' it should not be 'وسف'. Be very precise.\n"
        f"- Extract Arabic text EXACTLY as written. Do NOT add 'i' or any other characters.\n\n"
        f"**CRITICAL INSTRUCTION FOR FRENCH:**\n"
        f"- Extract French text EXACTLY as it appears on the document.\n"
        f"- Do NOT add 'i' or any other letters that are not visible in the image.\n"
        f"- Preserve the original spelling and capitalization.\n"
        f"- If a word appears as 'Nom', extract it as 'Nom', not 'Nomi' or 'Nomi'.\n"
    )
    
    # Add context based on document type and image configuration
    if document_type == 'cin':
        # For CIN, check if verso exists and is different (two separate images) or same (combined image) or None (only recto)
        if image_path_verso and image_path_verso != image_path_recto:
            # Two separate images provided
            system_prompt += (
                "\nThe user has provided TWO separate images: "
                "the first image is the RECTO (Front) and the second image is the VERSO (Back). "
                "You must extract data from BOTH images to fill the schema (e.g., address is on the verso)."
            )
        elif image_path_verso == image_path_recto:
            # Single combined image (one image with both sides)
            system_prompt += (
                "\nThe user has provided ONE image that contains BOTH the front (RECTO) and back (VERSO) sides of the CIN card combined together. "
                "You must carefully examine the entire image to extract data from both sides and fill the complete schema. "
            )
        else:
            # Only recto provided, verso is missing (optional)
            system_prompt += (
                "\nThe user has provided ONLY the RECTO (Front) side of the CIN card. "
                "Extract all available data from the recto side. "
                "Fields that are typically on the verso (father_name, mother_name, address, can_number) will not be available "
                "and should be left as null."
            )
    elif document_type == 'driving_license':
        system_prompt += "\nThe user has provided ONE image of the RECTO (Front) of the driving license."
        if image_path_verso:
            system_prompt += " They also provided a VERSO (Back) image, which contains categories. Extract categories from the verso image."
    else:
        system_prompt += "\nThe user has provided ONE image."
    # --- END MODIFICATION ---

    
    # --- MODIFIED: Dynamic Messages List ---
    # We build the list of messages dynamically
    
    # 1. Start with the system prompt
    messages_payload = [
        {"role": "system", "content": system_prompt}
    ]
    
    # 2. Create the user content (which is a list of images)
    user_content_list = []
    
    # Add the Recto image (always present)
    user_content_list.append({
        "type": "image_url",
        "image_url": {"url": image_path_recto}
    })
    
    # Add the Verso image ONLY if it exists AND is different from recto
    if image_path_verso and image_path_verso != image_path_recto:
        user_content_list.append({
            "type": "image_url",
            "image_url": {"url": image_path_verso}
        })
        
    # 3. Add the user content block to the main messages payload
    messages_payload.append({
        "role": "user",
        "content": user_content_list
    })
    # --- END MODIFICATION ---

    try:
        # Select schema per document type
        model_map = {
            'vehicle_registration': VehicleRegistrationSchema,
            'driving_license': DrivingLicenseSchema,
            'cin': CINSchema,
        }
        model_cls = model_map.get(document_type, CINSchema)

        # Step 1: Call the OpenAI API
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages_payload,  # <-- Use the new dynamic payload
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": f"{document_type}_schema",
                    "schema": model_cls.model_json_schema(), 
                },
            },
            timeout=120.0,  # 2 minutes timeout for large images
        )

        content = response.choices[0].message.content
        print(f"\n📦 Raw Response ({document_type}):")
        print(content)

        # Step 2: Parse and Validate the response
        json_data = json.loads(content)
        parsed_result = model_cls.model_validate(json_data)
        
        # Step 3: Return normalized dict
        return parsed_result.model_dump()
    
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"❌ Error: Failed to parse or validate AI response.")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        print(f"❌ Error: OpenAI API call failed.")
        print(f"   Error Type: {error_type}")
        print(f"   Error Message: {error_message}")
        print(f"   Document Type: {document_type}")
        print(f"   Image Recto: {image_path_recto}")
        if image_path_verso:
            print(f"   Image Verso: {image_path_verso}")
        import traceback
        traceback.print_exc()
        return None

