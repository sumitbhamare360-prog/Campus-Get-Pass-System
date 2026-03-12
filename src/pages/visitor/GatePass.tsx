import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  ArrowLeft,
  Printer,
  Download,
  Loader2
} from "lucide-react";

export function GatePass() {
  const { id } = useParams();
  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    fetch(`/api/visitors/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setVisitor(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  if (!visitor || visitor.error)
    return (
      <div className="text-center p-12 text-red-500">Visitor not found</div>
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]";
      case "Pending Approval":
        return "bg-[#fef3c7] text-[#92400e] border-[#fde68a]";
      case "Rejected":
        return "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
      case "Inside Campus":
        return "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]";
      case "Completed":
        return "bg-[#f3f4f6] text-[#1f2937] border-[#e5e7eb]";
      default:
        return "bg-[#f3f4f6] text-[#1f2937]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-5 h-5 mr-1.5" />;
      case "Pending Approval":
        return <Clock className="w-5 h-5 mr-1.5" />;
      case "Rejected":
        return <ShieldAlert className="w-5 h-5 mr-1.5" />;
      default:
        return null;
    }
  };

  const executePrint = () => {
    window.print();
  };

  const passContent = (
    <div id="printable-pass" className="bg-white rounded-2xl shadow-lg border border-[#e5e7eb] overflow-hidden print:shadow-none print:border-2" style={{ color: '#111827' }}>
      {/* Header */}
      <div className="bg-[#312e81] px-8 py-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
            Digital Gate Pass
          </h2>
          <p className="text-[#c7d2fe] text-sm mt-1 font-mono">
            {visitor.visitor_id}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#a5b4fc] uppercase tracking-wider font-semibold">
            Date of Visit
          </p>
          <p className="font-medium text-white">
            {format(new Date(visitor.entry_time), "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`px-8 py-3 flex items-center justify-center border-b font-semibold text-sm uppercase tracking-wider ${getStatusColor(visitor.status)}`}
      >
        {getStatusIcon(visitor.status)}
        {visitor.status}
      </div>

      {/* Body */}
      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Details */}
          <div className="flex-1 space-y-6">
            <div className="flex items-start space-x-4">
              {visitor.photo ? (
                <img
                  src={visitor.photo}
                  alt={visitor.name}
                  className="w-24 h-24 rounded-lg object-cover border-2 border-[#f3f4f6] shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-[#f3f4f6] border-2 border-[#e5e7eb] flex items-center justify-center text-[#9ca3af]">
                  No Photo
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-[#111827]">
                  {visitor.name}
                </h3>
                <p className="text-[#6b7280]">{visitor.phone}</p>
                <p className="text-sm text-[#6b7280] mt-1">
                  {visitor.id_proof_type}: {visitor.id_proof_number}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#f3f4f6]">
              <div>
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold mb-1">
                  Purpose
                </p>
                <p className="font-medium text-[#111827]">{visitor.purpose}</p>
              </div>
              <div>
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold mb-1">
                  Department
                </p>
                <p className="font-medium text-[#111827]">
                  {visitor.department}
                </p>
              </div>
              {visitor.host_name && (
                <div className="col-span-2">
                  <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold mb-1">
                    {visitor.purpose === "Event" ? "Event Name" : "Meeting With"}
                  </p>
                  <p className="font-medium text-[#111827]">
                    {visitor.host_name}
                  </p>
                </div>
              )}
              {visitor.host_location && (
                <div className="col-span-2">
                  <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold mb-1">
                    Location / Venue
                  </p>
                  <p className="font-medium text-[#111827]">
                    {visitor.host_location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
            <QRCodeSVG
              value={visitor.visitor_id}
              size={160}
              level="H"
              includeMargin={true}
              className="bg-white p-2 rounded-lg shadow-sm"
            />
            <p className="text-xs text-[#6b7280] mt-4 text-center">
              Scan at security gate
              <br />
              for verification
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#f9fafb] px-8 py-4 border-t border-[#f3f4f6] text-xs text-[#6b7280] text-center">
        This pass is non-transferable and valid only for the specified date
        and purpose. Please present a valid photo ID along with this pass at
        the security gate.
      </div>
    </div>
  );

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto print:bg-white print:static">
        <div className="max-w-2xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
          {/* Preview Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
              <p className="text-sm text-gray-500">Review the gate pass before printing</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={executePrint}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center font-medium transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print / Save as PDF
              </button>
            </div>
          </div>

          {passContent}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link
          to="/"
          className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            setShowPreview(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Pass
        </button>
      </div>

      {passContent}
    </div>
  );
}
