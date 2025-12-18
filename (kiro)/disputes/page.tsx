"use client";
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";

interface Dispute {
  disputeId: string;
  description: string;
  status: string;
  rejectionReason: string | null;
  resolutionComment: string | null;
  payrollSpecialistId: string | null;
  payrollManagerId: string | null;
  financeStaffId: string | null;
}

interface Payslip {
  payslipId: string;
  month: number;
  year: number;
  netPay: string;
  createdAt: string;
}

const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form state
  const [selectedPayslip, setSelectedPayslip] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchDisputes();
    fetchPayslips();
  }, []);

  const fetchDisputes = async () => {
    try {
      const meRes = await fetch("http://localhost:5000/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send HTTP-only cookie
      });

      if (!meRes.ok) {
        throw new Error("Failed to fetch user");
      }

      await meRes.json(); // Verify user is authenticated
      setLoading(true);

      // Fetch disputes - backend expects cookie-based auth, not Authorization header
      const response = await fetch(
        "http://localhost:5000/payroll-tracking/my-disputes",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // send HTTP-only cookie
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch disputes" }));
        throw new Error(errorData.message || "Failed to fetch disputes");
      }

      const data = await response.json();
      // Backend returns array when disputes exist, or object with { message, disputes: [] } when empty
      // Ensure we always set an array to prevent "filter is not a function" errors
      let disputesArray: Dispute[] = [];
      if (Array.isArray(data)) {
        disputesArray = data;
      } else if (data && Array.isArray(data.disputes)) {
        disputesArray = data.disputes;
      }
      setDisputes(disputesArray);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback sample data
      setDisputes([
        {
          disputeId: "1",
          description: "Incorrect overtime calculation for November",
          status: "PENDING",
          rejectionReason: null,
          resolutionComment: null,
          payrollSpecialistId: null,
          payrollManagerId: null,
          financeStaffId: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/payroll-tracking/my-payslip",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // send HTTP-only cookie
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch payslips:", response.status, errorText);
        // If 404, the route might not be registered - use fallback
        if (response.status === 404) {
          console.warn(
            "Route /payroll-tracking/my-payslip not found. Make sure backend is running and route is registered."
          );
        }
        throw new Error(
          `Failed to fetch payslips: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // Backend now returns an array, but handle both cases for compatibility
      const payslipsArray = Array.isArray(data) ? data : data ? [data] : [];
      setPayslips(payslipsArray);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      // Fallback sample data
      setPayslips([
        {
          payslipId: "691bb443b2c1cc410437babf",
          month: 11,
          year: 2025,
          netPay: "$14200.00",
          createdAt: "Tue Nov 18 2025",
        },
      ]);
    }
  };

  const handleSubmitDispute = async () => {
    if (!selectedPayslip || !description.trim()) {
      alert("Please select a payslip and enter a description");
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await fetch(
        "http://localhost:5000/payroll-tracking/disputes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // send HTTP-only cookie
          body: JSON.stringify({
            payslipId: selectedPayslip,
            description: description.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to submit dispute" }));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          `Failed to submit dispute: ${response.status} ${response.statusText}`;
        console.error("Dispute submission error:", errorMessage, errorData);
        throw new Error(errorMessage);
      }

      // Reset form and close modal
      setSelectedPayslip("");
      setDescription("");
      setShowModal(false);

      // Refresh disputes list
      await fetchDisputes();

      alert("Dispute submitted successfully!");
    } catch (err) {
      alert(
        "Error submitting dispute: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch ((status || "").toUpperCase()) {
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

  const getStatusColor = (status: string | null | undefined) => {
    switch ((status || "").toUpperCase()) {
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

  const getMonthName = (month: number): string => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[month - 1] || "Unknown";
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Payroll Disputes
            </h1>
            <p className="text-gray-600">
              Manage and track your payroll dispute requests
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Dispute
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700">
              ⚠️ API Error: {error} (Showing sample data)
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Disputes</p>
            <p className="text-3xl font-bold text-gray-900">
              {(disputes || []).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {
                (disputes || []).filter(
                  (d) => (d.status || "").toUpperCase() === "PENDING"
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-green-600">
              {
                (disputes || []).filter((d) =>
                  ["APPROVED", "RESOLVED"].includes(
                    (d.status || "").toUpperCase()
                  )
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {
                (disputes || []).filter(
                  (d) => (d.status || "").toUpperCase() === "REJECTED"
                ).length
              }
            </p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {(disputes || []).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Disputes Found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t submitted any payroll disputes yet.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Submit Your First Dispute
              </button>
            </div>
          ) : (
            (disputes || []).map((dispute) => (
              <div
                key={dispute.disputeId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(dispute.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          dispute.status
                        )}`}
                      >
                        {dispute.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {dispute.disputeId}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Dispute Description
                    </h3>
                    <p className="text-gray-700 mb-4">{dispute.description}</p>

                    {dispute.rejectionReason && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-red-800 mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700">
                          {dispute.rejectionReason}
                        </p>
                      </div>
                    )}

                    {dispute.resolutionComment && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-green-800 mb-1">
                          Resolution Comment:
                        </p>
                        <p className="text-sm text-green-700">
                          {dispute.resolutionComment}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {dispute.payrollSpecialistId && (
                        <span>Specialist: {dispute.payrollSpecialistId}</span>
                      )}
                      {dispute.payrollManagerId && (
                        <span>Manager: {dispute.payrollManagerId}</span>
                      )}
                      {dispute.financeStaffId && (
                        <span>Finance: {dispute.financeStaffId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Submit New Dispute
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payslip <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPayslip}
                    onChange={(e) => setSelectedPayslip(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Choose a payslip...</option>
                    {payslips.map((payslip) => (
                      <option key={payslip.payslipId} value={payslip.payslipId}>
                        {getMonthName(payslip.month)} {payslip.year} -{" "}
                        {payslip.netPay} ({payslip.createdAt})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispute Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Please describe the issue with your payslip in detail..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Provide as much detail as possible to help us resolve your
                    dispute quickly.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitDispute}
                    disabled={submitLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {submitLoading ? "Submitting..." : "Submit Dispute"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
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

export default DisputesPage;
