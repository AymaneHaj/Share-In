import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  FileText,
  TrendingUp,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Loader2,
  XCircle,
} from "lucide-react";
import * as adminService from "../services/adminService";
import type { AdminStats, Document } from "../services/adminService";

const COLORS = {
  cin: "#06b6d4",
  driving_license: "#a855f7",
  vehicle_registration: "#ec4899",
  pending: "#fbbf24",
  processing: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
  confirmed: "#6366f1",
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    document_type: "",
    status: "",
  });
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [page, filters.document_type, filters.status]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, docsData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getAllDocuments(page, 10, {
          document_type: filters.document_type || undefined,
          status: filters.status || undefined,
        }),
      ]);
      setStats(statsData);
      setDocuments(docsData.documents);
      setTotalPages(docsData.total_pages);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await adminService.deleteDocument(documentId);
      loadData();
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    }
  };

  const handleEdit = async (document: Document) => {
    setSelectedDocument(document);
    setEditData(document.extracted_data || {});
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument) return;

    try {
      await adminService.updateDocument(selectedDocument.id, {
        extracted_data: editData,
      });
      setIsEditing(false);
      setSelectedDocument(null);
      loadData();
    } catch (error) {
      console.error("Failed to update document:", error);
      alert("Failed to update document");
    }
  };

  const prepareChartData = () => {
    if (!stats) return { byType: [], byStatus: [] };

    const byType = Object.entries(stats.documents_by_type || {}).map(
      ([type, count]) => ({
        name: type.replace("_", " ").toUpperCase(),
        value: count,
      })
    );

    const byStatus = Object.entries(stats.documents_by_status || {}).map(
      ([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: COLORS[status as keyof typeof COLORS] || "#64748b",
      })
    );

    return { byType, byStatus };
  };

  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl transition-transform duration-500 group-hover:scale-105" />
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}
      />
      <div className="relative backdrop-blur-sm bg-white/80 rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 group-hover:shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {value.toLocaleString()}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <button 
              onClick={loadData}
              disabled={isLoading}
              className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
          <p className="text-gray-600 text-lg">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={Users}
            color="from-cyan-500 to-blue-500"
          />
          <StatCard
            title="Total Documents"
            value={stats?.total_documents || 0}
            icon={FileText}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Completed"
            value={stats?.documents_by_status?.completed || 0}
            icon={TrendingUp}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Processing"
            value={stats?.documents_by_status?.processing || 0}
            icon={TrendingUp}
            color="from-orange-500 to-yellow-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Documents by Type */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Documents by Type
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.byType.map((entry, index) => {
                    const colorKey = entry.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[colorKey] || "#8884d8"}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Documents by Status */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Documents by Status
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData.byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                >
                  {chartData.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Documents List */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Documents
            </h2>
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.document_type}
                onChange={(e) =>
                  setFilters({ ...filters, document_type: e.target.value })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <option value="">All Types</option>
                <option value="cin">CIN</option>
                <option value="driving_license">Driving License</option>
                <option value="vehicle_registration">
                  Vehicle Registration
                </option>
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">
                    Type
                  </th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">
                    User
                  </th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">
                    Created
                  </th>
                  <th className="text-left py-4 px-4 text-gray-700 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
                  >
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg text-sm font-medium text-gray-700">
                        {doc.document_type.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {doc.user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {doc.user?.email || ""}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          doc.status === "completed" ||
                          doc.status === "confirmed"
                            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                            : doc.status === "failed"
                            ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-700"
                            : doc.status === "processing"
                            ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                            : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700"
                        }`}
                      >
                        {doc.status === "completed" ||
                        doc.status === "confirmed" ? (
                          <FileText className="w-3 h-3" />
                        ) : doc.status === "failed" ? (
                          <XCircle className="w-3 h-3" />
                        ) : doc.status === "processing" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="p-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {documents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No documents found</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 font-medium">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-5 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* View/Edit Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {isEditing ? "Edit Document" : "View Document"}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedDocument(null);
                      setIsEditing(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all duration-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={JSON.stringify(editData, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditData(parsed);
                        } catch (err) {
                          // Invalid JSON
                        }
                      }}
                      className="w-full h-96 p-4 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <pre className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl overflow-auto text-sm border border-gray-200">
                      {JSON.stringify(
                        selectedDocument.extracted_data || {},
                        null,
                        2
                      )}
                    </pre>
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={() => setSelectedDocument(null)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
