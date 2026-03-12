import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Clock,
  UserPlus,
  Eye,
  Trash2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function SecurityDashboard() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVisitors = () => {
    fetch("/api/visitors")
      .then((res) => res.json())
      .then((data) => {
        setVisitors(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/visitors/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchVisitors();
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const deleteVisitor = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchVisitors();
      }
    } catch (error) {
      console.error("Failed to delete visitor");
    }
  };

  const filteredVisitors = visitors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitor_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeCount = visitors.filter(
    (v) => v.status === "Inside Campus",
  ).length;
  const pendingCount = visitors.filter((v) => v.status === "Approved").length; // Approved but not entered

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Portal</h1>
          <p className="text-gray-500">
            Verify passes and manage campus entry/exit
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link 
            to="/visitor/register" 
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Add Visitor</span>
          </Link>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800">
              Inside Campus: {activeCount}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 flex items-center">
            <span className="text-sm font-medium text-emerald-800">
              Expected: {pendingCount}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Scan QR or search by Name / ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No visitors found
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor) => (
                  <tr
                    key={visitor.visitor_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {visitor.photo ? (
                          <img
                            src={visitor.photo}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {visitor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {visitor.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {visitor.visitor_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{visitor.purpose}</div>
                      <div className="text-xs text-gray-500">
                        {visitor.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {format(new Date(visitor.entry_time), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={visitor.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/visitor/pass/${visitor.visitor_id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Pass
                      </Link>
                      {visitor.status === "Approved" && (
                        <button
                          onClick={() =>
                            updateStatus(visitor.visitor_id, "Inside Campus")
                          }
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5 mr-1" /> Mark Entry
                        </button>
                      )}
                      {visitor.status === "Inside Campus" && (
                        <button
                          onClick={() =>
                            updateStatus(visitor.visitor_id, "Completed")
                          }
                          className="inline-flex items-center px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md hover:bg-gray-900 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1" /> Mark Exit
                        </button>
                      )}
                      {visitor.status === "Pending Approval" && (
                        <span className="text-xs text-amber-600 font-medium">
                          Waiting for Host
                        </span>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => deleteVisitor(visitor.visitor_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                          title="Delete Visitor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-100 text-gray-800";
  if (status === "Approved") color = "bg-emerald-100 text-emerald-800";
  if (status === "Pending Approval") color = "bg-amber-100 text-amber-800";
  if (status === "Rejected") color = "bg-red-100 text-red-800";
  if (status === "Inside Campus") color = "bg-blue-100 text-blue-800";
  if (status === "Completed") color = "bg-gray-100 text-gray-500";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
