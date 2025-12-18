"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Bell,
  Clock,
  X,
  FileText,
} from "lucide-react";

/* =====================
   TYPES
===================== */

interface Notification {
  id: string;
  type:
    | "dispute_approved"
    | "claim_approved"
    | "dispute_pending"
    | "claim_pending";

  title: string;
  description: string;

  recordId: string;          // Mongo _id (internal)
  recordDisplayId: string;   // DISP-0001 / CLAIM-0001

  amount?: number;

  employeeId: any;
  employeeDisplayId: string; // EMP-0001

  read: boolean;
  createdAt: string;
}

/* =====================
   HELPERS
===================== */

const getEmployeeDisplayId = (employee: any): string => {
  if (!employee) return "N/A";
  if (typeof employee === "object" && employee.employeeNumber) {
    return employee.employeeNumber;
  }
  return "EMP-UNKNOWN";
};

/* =====================
   COMPONENT
===================== */

const FinanceNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "dispute_approved" | "claim_approved" | "unread"
  >("all");

  const [error, setError] = useState<string | null>(null);
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

        await fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
      } catch (e: any) {
        setError(e?.message || "Error fetching user");
        setLoading(false);
      }
    })();
  }, []);


  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const approvedRes = await fetch(
        "http://localhost:3000/payroll-tracking/finance/approved-records",
        { credentials: "include" }
      );

      const disputesRes = await fetch(
        "http://localhost:3000/payroll-tracking/disputes/for-manager-approval",
        { credentials: "include" }
      );

      const claimsRes = await fetch(
        "http://localhost:3000/payroll-tracking/claims/for-manager-approval",
        { credentials: "include" }
      );

      const notificationsList: Notification[] = [];

      const approved = approvedRes.ok ? await approvedRes.json() : {};
      const disputes = disputesRes.ok ? await disputesRes.json() : [];
      const claims = claimsRes.ok ? await claimsRes.json() : [];

      /* ✅ APPROVED DISPUTES */
      approved.disputes?.forEach((d: any) => {
        notificationsList.push({
          id: `dispute_${d._id}`,
          type: "dispute_approved",
          title: "Dispute Approved for Refund",
          description: `Dispute ${d.disputeId} has been approved and requires refund processing`,
          recordId: d._id,
          recordDisplayId: d.disputeId,
          employeeId: d.employeeId,
          employeeDisplayId: getEmployeeDisplayId(d.employeeId),
          amount: d.refundAmount,
          read: false,
          createdAt: d.updatedAt || new Date().toISOString(),
        });
      });

      /* ✅ APPROVED CLAIMS */
      approved.claims?.forEach((c: any) => {
        notificationsList.push({
          id: `claim_${c._id}`,
          type: "claim_approved",
          title: "Claim Approved for Refund",
          description: `Claim ${c.claimId} has been approved and requires refund processing`,
          recordId: c._id,
          recordDisplayId: c.claimId,
          employeeId: c.employeeId,
          employeeDisplayId: getEmployeeDisplayId(c.employeeId),
          amount: c.approvedAmount ?? c.amount,
          read: false,
          createdAt: c.updatedAt || new Date().toISOString(),
        });
      });

   
     

      notificationsList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setNotifications(notificationsList);
    } catch (err) {
      console.error("Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Finance staff alerts for approved disputes and claims
            </p>
          </div>
          <div className="relative">
            <Bell className="w-12 h-12 text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications</p>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`
                  relative rounded-xl border-l-4 p-6 shadow-sm transition
                  ${n.read ? "bg-white border-gray-300" : ""}
                  ${
                    n.type === "dispute_approved" ||
                    n.type === "claim_approved"
                      ? "bg-green-50 border-green-500"
                      : "bg-yellow-50 border-yellow-500"
                  }
                `}
              >
                <div className="flex justify-between gap-6">
                  <div className="flex gap-4">
                    {n.type.includes("approved") ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-600 mt-1" />
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        {n.description}
                      </p>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Employee ID</p>
                          <p className="font-medium text-gray-900">
                            {n.employeeDisplayId}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Record ID</p>
                          <p className="font-medium text-gray-900">
                            {n.recordDisplayId}
                          </p>
                        </div>
                        {n.amount && (
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-gray-900">
                              ${n.amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Mark Read
                      </button>
                    )}

                    {n.type.includes("approved") && (
                      <Link
                        href={`/refunds?type=${
                          n.type === "dispute_approved" ? "dispute" : "claim"
                        }&recordId=${encodeURIComponent(
                          n.recordId
                        )}&amount=${n.amount ?? ""}`}
                        className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Create Refund
                      </Link>
                    )}

                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceNotifications;