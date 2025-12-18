"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  DollarSign,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Layers,
  Percent,
  Zap,
} from "lucide-react";

// --- 1. INTERFACE DEFINITIONS ---
interface InsuranceDetail {
  name: string;
  employeeRate: number;
  employerRate: number;
  employeeContribution: number;
  employerContribution: number;
  total: number;
}

interface InsuranceDeductionsResponse {
  payslipId: string;
  payrollRunId: string;
  baseSalary: number;
  // ADDED: Include grossSalary from the function output
  grossSalary: number;
  totalEmployee: number;
  totalEmployer: number;
  total: number;
  insurances: InsuranceDetail[];
}

// --- 2. HELPER COMPONENTS ---

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Define a unified color palette
const Colors = {
  PrimaryBlue: "#2563EB", // Blue-600
  DeductionRed: "#DC2626", // Red-600
  EmployerGreen: "#10B981", // Green-500
  TotalIndigo: "#4F46E5", // Indigo-600
  Background: "#F9FAFB", // Gray-50
};

// Card component for displaying summary metrics (with Animation)
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  colorHex,
  textClass,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorHex: string;
  textClass: string;
  delay: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg border-t-4 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ borderColor: colorHex }}
    >
      <div className="flex items-center mb-3">
        <div
          className="p-3 rounded-full transition-colors duration-300"
          style={{ backgroundColor: `${colorHex}15` }}
        >
          <Icon
            className={`w-6 h-6 ${textClass}`}
            style={{ color: colorHex }}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p
        className={`mt-1 text-3xl font-extrabold ${textClass}`}
        style={{ color: colorHex }}
      >
        ${formatCurrency(value)}
      </p>
    </div>
  );
};

// Component for displaying individual insurance breakdown rows (Improved alignment and padding)
const InsuranceRow = ({
  detail,
  index,
}: {
  detail: InsuranceDetail;
  index: number;
}) => (
  <div
    className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 last:border-b-0 items-center text-base transition-colors duration-200 hover:bg-indigo-50/50"
    style={{
      animation: `fadeIn 0.5s ease-out ${0.2 + index * 0.05}s forwards`,
    }} // Staggered row animation
  >
    {/* Policy Name (4 columns) */}
    <div className="col-span-4 font-semibold text-gray-800 flex items-center pl-4">
      <Layers className="w-4 h-4 mr-3 text-indigo-400 shrink-0" />
      {detail.name}
    </div>

    {/* Employee Rate (1 column) */}
    <div className="col-span-1 text-center font-medium text-gray-500">
      {detail.employeeRate}%
    </div>

    {/* Employee Contribution (3 columns) - Red for deduction */}
    <div className="col-span-3 text-right font-bold text-red-600 tracking-wide">
      -${formatCurrency(detail.employeeContribution)}
    </div>

    {/* Employer Rate (1 column) */}
    <div className="col-span-1 text-center font-medium text-gray-500">
      {detail.employerRate}%
    </div>

    {/* Employer Contribution (3 columns) - Green for employer benefit/cost */}
    <div className="col-span-3 text-right font-bold text-green-600 tracking-wide pr-4">
      +${formatCurrency(detail.employerContribution)}
    </div>
  </div>
);

// --- 3. MAIN COMPONENT ---
export default function PayslipInsuranceDetailsPage() {
  const [data, setData] = useState<InsuranceDeductionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const payslipId = searchParams.get("payslipId");

  useEffect(() => {
    // Define keyframes for a smooth fade-in effect
    const style = document.createElement("style");
    style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
    document.head.appendChild(style);

    const fetchInsuranceDetails = async () => {
      setLoading(true);
      setError("");
      try {
        // Using the actual fetch call as requested (no hardcoding/mocking)
        const response = await fetch(
          "http://localhost:5000/payroll-tracking/insurance-deductions",
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: response.statusText }));
          throw new Error(
            errorData.message ||
              `Failed to fetch insurance details (Status: ${response.status})`
          );
        }

        const result: InsuranceDeductionsResponse = await response.json();
        setData(result);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceDetails();
  }, []);

  // --- Loading State ---
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: Colors.Background }}
      >
        <Loader2 className="w-10 h-10 mr-3 text-indigo-600 animate-spin" />
        <p className="text-xl text-indigo-600 font-semibold">
          Retrieving insurance details...
        </p>
      </div>
    );
  }

  // --- Error State ---
  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: Colors.Background }}
      >
        <div
          className="text-center p-10 bg-white rounded-xl shadow-2xl border-t-4 border-red-600"
          style={{ animation: "fadeIn 0.5s ease-out forwards" }}
        >
          <AlertTriangle className="w-16 h-16 mx-auto text-red-600 mb-4" />
          <p className="text-2xl font-bold text-gray-800 mb-2">
            Data Fetch Error
          </p>
          <p className="text-red-600">Could not load insurance deductions.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-300 flex items-center mx-auto shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // --- Success Display ---
  return (
    <div
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor: Colors.Background }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section (Fade In 1) */}
        <header
          className="py-5 px-6 bg-white rounded-xl shadow-lg border-l-4 transition-opacity duration-500 ease-out"
          style={{
            borderColor: Colors.PrimaryBlue,
            animation: "fadeIn 0.5s ease-out 0s forwards",
          }}
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-sm text-blue-500 hover:text-blue-700 transition font-medium mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Current Payslip
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-indigo-600" />
            Insurance Contributions: Detailed View
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Payslip ID: **{payslipId || data.payslipId}** | Payroll Run: **
            {data.payrollRunId}**
          </p>
        </header>

        {/* Summary Metrics (Fade In 2 - Staggered) */}
        <div className="grid grid-cols-3 gap-6">
          <SummaryCard
            title="Your Total Deduction"
            value={data.totalEmployee}
            icon={TrendingDown}
            colorHex={Colors.DeductionRed}
            textClass="text-red-600"
            delay={100}
          />

          <SummaryCard
            title="Employer Total Contribution"
            value={data.totalEmployer}
            icon={TrendingUp}
            colorHex={Colors.EmployerGreen}
            textClass="text-green-600"
            delay={200}
          />

          <SummaryCard
            title="GRAND TOTAL (Combined)"
            value={data.total}
            icon={DollarSign}
            colorHex={Colors.TotalIndigo}
            textClass="text-indigo-600"
            delay={300}
          />
        </div>

        {/* Details Table (Fade In 3) */}
        <section
          className="bg-white rounded-xl shadow-xl overflow-hidden transition-opacity duration-700 ease-out"
          style={{ animation: "fadeIn 0.5s ease-out 0.4s forwards" }}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-500" />
              {/* UPDATED: Check for grossSalary existence before defaulting to baseSalary */}
              Policy Breakdown (Based on{" "}
              {data.grossSalary ? "Gross Salary" : "Base Salary"}: $
              {formatCurrency(data.grossSalary || data.baseSalary)})
            </h2>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-3 font-bold text-xs uppercase text-gray-700 bg-indigo-50/70 rounded-lg shadow-inner">
              <div className="col-span-4 pl-4">Policy Name</div>
              <div className="col-span-1 text-center flex items-center justify-center">
                <Percent className="w-3 h-3 mr-1" /> Your Rate
              </div>
              <div className="col-span-3 text-right pr-4">Your Deduction</div>
              <div className="col-span-1 text-center flex items-center justify-center">
                <Percent className="w-3 h-3 mr-1" /> Employer Rate
              </div>
              <div className="col-span-3 text-right pr-4">
                Employer Contribution
              </div>
            </div>

            {/* Rows - Staggered Fade In applied via InsuranceRow component */}
            <div className="divide-y divide-gray-200">
              {data.insurances.map((insurance, index) => (
                <InsuranceRow
                  key={insurance.name}
                  detail={insurance}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer Note (Fade In 4) */}
        <div
          className="p-4 text-sm text-gray-700 bg-yellow-50 rounded-xl shadow border-l-4 border-yellow-500 transition-opacity duration-700 ease-out"
          style={{ animation: "fadeIn 0.5s ease-out 0.5s forwards" }}
        >
          <p className="font-semibold">Contextual Note:</p>
          <p>
            Your contribution amount (**Deduction**) is subtracted from your
            gross pay. The Employer's Contribution is an additional cost borne
            by the company, not included in your gross earnings.
          </p>
        </div>
      </div>
    </div>
  );
}
