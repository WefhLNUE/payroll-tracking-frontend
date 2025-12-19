"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PayrollTrackingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/me", {
          credentials: "include",
        });
        const u = await response.json();

        setCurrentUser(u);

        // Ensure we handle the array correctly.
        // If your API returns 'role' as an array, use that.
        // If it's 'roles', use u.roles.
        const rolesArray = Array.isArray(u.role) ? u.role : u.roles || [];
        setUserRoles(rolesArray);
      } catch (e: any) {
        console.error("Failed to fetch user data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modules = [
    {
      title: "Track your Compensations",
      allowedRoles: ["department employee"],
      items: [
        {
          label: "Employee Claims",
          href: "/payroll-tracking/claims",
          description: "Create and View your Claims",
        },
        {
          label: "Employee Disputes",
          href: "/payroll-tracking/disputes",
          description: "Create and View your disputes",
        },
        {
          label: "Unused leave Compensations",
          href: "/payroll-tracking/unused-leave-compensation",
          description: " View your Unused leave Compensations",
        },
      ],
    },

    {
      title: "Track your Payslips",
      allowedRoles: ["department employee"],
      items: [
        {
          label: "Payslip",
          href: "/payroll-tracking/view-my-payslip",
          description: "View your payslip",
        },
        {
          label: "Payslip history",
          href: "/payroll-tracking/payslip-history",
          description: "View your payslip history",
        },
        {
          label: "Payslip Insurance Details",
          href: "/payroll-tracking/payslip-insurance-details",
          description: "View Insurance Details",
        },
      ],
    },

    {
      title: "Salary Details",
      allowedRoles: ["department employee"],
      items: [
        {
          label: "Employee Contract",
          href: "/payroll-tracking/contract-details",
          description: "View your Contract",
        },
        {
          label: "Salary History",
          href: "/payroll-tracking/salary-history",
          description: "View your Salary History",
        },
        {
          label: "Employer Contributions",
          href: "/payroll-tracking/employercontributions",
          description: "View Employer Contributions",
        },
      ],
    },

    {
      title: "Payslip Deductions",
      allowedRoles: ["department employee"],
      items: [
        {
          label: "paylip misconduct details",
          href: "/payroll-tracking/payslip-misconduct-details",
          description: "View payslip misconducts",
        },
        {
          label: "paylip unpaid leave details",
          href: "/payroll-tracking/payslip-unpaid-leave-details",
          description: "View payslip misconduct details",
        },
      ],
    },

    {
      title: "Manager Approval",
      allowedRoles: ["Payroll Manager"],
      items: [
        {
          label: "Claims",
          href: "/payroll-tracking/claims/manager",
          description: "Manage Claims",
        },
        {
          label: "Disputes",
          href: "/payroll-tracking/disputes/manager",
          description: "Manage Disputes",
        },
      ],
    },

    {
      title: "Payroll Specialist Management",
      allowedRoles: ["Payroll Specialist"],
      items: [
        {
          label: "Claims",
          href: "/payroll-tracking/claims/specialist",
          description: "Manage claims",
        },
        {
          label: "Disputes",
          href: "/payroll-tracking/disputes/specialist",
          description: "Manage Disputes",
        },
        {
          label: "Department Payrolls",
          href: "/payroll-tracking/department-payrolls",
          description: "view Departments Payroll",
        },
      ],
    },
    {
      title: "Finance Managment",
      allowedRoles: ["Finance Staff"],
      items: [
        {
          label: "Finance Notfications",
          href: "/payroll-tracking/finance-notifications",
          description: "Notfications 🔔",
        },
        {
          label: "Finance Reports",
          href: "/payroll-tracking/finance-reports",
          description: "View Analytics",
        },
        {
          label: "Payroll Runs",
          href: "/payroll-tracking/payroll-runs",
          description: "View Payroll Runs",
        },
        {
          label: "Refunds",
          href: "/payroll-tracking/refunds",
          description: "View & Manage Refunds",
        },
      ],
    },
  ];

  // 1. FILTER LOGIC: Check if any of the user's roles are in the allowedRoles array
  const filteredModules = modules.filter((module) =>
    module.allowedRoles.some((role) => userRoles.includes(role))
  );

  if (loading)
    return <div style={{ padding: "2rem" }}>Loading permissions...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "var(--payroll)",
          }}
        >
          Payroll Tracking Module
        </h1>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
        }}
      >
        {filteredModules.map((module) => (
          <div key={module.title} style={cardStyle}>
            <h2
              style={{
                fontSize: "1.5rem",
                color: "var(--payroll)",
                marginBottom: "1rem",
              }}
            >
              {module.title}
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {module.items.map((item) => (
                <Link key={item.href} href={item.href} style={linkStyle}>
                  <div style={{ fontWeight: "600" }}>{item.label}</div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {item.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Styling (same as before)
const cardStyle = {
  backgroundColor: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

const linkStyle = {
  display: "block",
  padding: "1rem",
  backgroundColor: "var(--bg-secondary)",
  borderRadius: "0.5rem",
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.2s",
};
