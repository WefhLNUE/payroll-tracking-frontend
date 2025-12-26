# Payroll Tracking Module – Frontend Documentation

## 1. Overview

The **Payroll Tracking Module** is the main entry page for the payroll system frontend, built using **Next.js (App Router)** with **Client-Side Rendering (CSR)**. It dynamically displays accessible payroll features based on the authenticated user's roles, which are retrieved from the backend.

This page acts as a **role-based navigation dashboard**, ensuring users only see modules they are authorized to access.

---

## 2. Technology Stack

### Frontend

- **Next.js 13+ (App Router)**
- **React (Client Components)**
- **TypeScript / JavaScript**
- **Fetch API (with cookies)**

### Backend (Expected)

- **NestJS / Express**
- **Authentication using Cookies (HTTP-only)**
- **Role-Based Access Control (RBAC)**

---

## 3. Rendering Strategy

- This page is a **Client Component** (`"use client"`)
- Authentication and authorization are handled **after page load**
- UI is rendered dynamically based on roles

### Why CSR here?

- Requires session cookies
- Depends on user-specific roles
- Navigation-heavy dashboard

---

## 4. Authentication Flow (Frontend ↔ Backend)

### Endpoint Used

```
GET /auth/me
```

### Frontend Call

```ts
fetch("http://localhost:5000/auth/me", {
  credentials: "include",
});
```

### Purpose

- Identify the currently logged-in user
- Retrieve assigned roles
- Drive role-based UI rendering

---

## 5. Expected Backend Response Contract

### Example Response

```json
{
  "_id": "64f...",
  "name": "John Doe",
  "email": "john@company.com",
  "role": ["department employee"]
}
```

> ⚠️ The frontend supports **both** `role` and `roles` fields for flexibility.

---

## 6. Role Handling Logic

```ts
const rolesArray = Array.isArray(u.role) ? u.role : u.roles || [];
setUserRoles(rolesArray);
```

### Supported Roles

- department employee
- Payroll Manager
- Payroll Specialist
- Finance Staff

---

## 7. Module Authorization Model

Each module defines:

- `title`
- `allowedRoles`
- `items[]` (navigation links)

### Authorization Rule

```ts
module.allowedRoles.some((role) => userRoles.includes(role));
```

Only modules with **at least one matching role** are displayed.

---

## 8. Module-to-Backend Mapping

### 8.1 Track Your Compensations

**Roles:** department employee

| Feature                   | Route                        | Backend Responsibility         |
| ------------------------- | ---------------------------- | ------------------------------ |
| Employee Claims           | `/claims`                    | CRUD claims for employee       |
| Employee Disputes         | `/disputes`                  | Submit & view disputes         |
| Unused Leave Compensation | `/unused-leave-compensation` | Calculate unused leave payouts |

---

### 8.2 Track Your Payslips

**Roles:** department employee

| Feature           | Route                        | Backend Responsibility |
| ----------------- | ---------------------------- | ---------------------- |
| Payslip           | `/view-my-payslip`           | Fetch latest payslip   |
| Payslip History   | `/payslip-history`           | Historical payslips    |
| Insurance Details | `/payslip-insurance-details` | Insurance deductions   |

---

### 8.3 Salary Details

**Roles:** department employee

| Feature                | Route                    | Backend Responsibility |
| ---------------------- | ------------------------ | ---------------------- |
| Employee Contract      | `/contract-details`      | Contract metadata      |
| Salary History         | `/salary-history`        | Salary changes         |
| Employer Contributions | `/employercontributions` | Employer-side payments |

---

### 8.4 Payslip Deductions

**Roles:** department employee

| Feature            | Route                           | Backend Responsibility |
| ------------------ | ------------------------------- | ---------------------- |
| Misconduct Details | `/payslip-misconduct-details`   | Penalties & violations |
| Unpaid Leave       | `/payslip-unpaid-leave-details` | Leave-based deductions |

---

### 8.5 Manager Approval

**Roles:** Payroll Manager

| Feature         | Route               | Backend Responsibility  |
| --------------- | ------------------- | ----------------------- |
| Claims Approval | `/claims/manager`   | Approve / reject claims |
| Disputes Review | `/disputes/manager` | Resolve disputes        |

---

### 8.6 Payroll Specialist Management

**Roles:** Payroll Specialist

| Feature             | Route                  | Backend Responsibility  |
| ------------------- | ---------------------- | ----------------------- |
| Claims Processing   | `/claims/specialist`   | Validate claims         |
| Disputes Processing | `/disputes/specialist` | Investigate disputes    |
| Department Payrolls | `/department-payrolls` | Department payroll data |

---

### 8.7 Finance Management

**Roles:** Finance Staff

| Feature       | Route                    | Backend Responsibility |
| ------------- | ------------------------ | ---------------------- |
| Notifications | `/finance-notifications` | Financial alerts       |
| Reports       | `/finance-reports`       | Analytics & summaries  |
| Payroll Runs  | `/payroll-runs`          | Payroll execution      |
| Refunds       | `/refunds`               | Handle refunds         |

---

## 9. Error & Loading States

### Loading

```tsx
if (loading) return <div>Loading permissions...</div>;
```

### Error Handling

- Fetch failures are logged
- Page remains safe (no crash)

---

## 10. Security Considerations

### Frontend

- UI-based authorization only
- Never trusted alone

### Backend (Required)

- Enforce RBAC on every endpoint
- Validate user role per request
- Never rely on frontend filtering

---

## 11. Future Improvements

- Move `/auth/me` to server component
- Introduce shared role enum
- Add skeleton loaders
- Cache user profile in global state
- Replace inline styles with Tailwind

---

## 12. Summary

- This page is the **role-based entry point** to the payroll system
- Backend provides authentication & roles
- Frontend dynamically renders authorized modules
- Strong separation of concerns between UI and access control

---

**Document Owner:** Payroll System Team
**Frontend Framework:** Next.js
**Rendering Mode:** CSR
**Auth Strategy:** Cookie-based session
