-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT,
  category TEXT,
  amount NUMERIC,
  date TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- 2. DPS Accounts Table
CREATE TABLE IF NOT EXISTS dps_accounts (
  id TEXT PRIMARY KEY,
  bank_name TEXT,
  monthly_deposit NUMERIC,
  period_years NUMERIC,
  profit_percentage NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  target_total NUMERIC,
  maturity_date TIMESTAMP WITH TIME ZONE
);

-- 3. DPS Deposits Table
CREATE TABLE IF NOT EXISTS dps_deposits (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES dps_accounts(id) ON DELETE CASCADE,
  amount NUMERIC,
  date TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- 4. Salary Settings Table
CREATE TABLE IF NOT EXISTS salary_settings (
  id TEXT PRIMARY KEY,
  gross_salary TEXT,
  base_deduction TEXT,
  medical TEXT,
  conveyance TEXT,
  food TEXT,
  attendance_bonus TEXT,
  days TEXT,
  rate TEXT,
  casual_limit TEXT,
  medical_limit TEXT,
  annual_limit TEXT
);

-- 5. Increment History Table
CREATE TABLE IF NOT EXISTS increment_history (
  id TEXT PRIMARY KEY,
  year TEXT,
  percent_increase NUMERIC,
  amount_plus NUMERIC,
  gross_total NUMERIC,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  applied_date TIMESTAMP WITH TIME ZONE
);

-- 7. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  type TEXT,
  amount NUMERIC,
  month TEXT,
  year TEXT,
  date TIMESTAMP WITH TIME ZONE,
  applied_date TIMESTAMP WITH TIME ZONE
);

-- 8. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
);

-- Disable RLS (Row Level Security) for development
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE dps_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE dps_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE increment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
