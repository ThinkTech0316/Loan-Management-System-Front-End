# Loan Management System - Backend API

REST API backend for the VanniLoan / RJ Finance loan management frontend application.

## Tech Stack

- **Runtime**: Node.js 20+
- **Database**: PostgreSQL (pg driver)
- **Password Hashing**: bcryptjs
- **Architecture**: Pure Node.js HTTP server (no Express routing)

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL running on localhost:5432

## Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
copy .env.example .env
# Edit .env and set your PostgreSQL password
```

### Environment Variables (.env)

```
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/loan
```

## Running the Server

```bash
# Development mode (auto-restart on file changes)
npm run dev

# Production mode
npm start

# Syntax check all files
npm run check

# Manual database migration
npm run db:init
```

On first run, the server will **automatically**:
1. Create the `loan` database if it doesn't exist
2. Create all tables (users, borrowers, loans, repayments, fixed_deposits, collection_data, settings, notifications, password_reset_requests)
3. Create indexes
4. Seed the admin user (password stored as bcrypt hash)

## Default Login

| Email | Password |
|-------|----------|
| `admin@vanniloan.com` | `password123` |

## API Endpoints

Base URL: `http://localhost:4000`

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/change-password` | Change password (requires current + new) |

### Borrowers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/borrowers` | List all active borrowers |
| GET | `/api/borrowers/deleted` | List soft-deleted borrowers |
| GET | `/api/borrowers/:id` | Get borrower by ID |
| POST | `/api/borrowers` | Create new borrower |
| PATCH | `/api/borrowers/:id` | Update borrower |
| PATCH | `/api/borrowers/:id/restore` | Restore soft-deleted borrower |
| DELETE | `/api/borrowers/:id` | Soft-delete borrower |
| DELETE | `/api/borrowers/:id/permanent` | Permanently delete borrower and related records |

### Loans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List all loans (filter by `?status=`) |
| GET | `/api/loans/:id` | Get loan by ID |
| GET | `/api/loans/:id/schedule` | Get repayment schedule for a loan |
| POST | `/api/loans` | Create new loan |
| PATCH | `/api/loans/:id` | Update loan |

### Repayments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repayments` | List repayments (filter by `?loanId=`) |
| GET | `/api/repayments/:id` | Get repayment by ID |
| POST | `/api/repayments` | Record new repayment |
| DELETE | `/api/repayments/:id` | Delete repayment (restores loan balance) |

### Fixed Deposits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fixed-deposits` | List all FDs (filter by `?status=`) |
| GET | `/api/fixed-deposits/:id` | Get FD by ID |
| GET | `/api/fixed-deposits/:id/earnings` | Get FD earnings schedule |
| POST | `/api/fixed-deposits` | Create new FD |
| PATCH | `/api/fixed-deposits/:id` | Update FD |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/collection-data` | Monthly collection data |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List all notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | List all settings |
| GET | `/api/settings/:key` | Get setting by key |
| PUT | `/api/settings/:key` | Upsert setting |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image (multipart/form-data) |
| GET | `/uploads/:filename` | Serve uploaded file |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | Admin users (bcrypt-hashed passwords) |
| `borrowers` | Borrower directory with soft-delete |
| `loans` | Loan records linked to borrowers |
| `repayments` | Repayment records linked to loans |
| `fixed_deposits` | Fixed deposit records |
| `collection_data` | Monthly expected vs actual collections |
| `settings` | Key-value settings store (JSONB) |
| `notifications` | In-app notifications |
| `password_reset_requests` | Password reset tokens |

## Project Structure

```
src/
├── app.js           # HTTP server and route definitions
├── bootstrap.js     # Auto-create database and run migrations on startup
├── config.js        # Environment and configuration loader
├── database.js      # PostgreSQL connection pool and query helpers
├── errors.js        # Custom error classes
├── http.js          # HTTP utilities (CORS, JSON parsing, response helpers)
├── migrate.js       # Standalone migration script
├── schema.js        # SQL schema (CREATE TABLE statements)
├── seed.js          # Database seeding (admin user with bcrypt)
├── server.js        # Entry point (runs bootstrap then starts server)
├── services.js      # Business logic for all API operations
├── store.js         # (reserved for future use)
└── validators.js    # Input validation for borrowers, loans, repayments, FDs
```

## Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```
