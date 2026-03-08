# ConstructMarket - Product Requirements Document

## Overview
ConstructMarket is a multi-tenant B2B SaaS construction procurement marketplace connecting Builders, Trade Providers/Suppliers, and Platform Admins.

## Problem Statement
The construction industry lacks an efficient digital marketplace for:
- Builders to find and engage verified trade providers
- Providers to discover project opportunities
- Secure contract management and payments
- Compliance and verification management

## Core User Roles

### 1. Builder
- Creates projects/tasks
- Receives and evaluates bids from providers
- Selects providers and generates contracts
- Signs contracts electronically
- Releases payments via Stripe

### 2. Provider (Trade/Supplier)
- Completes company profile with credentials
- Browses available tasks matching their trade
- Submits competitive bids
- Executes work orders
- Receives payments via Stripe Connect

### 3. Admin
- Manages platform users and companies
- Verifies licences and insurance
- Oversees disputes
- Views platform analytics and GMV

## Technical Stack
- **Frontend**: React 18 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Google OAuth (via Emergent Auth)
- **Payments**: Stripe Connect (Test mode)
- **Deployment**: Docker/Kubernetes with Supervisor

## Implemented Features (March 2026)

### Authentication & Authorization
- [x] JWT-based signup and login
- [x] Google OAuth integration via Emergent Auth
- [x] Role-based access control (builder/provider/admin)
- [x] Session management with token refresh

### Builder Features
- [x] Dashboard with stats (Active Tasks, Open Bids, Contracts, Payments)
- [x] 5-step task creation wizard
- [x] Task management (draft, publish, manage)
- [x] Bid review and selection
- [x] Contract creation with HTML generation
- [x] E-signature capability
- [x] Payment management

### Provider Features
- [x] Dashboard with task stats
- [x] Task feed with search and filters (category, city)
- [x] Bid submission with pricing and timeline
- [x] Contract review and signing
- [x] Work order management
- [x] Settings (Profile, Company, Credentials)

### Admin Features
- [x] Platform dashboard with analytics
- [x] User management (list, activate/deactivate)
- [x] Company management (list, verify)
- [x] Licence verification
- [x] Insurance verification
- [x] Platform analytics (GMV, tasks by status/category)

### Contract & Payment System
- [x] Automated contract HTML generation
- [x] E-signature flow (both parties)
- [x] Work order auto-creation
- [x] Payment tracking
- [x] Stripe Checkout integration

### Notification System
- [x] In-app notifications
- [x] Notification types: bid_received, bid_selected, contract_ready, work_started
- [x] Mark as read functionality

## API Endpoints

### Auth
- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - JWT login
- POST `/api/auth/google/session` - Google OAuth
- GET `/api/auth/me` - Current user info
- POST `/api/auth/complete-onboarding` - Complete registration

### Tasks
- GET `/api/tasks/` - List tasks
- POST `/api/tasks/` - Create task
- GET `/api/tasks/{id}` - Get task details
- PUT `/api/tasks/{id}` - Update task

### Bids
- GET `/api/bids/` - List bids
- POST `/api/bids/` - Submit bid
- PUT `/api/bids/{id}` - Update bid status

### Contracts
- GET `/api/contracts/` - List contracts
- POST `/api/contracts/` - Create contract
- GET `/api/contracts/{id}` - Get contract
- POST `/api/contracts/{id}/sign` - Sign contract

### Payments
- GET `/api/payments/` - List payments
- POST `/api/payments/{id}/initiate-checkout` - Start Stripe checkout
- POST `/api/payments/{id}/release` - Release payment

### Admin
- GET `/api/admin/dashboard` - Platform stats
- GET `/api/admin/analytics` - Detailed analytics
- GET `/api/admin/users` - List users
- GET `/api/admin/companies` - List companies
- PUT `/api/admin/users/{id}/activate` - Toggle user status
- PUT `/api/admin/companies/{id}/verify` - Verify company

## Test Credentials
- Builder: `builder@test.com` / `Test123!`
- Provider: `provider@test.com` / `Test123!`
- Admin: `admin@constructmarket.com` / `Admin123!`

## Database Collections
- users
- companies
- tasks
- bids
- contracts
- work_orders
- work_diary_entries
- payments
- invoices
- licences
- insurance
- ratings
- notifications

## Testing Status
- Backend: 100% pass rate (25/25 tests)
- Frontend: 100% pass rate (all UI tests passed)
- Test file: `/app/backend/tests/test_construct_market.py`

## Remaining Tasks (P1/P2)

### P1 - High Priority
- [ ] Stripe Connect onboarding for providers
- [ ] Provider payout after work completion
- [ ] Work diary implementation (photo uploads)
- [ ] Email notifications (via Resend)
- [ ] Licence/Insurance document upload

### P2 - Medium Priority
- [ ] Provider ratings & reviews
- [ ] Dispute management flow
- [ ] Task templates
- [ ] Advanced search filters
- [ ] PDF contract export

### P3 - Future Enhancements
- [ ] Real-time chat between builder/provider
- [ ] Mobile-responsive optimizations
- [ ] Bulk task creation
- [ ] Provider recommendation engine
- [ ] Financial reporting dashboard
