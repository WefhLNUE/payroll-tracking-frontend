"use client";

import { useEffect, useState } from "react";
// Lucide icons
import {
  ArrowLeft,
  FileText,
  Loader2,
  DollarSign,
  Clock,
  Calendar,
  TrendingDown,
  BarChart2,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- 1. INTERFACE DEFINITION ---
interface PayslipSummary {
  payrollRunId: string;
  totalGrossSalary: string;
  totalDeductions: string;
  netPay: string;
  paymentStatus: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

// --- 2. HELPER COMPONENT: Status Indicator (Muted Colors) ---
const StatusIndicator = ({ status }: { status: string }) => {
  const statusLower = status.toLowerCase();

  if (statusLower === "paid") {
    return (
      <div className="flex items-center text-green-800 font-bold text-xs bg-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3 mr-1" /> PAID
      </div>
    );
  }
  if (statusLower === "pending") {
    return (
      <div className="flex items-center text-amber-800 font-bold text-xs bg-amber-200 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3 mr-1" /> PENDING
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-800 font-bold text-xs bg-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3 mr-1" /> FAILED
    </div>
  );
};

// --- 3. ELEGANT NEUTRAL Payslip List Item (Soft Colors, High Contrast) ---

interface PayslipCardProps {
  item: PayslipSummary;
}

const PayslipListItem = ({ item }: PayslipCardProps) => {
  const monthName = new Date(item.year, item.month - 1).toLocaleString(
    "en-US",
    { month: "long" }
  );

  return (
    <div
      className="w-full bg-white rounded-xl shadow-lg overflow-hidden 
                        hover:shadow-xl transition duration-300 transform hover:scale-[1.005] border-l-4 border-slate-700/50"
    >
      {/* FINAL FLEXIBLE GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[30%_1fr_20%] divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* 1. Period and Status (WIDER PROPORTION: 30% - Soft Gray Background) */}
        <div className="p-4 flex flex-col justify-center bg-gray-100">
          {/* Primary Row: Month/Year and Status Indicator (Horizontal) */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-700" />
              <span className="text-lg font-extrabold text-gray-900">
                {monthName} {item.year}
              </span>
            </div>
            <StatusIndicator status={item.paymentStatus} />
          </div>

          {/* Secondary Row: Dedicated full-width line for the Run ID */}
          <span className="text-xs text-slate-600 font-mono pl-7 truncate w-full mt-0.5 opacity-90">
            RUN ID: {item.payrollRunId.substring(0, 20)}...
          </span>
        </div>

        {/* 2. Combined Financial Details (Middle Section - Clean White) */}
        <div className="py-4 px-6 flex justify-between items-center text-center bg-white">
          <div className="flex flex-col flex-1 border-r border-gray-100 pr-4">
            <span className="text-xs font-semibold text-gray-500 flex items-center mb-1 justify-center">
              <TrendingUp className="w-3 h-3 mr-1 text-teal-600" /> GROSS
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {item.totalGrossSalary}
            </span>
          </div>
          <div className="flex flex-col flex-1 pl-4">
            <span className="text-xs font-semibold text-gray-500 flex items-center mb-1 justify-center">
              <TrendingDown className="w-3 h-3 mr-1 text-red-600" /> DEDUCTIONS
            </span>
            <span className="text-xl font-extrabold text-red-700">
              {item.totalDeductions}
            </span>
          </div>
        </div>

        {/* 3. NET PAY (SHORTER PROPORTION: 20% - Deep Blue, Clean Contrast) */}
        <div className="py-4 px-4 flex flex-col justify-center bg-slate-700 text-white">
          <span className="text-sm font-bold opacity-90 mb-1 flex items-center">
            <DollarSign className="w-4 h-4 mr-1" /> TAKE HOME PAY
          </span>
          <span className="text-2xl font-extrabold">{item.netPay}</span>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN COMPONENT (Full-Width List) ---
export default function PayslipHistoryPage() {
  const [history, setHistory] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Fetching from the assumed correct history endpoint
    fetch("http://localhost:5000/payroll-tracking/my-payslip-status", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 404) {
          return [];
        }
        if (!res.ok) {
          throw new Error(
            "Failed to fetch payslip history (Status: " + res.status + ")"
          );
        }
        return res.json().then((data) => (Array.isArray(data) ? data : [data]));
      })
      .then((data) => setHistory(data))
      .catch((e) => setError(e.message || "Failed to fetch history"))
      .finally(() => setLoading(false));
  }, []);

  // --- Loading and Error States ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 mr-3 animate-spin text-slate-600" />
        <p className="text-xl text-slate-600 font-semibold">
          Loading payment history...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
        <p className="text-center text-xl text-red-600 font-bold p-8 bg-white rounded-lg border-t-4 border-red-500 shadow-lg">
          Error loading data: {error}
        </p>
      </div>
    );

  return (
    // Outer container handles overall page padding
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="space-y-8">
        {/* Header (Constrained to max-w-7xl for better readability/centering) */}
        <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-gray-300">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
            <Clock className="w-8 h-8 mr-4 text-slate-600" />
            Payroll Statement History
          </h1>
          <button
            onClick={() => router.back()}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Current Payslip
          </button>
        </header>

        {history.length === 0 ? (
          // Empty state (Constrained and centered)
          <div className="max-w-7xl mx-auto p-20 text-center bg-white rounded-xl shadow-lg border-t-4 border-amber-500">
            <FileText className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <p className="text-2xl font-semibold text-gray-700">
              No Past Records Available
            </p>
            <p className="text-gray-500 mt-2">
              The system has not generated any previous payroll statements for
              your account.
            </p>
          </div>
        ) : (
          <div className="p-0">
            {/* Title (Constrained and centered for visual alignment with the header) */}
            <h2 className="max-w-7xl mx-auto text-xl font-semibold text-gray-700 mb-6 border-b pb-2">
              Showing {history.length} Total Payroll Records
            </h2>
            {/* Payslip List Stack (This utilizes the full width of the parent 'p-4 sm:p-8' container) */}
            <div className="flex flex-col space-y-4">
              {history.map((item) => (
                <PayslipListItem key={item.payrollRunId} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
