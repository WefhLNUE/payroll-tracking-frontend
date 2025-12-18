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
} from "lucide-react";

interface MisconductDeduction {
  type: "Absenteeism" | "Lateness";
  date: string;
  reason: string;
  potentialDeductionAmount?: number;
}

function MisconductContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const payslipId = searchParams.get("payslipId");

  const [deductions, setDeductions] = useState<MisconductDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Track the range we are currently viewing
  const [viewingRange, setViewingRange] = useState({
    start: "",
    end: "",
    label: "",
  });

  const fetchDeductions = useCallback(
    async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError("");

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

      try {
        // Updated URL to match your @Get('misconduct-deductions')
        const url = `http://localhost:5000/payroll-tracking/misconduct-deductions?startDate=${startISO}&endDate=${endISO}`;
        console.log("Fetching from:", url);

        const res = await fetch(url, { credentials: "include" });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.message || `Server Error: ${res.status}`);
        }

        const data = await res.json();
        console.log("API Response:", data);
        setDeductions(data);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message);
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
          `http://localhost:5000/payroll-tracking/my-payslip`,
          { credentials: "include" }
        );
        const payslipData = await payslipRes.json();

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
      } catch (e) {
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
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-center gap-4 text-red-700">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">API Connection Failed: {error}</p>
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
            <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 mt-12 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <ArrowDownCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Aggregate Deduction
                  </p>
                  <p className="text-slate-300 text-sm">
                    Calculated impact for {viewingRange.label}
                  </p>
                </div>
              </div>
              <div className="text-4xl font-black text-red-400">
                -$
                {deductions
                  .reduce(
                    (acc, curr) => acc + (curr.potentialDeductionAmount || 0),
                    0
                  )
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
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
        <div className="p-20 text-center text-slate-400 animate-pulse">
          Loading Application Context...
        </div>
      }
    >
      <MisconductContent />
    </Suspense>
  );
}
