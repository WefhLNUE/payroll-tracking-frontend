"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

interface Dispute {
  _id: string;
  disputeId: string;
  employeeId:
  {
     _id: string;        
     employeeNumber: string; 
    };
  payslipId: string;
  description: string;
  status: string;
  rejectionReason: string | null;
  resolutionComment: string | null;
  payrollSpecialistId: string | null;
  payrollManagerId: string | null;
  financeStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

type UserRole = "specialist" | "manager";

// Helper function to extract ID from object or return string
const getId = (value: any): string => {
  if (!value) return "N/A";
  if (typeof value === "string") return value;
  if (value._id) return value._id;
  return "N/A";
};
const getEmployeeDisplayId = (employee: any): string => {
  if (!employee) return "N/A";

  // populated object
  if (typeof employee === "object" && employee.employeeNumber) {
    return employee.employeeNumber;
  }

  // fallback (should not happen if populated)
  return "EMP-UNKNOWN";
};
const DisputesSpecialistPage: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>("specialist");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form states
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });
        if (!me.ok) {
          setError("Unauthorized");
          setLoading(false);
          return;
        }
        const u = await me.json();
        setCurrentUser(u);

        if (!Array.isArray(u.roles) || !u.roles.includes("Payroll Specialist")) {
          setError("Forbidden: requires Payroll Specialist role");
          setLoading(false);
          return;
        }

        await fetchDisputes();
      } catch (e: any) {
        setError(e?.message || "Error fetching user");
        setLoading(false);
      }
    })();
  }, []);

  const fetchDisputes = async () => {
    try {
      const endpoint =
        "http://localhost:3000/payroll-tracking/disputes/for-specialist-review";
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch disputes");
      const data = await response.json();
      setDisputes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dispute: Dispute) => {
    try {
      setProcessingId(dispute._id);

      const response = await fetch(
        `http://localhost:3000/payroll-tracking/dispute/${dispute._id}/specialist-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            comments: approvalComments,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to approve dispute");

      alert("Dispute approved successfully!");
      setShowApprovalModal(false);
      resetForm();
      await fetchDisputes();
    } catch (err) {
      alert(
        "Error approving dispute: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (dispute: Dispute) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingId(dispute._id);

      const response = await fetch(
        `http://localhost:3000/payroll-tracking/dispute/${dispute._id}/specialist-reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            rejectionReason,
            comments: approvalComments,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject dispute");

      alert("Dispute rejected successfully!");
      setShowRejectionModal(false);
      resetForm();
      await fetchDisputes();
    } catch (err) {
      alert(
        "Error rejecting dispute: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setApprovalComments("");
    setRejectionReason("");
    setSelectedDispute(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "APPROVED":
      case "RESOLVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPendingDisputes = () =>
    disputes.filter((d) =>
      (d.status || "").toLowerCase().includes("pending") ||
      (d.status || "").toLowerCase().includes("review")
    );

  /* =====================
     JSX — UNCHANGED
     ===================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const pendingDisputes = getPendingDisputes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Disputes Review & Approval
            </h1>
            <p className="text-gray-600">
              {userRole === "specialist"
                ? "Review disputes submitted by employees and forward to manager"
                : "Approve or reject disputes from payroll specialist review"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700">⚠️ API Error: {error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Disputes</p>
            <p className="text-3xl font-bold text-gray-900">{disputes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingDisputes.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {disputes.filter((d) => d.status.toUpperCase() === "APPROVED").length}
            </p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {pendingDisputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Disputes to Review</h3>
              <p className="text-gray-600">All disputes have been processed or are awaiting submission.</p>
            </div>
          ) : (
            pendingDisputes.map((dispute) => (
              <div key={dispute._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(dispute.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                      <span className="text-sm text-gray-500">ID: {dispute.disputeId}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Employee ID</p>
                        <p className="font-semibold text-gray-900">{getEmployeeDisplayId(dispute.employeeId)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Payslip ID</p>
                        <p className="font-semibold text-gray-900">{getId(dispute.payslipId)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Submitted</p>
                        <p className="font-semibold text-gray-900">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute Description</h3>
                    <p className="text-gray-700 mb-4">{dispute.description}</p>

                    {dispute.rejectionReason && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{dispute.rejectionReason}</p>
                      </div>
                    )}

                    {dispute.resolutionComment && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-green-800 mb-1">Resolution Comment:</p>
                        <p className="text-sm text-green-700">{dispute.resolutionComment}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowApprovalModal(true);
                    }}
                    disabled={processingId === dispute._id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processingId === dispute._id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowRejectionModal(true);
                    }}
                    disabled={processingId === dispute._id}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    {processingId === dispute._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Approve Dispute</h2>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-green-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-1">Dispute ID</p>
                  <p className="font-semibold text-gray-900">{selectedDispute.disputeId}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Add any comments..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(selectedDispute)}
                    disabled={processingId === selectedDispute._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {processingId === selectedDispute._id ? "Processing..." : "Confirm Approval"}
                  </button>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-red-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Reject Dispute</h2>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-red-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-1">Dispute ID</p>
                  <p className="font-semibold text-gray-900">{selectedDispute.disputeId}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="Provide a detailed reason for rejection..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments</label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="Any additional comments..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleReject(selectedDispute)}
                    disabled={processingId === selectedDispute._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {processingId === selectedDispute._id ? "Processing..." : "Confirm Rejection"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputesSpecialistPage;