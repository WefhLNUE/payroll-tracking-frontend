"use client";

import Link from "next/link";

export default function payrolltrackingPage() {
  const modules = [
    {
      title: "Track your Compensations",
      description: "Track your payments",
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
      description: "Track your paid & unpaid payments",
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
      description: "View Salary Details",
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
      description: "View Your Deductions",
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
      description: "Things that need a Manager Approval",
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
      title: "Payroll Specialist Managment",
      description: "Manage Payrolls",
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
      ],
    },
    {
      title: "Reports",
      description: "View Analytics",
      items: [
        {
          label: "Department Payrolls",
          href: "/payroll-tracking/department-payrolls",
          description: "view Departments Payroll",
        },
        {
          label: "Payroll Runs",
          href: "/payroll-tracking/payroll-runs",
          description: "View Payroll Runs",
        },
      ],
    },

    {
      title: "Finance Managment",
      description: "Only Finance",
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
          label: "Refunds",
          href: "/payroll-tracking/refunds",
          description: "View & Manage Refunds",
        },
      ],
    },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "var(--payroll)",
            marginBottom: "0.5rem",
          }}
        >
          Payroll Tracking Module
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)" }}>
          Payroll Tracking & Managment
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
        }}
      >
        {modules.map((module) => (
          <div
            key={module.title}
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "var(--payroll)",
              }}
            >
              {module.title}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
              }}
            >
              {module.description}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {module.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "1rem",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    transition: "background-color 0.2s",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-selected)";
                    e.currentTarget.style.borderColor = "var(--payroll)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
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

      {/* Public Careers Page Link
      <div
        style={{
          marginTop: "3rem",
          padding: "2rem",
          backgroundColor: "var(--payroll)",
          borderRadius: "0.75rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "white",
            marginBottom: "0.5rem",
          }}
        >
          Public Careers Page
        </h2>
        <p
          style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: "1.5rem" }}
        >
          View your organization's public job board where candidates can browse
          and apply for positions
        </p>
        <Link
          href="/careers/jobs"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            backgroundColor: "white",
            color: "var(--payroll)",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: "600",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Visit Careers Page →
        </Link>
      </div> */}
    </div>
  );
}
