"use client";
import React, { useState, useEffect } from "react";
import { Shield, DollarSign, Gift, TrendingUp, Briefcase } from "lucide-react";

interface Insurance {
  name: string;
  amount: number;
}

interface Allowance {
  name: string;
  amount: number;
}

interface EmployerContributions {
  baseSalary: number;
  totalEmployerInsurance: number;
  totalAllowances: number;
  totalEmployerContributions: number;
  insurance: Insurance[];
  allowances: Allowance[];
}

const EmployerContributionsPage: React.FC = () => {
  const [data, setData] = useState<EmployerContributions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/payroll-tracking/employer-contributions",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // send HTTP-only cookie
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to fetch employer contributions:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to fetch employer contributions: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Employer contributions data received:", result);

      // Ensure the data structure matches what we expect
      if (!result || typeof result !== "object") {
        throw new Error("Invalid data format received");
      }

      // Ensure arrays exist and have the correct structure
      // Check if there's an error message from backend
      if (result.error) {
        setError(result.error);
        // Still set data with zeros so UI can show the message
        setData({
          baseSalary: 0,
          totalEmployerInsurance: 0,
          totalAllowances: 0,
          totalEmployerContributions: 0,
          insurance: [],
          allowances: [],
        });
        return;
      }

      const formattedData = {
        baseSalary: result.baseSalary || 0,
        totalEmployerInsurance: result.totalEmployerInsurance || 0,
        totalAllowances: result.totalAllowances || 0,
        totalEmployerContributions: result.totalEmployerContributions || 0,
        insurance: Array.isArray(result.insurance)
          ? result.insurance.map(
              (item: {
                name?: string;
                amount?: number;
                employerContribution?: number;
              }) => ({
                name: item.name || "Unknown",
                amount: item.amount || item.employerContribution || 0,
              })
            )
          : [],
        allowances: Array.isArray(result.allowances)
          ? result.allowances.map(
              (item: { name?: string; amount?: number }) => ({
                name: item.name || "Unknown",
                amount: item.amount || 0,
              })
            )
          : [],
      };

      console.log("Formatted data:", formattedData);
      setData(formattedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback to sample data
      setData({
        baseSalary: 15000,
        totalEmployerInsurance: 1500,
        totalAllowances: 2000,
        totalEmployerContributions: 3500,
        insurance: [
          { name: "Health Insurance", amount: 800 },
          { name: "Life Insurance", amount: 400 },
          { name: "Pension Fund", amount: 300 },
        ],
        allowances: [
          { name: "Transportation", amount: 500 },
          { name: "Housing", amount: 1000 },
          { name: "Meal", amount: 500 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contributions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No data available</p>
          {error && <p className="text-sm text-gray-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Employer Contributions
          </h1>
          <p className="text-gray-600">
            Overview of your employer&apos;s contributions and benefits
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700 font-semibold mb-2">
              ⚠️{" "}
              {error === "No pay grade assigned to employee"
                ? "Pay Grade Not Assigned"
                : "API Error"}
            </p>
            <p className="text-yellow-600 text-sm">
              {error === "No pay grade assigned to employee"
                ? "Your employee profile does not have a pay grade assigned. Please contact HR to assign a pay grade to your profile. Once assigned, your employer contributions will be displayed here."
                : `${error} (Showing sample data)`}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Base Salary</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.baseSalary)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Insurance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalEmployerInsurance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Allowances</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalAllowances)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-indigo-100 mb-1">Total Contributions</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(data.totalEmployerContributions)}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Insurance Contributions */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">
                  Insurance Contributions
                </h2>
              </div>
            </div>
            <div className="p-6">
              {data.insurance.length > 0 ? (
                <div className="space-y-4">
                  {data.insurance.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-700">
                        Total Insurance
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(data.totalEmployerInsurance)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No insurance contributions
                </p>
              )}
            </div>
          </div>

          {/* Allowances */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center">
                <Gift className="w-6 h-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Allowances</h2>
              </div>
            </div>
            <div className="p-6">
              {data.allowances.length > 0 ? (
                <div className="space-y-4">
                  {data.allowances.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-700">
                        Total Allowances
                      </span>
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrency(data.totalAllowances)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No allowances</p>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Contribution Breakdown
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Base Salary
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(data.baseSalary)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Insurance Contributions
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(data.totalEmployerInsurance)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (data.totalEmployerInsurance / data.baseSalary) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Allowances
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(data.totalAllowances)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(data.totalAllowances / data.baseSalary) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between">
                <span className="text-base font-bold text-gray-900">
                  Total Package Value
                </span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(
                    data.baseSalary + data.totalEmployerContributions
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerContributionsPage;
