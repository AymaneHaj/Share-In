import api from "./api";

// This interface should match the backend response
export interface DocumentResult {
  id: string;
  document_id?: string; // Handle both id and document_id
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
  [key: string]: any;
}

interface ConfirmResponse {
  message: string;
  document: DocumentResult;
}

/**
 * Uploads a document (FormData). Interceptor adds token.
 */
export const uploadDocument = async (
  formData: FormData
): Promise<DocumentResult> => {
  // The backend endpoint is /api/documents/upload
  // Don't set Content-Type manually - axios will set it automatically with boundary for FormData
  const response = await api.post("/api/documents/upload", formData);
  return response.data;
};

/**
 * Fetches the status and data of a single document by its ID.
 */
export const getDocument = async (
  documentId: string
): Promise<DocumentResult> => {
  // The backend endpoint is /api/documents/<id>
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
  // The backend endpoint is /api/documents/<id>/confirm
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
  // The backend endpoint is /api/documents/schema
  const response = await api.get("/api/documents/schema");
  return response.data;
};

/**
 * Gets all documents for the current user
 */
export const getUserDocuments = async (
  page: number = 1,
  perPage: number = 10
): Promise<{
  documents: DocumentResult[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}> => {
  const response = await api.get("/api/documents", {
    params: { page, per_page: perPage },
  });
  return response.data;
};

/**
 * Updates a document's extracted data
 */
export const updateDocument = async (
  documentId: string,
  data: { extracted_data?: any; status?: string }
): Promise<{ message: string; document: DocumentResult }> => {
  const response = await api.put(`/api/documents/${documentId}`, data);
  return response.data;
};

/**
 * Deletes a document
 */
export const deleteDocument = async (
  documentId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data;
};