"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarOff,
  ChevronLeft,
  Calculator,
  Info,
  AlertCircle,
  ArrowDownCircle,
  RefreshCw,
  Receipt,
  Wallet,
  CalendarDays,
} from "lucide-react";

// --- INTERFACES MATCHING YOUR UPDATED FUNCTION ---
interface UnpaidLeaveDetail {
  leaveType: string;
  daysTaken: number;
  dailyRate: number;
  amount: number;
}

interface UnpaidLeaveResponse {
  baseSalary: number;
  workingDays: number;
  dailyRate: number;
  unpaidDaysTotal: number;
  totalDeductions: number;
  details: UnpaidLeaveDetail[];
}

function UnpaidLeaveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const payslipId = searchParams.get("payslipId");

  const [data, setData] = useState<UnpaidLeaveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/payroll-tracking/unpaid-leave-deductions`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(
          `Server error: ${res.status} - Could not retrieve leave data.`
        );
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [payslipId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium italic">
            Calculating unpaid leave impact...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Statement
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <CalendarOff className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Unpaid Leave Details
                </h1>
                <p className="text-slate-500 mt-1 font-medium">
                  Breakdown of salary deductions for non-paid absences
                </p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl flex items-center shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-500 mr-4 shrink-0" />
            <div>
              <p className="font-bold text-red-800">Connection Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchDetails}
              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : !data || data.details.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No Unpaid Absences
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              You have no recorded unpaid leave deductions for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CALCULATION LOGIC CARD (NEW) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Base Salary
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  ${data.baseSalary.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarDays className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Working Days
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {data.workingDays} Days
                </p>
              </div>

              <div className="bg-blue-600 p-6 rounded-2xl shadow-lg border border-blue-700">
                <div className="flex items-center gap-3 mb-2 text-blue-100">
                  <Calculator className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Daily Rate
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  ${data.dailyRate.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Summary List */}
            <div className="grid gap-4">
              {data.details.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="flex">
                    <div className="w-2 bg-orange-500 shrink-0" />
                    <div className="p-6 w-full flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100">
                            Unpaid Leave
                          </span>
                          <h3 className="text-lg font-bold text-slate-800">
                            {item.leaveType}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <div className="flex items-center">
                            <CalendarOff className="w-4 h-4 mr-1.5 text-slate-400" />
                            <span>{item.daysTaken} Days Taken</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                          <div className="flex items-center">
                            <Calculator className="w-4 h-4 mr-1.5 text-slate-400" />
                            Rate: ${item.dailyRate}
                          </div>
                        </div>
                      </div>

                      <div className="text-right min-w-[140px] bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tighter">
                          Line Total
                        </p>
                        <p className="text-2xl font-black text-red-600">
                          -$
                          {item.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total Banner */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
              {/* Decorative Background Icon */}
              <CalendarOff className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />

              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <ArrowDownCircle className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Aggregate Impact
                  </p>
                  <p className="text-slate-300 text-sm mt-1">
                    Total of {data.unpaidDaysTotal} unpaid days deducted
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right relative z-10">
                <span className="text-5xl font-black text-orange-400 tracking-tighter">
                  -$
                  {data.totalDeductions.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Math Footnote */}
            <div className="p-6 bg-slate-100/50 rounded-2xl border border-slate-200 flex gap-4 items-start">
              <Info className="w-5 h-5 text-slate-400 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                <strong>Calculation Note:</strong> Your daily rate is calculated
                as:
                <code className="mx-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-600 font-bold">
                  Base Salary (${data.baseSalary.toLocaleString()}) /{" "}
                  {data.workingDays} Working Days
                </code>
                . This rate (${data.dailyRate}) is applied to each day of unpaid
                leave recorded in the system.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnpaidLeavePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400 animate-pulse font-medium tracking-widest uppercase text-xs">
            Loading Secure Data...
          </p>
        </div>
      }
    >
      <UnpaidLeaveContent />
    </Suspense>
  );
}
