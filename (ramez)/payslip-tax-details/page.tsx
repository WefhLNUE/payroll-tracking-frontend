// app/payslip-tax-details/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  DollarSign,
  Activity,
  FileText,
  Scale,
} from "lucide-react";

// --- UPDATED INTERFACE DEFINITION ---
interface TaxDetailItem {
  // The backend now provides these properties
  name: string;
  rate: number;
  lawReference: string; // Updated from 'description'
  amount: number; // Now provided by the backend
  // Since the item does not have an _id in the example output, we will rely on index for keying
}

interface DetailedTaxDeduction {
  taxableBase: number;
  totalTax: number; // New property provided by the backend
  taxes: TaxDetailItem[];
}
// ------------------------------------

export default function PayslipTaxDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payslipId = searchParams.get("payslipId");

  const [taxDetails, setTaxDetails] = useState<DetailedTaxDeduction | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!payslipId) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        // --- FIX 1: URL construction changed to use path parameter ---
        const url = `http://localhost:5000/payroll-tracking/tax-deduction/${payslipId}`;
        // -----------------------------------------------------------

        const response = await fetch(url, { credentials: "include" });

        if (!response.ok) {
          const errorBody = await response
            .json()
            .catch(() => ({ message: "Server error occurred." }));
          throw new Error(
            errorBody.message ||
              `Failed to load tax details (Status: ${response.status})`
          );
        }

        const data: DetailedTaxDeduction = await response.json();
        setTaxDetails(data);
      } catch (error) {
        console.error("Error fetching tax details:", error);
        if (error instanceof Error) {
          alert(`Failed to load tax details: ${error.message}`);
        }
        setTaxDetails(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [payslipId]);

  // --- RENDER: Loading and Error States (Unchanged) ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
        <FileText className="w-12 h-12 text-blue-500 animate-pulse mb-3" />
        <p className="text-xl font-semibold text-blue-600">
          Loading detailed tax breakdown...
        </p>
      </div>
    );
  }

  if (!payslipId || !taxDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
        <p className="text-xl text-red-600 font-bold mb-4">
          Tax details not found or failed to load.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <ChevronLeft className="w-5 h-5 mr-1 inline-block" />
          Go Back to Payslip
        </button>
      </div>
    );
  }

  // --- RENDER: Success (Updated to use totalTax and amount) ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-gray-50 min-h-screen">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition p-2 rounded-lg hover:bg-blue-100"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Dashboard
      </button>

      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 border-t-4 border-red-500">
        <h1 className="text-3xl font-bold text-gray-900 border-b pb-2 mb-4 flex items-center">
          <Activity className="w-7 h-7 mr-2 text-red-500" />
          Detailed Tax Deductions
        </h1>
        <p className="text-sm text-gray-500 mb-6">Payslip ID: {payslipId}</p>

        <div className="space-y-8">
          {/* Taxable Base Section */}
          <div className="p-5 bg-green-50 rounded-lg border-l-4 border-green-500 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-green-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Taxable Base Income
            </h2>
            <p className="text-4xl font-extrabold text-green-700">
              $
              {(taxDetails.taxableBase ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This is the gross income amount used to calculate percentage-based
              tax deductions.
            </p>
          </div>

          {/* Total Tax Deduction Section (NEW: Using totalTax from API) */}
          <div className="p-5 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-red-800 flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Total Tax Deducted
            </h2>
            <p className="text-4xl font-extrabold text-red-700">
              $
              {(taxDetails.totalTax ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Sum of all mandatory tax and social contributions.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            Individual Tax Breakdown
          </h2>
          {taxDetails.taxes && taxDetails.taxes.length > 0 ? (
            <ul className="space-y-4">
              {taxDetails.taxes.map((tax, index) => (
                <li
                  // Since the tax items don't have an _id in the example, we use index for keying
                  key={tax.name + index}
                  className="flex flex-col sm:flex-row justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition duration-150"
                >
                  <div>
                    <span className="font-bold text-lg text-gray-800">
                      {tax.name} ({tax.rate}%)
                    </span>
                    {/* Using lawReference from the new structure */}
                    <p className="text-sm text-gray-600">{tax.lawReference}</p>
                  </div>
                  <span className="font-extrabold text-xl text-red-700 mt-2 sm:mt-0">
                    {/* Using amount provided directly by the backend */}- $
                    {(tax.amount ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-gray-600">
                No tax deductions found for this payslip.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
