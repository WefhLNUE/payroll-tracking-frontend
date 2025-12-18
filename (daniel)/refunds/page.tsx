"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  X,
  FileText,
  Plus,
} from "lucide-react";

interface Refund {
  _id: string;
  type: "dispute" | "claim";
  recordId: string;
    employeeId:
  {
     _id: string;        
     employeeNumber: string; 
    };
  refundAmount: number;
  status: string;
  description?: string;
  financeStaffId: any;
  payrollRunId?: string;
  createdAt: string;
  updatedAt: string;
}
const getReadableId = (refund: any) => {
  if (refund.disputeId?.disputeId) return refund.disputeId.disputeId;
  if (refund.claimId?.claimId) return refund.claimId.claimId;
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
// Helper function to extract ID from object or return string
const getId = (value: any): string => {
  if (!value && value !== 0) return "N/A";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value._id) {
      const id = value._id;
      return typeof id === "string" ? id : String(id);
    }
    if (value.id) {
      const id = value.id;
      return typeof id === "string" ? id : String(id);
    }
    // Try JSON stringification to extract any id-like field
    const keys = Object.keys(value);
    for (const key of keys) {
      if (key === "_id" || key === "id") {
        return String(value[key]);
      }
    }
    // Mongoose ObjectId may be represented with a toString()
    try {
      const s = value.toString();
      if (s && s !== "[object Object]" && s.length > 5) return s;
    } catch (e) {
      // ignore
    }
    // Log for debugging
    console.warn("getId could not extract id from:", value);
  }
  return "N/A";
};

const RefundsPage: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [approvedRecords, setApprovedRecords] = useState<{
  disputes: any[];
  claims: any[];
}>({ disputes: [], claims: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
const searchParams = useSearchParams();

  // Form states
  const [refundType, setRefundType] = useState<"dispute" | "claim">("dispute");
  const [recordId, setRecordId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payrollRunId, setPayrollRunId] = useState("");
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

        if (!Array.isArray(u.roles) || !u.roles.includes("Finance Staff")) {
          setError("Forbidden: requires Finance Staff role");
          setLoading(false);
          return;
        }

        await fetchRefunds();
        await fetchApprovedRecords();

      } catch (e: any) {
        setError(e?.message || "Error fetching user");
        setLoading(false);
      }
    })();
  }, []);
useEffect(() => {
  const type = searchParams.get("type");
  const recordIdParam = searchParams.get("recordId");
  const amount = searchParams.get("amount");

  if (type && recordIdParam) {
    setRefundType(type as "dispute" | "claim");
    setRecordId(recordIdParam);

    if (amount) {
      setRefundAmount(amount);
    }

    setShowCreateModal(true);
  }
}, [searchParams]);
const fetchApprovedRecords = async () => {
  try {
    const res = await fetch(
      "http://localhost:3000/payroll-tracking/finance/approved-records",
      { credentials: "include" }
    );

    if (!res.ok) throw new Error("Failed to fetch approved records");

    const data = await res.json();
    setApprovedRecords({
      disputes: data.disputes || [],
      claims: data.claims || [],
    });
  } catch (err) {
    console.error("Approved records fetch error", err);
  }
};

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/refunds",
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch refunds");
      }

 const data = await response.json();

const normalized = (Array.isArray(data) ? data : []).map((r: any) => ({
  ...r,
  status: String(r.status).toUpperCase(),
  refundAmount: r.refundDetails?.amount ?? 0, // ✅ keep old usage alive
}));

setRefunds(normalized); } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRefund = async () => {
    if (!recordId.trim() || !refundAmount.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setProcessingId("create");
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/refund/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            type: refundType,
            recordId: recordId,
            refundAmount: parseFloat(refundAmount),
            description: description,
          }),
        }
      );

      const resBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resBody.message || "Failed to create refund");
      }

      alert(resBody.message || "Refund created successfully!");
      setShowCreateModal(false);
      resetForm();
      await fetchRefunds();
      await fetchApprovedRecords();
    } catch (err) {
      alert(
        "Error creating refund: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedRefund || !payrollRunId.trim()) {
      alert("Please enter payroll run ID");
      return;
    }

    try {
      setProcessingId(selectedRefund._id);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/refund/${selectedRefund._id}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            payrollRunId: payrollRunId,
          }),
        }
      );
      const resBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resBody.message || "Failed to mark refund as paid");
      }

      alert(resBody.message || "Refund marked as paid successfully!");
      setShowMarkPaidModal(false);
      resetForm();
      await fetchRefunds();
    } catch (err) {
      alert(
        "Error marking refund as paid: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setRefundType("dispute");
    setRecordId("");
    setRefundAmount("");
    setDescription("");
    setPayrollRunId("");
    setSelectedRefund(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PAID":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPendingRefunds = () => {
    return refunds.filter((r) => r.status.toUpperCase() === "PENDING");
  };

  const getFilteredRefunds = () => {
    return refunds.filter((refund) => {
      // derive type from backend fields (refund.type may be missing)
      const actualType = (refund as any).type || ((refund as any).disputeId ? 'dispute' : (refund as any).claimId ? 'claim' : 'unknown');
      // Filter by status
      if (filterStatus !== "all" && refund.status.toUpperCase() !== filterStatus.toUpperCase()) {
        return false;
      }

      // Filter by type
      if (filterType !== "all" && actualType !== filterType) {
        return false;
      }

      // Filter by amount range
      const amount = (refund as any).refundDetails?.amount || 0;
      if (filterMinAmount && amount < parseFloat(filterMinAmount)) {
        return false;
      }
      if (filterMaxAmount && amount > parseFloat(filterMaxAmount)) {
        return false;
      }

      return true;
    });
  };

  const getTotalPendingAmount = () => {
    return getPendingRefunds().reduce((sum, refund) => sum + ((refund as any).refundDetails?.amount || 0), 0);
  };

  const getTotalPaidAmount = () => {
    return refunds
      .filter((r) => r.status.toUpperCase() === "PAID")
      .reduce((sum, refund) => sum + ((refund as any).refundDetails?.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading refunds...</p>
        </div>
      </div>
    );
  }

  const pendingRefunds = getPendingRefunds();
  const filteredRefunds = getFilteredRefunds();
  
  const refundedDisputeIds = new Set(
  refunds
    .filter((r: any) => r.disputeId?._id)
    .map((r: any) => r.disputeId._id)
);

const refundedClaimIds = new Set(
  refunds
    .filter((r: any) => r.claimId?._id)
    .map((r: any) => r.claimId._id)
);
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-red-600 font-semibold">{error}</p>
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
              Refunds Management
            </h1>
            <p className="text-gray-600">
              Manage refunds for approved disputes and claims
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Refund
          </button>
        </div>
{/* ✅ Approved Disputes & Claims Awaiting Refund */}
<div className="bg-white rounded-lg shadow-md p-6 mt-10 mb-12">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">
    Approved Disputes & Claims Awaiting Refund
  </h3>

  {approvedRecords.disputes.length === 0 &&
   approvedRecords.claims.length === 0 ? (
    <p className="text-gray-600">No approved records awaiting refund.</p>
  ) : (
    <div className="space-y-4">
      {[
  ...approvedRecords.disputes
    .filter(d => !refundedDisputeIds.has(d._id))
    .map(d => ({ ...d, _type: "dispute" })),

  ...approvedRecords.claims
    .filter(c => !refundedClaimIds.has(c._id))
    .map(c => ({ ...c, _type: "claim" })),
].map((record: any) => (
        <div
          key={record._id}
          className="border rounded-lg p-4 flex justify-between items-start"
        >
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">
              {record._type === "dispute" ? "Dispute" : "Claim"}:{" "}
              {record.disputeId || record.claimId}
            </p>

            <p className="text-sm text-gray-600">
              Employee: {getEmployeeDisplayId(record.employeeId)}
            </p>

            {/* ✅ Approved Refund Amount */}
            {record._type === "claim" && (
              <p className="text-sm font-semibold text-green-700">
                Approved Amount: $
                {(record.approvedAmount ?? record.amount)?.toFixed(2)}
              </p>
            )}

            {record._type === "dispute" && record.resolutionComment && (
              <p className="text-sm font-semibold text-green-700">
                Approved Refund (see note below)
              </p>
            )}

            {/* ✅ Manager Message */}
            {record.resolutionComment && (
              <div className="bg-gray-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Manager Comment
                </p>
                <p className="text-sm text-gray-600">
                  {record.resolutionComment}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setRefundType(record._type);
              setRecordId(record._id); // ✅ Mongo ID
              setShowCreateModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg h-fit"
          >
            Create Refund
          </button>
        </div>
      ))}
    </div>
  )}
</div>
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700">
              ⚠️ API Error: {error}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="dispute">Dispute</option>
                <option value="claim">Claim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Amount
              </label>
              <input
                type="number"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Amount
              </label>
              <input
                type="number"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterType("all");
                setFilterMinAmount("");
                setFilterMaxAmount("");
              }}
              className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Refunds</p>
            <p className="text-3xl font-bold text-gray-900">{refunds.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${getTotalPendingAmount().toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ${getTotalPaidAmount().toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 mb-1">Pending Refunds</p>
            <p className="text-3xl font-bold text-purple-600">
              {pendingRefunds.length}
            </p>
          </div>
        </div>

        {/* Refunds List */}
        <div className="space-y-4">
          {filteredRefunds.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {refunds.length === 0 ? "No Refunds" : "No Refunds Match Filters"}
              </h3>
              <p className="text-gray-600 mb-6">
                {refunds.length === 0
                  ? "No refunds have been created yet."
                  : "Try adjusting your filter criteria."}
              </p>
              {refunds.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Refund
                </button>
              )}
            </div>
          ) : (
            filteredRefunds.map((refund) => {
              const actualType = (refund as any).type || ((refund as any).disputeId ? 'dispute' : (refund as any).claimId ? 'claim' : 'unknown');

              return (
                <div
                  key={refund._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(refund.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {actualType === 'dispute' ? 'Dispute Refund' : actualType === 'claim' ? 'Claim Refund' : 'Refund'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Record ID</p>
                          <p className="font-semibold text-gray-900">
                           {getReadableId(refund)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Employee ID</p>
                          <p className="font-semibold text-gray-900">
                          {getEmployeeDisplayId(refund.employeeId)}
                         </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(refund.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Amount Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 p-4 mb-4 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Refund Amount
                            </p>
                            <p className="text-3xl font-bold text-blue-600">
                              ${(((refund as any).refundDetails?.amount) || 0).toFixed(2)}
                            </p>
                          </div>
                          <DollarSign className="w-12 h-12 text-blue-400 opacity-50" />
                        </div>
                      </div>

                      {(refund as any).refundDetails?.description && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Description:
                          </p>
                          <p className="text-sm text-gray-600">
                            {(refund as any).refundDetails.description}
                          </p>
                        </div>
                      )}

                      {(refund as any).paidInPayrollRunId && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Payroll Run ID:
                          </p>
                          <p className="text-sm text-gray-600">
                            {getId((refund as any).paidInPayrollRunId)}
                          </p>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <p>
                          Processed by: <span className="font-semibold">{getId(refund.financeStaffId)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {refund.status.toUpperCase() === "PENDING" && (
                    <div className="pt-4 border-t mt-4">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setShowMarkPaidModal(true);
                        }}
                        disabled={processingId === refund._id}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {processingId === refund._id
                          ? "Processing..."
                          : "Mark as Paid"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create Refund Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Create Refund
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={refundType}
                    onChange={(e) =>
                      setRefundType(e.target.value as "dispute" | "claim")
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="dispute">Dispute</option>
                    <option value="claim">Claim</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter dispute or claim ID..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Add any description or notes..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCreateRefund}
                    disabled={processingId === "create"}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {processingId === "create" ? "Creating..." : "Create Refund"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
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

        {/* Mark as Paid Modal */}
        {showMarkPaidModal && selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Mark Refund as Paid
                </h2>
                <button
                  onClick={() => {
                    setShowMarkPaidModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-green-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Refund ID</p>
                      <p className="font-semibold text-gray-900">
                        {selectedRefund._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Amount</p>
                      <p className="font-semibold text-gray-900">
${((selectedRefund as any).refundDetails?.amount ?? selectedRefund.refundAmount ?? 0).toFixed(2)}                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payroll Run ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={payrollRunId}
                    onChange={(e) => setPayrollRunId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Enter payroll run ID..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={processingId === selectedRefund._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {processingId === selectedRefund._id
                      ? "Processing..."
                      : "Confirm Payment"}
                  </button>
                  <button
                    onClick={() => {
                      setShowMarkPaidModal(false);
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

export default RefundsPage;
