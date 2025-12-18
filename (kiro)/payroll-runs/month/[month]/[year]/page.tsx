"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PayrollRunsByMonthPage() {
  const params = useParams();
  const month = params?.month as string | undefined;
  const year = params?.year as string | undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchRuns() {
      setLoading(true);
      setError(null);
      if (!month || !year) {
        setError("Missing month or year in route parameters");
        setLoading(false);
        return;
      }

      try {
        const encodedMonth = encodeURIComponent(month);
        const encodedYear = encodeURIComponent(year);
        const res = await fetch(
          `http://localhost:5000/payroll-tracking/payroll-runs/month/${encodedMonth}/${encodedYear}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        console.log("Fetching payroll runs for:", res);

        const data = await res.json();
        if (mounted) {
          console.log("Payroll runs data:", data);
          setRuns(Array.isArray(data) ? data : data?.payrollRuns || []);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to fetch payroll runs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRuns();

    return () => {
      mounted = false;
    };
  }, [month, year]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">
            Payroll Runs — {month}/{year}
          </h1>
          <p className="text-sm text-gray-600">
            Payroll runs for the selected period.
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            Loading payroll runs…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && runs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            No payroll runs found for this period.
          </div>
        )}

        {!loading && !error && runs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">
                Found {runs.length} payroll run(s)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-black">
                <thead className="bg-gray-50 text-left text-black">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Run ID</th>
                    <th className="px-4 py-2">Payroll period</th>
                    <th className="px-4 py-2">Employees</th>
                    <th className="px-4 py-2">Total Net Pay</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {runs.map((r: any) => {
                    const payPeriodStart = r.payPeriodStart || r.period?.start;
                    const payPeriodEnd = r.payPeriodEnd || r.period?.end;
                    const totalNetPay = r.totalNetPay || r.netPayTotal || 0;

                    return (
                      <tr key={r._id || r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-black">
                          {r._id || r.id}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-black">
                          {r.runId}
                        </td>
                        <td className="px-4 py-3 text-black">
                          {new Date(r.payrollPeriod).toLocaleDateString()} -
                        </td>
                        <td className="px-4 py-3 text-black">{r.employees}</td>
                        <td className="px-4 py-3 text-black">
                          {r.totalnetpay}
                        </td>
                        <td className="px-4 py-3 text-black">
                          {r.status || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
