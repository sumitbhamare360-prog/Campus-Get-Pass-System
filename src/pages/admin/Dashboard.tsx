import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
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
} from "recharts";
import { Users, UserCheck, ShieldAlert, LogOut, UserPlus, Trash2, Activity, FileText, Edit2 } from "lucide-react";
import { ReportGenerator } from "../../components/ReportGenerator";

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [hosts, setHosts] = useState<any[]>([]);
  const [allVisitors, setAllVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'visitors' | 'reports'>('analytics');
  
  // New Host Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHostId, setEditingHostId] = useState<number | null>(null);
  const [newHostUsername, setNewHostUsername] = useState('');
  const [newHostPassword, setNewHostPassword] = useState('');
  const [newHostLocation, setNewHostLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAllVisitors();
  }, []);

  const fetchAllVisitors = () => {
    fetch("/api/visitors")
      .then((res) => res.json())
      .then((data) => {
        setAllVisitors(data);
      });
  };

  const fetchStats = () => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  };

  const handleVisitorStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/visitors/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchAllVisitors();
      fetchStats();
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchAllVisitors();
        fetchStats();
      } else {
        console.error(data.error || 'Failed to delete visitor');
      }
    } catch (err) {
      console.error('Server error. Please try again.');
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-gray-500">Loading dashboard...</div>
    );

  const COLORS = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Manage campus operations and personnel</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
            activeTab === 'analytics' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 mr-2" /> Analytics
        </button>
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
            activeTab === 'visitors' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4 mr-2" /> Visitor Management
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
            activeTab === 'reports' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" /> Reports
        </button>
      </div>

      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Visits"
              value={stats.total}
              icon={<Users className="w-6 h-6 text-indigo-600" />}
            />
            <StatCard
              title="Currently Inside"
              value={stats.active}
              icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pending}
              icon={<ShieldAlert className="w-6 h-6 text-amber-600" />}
            />
            <StatCard
              title="Completed Visits"
              value={stats.completed}
              icon={<LogOut className="w-6 h-6 text-gray-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Visits by Purpose
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.byPurpose}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="purpose"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Department Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byDepartment}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="department"
                    >
                      {stats.byDepartment.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {stats.byDepartment.map((entry: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    {entry.department} ({entry.count})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'visitors' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Visitor Management</h3>
            <p className="text-sm text-gray-500">Approve, reject or remove any visitor record</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Host / Event</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No visitor records found.
                    </td>
                  </tr>
                ) : (
                  allVisitors.map((v) => (
                    <tr key={v.visitor_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{v.name}</div>
                        <div className="text-xs text-gray-500">{v.visitor_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{v.host_name}</div>
                        <div className="text-xs text-gray-500">{v.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          v.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' :
                          v.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          v.status === 'Inside Campus' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {v.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => handleVisitorStatus(v.visitor_id, 'Approved')}
                              className="text-emerald-600 hover:text-emerald-700 font-medium text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVisitorStatus(v.visitor_id, 'Rejected')}
                              className="text-red-600 hover:text-red-700 font-medium text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteVisitor(v.visitor_id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <ReportGenerator visitors={allVisitors} title="Campus Visitor Report (Admin)" />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
