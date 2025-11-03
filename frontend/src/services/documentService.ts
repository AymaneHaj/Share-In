// src/services/documentService.ts
import api from "./api";

// This interface should match the backend response
export interface DocumentResult {
  id: string;
  document_type: string;
  status: string;
  original_filename: string;
  image_path_recto: string;
  image_path_verso?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  extracted_data?: any;
  error_messages?: string[];
  [key: string]: any; // Allow other properties
}

interface ConfirmResponse {
  message: string;
  document: DocumentResult;
}

/**
 * Uploads a document. The interceptor will add the auth token.
 */
export const uploadDocument = async (
  formData: FormData
): Promise<DocumentResult> => {
  const response = await api.post("/api/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  // The backend returns the document object directly on this route
  return response.data;
};

/**
 * Fetches the status and data of a single document by its ID.
 */
export const getDocument = async (
  documentId: string
): Promise<DocumentResult> => {
  const response = await api.get(`/api/documents/${documentId}`);
  return response.data;
};

/**
 * Confirms the user-validated data.
 */
export const confirmDocument = async (
  documentId: string,
  validatedData: any
): Promise<ConfirmResponse> => {
  const response = await api.put(
    `/api/documents/${documentId}/confirm`,
    validatedData
  );
  return response.data;
};

/**
 * Fetches the field schema from the backend.
 */
export const getFieldSchema = async (): Promise<any> => {
  const response = await api.get("/api/documents/schema");
  return response.data;
};
