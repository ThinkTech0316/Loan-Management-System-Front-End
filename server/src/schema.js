export const masterSchemaSql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS master_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  db_name VARCHAR(255),
  db_user VARCHAR(255),
  db_password VARCHAR(255),
  phone VARCHAR(100),
  sms_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_master_user_status CHECK (status IN ('active', 'suspended')),
  CONSTRAINT chk_master_user_role CHECK (role IN ('superadmin', 'admin'))
);
`;

export const tenantSchemaSql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrowers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NOT NULL,
  nic VARCHAR(100) NOT NULL DEFAULT '',
  district VARCHAR(255) NOT NULL DEFAULT 'Yogapuram',
  address TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  avatar VARCHAR(500),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_borrower_status CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(255) PRIMARY KEY,
  borrower_id VARCHAR(255) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  interest_rate DECIMAL(8,2) NOT NULL,
  duration_months INT NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  repayment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  remaining_balance DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_loan_amount CHECK (amount > 0),
  CONSTRAINT chk_loan_rate CHECK (interest_rate >= 0),
  CONSTRAINT chk_loan_duration CHECK (duration_months > 0),
  CONSTRAINT chk_loan_balance CHECK (remaining_balance >= 0),
  CONSTRAINT chk_loan_status CHECK (status IN ('pending', 'active', 'completed', 'overdue')),
  CONSTRAINT chk_loan_freq CHECK (repayment_frequency IN ('weekly', 'monthly')),
  CONSTRAINT fk_loan_borrower FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS repayments (
  id VARCHAR(255) PRIMARY KEY,
  loan_id VARCHAR(255) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  method VARCHAR(30) NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_repay_amount CHECK (amount > 0),
  CONSTRAINT chk_repay_status CHECK (status IN ('paid', 'pending', 'failed')),
  CONSTRAINT chk_repay_method CHECK (method IN ('cash', 'bank_transfer', 'mobile_wallet')),
  CONSTRAINT fk_repay_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS fixed_deposits (
  id VARCHAR(255) PRIMARY KEY,
  borrower_id VARCHAR(255) NOT NULL,
  principal_amount DECIMAL(14,2) NOT NULL,
  interest_rate DECIMAL(8,2) NOT NULL,
  duration_months INT NOT NULL,
  start_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  maturity_amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_fd_principal CHECK (principal_amount > 0),
  CONSTRAINT chk_fd_rate CHECK (interest_rate >= 0),
  CONSTRAINT chk_fd_duration CHECK (duration_months > 0),
  CONSTRAINT chk_fd_maturity CHECK (maturity_amount >= 0),
  CONSTRAINT chk_fd_status CHECK (status IN ('active', 'matured', 'withdrawn')),
  CONSTRAINT fk_fd_borrower FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS collection_data (
  month VARCHAR(10) PRIMARY KEY,
  expected DECIMAL(14,2) NOT NULL DEFAULT 0,
  actual DECIMAL(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  "key" VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  is_unread BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_notify_type CHECK (type IN ('success', 'error', 'info', 'warning'))
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;;
