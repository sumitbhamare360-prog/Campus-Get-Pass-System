import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, CheckCircle2 } from "lucide-react";

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hosts, setHosts] = useState<any[]>([]);
  const [showHostSuggestions, setShowHostSuggestions] = useState(false);
  const [filteredHosts, setFilteredHosts] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    id_proof_type: "Aadhar Card",
    id_proof_number: "",
    purpose: "Meeting Faculty",
    host_name: "",
    department: "Computer Science",
  });

  useEffect(() => {
    const hostParam = searchParams.get('host');
    if (hostParam) {
      setFormData(prev => ({ ...prev, host_name: hostParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/users/hosts")
      .then((res) => res.json())
      .then((data) => {
        setHosts(data);
        setFilteredHosts(data);
      })
      .catch((err) => console.error("Failed to fetch hosts:", err));
  }, []);

  useEffect(() => {
    if (formData.host_name) {
      const filtered = hosts.filter((h) =>
        h.username.toLowerCase().includes(formData.host_name.toLowerCase())
      );
      setFilteredHosts(filtered);
    } else {
      setFilteredHosts(hosts);
    }
  }, [formData.host_name, hosts]);

  const handleHostSelect = (username: string) => {
    setFormData({ ...formData, host_name: username });
    setShowHostSuggestions(false);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setPhoto(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (["Meeting Faculty", "Meeting Student", "Event"].includes(formData.purpose)) {
      const isValidHost = hosts.some((h) => h.username === formData.host_name);
      if (!isValidHost) {
        setFormError("Please select a valid host/event from the suggestions.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photo }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/visitor/pass/${data.visitor_id}`);
      } else {
        setFormError("Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Error registering visitor:", error);
      setFormError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 px-8 py-6 text-white">
        <h2 className="text-2xl font-bold">Visitor Registration</h2>
        <p className="text-indigo-100 mt-1">
          Please fill out the form below to generate your gate pass.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Proof Type
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.id_proof_type}
                  onChange={(e) =>
                    setFormData({ ...formData, id_proof_type: e.target.value })
                  }
                >
                  <option>Aadhar Card</option>
                  <option>PAN Card</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.id_proof_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_proof_number: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Visit
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
              >
                <option>Meeting Faculty</option>
                <option>Meeting Student</option>
                <option>Admission Enquiry</option>
                <option>Campus Tour</option>
                <option>Event</option>
                <option>Other</option>
              </select>
            </div>

            {["Meeting Faculty", "Meeting Student", "Event"].includes(
              formData.purpose,
            ) && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.purpose === "Event" ? "Event Name" : "Host Name"}
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.host_name}
                  onChange={(e) => {
                    setFormData({ ...formData, host_name: e.target.value });
                    setShowHostSuggestions(true);
                  }}
                  onFocus={() => setShowHostSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowHostSuggestions(false), 200)}
                  placeholder={formData.purpose === "Event" ? "Type to search event..." : "Type to search host..."}
                  autoComplete="off"
                />
                {showHostSuggestions && filteredHosts.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filteredHosts.map((host) => (
                      <li
                        key={host.id}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700"
                        onClick={() => handleHostSelect(host.username)}
                      >
                        {host.username}
                      </li>
                    ))}
                  </ul>
                )}
                {showHostSuggestions && filteredHosts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                    {formData.purpose === "Event" ? "No events found." : "No hosts found."}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              >
                <option>Computer Science</option>
                <option>Mechanical Engineering</option>
                <option>Electrical Engineering</option>
                <option>Civil Engineering</option>
                <option>Administration</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Visitor Photo (Required)
          </label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
            {photo ? (
              <div className="relative">
                <img
                  src={photo}
                  alt="Visitor"
                  className="w-48 h-48 object-cover rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                >
                  <span className="sr-only">Remove</span>
                  &times;
                </button>
                <div className="mt-2 text-center text-sm text-emerald-600 flex items-center justify-center font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Photo captured
                </div>
              </div>
            ) : isCapturing ? (
              <div className="flex flex-col items-center">
                {/* @ts-ignore */}
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-64 h-48 object-cover rounded-lg shadow-sm mb-4"
                />
                <button
                  type="button"
                  onClick={capture}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Camera className="w-4 h-4 mr-2" /> Capture Photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCapturing(true)}
                className="flex flex-col items-center justify-center w-48 h-48 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-gray-500"
              >
                <Camera className="w-8 h-8 mb-2 text-indigo-500" />
                <span>Open Camera</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || !photo}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Registering..." : "Submit Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
