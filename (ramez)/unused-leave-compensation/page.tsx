"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  FileText,
  Briefcase,
  BarChart2,
  Clock,
  ChevronLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Calculator,
} from "lucide-react";

// --- INTERFACE DEFINITIONS ---

interface LeaveBreakdown {
  leaveTypeId: string | null;
  leaveTypeName: string;
  isEncashable: boolean;
  remainingDays: number;
  accruedActual: number;
  dailyRate: number;
  estimatedValue: number;
}

interface LeaveCompensationResponse {
  employeeId: string;
  monthlyBaseSalary: number;
  dailyRate: number;
  totalPotentialCompensation: number;
  leaveBreakdown: LeaveBreakdown[];
  note: string;
}

// --- API FETCH FUNCTION ---
const API_URL =
  "http://localhost:5000/payroll-tracking/unused-leave-compensation";

const fetchLeaveCompensation = async (): Promise<LeaveCompensationResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: "Failed to fetch data" }));
      throw new Error(errorBody.message || "API Error");
    }
    return response.json();
  } catch (e) {
    console.error("Fetch Error:", e);
    throw new Error("Could not load leave compensation details.");
  }
};

// --- MAIN COMPONENT ---
export default function UnusedLeaveCompensationPage() {
  const [data, setData] = useState<LeaveCompensationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchLeaveCompensation()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 font-semibold">
            Calculating leave values...
          </p>
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 font-bold">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <header>
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 transition font-medium mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500">
            <Calendar className="w-8 h-8 mr-4 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Unused Leave Compensation
              </h1>
              <p className="text-sm text-gray-500">
                Estimating the cash value of your remaining leave balance
              </p>
            </div>
          </div>
        </header>

        {/* TOTAL HIGHLIGHT */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-emerald-100 font-medium uppercase tracking-wider text-sm">
              Total Potential Encashment
            </h2>
            <p className="text-4xl font-black mt-1">
              {formatCurrency(data.totalPotentialCompensation)}
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm text-right">
            <p className="text-xs text-emerald-50 text-emerald-100 uppercase">
              Daily Pay Rate
            </p>
            <p className="text-xl font-bold">
              {formatCurrency(data.dailyRate)} / day
            </p>
          </div>
        </div>

        {/* BREAKDOWN TABLE */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center font-bold text-gray-700">
              <Calculator className="w-5 h-5 mr-2 text-blue-500" />
              Leave Type Breakdown
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {data.leaveBreakdown.length} Leave Types Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Encashable</th>
                  <th className="px-6 py-4">Remaining Days</th>
                  <th className="px-6 py-4 text-right">Estimated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.leaveBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">
                        {item.leaveTypeName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Accrued: {item.accruedActual} days
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {item.isEncashable ? (
                        <span className="flex items-center text-emerald-600 text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-500 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {item.remainingDays} Days
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-700 font-bold">
                        {formatCurrency(item.estimatedValue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="text-gray-800 font-bold mb-3 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-blue-500" />
              Calculation Basis
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly Base Salary</span>
                <span className="font-semibold">
                  {formatCurrency(data.monthlyBaseSalary)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Standard Work Days</span>
                <span className="font-semibold">22 Days / Month</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-gray-800 font-bold">
                  Calculated Daily Rate
                </span>
                <span className="text-blue-600 font-bold">
                  {formatCurrency(data.dailyRate)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h3 className="text-amber-800 font-bold mb-2 flex items-center text-sm">
              <AlertCircle className="w-5 h-5 mr-2" />
              Policy Note
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              {data.note}
              <br />
              <br />
              Please note that "Total Potential Compensation" is an estimate.
              Actual encashment is subject to company policy, tax deductions,
              and HR approval during the final payroll run.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
