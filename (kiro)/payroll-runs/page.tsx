"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";

export default function PayrollRunsPage() {
  const router = useRouter();
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [searchType, setSearchType] = useState<"month-year" | "year">(
    "month-year"
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchType === "month-year") {
      if (!month || !year) {
        alert("Please select both month and year");
        return;
      }
      router.push(`/payroll-tracking/payroll-runs/month/${month}/${year}`);
    } else {
      if (!year) {
        alert("Please select a year");
        return;
      }
      router.push(`/payroll-tracking/payroll-runs/year/${year}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payroll Runs
          </h1>
          <p className="text-gray-600">
            Select a period to view payroll information
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Search Type Toggle */}
          <div className="mb-8">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSearchType("month-year");
                  setMonth("");
                  setYear("");
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  searchType === "month-year"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                By Month & Year
              </button>
              <button
                onClick={() => {
                  setSearchType("year");
                  setMonth("");
                  setYear("");
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  searchType === "year"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                By Year Only
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Month Selection (shown only for month-year search) */}
            {searchType === "month-year" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
                >
                  <option value="">Choose a month...</option>
                  {monthNames.map((m, index) => (
                    <option
                      key={index}
                      value={String(index + 1).padStart(2, "0")}
                    >
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
              >
                <option value="">Choose a year...</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                  (y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Quick Select Current */}
            {searchType === "month-year" && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMonth(String(currentMonth).padStart(2, "0"));
                    setYear(String(currentYear));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Use Current Month & Year
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-8"
            >
              View Payroll Runs
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              What you can do:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>View payroll runs for a specific month and year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>View all payroll runs for a specific year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>Check payment statuses and details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
