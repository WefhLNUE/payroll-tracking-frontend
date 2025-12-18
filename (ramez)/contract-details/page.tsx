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
} from "lucide-react";

// --- INTERFACE DEFINITIONS ---

// 1. Interface for the data received directly from your backend: GET /payroll-tracking/base-salary
interface BaseSalaryAPIResponse {
  employeeId: string;
  contractType: string; // e.g., "PART_TIME_CONTRACT"
  workType: string; // e.g., "FULL-TIME"
  originalBaseSalary: number;
  adjustedBaseSalary: number;
  multiplier: number; // e.g., 0.5
}

// --- API FETCH FUNCTION ---
const API_BASE_URL = "http://localhost:5000/payroll-tracking/base-salary";

const fetchBaseSalaryData = async (): Promise<BaseSalaryAPIResponse> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      credentials: "include", // Important for authenticated API access
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: "Failed to parse error body." }));
      throw new Error(
        `API Error: ${response.status} - ${
          errorBody.message || response.statusText
        }`
      );
    }

    return response.json();
  } catch (e) {
    console.error("Fetch Error:", e);
    throw new Error(
      "Could not connect to the payroll service or authentication failed."
    );
  }
};

// --- HELPER COMPONENT FOR DETAIL ROWS ---
interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  highlight?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon: Icon,
  label,
  value,
  highlight = false,
}) => (
  <div
    className={`flex items-start space-x-4 p-4 border-b last:border-b-0 ${
      highlight ? "bg-blue-50 border-blue-200" : "border-gray-200"
    }`}
  >
    <Icon
      className={`w-6 h-6 ${
        highlight ? "text-blue-600" : "text-blue-500"
      } mt-0.5 flex-shrink-0`}
    />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={`text-base font-semibold text-gray-900 mt-0.5 ${
          highlight ? "font-bold" : ""
        }`}
      >
        {value}
      </p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function ContractDetailsPage() {
  // State now only holds the data fields received from the API
  const [details, setDetails] = useState<BaseSalaryAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetchBaseSalaryData()
      .then((apiData) => {
        setDetails(apiData);
      })
      .catch((e) => setError(e.message || "Failed to load contract details."))
      .finally(() => setLoading(false));
  }, []);

  // --- Loading and Error States ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-center text-xl text-blue-600 font-semibold animate-pulse">
          Loading base salary details from API...
        </p>
      </div>
    );

  if (error || !details)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-center text-xl text-red-600 font-bold p-8 bg-white rounded-lg shadow-lg">
          {error || "Compensation details are not available."}
        </p>
      </div>
    );

  // --- Formatting ---
  const formatCurrency = (amount: number) =>
    amount.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const formattedAdjustedSalary = formatCurrency(details.adjustedBaseSalary);
  const formattedOriginalSalary = formatCurrency(details.originalBaseSalary);

  // Cleanup string formatting from API (e.g., PART_TIME_CONTRACT -> Part Time Contract)
  const formatString = (s: string) =>
    s
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER & BACK BUTTON */}
        <header className="py-5">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 transition font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Payslip
          </button>
          <div className="mt-4 flex items-center bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-600">
            <FileText className="w-8 h-8 mr-4 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Base Compensation Details
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Data retrieved for Employee ID: **{details.employeeId}**
              </p>
            </div>
          </div>
        </header>

        {/* ADJUSTED BASE SALARY HIGHLIGHT (The current pay rate) - CORRECTED STYLING */}
        <div
          className="bg-gradient-to-r from-gray-900 to-gray-700 text-white 
                              p-6 sm:p-8 rounded-xl shadow-2xl flex justify-between items-center"
        >
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-100 flex items-center tracking-wider">
            <div className="p-2 bg-green-500 rounded-full mr-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            CURRENT BASE SALARY (Adjusted Annual Rate)
          </h2>
          <span className="text-3xl sm:text-4xl font-extrabold text-green-300">
            {formattedAdjustedSalary}
          </span>
        </div>

        {/* DETAILED API INFORMATION PANEL */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
          <div className="p-5 bg-purple-600 text-white font-bold text-xl flex items-center">
            <BarChart2 className="w-5 h-5 mr-3" />
            Compensation Calculation Breakdown
          </div>

          <div className="p-2 divide-y divide-gray-100">
            {/* 1. Original Salary */}
            <DetailItem
              icon={DollarSign}
              label="Original Base Salary (Full-Time Equivalent)"
              value={formattedOriginalSalary}
            />

            {/* 2. Multiplier */}
            <DetailItem
              icon={BarChart2}
              label="Employment Multiplier"
              value={details.multiplier.toString()}
              highlight={true}
            />

            {/* 3. Adjusted Salary (Confirmed) */}
            <DetailItem
              icon={DollarSign}
              label="Adjusted Base Salary (Used in Payroll)"
              value={formattedAdjustedSalary}
              highlight={true}
            />

            {/* 4. Contract Type */}
            <DetailItem
              icon={Briefcase}
              label="Contract Type"
              value={formatString(details.contractType)}
            />

            {/* 5. Work Type */}
            <DetailItem
              icon={Clock}
              label="Work Arrangement"
              value={formatString(details.workType)}
            />

            {/* 6. Employee ID */}
            <DetailItem
              icon={FileText}
              label="Employee ID"
              value={details.employeeId}
            />
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-sm text-sm text-gray-700">
          <p className="font-semibold flex items-center">
            <FileText className="w-4 h-4 mr-2 text-yellow-600" />
            Information Source
          </p>
          <p className="mt-2">
            This page displays all data returned directly from the authenticated
            base salary API endpoint (`/payroll-tracking/base-salary`). No other
            employment details are currently available through this specific
            endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}
