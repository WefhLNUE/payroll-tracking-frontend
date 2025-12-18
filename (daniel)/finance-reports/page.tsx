"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface FinanceReport {
  totalTaxes: number;
  totalInsurance: number;
  totalBenefits: number;
  totalAllowances: number;
  totalBonuses: number;
  numberOfEmployees: number;
}

const FinanceReportsPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [reports, setReports] = useState<FinanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

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
  
        fetchReports();
    

        } catch (e: any) {
          setError(e?.message || "Error fetching claims");
        } finally {
          setLoading(false);
        }
      })();
    }, [year]);
 

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/finance-report/${year}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch finance reports");
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCompensation = (): number => {
    return reports.reduce((sum, report) => {
      return (
        sum -
        (report.totalTaxes || 0) -
        (report.totalInsurance || 0) +
        (report.totalBenefits || 0) +
        (report.totalAllowances || 0) +
        (report.totalBonuses || 0)
      );
    }, 0);
  };

  const getYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading finance reports...</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Finance Reports
              </h1>
              <p className="text-gray-600">
                Annual payroll expenses breakdown and analysis
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-600" />
          </div>

          {/* Year Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 inline-block">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {getYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700">
              ⚠️ API Error: {error}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900">
              {reports.reduce((sum, r) => sum + (r.numberOfEmployees || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Total Compensation</p>
            <p className="text-3xl font-bold text-green-600">
              ${calculateTotalCompensation().toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 mb-1">Avg per Employee</p>
            <p className="text-3xl font-bold text-purple-600">
              $
              {reports.length > 0 && reports[0].numberOfEmployees > 0
                ? (
                    calculateTotalCompensation() /
                    reports.reduce((sum, r) => sum + (r.numberOfEmployees || 0), 0)
                  ).toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>

        {/* Detailed Reports */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600">
              No finance reports available for the selected year.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Year {year} Finance Report
                </h2>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Taxes */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Total Taxes</h3>
                      <DollarSign className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-600 mb-1">
                      -${(report.totalTaxes || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(
                        ((report.totalTaxes || 0) / calculateTotalCompensation()) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>

                  {/* Insurance */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Insurance Contributions
                      </h3>
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600 mb-1">
                      -${(report.totalInsurance || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(
                        ((report.totalInsurance || 0) / calculateTotalCompensation()) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Total Benefits
                      </h3>
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-1">
                      ${(report.totalBenefits || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(
                        ((report.totalBenefits || 0) / calculateTotalCompensation()) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>

                  {/* Allowances */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Total Allowances
                      </h3>
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-1">
                      ${(report.totalAllowances || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(
                        ((report.totalAllowances || 0) / calculateTotalCompensation()) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>

                  {/* Bonuses */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Total Bonuses
                      </h3>
                      <TrendingUp className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600 mb-1">
                      ${(report.totalBonuses || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(
                        ((report.totalBonuses || 0) / calculateTotalCompensation()) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>

                  {/* Employees */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Number of Employees
                      </h3>
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-indigo-600 mb-1">
                      {report.numberOfEmployees || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      Active employees
                    </p>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Taxes:</span>
                      <span className="font-semibold text-gray-900">
                        -${(report.totalTaxes || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Insurance Contributions:
                      </span>
                      <span className="font-semibold text-gray-900">
                        -${(report.totalInsurance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Benefits:</span>
                      <span className="font-semibold text-gray-900">
                        ${(report.totalBenefits || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Allowances:</span>
                      <span className="font-semibold text-gray-900">
                        ${(report.totalAllowances || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Bonuses:</span>
                      <span className="font-semibold text-gray-900">
                        ${(report.totalBonuses || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold text-gray-900">
                        Grand Total:
                      </span>
                      <span className="font-bold text-lg text-blue-600">
                        ${calculateTotalCompensation().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceReportsPage;
