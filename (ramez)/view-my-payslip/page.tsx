"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Zap,
  FileText,
  Download,
  Clock,
  BarChart2,
  TrendingDown,
  Award,
  Shield,
  UserCheck,
  CreditCard,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Calculator,
  AlertTriangle,
} from "lucide-react";

// --- INTERFACE DEFINITIONS ---
interface Allowance {
  _id: string;
  name: string;
  amount: number;
  status: string;
}
interface Tax {
  _id: string;
  name: string;
  rate: number;
  description: string;
  status: string;
}
interface Insurance {
  _id: string;
  name: string;
  status: string;
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
}
interface Refund {
  _id: string;
  name: string;
  amount: number;
  status: string;
  positionName?: string;
}
interface EarningsDetails {
  baseSalary: number;
  allowances: Allowance[];
  bonuses: Refund[];
  benefits: Refund[];
  refunds: Refund[];
  _id: string;
}
interface DeductionsDetails {
  taxes: Tax[];
  insurances: Insurance[];
  penalties: any;
  _id: string;
}
interface Payslip {
  _id: string;
  payrollRunId: string;
  earningsDetails: EarningsDetails;
  deductionsDetails: DeductionsDetails;
  totalGrossSalary: number;
  totaDeductions: number; // Corrected typo in variable name consistency is generally good, but we use the API's name here
  netPay: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

// --- DUMMY TAX DETAIL INTERFACE ---
interface DetailedTaxDeduction {
  taxableBase: number;
  taxes: Tax[];
}
// -------------------------------------------

// --- HELPER COMPONENT FOR DETAIL ROWS ---
const DetailRow = ({
  label,
  value,
  statusLabel,
  isTotal = false,
  isDeduction = false,
}: {
  label: string;
  value: number;
  statusLabel?: string;
  isTotal?: boolean;
  isDeduction?: boolean;
}) => {
  // Helper to determine status badge color
  const getStatusClasses = (status?: string) => {
    if (!status) return "bg-gray-200 text-gray-700";
    const lowerStatus = status.toLowerCase();
    if (
      lowerStatus === "approved" ||
      lowerStatus === "active" ||
      lowerStatus === "paid"
    )
      return "bg-green-100 text-green-700";
    if (lowerStatus === "pending" || lowerStatus === "draft")
      return "bg-yellow-100 text-yellow-700";
    if (
      lowerStatus === "rejected" ||
      lowerStatus === "inactive" ||
      lowerStatus === "failed"
    )
      return "bg-red-100 text-red-700";
    return "bg-gray-200 text-gray-700";
  };

  const safeValue = value ?? 0;

  return (
    <div
      className={`flex justify-between items-center py-2 ${
        isTotal
          ? "font-bold text-lg text-gray-900 border-t border-b border-gray-300 mt-2"
          : "text-sm text-gray-700"
      }`}
    >
      <span className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-3 ${
            isDeduction ? "bg-red-500" : "bg-green-500"
          }`}
        ></div>
        {label}
        {/* Display Status Label */}
        {statusLabel && (
          <span
            className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${getStatusClasses(
              statusLabel
            )}`}
          >
            ({statusLabel})
          </span>
        )}
      </span>
      <span className={`${isTotal ? "text-xl font-extrabold" : ""}`}>
        {safeValue < 0 && "-"}$
        {Math.abs(safeValue).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function MyPayslipPage() {
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFetchingTaxDetails, setIsFetchingTaxDetails] = useState(false);

  const router = useRouter();

  // --- SAFETY DEFAULTS ---
  const defaultEarnings: EarningsDetails = {
    baseSalary: 0,
    allowances: [],
    bonuses: [],
    benefits: [],
    refunds: [],
    _id: "",
  };

  const defaultDeductions: DeductionsDetails = {
    taxes: [],
    insurances: [],
    penalties: { penalties: [] },
    _id: "",
  };

  useEffect(() => {
    // Fetch logic as before
    fetch("http://localhost:5000/payroll-tracking/my-payslip", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error(
            "Failed to fetch payslip (Status: " + res.status + ")"
          );
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          // Merge with defaults to ensure safety
          const mergedPayslip = {
            ...data,
            earningsDetails: { ...defaultEarnings, ...data.earningsDetails },
            deductionsDetails: {
              ...defaultDeductions,
              ...data.deductionsDetails,
            },
          };
          setPayslip(mergedPayslip);
        } else {
          setPayslip(null);
        }
      })
      .catch((e) => setError(e.message || "Failed to fetch payslip"))
      .finally(() => setLoading(false));
  }, []);

  // --- DOWNLOAD HANDLER ---
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/payroll-tracking/download-payslip",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "payslip.pdf";
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?(.+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error during PDF download:", err);
      alert("Failed to download the payslip. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- HANDLER FOR TAX DETAILS ---
  const handleViewTaxDetails = async () => {
    if (!payslip || isFetchingTaxDetails) return;

    setIsFetchingTaxDetails(true);

    try {
      const payslipId = payslip._id;
      // In a real app, this API would return the detailed tax breakdown,
      // including the calculated taxable base.
      const url = `http://localhost:5000/payroll-tracking/tax-deduction/${payslipId}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error fetching tax details." }));
        throw new Error(
          errorData.message ||
            `Failed to fetch tax details (Status: ${response.status})`
        );
      }

      // Simulating the fetch success for navigation purpose
      // const taxDetails: DetailedTaxDeduction = await response.json();

      // Navigate to the tax details page
      router.push(
        `/payroll-tracking/payslip-tax-details?payslipId=${payslipId}`
      );
    } catch (err) {
      console.error("Error fetching tax details:", err);
      if (err instanceof Error) {
        alert(`Failed to fetch tax details: ${err.message}`);
      } else {
        alert(`Failed to fetch tax details: An unknown error occurred.`);
      }
    } finally {
      setIsFetchingTaxDetails(false);
    }
  };

  // --- NEW HANDLER FOR INSURANCE DETAILS ---
  const handleViewInsuranceDetails = () => {
    if (!payslip) return;
    const payslipId = payslip._id;
    // Redirect to a new page, passing the payslip ID or other relevant info
    router.push(
      `/payroll-tracking/payslip-insurance-details?payslipId=${payslipId}`
    );
  };

  // --- HANDLER FOR CONTRACT DETAILS ---
  const handleViewContract = () => {
    // *** CORRECTED ROUTE TO MATCH SIMPLER FILE STRUCTURE ***
    router.push("/payroll-tracking/contract-details");
  };

  // --- HISTORY HANDLER ---
  const handleViewHistory = () => {
    router.push("/payroll-tracking/payslip-history");
  };

  // --- HANDLER FOR UNUSED LEAVE COMPENSATION ---
  const handleViewLeaveCompensation = () => {
    router.push("/payroll-tracking/unused-leave-compensation");
  };

  // --- NEW HANDLER FOR MISCONDUCT DETAILS ---
  const handleViewMisconductDetails = () => {
    if (!payslip) return;
    router.push(
      `/payroll-tracking/payslip-misconduct-details?payslipId=${payslip._id}`
    );
  };

  // --- NEW HANDLER FOR UNPAID LEAVE DETAILS ---
  const handleViewUnpaidLeaveDetails = () => {
    if (!payslip) return;
    router.push(
      `/payroll-tracking/payslip-unpaid-leave-details?payslipId=${payslip._id}`
    );
  };

  // --- LOADING, ERROR, NO PAYSLIP STATES ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-center text-xl text-blue-600 font-semibold animate-pulse">
          Loading payroll data...
        </p>
      </div>
    );

  if (
    error &&
    error !== "Failed to fetch payslip with status: 404" &&
    error !== "Failed to fetch payslip (Status: 404)"
  )
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-center text-xl text-red-600 font-bold p-8 bg-white rounded-lg border-t-4 border-red-500 shadow-lg">
          Error: {error}
        </p>
      </div>
    );

  if (!payslip)
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-100">
        <div className="text-center p-10 bg-white rounded-xl shadow-2xl border-t-4 border-yellow-500">
          <CreditCard className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <p className="text-2xl font-bold text-gray-800 mb-2">
            No Recent Payslip Found
          </p>
          <p className="text-gray-600">
            The most recent payroll statement is not yet available in the
            system.
          </p>
          <button
            onClick={handleViewHistory}
            className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            <Clock className="w-4 h-4 mr-2 inline-block" />
            View History
          </button>
        </div>
      </div>
    );

  // --- CALCULATIONS & DATA MAPPING ---
  // Apply final safety catch for destructuring
  const earningsDetails = payslip.earningsDetails ?? defaultEarnings;
  const deductionsDetails = payslip.deductionsDetails ?? defaultDeductions;

  // 1. Calculate total Allowances: Use only 'approved' statuses for the total amount calculation
  const totalAllowances = (earningsDetails.allowances ?? [])
    .filter((a) => a?.status?.toLowerCase() === "approved") // Filter applied for calculation
    .reduce((sum, a) => sum + Number(a?.amount ?? 0), 0);

  const totalBonuses = (earningsDetails.bonuses ?? []).reduce(
    (s, b) => s + (b?.amount ?? 0),
    0
  );
  const totalRefunds = (earningsDetails.refunds ?? []).reduce(
    (s, r) => s + (r?.amount ?? 0),
    0
  );
  const totalBenefits = (earningsDetails.benefits ?? []).reduce(
    (s, b) => s + (b?.amount ?? 0),
    0
  );

  // 2. *** CRITICAL CORRECTION ***: Use the totalGrossSalary from the API response
  const grossSalaryBase = payslip.totalGrossSalary ?? 0;

  // 3. Calculate Deduction Totals based on the Gross Salary base
  const totalTaxes = (deductionsDetails.taxes ?? []).reduce(
    (s, t) => s + (grossSalaryBase * (t?.rate ?? 0)) / 100,
    0
  );
  const totalEmployeeInsuranceDeduction = (
    deductionsDetails.insurances ?? []
  ).reduce((s, i) => s + (grossSalaryBase * (i?.employeeRate ?? 0)) / 100, 0);
  const totalPenalties =
    deductionsDetails.penalties?.penalties?.reduce(
      (s: number, p: any) => s + (p?.amount ?? 0),
      0
    ) || 0;

  // Removed totalGrossEarningsCalculated
  // Removed totalDeductionsCalculated - We rely on payslip.totaDeductions

  // Status Styling
  const statusClasses =
    {
      PAID: "bg-green-500 text-white",
      PENDING: "bg-yellow-500 text-gray-800",
      FAILED: "bg-red-500 text-white",
    }[payslip.paymentStatus ?? "PENDING"] || "bg-gray-500 text-white";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 transition font-medium mb-4"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </button>
        {/* HEADER & METADATA */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 px-8 bg-white rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-4 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Payroll Statement
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Period:{" "}
                {payslip.createdAt
                  ? new Date(payslip.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })
                  : "N/A"}{" "}
                | ID: {payslip.payrollRunId ?? "N/A"}
              </p>
            </div>
          </div>
          <div
            className={`mt-4 sm:mt-0 px-4 py-1.5 text-sm font-bold rounded-full ${statusClasses}`}
          >
            {payslip.paymentStatus ?? "UNKNOWN"}
          </div>
        </header>

        {/* NET PAY FINAL BANNER */}
        <div
          className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white 
                      p-6 sm:p-8 rounded-xl shadow-2xl flex justify-between items-center 
                      hover:from-blue-900 hover:to-indigo-950 transition duration-300"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center tracking-wider">
            <div className="p-2 bg-green-500 rounded-full mr-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            NET PAY (TAKE HOME)
          </h2>
          <span className="text-4xl font-extrabold text-green-300">
            $
            {(payslip.netPay ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* SUMMARY SECTION - 5 Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* 1. Base Salary Card */}
          <div className="bg-white rounded-xl p-5 shadow-lg border-t-4 border-blue-500 transition hover:shadow-xl relative">
            {/* Icon Container (Top Left) */}
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* --- CREATIVE BUTTON --- */}
            <button
              onClick={handleViewContract}
              title="View Contract Details (Base Salary)"
              className="flex items-center text-xs font-semibold text-blue-600 
                          bg-blue-50 rounded-lg py-1 px-2 transition hover:bg-blue-100 
                          absolute top-3 right-3 z-10 whitespace-nowrap"
              aria-label="View Contract Details"
            >
              View Contract Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </button>
            {/* -------------------------------------- */}

            {/* Card Content (Bottom) */}
            <p className="text-sm font-medium text-gray-600">Base Salary</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              $
              {(earningsDetails.baseSalary ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 2. Total Deductions Card (Uses data.totaDeductions) */}
          <div className="bg-white rounded-xl p-5 shadow-lg border-t-4 border-red-500 transition hover:shadow-xl">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">
              Total Deductions
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              $
              {(payslip.totaDeductions ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 3. Total Allowances Card (Uses calculated totalAllowances - only approved) */}
          <div className="bg-white rounded-xl p-5 shadow-lg border-t-4 border-purple-500 transition hover:shadow-xl">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">
              Total Allowances
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              $
              {(totalAllowances ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 4. Gross Salary Card (Uses data.totalGrossSalary) */}
          <div
            className="bg-cyan-500 text-white 
                        rounded-xl p-5 shadow-lg flex flex-col justify-between transition hover:shadow-2xl"
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium opacity-80">Gross Salary</p>
            <p className="mt-1 text-2xl font-extrabold">
              $
              {(payslip.totalGrossSalary ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 5. Unused Leave Compensation Card (NEW) */}
          <div
            className="bg-white rounded-xl p-5 shadow-lg border-t-4 border-emerald-500 transition hover:shadow-xl relative group cursor-pointer"
            onClick={handleViewLeaveCompensation}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewLeaveCompensation();
              }}
              className="flex items-center text-xs font-semibold text-emerald-600 
                          bg-emerald-50 rounded-lg py-1 px-2 transition hover:bg-emerald-100 
                          absolute top-3 right-3 z-10 whitespace-nowrap"
            >
              View Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </button>

            <p className="text-sm font-medium text-gray-600">Unused Leave</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              Potential Value
            </p>
          </div>
        </div>

        {/* EARNINGS & DEDUCTIONS DETAIL */}
        <div className="grid lg:grid-cols-2 gap-6 pt-8">
          {/* EARNINGS SECTION */}
          <section className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-green-500 text-white font-bold text-xl flex items-center">
              <Zap className="w-5 h-5 mr-3" />
              Earnings Breakdown
            </div>

            <div className="p-6 space-y-4">
              <DetailRow
                label="Base Salary"
                value={earningsDetails.baseSalary}
                isTotal={true}
              />

              {/* Allowances Section - Display all, filter in total calculation */}
              <div className="pt-2">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">
                  Allowances
                </h3>
                {(earningsDetails.allowances ?? []).length > 0 ? (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    {earningsDetails.allowances.map((a) => (
                      <DetailRow
                        key={a._id}
                        label={a.name}
                        value={a.amount}
                        statusLabel={a.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                    No allowances found.
                  </div>
                )}
              </div>

              {/* Other Income Section - Display all, including status */}
              <div className="pt-2">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">
                  Other Income
                </h3>
                {totalBonuses > 0 || totalRefunds > 0 || totalBenefits > 0 ? (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    {(earningsDetails.bonuses ?? []).map((b) => (
                      <DetailRow
                        key={b._id}
                        label={`Bonus: ${b.positionName || b.name}`}
                        value={b.amount}
                        statusLabel={b.status}
                      />
                    ))}
                    {(earningsDetails.refunds ?? []).map((r) => (
                      <DetailRow
                        key={r._id}
                        label={`Refund: ${r.name}`}
                        value={r.amount}
                        statusLabel={r.status}
                      />
                    ))}
                    {(earningsDetails.benefits ?? []).map((b) => (
                      <DetailRow
                        key={b._id}
                        label={`Benefit: ${b.name}`}
                        value={b.amount}
                        statusLabel={b.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                    No other income recorded.
                  </div>
                )}
              </div>

              <DetailRow
                label="TOTAL GROSS EARNINGS"
                value={payslip.totalGrossSalary}
                isTotal={true}
              />
            </div>
          </section>

          {/* DEDUCTIONS SECTION */}
          <section className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-purple-600 text-white font-bold text-xl flex items-center">
              <Shield className="w-5 h-5 mr-3" />
              Deductions Breakdown
            </div>

            <div className="p-6 space-y-4">
              {/* Taxes */}
              <div className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-lg text-gray-800">Taxes</h3>
                  <button
                    onClick={handleViewTaxDetails}
                    disabled={isFetchingTaxDetails}
                    className={`flex items-center text-sm font-medium p-1 rounded transition 
                              text-blue-600 hover:bg-blue-50 hover:text-blue-800
                              ${
                                isFetchingTaxDetails
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                  >
                    {isFetchingTaxDetails ? "Loading..." : "View Tax Details"}
                    {!isFetchingTaxDetails && (
                      <ChevronRight className="w-4 h-4 ml-1" />
                    )}
                  </button>
                </div>

                {(deductionsDetails.taxes ?? []).length > 0 ? (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    {deductionsDetails.taxes.map((t) => (
                      <DetailRow
                        key={t._id}
                        label={`${t.name} (${t.rate}%)`}
                        value={-((grossSalaryBase * (t?.rate ?? 0)) / 100)}
                        isDeduction={true}
                        statusLabel={t.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                    No tax deductions available.
                  </div>
                )}
              </div>

              {/* Insurances (WITH UPDATED STYLING) */}
              <div className="pt-2 pb-2">
                {/* Header Row: Insurance Title and Button */}
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-base text-gray-800 min-w-0 pr-2 whitespace-nowrap overflow-hidden truncate">
                    Insurance Contributions (Employee Portion)
                  </h3>

                  {/* BUTTON: Remains consistent blue styling */}
                  <button
                    onClick={handleViewInsuranceDetails}
                    className="flex items-center text-sm font-medium p-1 rounded transition 
                              text-blue-600 hover:bg-blue-50 hover:text-blue-800 shrink-0"
                  >
                    View Insurance Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {(deductionsDetails.insurances ?? []).length > 0 ? (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    {deductionsDetails.insurances.map((i) => (
                      <DetailRow
                        key={i._id}
                        label={`${i.name} (${i.employeeRate}%)`}
                        value={
                          -((grossSalaryBase * (i?.employeeRate ?? 0)) / 100)
                        }
                        isDeduction={true}
                        statusLabel={i.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                    No insurance contributions available.
                  </div>
                )}
              </div>

              {/* Penalties Section with Redirect Button */}
              <div className="pt-2 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Penalties
                  </h3>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={handleViewMisconductDetails}
                      className="flex items-center text-sm font-medium p-1 rounded transition 
                              text-blue-600 hover:bg-blue-50 hover:text-blue-800 shrink-0"
                    >
                      View Lateness & Misconduct Deduction
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>

                    {/* --- NEW BUTTON: REVIEW UNPAID LEAVE DAYS --- */}
                    <button
                      onClick={handleViewUnpaidLeaveDetails}
                      className="flex items-center text-sm font-medium p-1 rounded transition 
                              text-blue-600 hover:bg-blue-50 hover:text-blue-800 shrink-0"
                    >
                      Review your unpaid leave days deductions
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                {totalPenalties > 0 &&
                (deductionsDetails.penalties?.penalties ?? []).length > 0 ? (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    {deductionsDetails.penalties.penalties.map(
                      (p: any, index: number) => (
                        <DetailRow
                          key={index}
                          label={p.reason || "Misconduct Penalty"}
                          value={-(p?.amount ?? 0)}
                          isDeduction={true}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                    No penalties applied for this period.
                  </div>
                )}
              </div>

              {/* Total Deductions Line (Uses data.totaDeductions) */}
              <DetailRow
                label="TOTAL DEDUCTIONS"
                value={-(payslip.totaDeductions ?? 0)}
                isTotal={true}
                isDeduction={true}
              />
            </div>
          </section>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-300">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md transition ${
              isDownloading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isDownloading ? (
              <>
                <Download className="w-5 h-5 mr-2 animate-bounce" />
                Preparing PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={handleViewHistory}
            className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md transition"
          >
            <Clock className="w-5 h-5 mr-2" />
            View Past Payslips
          </button>
        </div>
      </div>
    </div>
  );
}
