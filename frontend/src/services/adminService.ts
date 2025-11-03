import api from "./api";

export interface AdminStats {
  total_users: number;
  total_documents: number;
  documents_by_type: Record<string, number>;
  documents_by_status: Record<string, number>;
  recent_documents: Document[];
}

export interface Document {
  id: string;
  document_type: string;
  status: string;
  original_filename: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  extracted_data?: any;
}

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get("/api/admin/stats");
  return response.data;
};

/**
 * Get all documents with pagination
 */
export const getAllDocuments = async (
  page: number = 1,
  perPage: number = 10,
  filters?: {
    document_type?: string;
    status?: string;
    user_id?: string;
  }
): Promise<{
  documents: Document[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}> => {
  const params: any = { page, per_page: perPage };
  if (filters?.document_type) params.document_type = filters.document_type;
  if (filters?.status) params.status = filters.status;
  if (filters?.user_id) params.user_id = filters.user_id;

  const response = await api.get("/api/admin/documents", { params });
  return response.data;
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (documentId: string): Promise<Document> => {
  const response = await api.get(`/api/admin/documents/${documentId}`);
  return response.data;
};

/**
 * Update a document
 */
export const updateDocument = async (
  documentId: string,
  data: Partial<Document>
): Promise<Document> => {
  const response = await api.put(`/api/admin/documents/${documentId}`, data);
  return response.data.document;
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  await api.delete(`/api/admin/documents/${documentId}`);
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<Array<{
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}>> => {
  const response = await api.get("/api/admin/users");
  return response.data.users;
};

