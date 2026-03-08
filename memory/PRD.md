# ConstructMarket - Product Requirements Document

## Overview
ConstructMarket is a production-ready, enterprise-grade B2B SaaS construction procurement marketplace connecting Builders, Trade Providers/Suppliers, and Platform Admins/Founders.

## Problem Statement
The construction industry lacks an efficient digital marketplace for:
- Builders to find and engage verified trade providers
- Providers to discover project opportunities and get paid securely
- Platform operators to manage customers and track business metrics

## Core User Roles

### 1. Builder
- Creates projects/tasks with detailed scope and budget
- Receives and evaluates bids from verified providers
- Selects providers, generates contracts, and signs electronically
- Releases payments via Stripe escrow

### 2. Provider (Trade/Supplier)
- Completes company profile with licences and insurance
- Browses public marketplace and task feed
- Submits competitive bids with pricing and timeline
- Signs contracts and executes work orders
- Receives payouts via Stripe Connect

### 3. Admin
- Manages platform users and companies
- Verifies licences and insurance documents
- Oversees disputes and compliance
- Views platform analytics

### 4. Founder (CRM Access)
- Full CRM dashboard for business metrics
- Customer lifecycle management
- Sales pipeline tracking
- Revenue analytics and reporting

## Technical Stack
- **Frontend**: React 18 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python 3.11+)
- **Database**: MongoDB
- **Authentication**: JWT + Google OAuth (via Emergent Auth)
- **Payments**: Stripe Connect (Test mode configured)
- **Deployment**: Docker/Kubernetes with Supervisor

## Implemented Features (March 2026)

### Public Features
- [x] Landing page with hero section, features, CTA
- [x] **Public Marketplace** - Browse all posted tasks without login
- [x] Marketplace task detail pages
- [x] Category filtering (Concrete, Electrical, Plumbing, etc.)
- [x] State/city location filtering
- [x] Budget range filtering
- [x] Search functionality

### Authentication & Authorization
- [x] JWT-based signup and login
- [x] Google OAuth integration via Emergent Auth
- [x] Role-based access control (builder/provider/admin/founder)
- [x] Session management with token refresh

### Builder Features
- [x] Dashboard with stats (Active Tasks, Open Bids, Contracts, Payments)
- [x] 5-step task creation wizard
- [x] Task management (draft, publish, manage, close)
- [x] Bid review, comparison, and selection
- [x] Contract creation with professional HTML templates
- [x] E-signature capability (both parties)
- [x] Payment initiation via Stripe Checkout
- [x] Invoice viewing and management

### Provider Features
- [x] Dashboard with opportunity stats
- [x] Task feed with advanced search and filters
- [x] Bid submission with pricing, timeline, materials
- [x] Contract review and e-signing
- [x] Work order management
- [x] **Payouts Dashboard** - Stripe Connect onboarding
- [x] Available/pending balance tracking
- [x] Payout request functionality
- [x] Ratings and reviews display
- [x] Settings (Profile, Company, Credentials)

### Admin Features
- [x] Platform overview dashboard
- [x] User management (list, activate/deactivate)
- [x] Company management (list, verify)
- [x] Licence verification workflow
- [x] Insurance verification workflow
- [x] Disputes management
- [x] Platform analytics (GMV, tasks by status/category)

### CRM Features (Enterprise)
- [x] **CRM Dashboard** - Business overview for founders
  - Total Revenue with growth indicators
  - Active Customers count
  - Active Projects tracking
  - GMV (Gross Merchandise Value)
  - Conversion rate metrics
  - Sales pipeline summary
  - Recent activity feed
- [x] **Customer Management**
  - Customer list with filtering
  - Role and status filters
  - Lifetime value calculation
  - Pagination
- [x] **Sales Pipeline**
  - Kanban-style pipeline view
  - Pipeline stages (Lead → Contacted → Proposal → Negotiation → Won/Lost)
  - Deal value tracking
  - Time period filters
- [x] **Revenue Analytics**
  - Revenue by period (week/month/quarter/year)
  - Revenue by category breakdown
  - Monthly trend visualization
  - Top customers by revenue
  - Transaction count and average
- [x] **Reports Generation**
  - Executive Summary reports
  - Financial reports
  - Customer reports
  - Operations reports

### Contract & Payment System
- [x] Automated contract HTML generation with professional styling
- [x] E-signature flow with timestamps
- [x] Work order auto-creation on contract execution
- [x] Payment milestone tracking
- [x] Stripe Checkout for secure payments
- [x] Stripe Connect for provider payouts

### Notification System
- [x] In-app real-time notifications
- [x] Notification types: bid_received, bid_selected, contract_ready, work_started
- [x] Mark as read functionality
- [x] Unread count badges

## API Endpoints

### Public
- GET `/api/marketplace/tasks` - List posted tasks (public)
- GET `/api/marketplace/tasks/{id}` - Get task details (public)

### Auth
- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - JWT login
- POST `/api/auth/google/session` - Google OAuth
- GET `/api/auth/me` - Current user info

### Tasks
- GET `/api/tasks/` - List tasks (authenticated)
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

### Provider
- GET `/api/provider/payouts` - Get payout history
- GET `/api/provider/stripe-status` - Check Stripe Connect status
- POST `/api/provider/stripe-onboard` - Start onboarding
- POST `/api/provider/request-payout` - Request payout

### CRM (Admin/Founder only)
- GET `/api/crm/dashboard` - Business metrics
- GET `/api/crm/customers` - Customer list
- GET `/api/crm/pipeline` - Sales pipeline
- GET `/api/crm/revenue` - Revenue analytics
- GET `/api/crm/reports` - List reports
- POST `/api/crm/reports/generate` - Generate report

### Admin
- GET `/api/admin/dashboard` - Platform stats
- GET `/api/admin/analytics` - Detailed analytics
- GET `/api/admin/users` - List users
- GET `/api/admin/companies` - List companies

## Test Credentials
- Builder: `builder@test.com` / `Test123!`
- Provider: `provider@test.com` / `Test123!`
- Admin: `admin@constructmarket.com` / `Admin123!`

## Database Collections
- users, companies, tasks, bids, contracts
- work_orders, work_diary_entries, payments, payouts
- invoices, licences, insurance, ratings, notifications

## Testing Status
- Backend: 100% pass rate (47+ tests across 2 iterations)
- Frontend: 100% pass rate (all UI flows verified)
- Mobile Responsive: Verified on 390x844 viewport
- Test files: `/app/backend/tests/`

## Production Deployment Checklist
- [x] Environment variables configured via .env files
- [x] MongoDB connection string secure
- [x] Stripe test keys configured
- [x] CORS origins properly set
- [x] JWT secret secure and non-default
- [x] Health check endpoint available
- [x] Supervisor configuration for process management
- [x] Hot reload disabled for production
- [ ] Switch Stripe to production keys
- [ ] Configure production MongoDB cluster
- [ ] Set up proper logging and monitoring
- [ ] Configure SSL/TLS certificates
- [ ] Set up backup strategy

## Remaining Enhancements (Future)
- [ ] Real-time chat between builder/provider
- [ ] Work diary with photo uploads
- [ ] Email notifications via Resend
- [ ] Push notifications
- [ ] Advanced analytics dashboards
- [ ] Bulk task creation
- [ ] Provider recommendation engine
- [ ] PDF contract export
- [ ] Two-factor authentication
