# Cotizador de Seguros

## Current State
New project with empty Motoko backend and no frontend implementation.

## Requested Changes (Diff)

### Add
- Full authentication system with role-based access: `agent` (common user) and `admin`
- User registration with email, name, password (hashed), role assignment
- Session management (token-based via Motoko stable storage)
- Insurance plans data (at least 3 plans: Basic, Standard, Premium) with benefits, coverage amounts, premiums
- Quote creation: client info, selected plan, coverage amount, premium, status (pending/paid)
- Quote management: save as pending, mark as paid, view history
- Admin: view all users, all quotes, activate/deactivate users, change roles
- Statistics endpoint: total users, total quotes, pending count, paid count
- Real-time polling support (endpoints return fresh data on each call)

### Modify
- Backend main.mo: implement all data models and query/update functions

### Remove
- Nothing (new project)

## Implementation Plan
1. Backend: User model (id, username, email, passwordHash, role, registeredAt, isActive, lastActivity)
2. Backend: InsurancePlan model (id, name, description, benefits[], monthlyPremium, coverageAmount)
3. Backend: Quote model (id, userId, clientName, clientAge, clientEmail, planId, planName, coverageAmount, monthlyPremium, status, createdAt, paidAt)
4. Backend: Session model (token, userId, expiresAt)
5. Backend: Auth functions: register, login, logout, validateSession
6. Backend: User management: getUsers, getUserById, updateUserRole, setUserActive
7. Backend: Quote functions: createQuote, getQuotesByUser, getAllQuotes, updateQuoteStatus
8. Backend: Stats function: getAdminStats
9. Frontend: Login/Register pages with role routing
10. Frontend: Agent dashboard - create quote form, quote list, quote card (exportable image), PDF download
11. Frontend: Admin dashboard - user list (polling), all quotes, stats cards, user management actions
12. Frontend: Responsive layout, professional design using Tailwind
13. Frontend: html2canvas for quote image export, jsPDF for plan benefits PDF
