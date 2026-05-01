import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [total, setTotal] = useState(0);
  const [perDay, setPerDay] = useState([]);
  const [perLabel, setPerLabel] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = { Authorization: `Bearer ${user?.token}` };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [countRes, perDayRes, perLabelRes, imagesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/images/count`, {
          headers,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/images/per-day`, {
          headers,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/images/group-by-label`, {
          headers,
        }),
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/images?page=${page}&limit=6`,
          { headers },
        ),
      ]);
      setTotal(countRes.data.total);
      setPerDay(perDayRes.data.map((d) => ({ date: d._id, count: d.count })));
      setPerLabel(
        perLabelRes.data.map((d) => ({ name: d._id, value: d.count })),
      );
      setImages(imagesRes.data.images);
      setTotalPages(imagesRes.data.totalPages);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !label) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("label", label);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/images`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setLabel("");
      fetchData();
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">
          Image Analytics Platform
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Metric Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Images</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{total}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Labels</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {perLabel.length}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Days Active</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-purple-600">
                {perDay.length}
              </p>
            )}
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Upload Image
          </h2>
          <form
            onSubmit={handleUpload}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium hover:file:bg-blue-100"
            />
            <input
              type="text"
              placeholder="Label (e.g. nature)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Images Per Day
            </h2>
            {loading ? (
              <div className="h-48 bg-gray-100 animate-pulse rounded" />
            ) : perDay.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Images Per Label
            </h2>
            {loading ? (
              <div className="h-48 bg-gray-100 animate-pulse rounded" />
            ) : perLabel.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={perLabel}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {perLabel.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Images Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Uploaded Images
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No images uploaded yet
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-gray-500 font-medium">
                        Filename
                      </th>
                      <th className="pb-3 text-gray-500 font-medium">Label</th>
                      <th className="pb-3 text-gray-500 font-medium">Size</th>
                      <th className="pb-3 text-gray-500 font-medium">
                        Uploaded
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((img) => (
                      <tr
                        key={img._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 text-gray-700 max-w-xs truncate">
                          {img.filename}
                        </td>
                        <td className="py-3">
                          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium">
                            {img.label}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {(img.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(img.uploadedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
