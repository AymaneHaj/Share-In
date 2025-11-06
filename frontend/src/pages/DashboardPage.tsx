// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
// Import the new services
import * as documentService from "../services/documentService";
// Import the shared type
import type { DocumentResult } from "../services/documentService";
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
} from "lucide-react";
// Import the HEIC converter
import heic2any from "heic2any";

// --- Interfaces ---

// Types for field schema (FIXED from 'any')
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
  icon: ComponentType<LucideProps>; // FIXED: Changed from React.ReactNode
  gradient: string;
  shadowColor: string;
}

// --- The Component ---
const DashboardPage: React.FC = () => {
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

  // File states - used for other document types (RESPECTING USER'S ORIGINAL LOGIC)
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

  // PRO: State for the dynamic schema, fetched from backend
  const [fieldSchema, setFieldSchema] = useState<SchemaData>({}); // FIXED: Use SchemaData type

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

          // PRO: Call the service (no fetch, no token)
          const documentData = await documentService.getDocument(documentId);

          if (
            documentData.status === "completed" ||
            documentData.status === "failed"
          ) {
            stopPolling();
            setUploadResult(documentData); // Update with final data
          } else if (documentData.status === "processing") {
            // Update status if it changed from 'pending'
            // FIXED: Check if prev exists before spreading
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

  // --- Static UI Data (FIXED Descriptions) ---
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
      title: "Driving License",
      description: "Upload driving license (Single side)",
      icon: Car,
      gradient: "from-purple-400 to-purple-600",
      shadowColor: "shadow-purple-500/50",
    },
    {
      id: "vehicle_registration",
      title: "Vehicle Registration",
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

    let processedFile = file;
    const fileName = file.name.toLowerCase();

    // Check if it's HEIC/HEIF
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
      setIsConverting(true);
      setError("");
      try {
        // Convert it to JPEG
        const convertedBlob = (await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        })) as Blob;

        // Create a new File object
        processedFile = new File(
          [convertedBlob],
          `${fileName.split(".")[0]}.jpg`,
          {
            type: "image/jpeg",
            lastModified: new Date().getTime(),
          }
        );
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setError(
          "Failed to convert HEIC image. Please try a JPEG or PNG."
        );
        setIsConverting(false);
        return; // Stop processing
      } finally {
        setIsConverting(false);
      }
    }

    // Check file type *after* potential conversion
    if (!processedFile.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG).");
      return;
    }

    // Set state based on side
    const reader = new FileReader();
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
      await processFile(e.target.files[0], side); // Make it async
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
      await processFile(e.dataTransfer.files[0], side); // Make it async
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      // PRO: Call the service, no fetch, no token
      const data = await documentService.uploadDocument(formData);
      setUploadResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
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
    } catch (err: any) {
      setError(err.response?.data?.error || "Confirmation failed.");
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
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto w-full px-6">
        {/* Document Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => startNewWith(type.id)}
              className={`bg-white rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${selectedType === type.id
                  ? "ring-4 ring-cyan-400 shadow-lg"
                  : "shadow-md hover:shadow-lg border border-transparent"
                }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${type.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${type.shadowColor}`}
                >
                  {/* FIXED: Use React.createElement for icon */}
                  <div className="text-white">
                    {React.createElement(type.icon, { className: "w-10 h-10" })}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {type.title}
                </h3>
                <p className="text-slate-600 text-sm">{type.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Upload Section */}
        {selectedType && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
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

                {/* NEW: Show HEIC converting message */}
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
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">
                        Upload Recto (Front) image - required. Verso (Back)
                        image is optional.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recto Dropzone */}
                      <div
                        onDragOver={(e) => handleDragOver(e, "recto")}
                        onDragLeave={(e) => handleDragLeave(e, "recto")}
                        onDrop={(e) => handleDrop(e, "recto")}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDraggingRecto
                            ? "border-cyan-500 bg-cyan-50"
                            : uploadedFileRecto
                              ? "border-green-400 bg-green-50"
                              : "border-slate-300 hover:border-cyan-400"
                          }`}
                      >
                        <input
                          type="file"
                          accept="image/*,.heic,.heif" // Accept HEIC
                          onChange={(e) => handleFileSelect(e, "recto")}
                          className="hidden"
                          id="file-upload-recto"
                        />
                        {!uploadedFileRecto ? (
                          <label
                            htmlFor="file-upload-recto"
                            className="cursor-pointer"
                          >
                            <UploadCloud className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-900 mb-2">
                              Upload Recto (Front)
                            </p>
                            <span className="inline-block bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium">
                              Choose File
                            </span>
                          </label>
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
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDraggingVerso
                            ? "border-purple-500 bg-purple-50"
                            : uploadedFileVerso
                              ? "border-green-400 bg-green-50"
                              : "border-slate-300 hover:border-purple-400"
                          }`}
                      >
                        <input
                          type="file"
                          accept="image/*,.heic,.heif" // Accept HEIC
                          onChange={(e) => handleFileSelect(e, "verso")}
                          className="hidden"
                          id="file-upload-verso"
                        />
                        {!uploadedFileVerso ? (
                          <label
                            htmlFor="file-upload-verso"
                            className="cursor-pointer"
                          >
                            <UploadCloud className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-900 mb-2">
                              Upload Verso (Back){" "}
                              <span className="text-sm text-slate-500">
                                (Optional)
                              </span>
                            </p>
                            <span className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg font-medium">
                              Choose File
                            </span>
                          </label>
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
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? "border-cyan-500 bg-cyan-50"
                        : uploadedFile
                          ? "border-green-400 bg-green-50"
                          : "border-slate-300 hover:border-cyan-400 hover:bg-slate-50"
                      }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.heic,.heif" // Accept HEIC
                      onChange={(e) => handleFileSelect(e, "single")}
                      className="hidden"
                      id="file-upload"
                    />
                    {!uploadedFile ? (
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <UploadCloud className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-slate-900 mb-2">
                          Drag and drop your document here
                        </p>
                        <p className="text-slate-600 mb-4">
                          or click to select
                        </p>
                        <span className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium">
                          Choose File
                        </span>
                      </label>
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

                {/* Upload Button (RESPECTING USER'S LOGIC) */}
                {((selectedType === "cin" && uploadedFileRecto) ||
                  (selectedType !== "cin" && uploadedFile)) && (
                    <div className="flex gap-4 justify-center mt-6">
                      <button
                        onClick={handleUpload}
                        disabled={isUploading || isConverting} // Disable if converting
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
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
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              /* STATE 2: We have an upload result (pending, completed, etc.) */
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Extraction Results
                  </h2>
                  <button
                    onClick={resetUpload}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Upload Another
                  </button>
                </div>

                {/* CASE 2A: document is running */}
                {(uploadResult.status === "pending" ||
                  uploadResult.status === "processing") && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                        <p className="text-blue-700 text-sm font-medium">
                          Document is {uploadResult.status}... Checking for
                          results automatically.
                        </p>
                      </div>
                    </div>
                  )}

                {/* CASE 2B: document failed */}
                {uploadResult.status === "failed" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-700 text-sm font-bold">
                          Document Failed
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                          {uploadResult.error_messages?.join(", ") ||
                            "The AI processor failed to extract data."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 2C: document is 'completed' (waiting for user validation) */}
                {uploadResult.status === "completed" && editableData && (
                  <form
                    onSubmit={handleConfirmSubmit}
                    className="border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 rounded-2xl shadow-md p-6 md:p-8"
                  >
                    <div className="mb-6">
                      <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          Review Extracted Data
                        </h3>
                      </div>
                      <p className="text-slate-500 text-sm">
                        Please review the AI's results. Correct any fields and
                        click 'Confirm'.
                      </p>
                    </div>

                    {/* PRO: Dynamic Form Rendering from Schema */}
                    {(() => {
                      const docType =
                        uploadResult.document_type || selectedType || "cin";
                      // Use the schema from the state
                      const groups: SchemaGroup[] = fieldSchema[docType] || [];

                      return (
                        <div className="space-y-6">
                          {groups.map((group, idx) => (
                            <div key={idx}>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                {group.title}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* FIXED: Added types for key/label */}
                                {group.fields.map(({ key, label }: SchemaField) => (
                                  <div key={key} className="group">
                                    <label
                                      htmlFor={key}
                                      className="block text-xs font-medium text-slate-600 mb-1"
                                    >
                                      {label}
                                    </label>
                                    <input
                                      type="text"
                                      id={key}
                                      name={key}
                                      value={editableData[key] ?? ""}
                                      onChange={handleFormChange}
                                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-slate-900 placeholder-slate-400 shadow-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/40 hover:shadow-cyan-500/40"
                      >
                        Confirm & Save
                      </button>
                    </div>
                  </form>
                )}

                {/* CASE 2D: document is 'confirmed' (Validation done) */}
                {uploadResult.status === "confirmed" && (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                      <p className="text-green-700 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                        Data confirmed and saved successfully.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-slate-800">
                      Final Confirmed Data:
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mt-4">
                      <pre className="text-sm text-slate-800 overflow-auto max-h-96">
                        {JSON.stringify(uploadResult.extracted_data, null, 2)}
                      </pre>
                    </div>

                    {/* Quick actions */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      {documentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => startNewWith(type.id)}
                          className="w-full sm:w-auto flex-1 bg-white border border-slate-200 hover:border-cyan-300 hover:shadow-md rounded-xl p-4 text-left transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex w-10 h-10 rounded-lg bg-gradient-to-br ${type.gradient} text-white items-center justify-center shadow-md`}
                            >
                              {/* FIXED: Use React.createElement */}
                              {React.createElement(type.icon, {
                                className: "w-6 h-6",
                              })}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900">
                                New {type.title}
                              </div>
                              <div className="text-xs text-slate-500">
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
      </div>
    </div>
  );
};

export default DashboardPage;