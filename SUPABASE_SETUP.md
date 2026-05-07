# Supabase Setup Guide

Please follow these steps to set up your Supabase database for the "My Book" app.

### 1. Run SQL Schema
Copy and paste the following SQL into the [Supabase SQL Editor](https://app.supabase.com/project/dyqidlgymyugprrqxvto/sql) and click **Run**:

```sql
-- Clean restart (Optional: Run this if you need to recreate tables)
-- drop table if exists transactions;
-- drop table if exists dps_deposits;
-- drop table if exists dps_accounts;
-- drop table if exists salary_settings;
-- drop table if exists increments;
-- drop table if exists leaves;
-- drop table if exists bills;
-- drop table if exists reminders;

-- Create transactions table
create table transactions (
  id text primary key,
  type text not null check (type in ('expense', 'income')),
  category text not null,
  amount numeric not null,
  date date not null,
  description text,
  user_id uuid default auth.uid()
);

-- Create dps_accounts table
create table dps_accounts (
  id text primary key,
  "bankName" text not null,
  "monthlyDeposit" numeric not null,
  "periodYears" integer not null,
  "profitPercentage" numeric not null,
  "startDate" date not null,
  "targetTotal" numeric not null,
  "maturityDate" date not null,
  user_id uuid default auth.uid()
);

-- Create dps_deposits table
create table dps_deposits (
  id text primary key,
  "accountId" text references dps_accounts(id) on delete cascade,
  amount numeric not null,
  date date not null,
  description text,
  user_id uuid default auth.uid()
);

-- Create salary_settings table
create table salary_settings (
  id text primary key, -- we use a fixed ID like 'default_settings'
  "grossSalary" text,
  "baseDeduction" text,
  medical text,
  conveyance text,
  food text,
  "attendanceBonus" text,
  days text,
  rate text,
  "casualLimit" text,
  "medicalLimit" text,
  "annualLimit" text,
  user_id uuid default auth.uid()
);

-- Create increments table
create table increments (
  id text primary key,
  year text not null,
  "percentIncrease" numeric not null,
  "amountPlus" numeric not null,
  "grossTotal" numeric not null,
  user_id uuid default auth.uid()
);

-- Create leaves table
create table leaves (
  id text primary key,
  type text not null,
  status text not null,
  "startDate" date not null,
  "endDate" date not null,
  reason text,
  "appliedDate" date default now(),
  user_id uuid default auth.uid()
);

-- Create bills table
create table bills (
  id text primary key,
  type text not null,
  status text not null,
  amount numeric not null,
  month text not null,
  year text not null,
  date date not null,
  "appliedDate" date default now(),
  user_id uuid default auth.uid()
);

-- Create reminders table
create table reminders (
  id text primary key,
  title text not null,
  description text,
  date date not null,
  "isActive" boolean default true,
  "createdAt" timestamp with time zone default now(),
  user_id uuid default auth.uid()
);

-- Enable Row Level Security (RLS)
-- (Optional: For personal use without multiple users, you can skip this or allow public access)
alter table transactions enable row level security;
alter table dps_accounts enable row level security;
alter table dps_deposits enable row level security;
alter table salary_settings enable row level security;
alter table increments enable row level security;
alter table leaves enable row level security;
alter table bills enable row level security;
alter table reminders enable row level security;

-- Create policies (Allow anon access for now as requested)
create policy "Allow all access" on transactions for all using (true) with check (true);
create policy "Allow all access" on dps_accounts for all using (true) with check (true);
create policy "Allow all access" on dps_deposits for all using (true) with check (true);
create policy "Allow all access" on salary_settings for all using (true) with check (true);
create policy "Allow all access" on increments for all using (true) with check (true);
create policy "Allow all access" on leaves for all using (true) with check (true);
create policy "Allow all access" on bills for all using (true) with check (true);
create policy "Allow all access" on reminders for all using (true) with check (true);
```

### 2. Note on RLS
The policies above allow any public user with your API key to read and write data. This is suitable for development. For a production app, you should set up Supabase Auth and restrict policies to `auth.uid()`.
