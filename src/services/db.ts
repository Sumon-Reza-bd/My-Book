import { supabase } from '../lib/supabase';
import { Transaction, DPSAccount, DPSDeposit, IncrementHistory, LeaveApplication, BillEntry, Reminder } from '../types';

export const dbService = {
  // Transactions
  async getTransactions() {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as Transaction[];
  },
  async saveTransaction(transaction: Transaction) {
    const { error } = await supabase.from('transactions').upsert(transaction);
    if (error) throw error;
  },
  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // DPS Accounts
  async getDPSAccounts() {
    const { data, error } = await supabase.from('dps_accounts').select('*');
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      bankName: item.bank_name,
      monthlyDeposit: item.monthly_deposit,
      periodYears: item.period_years,
      profitPercentage: item.profit_percentage,
      startDate: item.start_date,
      targetTotal: item.target_total,
      maturityDate: item.maturity_date
    })) as DPSAccount[];
  },
  async saveDPSAccount(account: DPSAccount) {
    const dbItem = {
      id: account.id,
      bank_name: account.bankName,
      monthly_deposit: account.monthlyDeposit,
      period_years: account.periodYears,
      profit_percentage: account.profitPercentage,
      start_date: account.startDate,
      target_total: account.targetTotal,
      maturity_date: account.maturityDate
    };
    const { error } = await supabase.from('dps_accounts').upsert(dbItem);
    if (error) throw error;
  },
  async deleteDPSAccount(id: string) {
    const { error } = await supabase.from('dps_accounts').delete().eq('id', id);
    if (error) throw error;
  },

  // DPS Deposits
  async getDPSDeposits() {
    const { data, error } = await supabase.from('dps_deposits').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      accountId: item.account_id,
      amount: item.amount,
      date: item.date,
      description: item.description
    })) as DPSDeposit[];
  },
  async saveDPSDeposit(deposit: DPSDeposit) {
    const dbItem = {
      id: deposit.id,
      account_id: deposit.accountId,
      amount: deposit.amount,
      date: deposit.date,
      description: deposit.description
    };
    const { error } = await supabase.from('dps_deposits').upsert(dbItem);
    if (error) throw error;
  },
  async deleteDPSDeposit(id: string) {
    const { error } = await supabase.from('dps_deposits').delete().eq('id', id);
    if (error) throw error;
  },

  // Salary Configuration (Settings)
  async getSalarySettings() {
    const { data, error } = await supabase.from('salary_settings').select('*').single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return {
      id: data.id,
      grossSalary: data.gross_salary,
      baseDeduction: data.base_deduction,
      medical: data.medical,
      conveyance: data.conveyance,
      food: data.food,
      attendanceBonus: data.attendance_bonus,
      days: data.days,
      rate: data.rate,
      casualLimit: data.casual_limit,
      medicalLimit: data.medical_limit,
      annualLimit: data.annual_limit
    };
  },
  async saveSalarySettings(settings: any) {
    const dbItem = {
      id: 'primary',
      gross_salary: settings.grossSalary,
      base_deduction: settings.baseDeduction,
      medical: settings.medical,
      conveyance: settings.conveyance,
      food: settings.food,
      attendance_bonus: settings.attendanceBonus,
      days: settings.days,
      rate: settings.rate,
      casual_limit: settings.casualLimit,
      medical_limit: settings.medicalLimit,
      annual_limit: settings.annualLimit
    };
    const { error } = await supabase.from('salary_settings').upsert(dbItem);
    if (error) throw error;
  },

  // Increment History
  async getIncrementHistory() {
    const { data, error } = await supabase.from('increment_history').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      year: item.year,
      percentIncrease: item.percent_increase,
      amountPlus: item.amount_plus,
      grossTotal: item.gross_total,
      date: item.date
    })) as IncrementHistory[];
  },
  async saveIncrement(increment: IncrementHistory) {
    const dbItem = {
      id: increment.id,
      year: increment.year,
      percent_increase: increment.percentIncrease,
      amount_plus: increment.amountPlus,
      gross_total: increment.grossTotal,
      date: increment.date
    };
    const { error } = await supabase.from('increment_history').upsert(dbItem);
    if (error) throw error;
  },
  async deleteIncrement(id: string) {
    const { error } = await supabase.from('increment_history').delete().eq('id', id);
    if (error) throw error;
  },

  // Leaves
  async getLeaves() {
    const { data, error } = await supabase.from('leaves').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      status: item.status,
      startDate: item.start_date,
      endDate: item.end_date,
      reason: item.reason,
      appliedDate: item.applied_date
    })) as LeaveApplication[];
  },
  async saveLeave(leave: LeaveApplication) {
    const dbItem = {
      id: leave.id,
      type: leave.type,
      status: leave.status,
      start_date: leave.startDate,
      end_date: leave.endDate,
      reason: leave.reason,
      applied_date: leave.appliedDate
    };
    const { error } = await supabase.from('leaves').upsert(dbItem);
    if (error) throw error;
  },
  async deleteLeave(id: string) {
    const { error } = await supabase.from('leaves').delete().eq('id', id);
    if (error) throw error;
  },

  // Bills
  async getBills() {
    const { data, error } = await supabase.from('bills').select('*').order('year', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      status: item.status || 'Pending',
      amount: item.amount,
      month: item.month,
      year: item.year,
      date: item.date,
      appliedDate: item.applied_date
    })) as BillEntry[];
  },
  async saveBill(bill: BillEntry) {
    const dbItem = {
      id: bill.id,
      type: bill.type,
      status: bill.status,
      amount: bill.amount,
      month: bill.month,
      year: bill.year,
      date: bill.date,
      applied_date: bill.appliedDate
    };
    const { error } = await supabase.from('bills').upsert(dbItem);
    if (error) throw error;
  },
  async deleteBill(id: string) {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) throw error;
  },

  // Reminders
  async getReminders() {
    const { data, error } = await supabase.from('reminders').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      date: item.date,
      isActive: item.is_active,
      createdAt: item.created_at
    })) as Reminder[];
  },
  async saveReminder(reminder: Reminder) {
    const dbItem = {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      date: reminder.date,
      is_active: reminder.isActive,
      created_at: reminder.createdAt
    };
    const { error } = await supabase.from('reminders').upsert(dbItem);
    if (error) throw error;
  },
  async deleteReminder(id: string) {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  }
};
