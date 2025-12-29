"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ArrowDownCircle,
  Info,
  ShieldAlert,
  RefreshCw,
  Search,
  RotateCcw,
  Wifi,
} from "lucide-react";

interface MisconductDeduction {
  type: "Absenteeism" | "Lateness";
  date: string;
  reason: string;
  potentialDeductionAmount?: number;
}

interface ErrorState {
  message: string;
  type: "network" | "server" | "validation" | "timeout" | "unknown";
}

function MisconductContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const payslipId = searchParams.get("payslipId");

  const [deductions, setDeductions] = useState<MisconductDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Track the range we are currently viewing
  const [viewingRange, setViewingRange] = useState({
    start: "",
    end: "",
    label: "",
  });

  // Validate deduction data structure
  const validateDeduction = (item: any): item is MisconductDeduction => {
    return (
      item &&
      typeof item === "object" &&
      (item.type === "Absenteeism" || item.type === "Lateness") &&
      typeof item.date === "string" &&
      typeof item.reason === "string" &&
      (item.potentialDeductionAmount === undefined ||
        typeof item.potentialDeductionAmount === "number")
    );
  };

  // Handle fetch errors with proper typing
  const handleFetchError = (err: any): ErrorState => {
    console.error("Fetch error:", err);

    if (err instanceof TypeError && err.message.includes("fetch")) {
      return {
        message: "Network error. Please check your connection.",
        type: "network",
      };
    }

    if (err.name === "AbortError") {
      return {
        message: "Request timed out. The server took too long to respond.",
        type: "timeout",
      };
    }

    if (err.message) {
      return {
        message: err.message,
        type: err.message.includes("Server Error") ? "server" : "validation",
      };
    }

    return {
      message: "An unexpected error occurred. Please try again.",
      type: "unknown",
    };
  };

  const fetchDeductions = useCallback(
    async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      setViewingRange({
        start: startISO,
        end: endISO,
        label: startDate.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        }),
      });

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/payroll-tracking/misconduct-deductions?startDate=${startISO}&endDate=${endISO}`;
        console.log("Fetching from:", url);

        const res = await fetch(url, {
          credentials: "include",
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorBody;
          try {
            errorBody = await res.json();
          } catch {
            errorBody = { message: `Server Error: ${res.status}` };
          }
          throw new Error(errorBody.message || `Server Error: ${res.status}`);
        }

        const data = await res.json();

        console.log("Fetched deductions:", data);

        // Validate response data
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: expected array");
        }

        // Filter and validate deductions
        const validDeductions = data.filter(validateDeduction);
        if (validDeductions.length < data.length) {
          console.warn(
            `${
              data.length - validDeductions.length
            } invalid records were filtered out`
          );
        }

        setDeductions(validDeductions);
      } catch (err: any) {
        clearTimeout(timeoutId);
        const errorState = handleFetchError(err);
        setError(errorState);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial Load: Get Payslip date first
  useEffect(() => {
    const init = async () => {
      try {
        const payslipRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/payroll-tracking/my-payslip`,
          { credentials: "include" }
        );

        if (!payslipRes.ok) {
          throw new Error(
            `Failed to fetch payslip: ${payslipRes.status}. Using current month as fallback.`
          );
        }

        const payslipData = await payslipRes.json();

        // Validate payslip data
        if (!payslipData || !payslipData.createdAt) {
          throw new Error(
            "Invalid payslip data received. Using current month as fallback."
          );
        }

        // Set range based on when payslip was created
        const pDate = new Date(payslipData.createdAt);
        const start = new Date(
          pDate.getFullYear(),
          pDate.getMonth(),
          1,
          0,
          0,
          0
        );
        const end = new Date(
          pDate.getFullYear(),
          pDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        fetchDeductions(start, end);
      } catch (e: any) {
        console.warn("Payslip fetch error, using fallback:", e.message);
        // Fallback to current month if payslip fetch fails
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        fetchDeductions(start, end);
      }
    };
    init();
  }, [fetchDeductions, payslipId]);

  const tryCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    fetchDeductions(start, end);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    tryCurrentMonth();
  };

  const getErrorIcon = (type: ErrorState["type"]) => {
    switch (type) {
      case "network":
        return <Wifi className="w-6 h-6" />;
      case "timeout":
        return <Clock className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Querying Attendance Records...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-500 hover:text-slate-800 mb-8 transition-all font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Return to Statement
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-red-50 p-4 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Deduction Details
                </h1>
                <p className="text-slate-500">
                  Attendance misconduct & policy violations
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[180px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Viewing Period
              </p>
              <div className="flex items-center text-slate-700 font-semibold">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                {viewingRange.label}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 p-8 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="text-red-700 mt-1">
                  {getErrorIcon(error.type)}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-red-900 text-lg mb-2">
                    Unable to Load Deduction Details
                  </h2>
                  <p className="text-red-700 mb-4">{error.message}</p>
                  <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 text-sm text-red-800">
                    <p className="font-semibold mb-1">Troubleshooting tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {error.type === "network" && (
                        <>
                          <li>Check your internet connection</li>
                          <li>Ensure the server is running on port 5000</li>
                        </>
                      )}
                      {error.type === "timeout" && (
                        <>
                          <li>The server is responding slowly</li>
                          <li>Try again in a moment</li>
                        </>
                      )}
                      {error.type === "server" && (
                        <>
                          <li>The server encountered an error</li>
                          <li>Contact support if the issue persists</li>
                        </>
                      )}
                      <li>Try loading the current month</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
                {retryCount > 0 && ` (${retryCount})`}
              </button>
              <button
                onClick={tryCurrentMonth}
                className="flex items-center gap-2 bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                Try Current Month
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>
        ) : deductions.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              No Records Found
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              We couldn't find any misconduct records for{" "}
              <span className="font-bold">{viewingRange.label}</span>. If you
              have recent records, they might be in the current month.
            </p>
            <button
              onClick={tryCurrentMonth}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Try Current Month
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {deductions.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-red-200 transition-all overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="flex">
                  <div
                    className={`w-2 ${
                      item.type === "Absenteeism"
                        ? "bg-red-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <div className="p-6 w-full flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                            item.type === "Absenteeism"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-slate-400 font-mono text-sm">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed italic">
                        "{item.reason}"
                      </p>
                    </div>

                    {item.potentialDeductionAmount && (
                      <div className="bg-red-50/50 px-6 py-4 rounded-2xl border border-red-100 flex flex-col justify-center items-end">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">
                          Amount
                        </span>
                        <span className="text-2xl font-black text-red-600">
                          -$
                          {item.potentialDeductionAmount.toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Total Highlight */}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MisconductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              Loading Application Context...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              If this takes too long, please refresh the page
            </p>
          </div>
        </div>
      }
    >
      <MisconductContent />
    </Suspense>
  );
}
