import { supabase } from '../lib/supabase';
import { Transaction, DPSAccount, DPSDeposit, IncrementHistory, LeaveApplication, BillEntry, Reminder } from '../types';

const TABLES = {
  TRANSACTIONS: 'transactions',
  DPS_ACCOUNTS: 'dps_accounts',
  DPS_DEPOSITS: 'dps_deposits',
  SALARY_SETTINGS: 'salary_settings',
  INCREMENTS: 'increments',
  LEAVES: 'leaves',
  BILLS: 'bills',
  REMINDERS: 'reminders'
};

export const dbService = {
  // Transactions
  async getTransactions() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching transactions:', error);
        return [];
      }
      return data as Transaction[];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  },
  async saveTransaction(transaction: Partial<Transaction>) {
    try {
      const { error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .upsert(transaction);
      
      if (error) {
        console.error('Supabase error saving transaction:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      throw err;
    }
  },
  async deleteTransaction(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting transaction:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  },

  // DPS Accounts
  async getDPSAccounts() {
    try {
      const { data, error } = await supabase
        .from(TABLES.DPS_ACCOUNTS)
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching DPS accounts:', error);
        return [];
      }
      return data as DPSAccount[];
    } catch (err) {
      console.error('Error fetching DPS accounts:', err);
      throw err;
    }
  },
  async saveDPSAccount(account: Partial<DPSAccount>) {
    try {
      const { error } = await supabase
        .from(TABLES.DPS_ACCOUNTS)
        .upsert(account);
      
      if (error) {
        console.error('Supabase error saving DPS account:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving DPS account:', err);
      throw err;
    }
  },
  async deleteDPSAccount(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.DPS_ACCOUNTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting DPS account:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting DPS account:', err);
      throw err;
    }
  },

  // DPS Deposits
  async getDPSDeposits() {
    try {
      const { data, error } = await supabase
        .from(TABLES.DPS_DEPOSITS)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching DPS deposits:', error);
        return [];
      }
      return data as DPSDeposit[];
    } catch (err) {
      console.error('Error fetching DPS deposits:', err);
      throw err;
    }
  },
  async saveDPSDeposit(deposit: Partial<DPSDeposit>) {
    try {
      const { error } = await supabase
        .from(TABLES.DPS_DEPOSITS)
        .upsert(deposit);
      
      if (error) {
        console.error('Supabase error saving DPS deposit:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving DPS deposit:', err);
      throw err;
    }
  },
  async deleteDPSDeposit(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.DPS_DEPOSITS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting DPS deposit:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting DPS deposit:', err);
      throw err;
    }
  },

  // Salary Configuration
  async getSalarySettings() {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALARY_SETTINGS)
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error fetching salary settings:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error fetching salary settings:', err);
      return null;
    }
  },
  async saveSalarySettings(settings: any) {
    try {
      const { error } = await supabase
        .from(TABLES.SALARY_SETTINGS)
        .upsert({ id: settings.id || 'default_settings', ...settings });
      
      if (error) {
        console.error('Supabase error saving salary settings:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving salary settings:', err);
      throw err;
    }
  },

  // Increment History
  async getIncrementHistory() {
    try {
      const { data, error } = await supabase
        .from(TABLES.INCREMENTS)
        .select('*')
        .order('year', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching increment history:', error);
        return [];
      }
      return data as IncrementHistory[];
    } catch (err) {
      console.error('Error fetching increment history:', err);
      throw err;
    }
  },
  async saveIncrement(increment: Partial<IncrementHistory>) {
    try {
      const { error } = await supabase
        .from(TABLES.INCREMENTS)
        .upsert(increment);
      
      if (error) {
        console.error('Supabase error saving increment:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving increment:', err);
      throw err;
    }
  },
  async deleteIncrement(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.INCREMENTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting increment:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting increment:', err);
      throw err;
    }
  },

  // Leaves
  async getLeaves() {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEAVES)
        .select('*')
        .order('appliedDate', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching leaves:', error);
        return [];
      }
      return data as LeaveApplication[];
    } catch (err) {
      console.error('Error fetching leaves:', err);
      throw err;
    }
  },
  async saveLeave(leave: Partial<LeaveApplication>) {
    try {
      const { error } = await supabase
        .from(TABLES.LEAVES)
        .upsert(leave);
      
      if (error) {
        console.error('Supabase error saving leave:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving leave:', err);
      throw err;
    }
  },
  async deleteLeave(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.LEAVES)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting leave:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting leave:', err);
      throw err;
    }
  },

  // Bills
  async getBills() {
    try {
      const { data, error } = await supabase
        .from(TABLES.BILLS)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching bills:', error);
        return [];
      }
      return data as BillEntry[];
    } catch (err) {
      console.error('Error fetching bills:', err);
      throw err;
    }
  },
  async saveBill(bill: Partial<BillEntry>) {
    try {
      const { error } = await supabase
        .from(TABLES.BILLS)
        .upsert(bill);
      
      if (error) {
        console.error('Supabase error saving bill:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving bill:', err);
      throw err;
    }
  },
  async deleteBill(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.BILLS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting bill:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting bill:', err);
      throw err;
    }
  },

  // Reminders
  async getReminders() {
    try {
      const { data, error } = await supabase
        .from(TABLES.REMINDERS)
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Supabase error fetching reminders:', error);
        return [];
      }
      return data as Reminder[];
    } catch (err) {
      console.error('Error fetching reminders:', err);
      throw err;
    }
  },
  async saveReminder(reminder: Partial<Reminder>) {
    try {
      const { error } = await supabase
        .from(TABLES.REMINDERS)
        .upsert(reminder);
      
      if (error) {
        console.error('Supabase error saving reminder:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      throw err;
    }
  },
  async deleteReminder(id: string) {
    try {
      const { error } = await supabase
        .from(TABLES.REMINDERS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting reminder:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      throw err;
    }
  }
};
