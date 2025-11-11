// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
// Import the new services
import * as documentService from "../services/documentService";
// Import the shared type
import type { DocumentResult } from "../services/documentService";
// Import auth context
import { useAuth } from "../contexts/AuthContext";
// Import dashboard tabs context
import { useDashboardTabs } from "../contexts/DashboardTabsContext";
// Import icons
import {
  UploadCloud,
  FileText,
  ScanFace,
  Car,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  ArrowRight,
  Trash2,
  Edit,
  Eye,
  XCircle,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
// Import the HEIC converter
import heic2any from "heic2any";

// --- Interfaces ---

// Types for field schema
interface SchemaField {
  key: string;
  label: string;
}
interface SchemaGroup {
  title: string;
  fields: SchemaField[];
}
type SchemaData = Record<string, SchemaGroup[]>;

// This interface is for the UI selection cards
interface DocumentType {
  id: "cin" | "driving_license" | "vehicle_registration";
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  gradient: string;
  shadowColor: string;
}

// --- The Component ---
const DashboardPage: React.FC = () => {
  // Get current user
  const { user } = useAuth();
  
  // Tab state from context
  const { activeTab, setActiveTab } = useDashboardTabs();
  
  // --- States ---
  const [selectedType, setSelectedType] = useState<DocumentType["id"] | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [error, setError] = useState<string>("");

  // NEW: State for HEIC conversion
  const [isConverting, setIsConverting] = useState(false);

  // This state holds the full API response for the document
  const [uploadResult, setUploadResult] = useState<DocumentResult | null>(null);

  // This state holds the data for the validation form
  const [editableData, setEditableData] = useState<any>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // File states - used for other document types
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // CIN specific states - for separate images upload
  const [uploadedFileRecto, setUploadedFileRecto] = useState<File | null>(null);
  const [previewRecto, setPreviewRecto] = useState<string | null>(null);
  const [isDraggingRecto, setIsDraggingRecto] = useState(false);
  const [uploadedFileVerso, setUploadedFileVerso] = useState<File | null>(null);
  const [previewVerso, setPreviewVerso] = useState<string | null>(null);
  const [isDraggingVerso, setIsDraggingVerso] = useState(false);

  // State for upload source modal (camera or file) - only used on desktop
  const [showUploadSourceModal, setShowUploadSourceModal] = useState(false);
  const [uploadSourceSide, setUploadSourceSide] = useState<"single" | "recto" | "verso">("single");

  // Detect if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
  };

  // PRO: State for the dynamic schema, fetched from backend
  const [fieldSchema, setFieldSchema] = useState<SchemaData>({});

  // States for documents list
  const [userDocuments, setUserDocuments] = useState<DocumentResult[]>([]);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResult | null>(null);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [editDocumentData, setEditDocumentData] = useState<any>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentResult | null>(null);

  // --- PRO: Load the schema from the backend on page load ---
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const schemaData = await documentService.getFieldSchema();
        setFieldSchema(schemaData);
      } catch (err) {
        console.error("Failed to load field schema", err);
        setError("Failed to load page configuration. Please refresh.");
      } finally {
        setIsLoadingSchema(false);
      }
    };
    loadSchema();
  }, []); // Runs once on page load

  // Load user documents
  useEffect(() => {
    loadUserDocuments();
  }, [documentsPage]);

  const loadUserDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const data = await documentService.getUserDocuments(documentsPage, 10);
      setUserDocuments(data.documents);
      setDocumentsTotalPages(data.total_pages);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // --- Polling Logic (Refactored to use the service) ---
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Get the document ID from the API response
    const documentId = uploadResult?.id || uploadResult?.document_id;

    if (
      documentId &&
      (uploadResult?.status === "pending" ||
        uploadResult?.status === "processing")
    ) {
      // Start polling
      pollingIntervalRef.current = setInterval(async () => {
        try {
          console.log(`Polling for document status: ${documentId}`);

          // PRO: Call the service
          const documentData = await documentService.getDocument(documentId);

          if (
            documentData.status === "completed" ||
            documentData.status === "failed"
          ) {
            stopPolling();
            setUploadResult(documentData); // Update with final data
          } else if (documentData.status === "processing") {
            // Update status if it changed from 'pending'
            setUploadResult((prev) =>
              prev ? { ...prev, status: "processing" } : null
            );
          }
        } catch (err) {
          setError(
            (err as any).response?.data?.error ||
            "Failed to check document status."
          );
          stopPolling();
        }
      }, 3000); // Poll every 3 seconds
    }

    // Cleanup function
    return () => stopPolling();
  }, [uploadResult?.status, uploadResult?.id, uploadResult?.document_id]);

  // --- Validation Form Logic (Populates form on 'completed') ---
  useEffect(() => {
    if (uploadResult?.status === "completed" && !editableData) {
      // AI is done, populate the form for user review
      setEditableData(uploadResult.extracted_data);
    }
    if (uploadResult?.status === "confirmed") {
      // User confirmed, hide the form
      setEditableData(null);
    }
  }, [uploadResult?.status, uploadResult?.extracted_data, editableData]);

  // --- Static UI Data ---
  const documentTypes: DocumentType[] = [
    {
      id: "cin",
      title: "CIN",
      description: "Upload Recto (Front) and Verso (Back) images.",
      icon: ScanFace,
      gradient: "from-cyan-400 to-cyan-600",
      shadowColor: "shadow-cyan-500/50",
    },
    {
      id: "driving_license",
      title: "Permis",
      description: "Upload Permis (Single side)",
      icon: Car,
      gradient: "from-purple-400 to-purple-600",
      shadowColor: "shadow-purple-500/50",
    },
    {
      id: "vehicle_registration",
      title: "Carte Grise",
      description: 'Upload "Carte Grise" (Single side)',
      icon: FileText,
      gradient: "from-pink-400 to-pink-600",
      shadowColor: "shadow-pink-500/50",
    },
  ];

  // --- File Handlers (MODIFIED FOR HEIC) ---
  const processFile = async (
    file: File | null,
    side: "single" | "recto" | "verso"
  ) => {
    if (!file) return;

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    let processedFile = file;
    const fileName = file.name.toLowerCase();

    // Check if it's HEIC/HEIF (by extension or MIME type)
    const isHeic = fileName.endsWith(".heic") || 
                   fileName.endsWith(".heif") ||
                   file.type === "image/heic" ||
                   file.type === "image/heif" ||
                   file.type === "image/heif-sequence";
    
    if (isHeic) {
      setIsConverting(true);
      setError("");
      try {
        // Convert it to JPEG - heic2any can return a Blob or an array of Blobs
        const conversionResult = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });

        // Handle both single Blob and array of Blobs
        let convertedBlob: Blob;
        if (Array.isArray(conversionResult)) {
          // If array, take the first blob
          convertedBlob = conversionResult[0] as Blob;
        } else {
          convertedBlob = conversionResult as Blob;
        }

        // Verify the conversion succeeded
        if (!convertedBlob || !(convertedBlob instanceof Blob)) {
          throw new Error("Conversion returned invalid result");
        }

        // Create a new File object
        processedFile = new File(
          [convertedBlob],
          `${fileName.split(".")[0]}.jpg`,
          {
            type: "image/jpeg",
            lastModified: new Date().getTime(),
          }
        );

        // Verify the file was created successfully
        if (!processedFile || processedFile.size === 0) {
          throw new Error("Converted file is empty");
        }
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setError(
          "Failed to convert HEIC image. Please try converting it to JPEG or PNG first, or use a different image format."
        );
        setIsConverting(false);
        return; // Stop processing
      } finally {
        setIsConverting(false);
      }
    }

    // Check file type *after* potential conversion
    // Accept any image type, or files without MIME type (some browsers don't set it)
    const fileType = processedFile.type.toLowerCase();
    const isImageType = fileType.startsWith("image/") || fileType === "";
    
    // Also check by extension as fallback for files without MIME type
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.heic', '.heif', '.avif', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isImageType && !hasImageExtension) {
      setError("Please upload an image file. Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, AVIF, and more.");
      return;
    }

    // Set state based on side
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.");
    };
    reader.onloadend = () => {
      const result = reader.result as string;
      if (side === "recto") {
        setUploadedFileRecto(processedFile);
        setPreviewRecto(result);
      } else if (side === "verso") {
        setUploadedFileVerso(processedFile);
        setPreviewVerso(result);
      } else {
        // This is for the 'single' case
        setUploadedFile(processedFile);
        setPreview(result);
      }
    };
    reader.readAsDataURL(processedFile);
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "single" | "recto" | "verso"
  ) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0], side);
      setShowUploadSourceModal(false);
    }
    e.target.value = "";
  };

  const handleDrop = async (
    e: React.DragEvent,
    side: "single" | "recto" | "verso"
  ) => {
    e.preventDefault();
    setError("");
    if (side === "recto") setIsDraggingRecto(false);
    else if (side === "verso") setIsDraggingVerso(false);
    else setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0], side);
    }
  };

  const handleDragOver = (
    e: React.DragEvent,
    side: "single" | "recto" | "verso"
  ) => {
    e.preventDefault();
    if (side === "recto") setIsDraggingRecto(true);
    else if (side === "verso") setIsDraggingVerso(true);
    else setIsDragging(true);
  };

  const handleDragLeave = (
    e: React.DragEvent,
    side: "single" | "recto" | "verso"
  ) => {
    e.preventDefault();
    if (side === "recto") setIsDraggingRecto(false);
    else if (side === "verso") setIsDraggingVerso(false);
    else setIsDragging(false);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPreview(null);
    setUploadedFileRecto(null);
    setPreviewRecto(null);
    setUploadedFileVerso(null);
    setPreviewVerso(null);
    setUploadResult(null);
    setError("");
    setEditableData(null);
    stopPolling();

    // Reset file input values
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    const rectoInput = document.getElementById(
      "file-upload-recto"
    ) as HTMLInputElement;
    const versoInput = document.getElementById(
      "file-upload-verso"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    if (rectoInput) rectoInput.value = "";
    if (versoInput) versoInput.value = "";
  };

  const startNewWith = (type: DocumentType["id"]) => {
    resetUpload();
    setSelectedType(type);
    // Scroll to upload section after a short delay to ensure it's rendered
    setTimeout(() => {
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };
  // --- End of File Handlers ---

  // --- PRO: Upload Logic (Using the service) ---
  const handleUpload = async () => {
    if (!selectedType) return;
    setIsUploading(true);
    setError("");
    stopPolling();

    const formData = new FormData();
    formData.append("document_type", selectedType);

    // RESPECTING USER'S ORIGINAL LOGIC
    if (selectedType === "cin") {
      // CIN: recto required, verso optional
      if (!uploadedFileRecto) {
        setError("Please upload at least the Recto (Front) image.");
        setIsUploading(false);
        return;
      }
      formData.append("file_recto", uploadedFileRecto);
      if (uploadedFileVerso) {
        formData.append("file_verso", uploadedFileVerso);
      }
    } else {
      // Other document types: single file
      if (!uploadedFile) {
        setError("Please upload a file.");
        setIsUploading(false);
        return;
      }
      formData.append("file", uploadedFile);
    }

    try {
      // PRO: Call the service
      const data = await documentService.uploadDocument(formData);
      setUploadResult(data);
    } catch (err: any) {
      console.error("Upload error:", err);
      
      // Provide more specific error messages
      let errorMessage = "Upload failed. Please try again.";
      
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data?.error || errorMessage;
      } else if (err.request) {
        // Request was made but no response received (network error)
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (err.message) {
        // Something else happened
        if (err.message.includes("Network Error") || err.message.includes("timeout")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // --- PRO: Form Handlers (Using the service) ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const documentId = uploadResult?.id || uploadResult?.document_id;
    if (!editableData || !documentId) return;

    try {
      // PRO: Call the service
      const response = await documentService.confirmDocument(
        documentId,
        editableData
      );

      // Update UI with the confirmed document from backend
      setUploadResult(response.document);
      setEditableData(null); // Hide the form
      loadUserDocuments(); // Refresh documents list
    } catch (err: any) {
      setError(err.response?.data?.error || "Confirmation failed.");
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      cin: "CIN",
      driving_license: "Permis",
      vehicle_registration: "Carte Grise",
    };
    return typeMap[type] || type.replace(/_/g, " ").toUpperCase();
  };

  const getExtractedName = (doc: DocumentResult): string => {
    if (!doc.extracted_data) return "N/A";
    
    const data = doc.extracted_data;
    
    // Try different field combinations based on document type
    if (doc.document_type === "cin") {
      const firstName = data.first_name_fr || data.first_name_ar || "";
      const lastName = data.last_name_fr || data.last_name_ar || "";
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    } else if (doc.document_type === "driving_license") {
      const firstName = data.first_name || data.first_name_fr || "";
      const lastName = data.last_name || data.last_name_fr || "";
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    } else if (doc.document_type === "vehicle_registration") {
      const ownerName = data.owner_name_fr || data.owner_name_ar || "";
      if (ownerName) {
        return ownerName;
      }
    }
    
    return "N/A";
  };

  const handleEditDocument = (document: DocumentResult) => {
    setSelectedDocument(document);
    setEditDocumentData(document.extracted_data || {});
    setIsEditingDocument(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument) return;

    try {
      await documentService.updateDocument(selectedDocument.id, {
        extracted_data: editDocumentData,
      });
      setIsEditingDocument(false);
      setSelectedDocument(null);
      loadUserDocuments();
    } catch (error) {
      console.error("Failed to update document:", error);
      alert("Échec de la mise à jour du document");
    }
  };

  const handleDeleteClick = (document: DocumentResult) => {
    setDocumentToDelete(document);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await documentService.deleteDocument(documentToDelete.id);
      setDocumentToDelete(null);
      loadUserDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Échec de la suppression du document");
    }
  };

  // --- RENDER ---
  if (isLoadingSchema) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
        {/* Upload Tab Content */}
        {activeTab === "upload" && (
          <>
        {/* Document Type Selection */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
            Choisissez un Type de Document
          </h1>
          <p className="text-gray-600 text-lg">Sélectionnez le type de document que vous souhaitez traiter</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => startNewWith(type.id)}
              className={`group relative overflow-hidden bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${
                selectedType === type.id
                  ? "ring-4 ring-cyan-400/50 shadow-2xl shadow-cyan-500/20 scale-105"
                  : "shadow-xl hover:shadow-2xl border border-gray-100/50 hover:border-cyan-200"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 bg-gradient-to-br ${type.gradient} rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${type.shadowColor} group-hover:scale-110 transition-transform duration-500`}
                >
                  <div className="text-white">
                    {React.createElement(type.icon, { className: "w-12 h-12" })}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all duration-300">
                  {type.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{type.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Upload Section */}
        {selectedType && (
          <div id="upload-section" className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
            {/* STATE 1: No upload result yet (show upload box) */}
            {!uploadResult ? (
              <div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Show HEIC converting message */}
                {isConverting && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-5 w-5 text-yellow-600" />
                      <p className="text-yellow-700 text-sm font-medium">
                        Converting HEIC image to JPEG...
                      </p>
                    </div>
                  </div>
                )}

                {/* RESPECTING USER'S ORIGINAL LOGIC (if/else for CIN) */}
                {selectedType === "cin" ? (
                  // CIN: Separate images (recto required, verso optional)
                  <div>
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl shadow-sm">
                      <p className="text-sm text-blue-800 font-semibold">
                        📸 Upload Recto (Front) image - required. Verso (Back) image is optional.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Recto Dropzone */}
                      <div
                        onDragOver={(e) => handleDragOver(e, "recto")}
                        onDragLeave={(e) => handleDragLeave(e, "recto")}
                        onDrop={(e) => handleDrop(e, "recto")}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                          isDraggingRecto
                            ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-xl scale-105"
                            : uploadedFileRecto
                            ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
                            : "border-gray-300 hover:border-cyan-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-cyan-50/30 hover:shadow-lg"
                        }`}
                      >
                        {/* Camera input */}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            handleFileSelect(e, "recto");
                            setShowUploadSourceModal(false);
                          }}
                          className="hidden"
                          id="camera-upload-recto"
                        />
                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={(e) => {
                            handleFileSelect(e, "recto");
                            setShowUploadSourceModal(false);
                          }}
                          className="hidden"
                          id="file-upload-recto"
                        />
                        {!uploadedFileRecto ? (
                          <button
                            onClick={() => {
                              if (isMobileDevice()) {
                                // On mobile, directly open the native file picker (gallery)
                                const fileInput = document.getElementById("file-upload-recto") as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              } else {
                                // On desktop, show modal to choose between camera and file
                                setUploadSourceSide("recto");
                                setShowUploadSourceModal(true);
                              }
                            }}
                            className="cursor-pointer w-full"
                          >
                            <UploadCloud className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-900 mb-2">
                              Upload Recto (Front)
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              📷 Prendre une photo ou choisir un fichier
                            </p>
                            <span className="inline-block bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium">
                              Choisir ou Photographier
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <img
                              src={previewRecto || undefined}
                              alt="Recto Preview"
                              className="max-h-64 mx-auto rounded-lg shadow-md"
                            />
                            <p className="text-lg font-semibold text-slate-900">
                              {uploadedFileRecto.name}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Verso Dropzone */}
                      <div
                        onDragOver={(e) => handleDragOver(e, "verso")}
                        onDragLeave={(e) => handleDragLeave(e, "verso")}
                        onDrop={(e) => handleDrop(e, "verso")}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                          isDraggingVerso
                            ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl scale-105"
                            : uploadedFileVerso
                            ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
                            : "border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50/30 hover:shadow-lg"
                        }`}
                      >
                        {/* Camera input */}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            handleFileSelect(e, "verso");
                            setShowUploadSourceModal(false);
                          }}
                          className="hidden"
                          id="camera-upload-verso"
                        />
                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={(e) => {
                            handleFileSelect(e, "verso");
                            setShowUploadSourceModal(false);
                          }}
                          className="hidden"
                          id="file-upload-verso"
                        />
                        {!uploadedFileVerso ? (
                          <button
                            onClick={() => {
                              if (isMobileDevice()) {
                                // On mobile, directly open the native file picker (gallery)
                                const fileInput = document.getElementById("file-upload-verso") as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              } else {
                                // On desktop, show modal to choose between camera and file
                                setUploadSourceSide("verso");
                                setShowUploadSourceModal(true);
                              }
                            }}
                            className="cursor-pointer w-full"
                          >
                            <UploadCloud className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-900 mb-2">
                              Upload Verso (Back){" "}
                              <span className="text-sm text-slate-500">
                                (Optional)
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              📷 Prendre une photo ou choisir un fichier
                            </p>
                            <span className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg font-medium">
                              Choisir ou Photographier
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <img
                              src={previewVerso || undefined}
                              alt="Verso Preview"
                              className="max-h-64 mx-auto rounded-lg shadow-md"
                            />
                            <p className="text-lg font-semibold text-slate-900">
                              {uploadedFileVerso.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Other document types: Single file
                  <div
                    onDragOver={(e) => handleDragOver(e, "single")}
                    onDragLeave={(e) => handleDragLeave(e, "single")}
                    onDrop={(e) => handleDrop(e, "single")}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      isDragging
                        ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-xl scale-105"
                        : uploadedFile
                        ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
                        : "border-gray-300 hover:border-cyan-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-cyan-50/30 hover:shadow-lg"
                    }`}
                  >
                    {/* Camera input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        handleFileSelect(e, "single");
                        setShowUploadSourceModal(false);
                      }}
                      className="hidden"
                      id="camera-upload"
                    />
                    {/* File input */}
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={(e) => {
                        handleFileSelect(e, "single");
                        setShowUploadSourceModal(false);
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    {!uploadedFile ? (
                      <button
                        onClick={() => {
                          if (isMobileDevice()) {
                            // On mobile, directly open the native file picker (gallery)
                            const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                            if (fileInput) {
                              fileInput.click();
                            }
                          } else {
                            // On desktop, show modal to choose between camera and file
                            setUploadSourceSide("single");
                            setShowUploadSourceModal(true);
                          }
                        }}
                        className="cursor-pointer w-full"
                      >
                        <UploadCloud className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-slate-900 mb-2">
                          Glissez-déposez votre document ici
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          📷 Prendre une photo ou choisir un fichier
                        </p>
                        <span className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium">
                          Choisir ou Photographier
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <img
                          src={preview || undefined}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <p className="text-lg font-semibold text-slate-900">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                {((selectedType === "cin" && uploadedFileRecto) ||
                  (selectedType !== "cin" && uploadedFile)) && (
                  <div className="flex gap-4 justify-center mt-8">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading || isConverting}
                      className="bg-gradient-to-r from-cyan-500 via-purple-500 to-purple-600 hover:from-cyan-400 hover:via-purple-400 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-purple-500/40 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105 disabled:hover:scale-100"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          Processing...
                        </>
                      ) : isConverting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-5 h-5" />
                          Process Document
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetUpload}
                      className="bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 px-6 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* STATE 2: We have an upload result (pending, completed, etc.) */
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                      Résultats d'Extraction
                    </h2>
                    <p className="text-gray-600">Vérifiez et confirmez les données extraites</p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Nouveau Document
                  </button>
                </div>

                {/* CASE 2A: document is running */}
                {(uploadResult.status === "pending" ||
                  uploadResult.status === "processing") && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200/50 rounded-2xl p-6 mb-6 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <Loader2 className="animate-spin h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-blue-800 text-base font-bold">
                          Traitement en cours...
                        </p>
                        <p className="text-blue-600 text-sm">
                          Le document est en cours de traitement. Veuillez patienter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 2B: document failed */}
                {uploadResult.status === "failed" && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200/50 rounded-2xl p-6 mb-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-800 text-lg font-bold mb-2">
                          Échec du Traitement
                        </p>
                        <p className="text-red-700 text-sm">
                          {uploadResult.error_messages?.join(", ") ||
                            "Le processeur IA n'a pas pu extraire les données."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 2C: document is 'completed' (waiting for user validation) */}
                {uploadResult.status === "completed" && editableData && (
                  <form
                    onSubmit={handleConfirmSubmit}
                    className="border-2 border-gray-200/50 bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl shadow-2xl p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Réviser les Données Extraites
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            Vérifiez et corrigez les données extraites par l'IA
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PRO: Dynamic Form Rendering from Schema */}
                    {(() => {
                      const docType =
                        uploadResult.document_type || selectedType || "cin";
                      // Use the schema from the state
                      const groups: SchemaGroup[] = fieldSchema[docType] || [];

                      return (
                        <div className="space-y-8">
                          {groups.map((group, idx) => (
                            <div key={idx} className="bg-white/50 rounded-2xl p-6 border border-gray-200/50">
                              <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                                {group.title}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {group.fields.map(({ key, label }: SchemaField) => (
                                  <div key={key} className="group">
                                    <label
                                      htmlFor={key}
                                      className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                      {label}
                                    </label>
                                    <input
                                      type="text"
                                      id={key}
                                      name={key}
                                      value={editableData[key] ?? ""}
                                      onChange={handleFormChange}
                                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-300 hover:border-gray-300"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="mt-8 flex items-center justify-end gap-4">
                      <button
                        type="submit"
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-purple-600 hover:from-cyan-400 hover:via-purple-400 hover:to-purple-500 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-105"
                      >
                        Confirmer & Enregistrer
                      </button>
                    </div>
                  </form>
                )}

                {/* CASE 2D: document is 'confirmed' (Validation done) */}
                {uploadResult.status === "confirmed" && (
                  <div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-2xl p-6 mb-8 text-center shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-green-800 text-lg font-bold">
                          Données confirmées et enregistrées avec succès!
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                        Données Finales Confirmées
                      </h3>
                      <p className="text-gray-600">Les données extraites et validées</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-8 border-2 border-gray-200/50 shadow-inner">
                      <pre className="text-sm text-gray-800 overflow-auto max-h-96 font-mono leading-relaxed">
                        {JSON.stringify(uploadResult.extracted_data, null, 2)}
                      </pre>
                    </div>

                    {/* Quick actions */}
                    <div className="mt-8 flex flex-wrap gap-4">
                      {documentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => startNewWith(type.id)}
                          className="group flex-1 min-w-[200px] bg-white border-2 border-gray-200 hover:border-cyan-300 hover:shadow-xl rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${type.gradient} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                              {React.createElement(type.icon, {
                                className: "w-7 h-7",
                              })}
                            </span>
                            <div>
                              <div className="font-bold text-gray-900 text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all duration-300">
                                Nouveau {type.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* Documents Tab Content */}
        {activeTab === "documents" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                Mes Documents
              </h2>
              <p className="text-gray-600">Gérez tous vos documents extraits</p>
            </div>
            <button
              onClick={loadUserDocuments}
              disabled={isLoadingDocuments}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <RefreshCcw className={`w-5 h-5 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {isLoadingDocuments ? (
            <div className="py-20 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Chargement des documents...</p>
              </div>
            </div>
          ) : userDocuments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">Aucun document trouvé</p>
              <p className="text-gray-500">Commencez par téléverser votre premier document</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-gray-200/50 shadow-inner">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="text-left py-5 px-6 text-gray-700 font-bold text-sm uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left py-5 px-6 text-gray-700 font-bold text-sm uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="text-left py-5 px-6 text-gray-700 font-bold text-sm uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left py-5 px-6 text-gray-700 font-bold text-sm uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-5 px-6 text-gray-700 font-bold text-sm uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {userDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50/30 hover:to-purple-50/30 transition-all duration-300 group"
                      >
                        <td className="py-5 px-6">
                          <span className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm">
                            {getDocumentTypeLabel(doc.document_type)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div>
                            <p className="font-semibold text-gray-900 text-base">
                              {doc.extracted_data ? getExtractedName(doc) : "En attente..."}
                            </p>
                            {doc.extracted_data && (
                              <p className="text-xs text-gray-500 mt-1.5">
                                {doc.document_type === "cin" 
                                  ? `${doc.extracted_data.first_name_ar || ""} ${doc.extracted_data.last_name_ar || ""}`.trim() || ""
                                  : doc.document_type === "driving_license"
                                  ? `${doc.extracted_data.first_name || ""} ${doc.extracted_data.last_name || ""}`.trim() || ""
                                  : doc.extracted_data.owner_name_ar || ""
                                }
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm ${
                              doc.status === "completed" ||
                              doc.status === "confirmed"
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                : doc.status === "failed"
                                ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                                : doc.status === "processing"
                                ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200"
                                : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            {doc.status === "completed" ||
                            doc.status === "confirmed" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : doc.status === "failed" ? (
                              <XCircle className="w-4 h-4" />
                            ) : doc.status === "processing" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-4 h-4" />
                            )}
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-sm text-gray-600 font-medium">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedDocument(doc)}
                              className="p-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(doc.status === "completed" || doc.status === "confirmed") && (
                              <>
                                <button
                                  onClick={() => handleEditDocument(doc)}
                                  className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(doc)}
                                  className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {documentsTotalPages > 1 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                  <p className="text-gray-700 font-semibold text-lg">
                    Page <span className="text-cyan-600 font-bold">{documentsPage}</span> sur <span className="text-purple-600 font-bold">{documentsTotalPages}</span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDocumentsPage((p) => Math.max(1, p - 1))}
                      disabled={documentsPage === 1}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 disabled:hover:shadow-none"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setDocumentsPage((p) => Math.min(documentsTotalPages, p + 1))}
                      disabled={documentsPage === documentsTotalPages}
                      className="px-6 py-3 border-2 border-cyan-400 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-purple-600 hover:from-cyan-400 hover:via-purple-400 hover:to-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        )}

        {/* View/Edit Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto border-2 border-gray-200/50">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
                  <div>
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                      {isEditingDocument ? "Modifier Document" : "Détails du Document"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {isEditingDocument ? "Modifiez les données extraites" : "Consultez les informations du document"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDocument(null);
                      setIsEditingDocument(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 p-3 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <XCircle className="w-7 h-7" />
                  </button>
                </div>

                {isEditingDocument ? (
                  <div>
                    <div className="mb-6 p-5 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl border-2 border-cyan-200/50">
                      <p className="text-sm text-gray-600 mb-1 font-semibold">Type de document:</p>
                      <p className="text-lg font-bold text-gray-900">
                        {getDocumentTypeLabel(selectedDocument.document_type)}
                      </p>
                    </div>
                    <textarea
                      value={JSON.stringify(editDocumentData, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditDocumentData(parsed);
                        } catch (err) {
                          // Invalid JSON
                        }
                      }}
                      className="w-full h-96 p-6 border-2 border-gray-200 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white shadow-inner"
                    />
                    <div className="flex justify-end gap-4 mt-8">
                      <button
                        onClick={() => setIsEditingDocument(false)}
                        className="px-8 py-3 border-2 border-gray-300 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-purple-600 hover:from-cyan-400 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold hover:scale-105"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl border-2 border-gray-200/50 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Type de document</p>
                          <p className="text-lg font-bold text-gray-900">
                            {getDocumentTypeLabel(selectedDocument.document_type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Statut</p>
                          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${
                            selectedDocument.status === "completed" || selectedDocument.status === "confirmed"
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                              : selectedDocument.status === "failed"
                              ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-700"
                              : selectedDocument.status === "processing"
                              ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                              : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700"
                          }`}>
                            {selectedDocument.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Date de création</p>
                          <p className="text-lg font-bold text-gray-900">
                            {new Date(selectedDocument.created_at).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-4">Données Extraites</h4>
                      <pre className="bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 rounded-2xl overflow-auto text-sm border-2 border-gray-200/50 max-h-96 font-mono leading-relaxed shadow-inner">
                        {JSON.stringify(
                          selectedDocument.extracted_data || {},
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                      {(selectedDocument.status === "completed" || selectedDocument.status === "confirmed") && (
                        <button
                          onClick={() => handleEditDocument(selectedDocument)}
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold hover:scale-105"
                        >
                          Modifier
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDocument(null);
                          setIsEditingDocument(false);
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold hover:scale-105"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Source Modal - Only for desktop (mobile uses native file picker directly) */}
        {showUploadSourceModal && !isMobileDevice() && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full border-2 border-gray-200/50">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
                    Choisir la source
                  </h3>
                  <button
                    onClick={() => setShowUploadSourceModal(false)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6 text-center">
                  Comment souhaitez-vous ajouter l'image ?
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const cameraId = uploadSourceSide === "recto" 
                        ? "camera-upload-recto" 
                        : uploadSourceSide === "verso"
                        ? "camera-upload-verso"
                        : "camera-upload";
                      const cameraInput = document.getElementById(cameraId) as HTMLInputElement;
                      if (cameraInput) {
                        cameraInput.click();
                      }
                    }}
                    className="flex-1 flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-2xl hover:border-cyan-400 hover:shadow-lg transition-all group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Prendre une photo</span>
                    <span className="text-sm text-gray-600 text-center">Utiliser la caméra</span>
                  </button>
                  <button
                    onClick={() => {
                      const fileId = uploadSourceSide === "recto" 
                        ? "file-upload-recto" 
                        : uploadSourceSide === "verso"
                        ? "file-upload-verso"
                        : "file-upload";
                      const fileInput = document.getElementById(fileId) as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    }}
                    className="flex-1 flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl hover:border-purple-400 hover:shadow-lg transition-all group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Choisir un fichier</span>
                    <span className="text-sm text-gray-600 text-center">Depuis la galerie</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {documentToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full border-2 border-gray-200/50">
              <div className="p-8">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-full shadow-lg">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent text-center mb-3">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 text-center mb-8 text-base leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible et ne peut pas être annulée.
                </p>
                <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-5 mb-8 border-2 border-gray-200/50 shadow-inner">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Type de document</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getDocumentTypeLabel(documentToDelete.document_type)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDocumentToDelete(null)}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DashboardPage;
