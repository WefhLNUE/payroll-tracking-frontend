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

interface Claim {
  claimId: string;
  description: string;
  claimType: string;
  amount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  resolutionComment: string | null;
}

const ClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // form
  const [description, setDescription] = useState("");
  const [claimType, setClaimType] = useState("");
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      // ensure authenticated (cookie-based)
      const meRes = await fetch("http://localhost:5000/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!meRes.ok) throw new Error("Not authenticated");

      const res = await fetch(
        "http://localhost:5000/payroll-tracking/my-claims",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "Failed to fetch claims");
      }

      const data = await res.json();
      // backend returns either array or { message, claims: [] }
      const list: Claim[] = Array.isArray(data)
        ? data
        : Array.isArray(data.claims)
        ? data.claims
        : [];
      setClaims(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // fallback sample
      setClaims([
        {
          claimId: "CLAIM-0001",
          description: "Travel expense for client visit",
          claimType: "TRAVEL",
          amount: 120.5,
          approvedAmount: null,
          status: "UNDER_REVIEW",
          rejectionReason: null,
          resolutionComment: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!description.trim() || !claimType.trim() || !amount.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await fetch(
        "http://localhost:5000/payroll-tracking/expense-claims",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            description: description.trim(),
            claimType: claimType.trim(),
            amount: parsedAmount,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Failed to submit claim: ${res.status}`);
      }

      // reset
      setDescription("");
      setClaimType("");
      setAmount("");
      setShowModal(false);
      await fetchClaims();
      alert("Claim submitted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "UNDER_REVIEW":
      case "PENDING_MANAGER_APPROVAL":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "APPROVED":
      case "CONFIRMED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "UNDER_REVIEW":
      case "PENDING_MANAGER_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Expense Claims
            </h1>
            <p className="text-gray-600">
              Submit and track your expense claims
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Claim
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700">
              ⚠️ API Error: {error} (showing sample data)
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total claims</p>
            <p className="text-3xl font-bold text-gray-900">
              {(claims || []).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {
                (claims || []).filter(
                  (c) =>
                    (c.status || "").toUpperCase().includes("UNDER_REVIEW") ||
                    (c.status || "").toUpperCase().includes("PENDING")
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {
                (claims || []).filter(
                  (c) => (c.status || "").toUpperCase() === "APPROVED"
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {
                (claims || []).filter(
                  (c) => (c.status || "").toUpperCase() === "REJECTED"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {(claims || []).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No claims found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any expense claims yet.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" /> Submit Your First Claim
              </button>
            </div>
          ) : (
            claims.map((c) => (
              <div
                key={c.claimId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(c.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {c.claimId}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {c.claimType} —{" "}
                      {c.amount ? `$${Number(c.amount).toFixed(2)}` : ""}
                    </h3>
                    <p className="text-gray-700 mb-4">{c.description}</p>

                    {c.rejectionReason && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-red-800 mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700">
                          {c.rejectionReason}
                        </p>
                      </div>
                    )}

                    {c.resolutionComment && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
                        <p className="text-sm font-semibold text-green-800 mb-1">
                          Resolution Comment:
                        </p>
                        <p className="text-sm text-green-700">
                          {c.resolutionComment}
                        </p>
                      </div>
                    )}

                    {c.approvedAmount != null && (
                      <div className="text-sm text-gray-600">
                        Approved Amount:{" "}
                        <span className="font-medium">
                          ${Number(c.approvedAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Submit Expense Claim
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    placeholder="e.g. TRAVEL, MEAL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Describe the expense..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitClaim}
                    disabled={submitLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {submitLoading ? "Submitting..." : "Submit Claim"}
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

export default ClaimsPage;
