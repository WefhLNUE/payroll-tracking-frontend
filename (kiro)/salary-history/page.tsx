"use client";
import React, { useState, useEffect } from "react";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";

interface Payslip {
  _id?: string;
  payslipId?: string;
  employeeId?: string;
  payrollRunId: string;
  earningsDetails?: {
    baseSalary: number;
    allowances?: Array<{ name: string; amount: number }>;
    bonuses?: Array<{ name: string; amount: number }>;
  };
  deductionsDetails?: {
    taxes?: Array<{ name: string; amount: number }>;
    insurances?: Array<{ name: string; amount: number }>;
    penalties?: { amount: number };
  };
  totalGrossSalary: number;
  totaDeductions?: number;
  netPay: number;
  paymentStatus: string;
  createdAt?: string;
  updatedAt?: string;
  month?: number;
  year?: number;
}

const SalaryHistoryPage: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
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
        throw new Error("Failed to fetch payslips");
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Handle single payslip object from API
      let payslipsData: Payslip[] = [];

      if (Array.isArray(data)) {
        payslipsData = data;
      } else if (data && data.netPay !== undefined) {
        // Single payslip object - wrap in array
        payslipsData = [data];
      } else if (data?.payslips && Array.isArray(data.payslips)) {
        payslipsData = data.payslips;
      }

      console.log("Processed payslips:", payslipsData);
      setPayslips(payslipsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback to sample data if API fails
    } finally {
      setLoading(false);
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

  const parseAmount = (amount: string | number): number => {
    if (typeof amount === "number") return amount;
    return parseFloat(amount.replace(/[$,]/g, ""));
  };

  const calculateTotalEarnings = (): string => {
    if (!payslips || payslips.length === 0) {
      return "$0.00";
    }
    const total = payslips.reduce(
      (sum: number, p: Payslip) => sum + parseAmount(p.netPay),
      0
    );
    return `$${total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salary history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Salary History
          </h1>
          <p className="text-gray-600">
            Track your earnings and payment records
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-yellow-700">
              ⚠️ API Error: {error} (Showing sample data)
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculateTotalEarnings()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Payslips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslips.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Latest Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslips[0]?.netPay || "N/A"}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600">
            <h2 className="text-xl font-semibold text-white">
              Payment Records
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslips.map((payslip) => {
                  const date = payslip.createdAt
                    ? new Date(payslip.createdAt).toLocaleDateString()
                    : "N/A";
                  const grossSalary =
                    typeof payslip.totalGrossSalary === "number"
                      ? `$${payslip.totalGrossSalary.toFixed(2)}`
                      : payslip.totalGrossSalary;
                  const deductions = payslip.totaDeductions
                    ? typeof payslip.totaDeductions === "number"
                      ? `$${payslip.totaDeductions.toFixed(2)}`
                      : payslip.totaDeductions
                    : "$0.00";
                  const netPay =
                    typeof payslip.netPay === "number"
                      ? `$${payslip.netPay.toFixed(2)}`
                      : payslip.netPay;

                  return (
                    <tr
                      key={payslip._id || payslip.payslipId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          {grossSalary}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">
                          -{deductions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-bold">
                          {netPay}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                            payslip.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payslip.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {payslips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payslips Found
            </h3>
            <p className="text-gray-500">
              Your salary history will appear here once available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryHistoryPage;
