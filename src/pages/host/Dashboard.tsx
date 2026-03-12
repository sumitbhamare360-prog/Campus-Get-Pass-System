import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, X, Clock, History, FileText, Users, UserPlus, Trash2, Edit2, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ReportGenerator } from "../../components/ReportGenerator";

export function HostDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [pendingVisitors, setPendingVisitors] = useState<any[]>([]);
  const [previousVisitors, setPreviousVisitors] = useState<any[]>([]);
  const [approvedVisitors, setApprovedVisitors] = useState<any[]>([]);
  const [allVisitors, setAllVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'reports' | 'hosts'>(isAdmin ? 'hosts' : 'pending');

  // Host Management State (for Admins)
  const [hosts, setHosts] = useState<any[]>([]);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHostId, setEditingHostId] = useState<number | null>(null);
  const [newHostUsername, setNewHostUsername] = useState('');
  const [newHostPassword, setNewHostPassword] = useState('');
  const [newHostLocation, setNewHostLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchVisitors = () => {
    fetch("/api/visitors")
      .then((res) => res.json())
      .then((data) => {
        setAllVisitors(data);
        // Determine which host's data to show
        const targetHost = isAdmin ? selectedHost : user?.username;
        
        if (targetHost) {
          const myVisitors = data.filter((v: any) => v.host_name === targetHost);
          setPendingVisitors(myVisitors.filter((v: any) => v.status === "Pending Approval"));
          setPreviousVisitors(myVisitors.filter((v: any) => v.status !== "Pending Approval"));
          setApprovedVisitors(myVisitors.filter((v: any) => ["Approved", "Inside Campus", "Completed"].includes(v.status)));
        } else if (isAdmin) {
          // If admin but no host selected, maybe show all for stats or just clear
          setPendingVisitors([]);
          setPreviousVisitors([]);
          setApprovedVisitors([]);
        }
        setLoading(false);
      });
  };

  const fetchHosts = () => {
    if (!isAdmin) return;
    fetch("/api/users/hosts")
      .then((res) => res.json())
      .then((data) => {
        setHosts(data);
      });
  };

  useEffect(() => {
    fetchVisitors();
    fetchHosts();
    const interval = setInterval(() => {
      fetchVisitors();
      fetchHosts();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, selectedHost]);

  const handleApproval = async (id: string, status: string) => {
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

  const handleDeleteVisitor = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this visitor record?")) return;
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchVisitors();
      } else {
        console.error(data.error || 'Failed to delete visitor');
      }
    } catch (err) {
      console.error('Server error. Please try again.');
    }
  };

  const handleAddHost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const url = editingHostId ? `/api/users/hosts/${editingHostId}` : '/api/users/hosts';
      const method = editingHostId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newHostUsername, password: newHostPassword, location: newHostLocation })
      });
      const data = await res.json();

      if (data.success) {
        setNewHostUsername('');
        setNewHostPassword('');
        setNewHostLocation('');
        setEditingHostId(null);
        setShowAddForm(false);
        fetchHosts();
      } else {
        setFormError(data.error || `Failed to ${editingHostId ? 'update' : 'add'} host`);
      }
    } catch (err) {
      setFormError('Server error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const startEditHost = (host: any) => {
    setEditingHostId(host.id);
    setNewHostUsername(host.username);
    setNewHostPassword('');
    setNewHostLocation(host.location || '');
    setShowAddForm(true);
    setFormError('');
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingHostId(null);
    setNewHostUsername('');
    setNewHostPassword('');
    setNewHostLocation('');
    setFormError('');
  };

  const handleDeleteHost = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this host account?")) return;
    try {
      const res = await fetch(`/api/users/hosts/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchHosts();
      } else {
        console.error(data.error || 'Failed to delete host');
      }
    } catch (err) {
      console.error('Server error. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
      <div className="print:hidden flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? (selectedHost ? `Managing Host: ${selectedHost}` : 'Host Management') : 'Host Dashboard'}
          </h1>
          <p className="text-gray-500">
            {isAdmin && selectedHost ? `Viewing dashboard as ${selectedHost}` : 'Review and manage visitor requests'}
          </p>
        </div>
        {isAdmin && selectedHost && (
          <button
            onClick={() => {
              setSelectedHost(null);
              setActiveTab('hosts');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center"
          >
            <Users className="w-4 h-4 mr-2" /> Back to Host List
          </button>
        )}
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('hosts');
              setSelectedHost(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
              activeTab === 'hosts' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" /> Host List
          </button>
        )}
        {(isAdmin && selectedHost || !isAdmin) && (
          <>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'pending' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                activeTab === 'history' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4 mr-2" /> Visitor History
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                activeTab === 'reports' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" /> Reports
            </button>
          </>
        )}
      </div>

      {activeTab === 'hosts' && isAdmin && !selectedHost && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Host Accounts</h3>
              <p className="text-sm text-gray-500">Manage faculty and staff login credentials</p>
            </div>
            <button
              onClick={() => showAddForm ? cancelForm() : setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {showAddForm ? 'Cancel' : 'Add New Host'}
            </button>
          </div>

          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-indigo-50/50">
              <form onSubmit={handleAddHost} className="max-w-md space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newHostUsername}
                    onChange={(e) => setNewHostUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., faculty_john"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingHostId && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}</label>
                  <input
                    type="password"
                    required={!editingHostId}
                    value={newHostPassword}
                    onChange={(e) => setNewHostPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter secure password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address (Where to meet)</label>
                  <input
                    type="text"
                    required
                    value={newHostLocation}
                    onChange={(e) => setNewHostLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Main Building, Room 101"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {formLoading ? 'Saving...' : editingHostId ? 'Save Changes' : 'Create Host Account'}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hosts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No host accounts found.
                    </td>
                  </tr>
                ) : (
                  hosts.map((host) => (
                    <tr key={host.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-500">#{host.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{host.username}</td>
                      <td className="px-6 py-4 text-gray-600">{host.location || 'N/A'}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedHost(host.username);
                            setActiveTab('pending');
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md hover:bg-indigo-100 transition-colors"
                        >
                          <Activity className="w-3.5 h-3.5 mr-1" /> Manage Dashboard
                        </button>
                        <button
                          onClick={() => startEditHost(host)}
                          className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHost(host.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
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

      {(activeTab !== 'hosts' || (isAdmin && selectedHost)) && (
        <>
          {activeTab === 'reports' ? (
            <ReportGenerator visitors={approvedVisitors} title={`Visitor Report - ${isAdmin ? selectedHost : user?.username}`} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700 flex items-center">
                  {activeTab === 'pending' ? (
                    <><Clock className="w-5 h-5 mr-2 text-amber-500" /> Pending Approvals</>
                  ) : (
                    <><History className="w-5 h-5 mr-2 text-indigo-500" /> Previous Visitors</>
                  )}
                </h2>
                <div className="flex items-center space-x-4">
                  {isAdmin && selectedHost && (
                    <Link
                      to={`/visitor/register?host=${selectedHost}`}
                      className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Visitor
                    </Link>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-800'}`}>
                    {activeTab === 'pending' ? pendingVisitors.length : previousVisitors.length} Records
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading requests...
                  </div>
                ) : activeTab === 'pending' ? (
                  pendingVisitors.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        All caught up!
                      </p>
                      <p className="text-sm">
                        No pending visitor requests at the moment.
                      </p>
                    </div>
                  ) : (
                    pendingVisitors.map((visitor) => (
                      <div
                        key={visitor.visitor_id}
                        className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-4">
                          {visitor.photo ? (
                            <img
                              src={visitor.photo}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                              {visitor.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {visitor.name}
                            </h3>
                            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              <span>
                                <strong className="font-medium">Purpose:</strong>{" "}
                                {visitor.purpose}
                              </span>
                              <span>
                                <strong className="font-medium">Phone:</strong>{" "}
                                {visitor.phone}
                              </span>
                              <span>
                                <strong className="font-medium">Time:</strong>{" "}
                                {format(new Date(visitor.entry_time), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-mono flex items-center space-x-4">
                              <span>ID: {visitor.visitor_id}</span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteVisitor(visitor.visitor_id)}
                                  className="text-red-400 hover:text-red-600 transition-colors flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 sm:ml-auto">
                          <button
                            onClick={() =>
                              handleApproval(visitor.visitor_id, "Rejected")
                            }
                            className="flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-200 transition-colors font-medium text-sm"
                          >
                            <X className="w-4 h-4 mr-1.5" /> Reject
                          </button>
                          <button
                            onClick={() =>
                              handleApproval(visitor.visitor_id, "Approved")
                            }
                            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 transition-colors font-medium text-sm shadow-sm"
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Approve
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  previousVisitors.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No previous visitors found.
                    </div>
                  ) : (
                    previousVisitors.map((visitor) => (
                      <div
                        key={visitor.visitor_id}
                        className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-4">
                          {visitor.photo ? (
                            <img
                              src={visitor.photo}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                              {visitor.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {visitor.name}
                            </h3>
                            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              <span>
                                <strong className="font-medium">Purpose:</strong>{" "}
                                {visitor.purpose}
                              </span>
                              <span>
                                <strong className="font-medium">Time:</strong>{" "}
                                {format(new Date(visitor.entry_time), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-mono flex items-center space-x-4">
                              <span>ID: {visitor.visitor_id}</span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteVisitor(visitor.visitor_id)}
                                  className="text-red-400 hover:text-red-600 transition-colors flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:ml-auto">
                          <StatusBadge status={visitor.status} />
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
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
