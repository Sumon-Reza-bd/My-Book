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
      const response = await fetch('/api/db/transactions?order=date');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch transactions');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  },
  async saveTransaction(transaction: Transaction) {
    try {
      const response = await fetch('/api/db/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save transaction');
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      throw err;
    }
  },
  async deleteTransaction(id: string) {
    try {
      const response = await fetch(`/api/db/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  },

  // DPS Accounts
  async getDPSAccounts() {
    try {
      const response = await fetch('/api/db/dps_accounts');
      if (!response.ok) throw new Error('Failed to fetch DPS accounts');
      return await response.json();
    } catch (err) {
      console.error('Error fetching DPS accounts:', err);
      throw err;
    }
  },
  async saveDPSAccount(account: DPSAccount) {
    try {
      const response = await fetch('/api/db/dps_accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      if (!response.ok) throw new Error('Failed to save DPS account');
    } catch (err) {
      console.error('Error saving DPS account:', err);
      throw err;
    }
  },
  async deleteDPSAccount(id: string) {
    try {
      const response = await fetch(`/api/db/dps_accounts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete DPS account');
    } catch (err) {
      console.error('Error deleting DPS account:', err);
      throw err;
    }
  },

  // DPS Deposits
  async getDPSDeposits() {
    try {
      const response = await fetch('/api/db/dps_deposits?order=date');
      if (!response.ok) throw new Error('Failed to fetch DPS deposits');
      return await response.json();
    } catch (err) {
      console.error('Error fetching DPS deposits:', err);
      throw err;
    }
  },
  async saveDPSDeposit(deposit: DPSDeposit) {
    try {
      const response = await fetch('/api/db/dps_deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deposit)
      });
      if (!response.ok) throw new Error('Failed to save DPS deposit');
    } catch (err) {
      console.error('Error saving DPS deposit:', err);
      throw err;
    }
  },
  async deleteDPSDeposit(id: string) {
    try {
      const response = await fetch(`/api/db/dps_deposits/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete DPS deposit');
    } catch (err) {
      console.error('Error deleting DPS deposit:', err);
      throw err;
    }
  },

  // Salary Configuration
  async getSalarySettings() {
    try {
      const response = await fetch('/api/db/salary_settings/single');
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error('Error fetching salary settings:', err);
      return null;
    }
  },
  async saveSalarySettings(settings: any) {
    try {
      const response = await fetch('/api/db/salary_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: settings.id || 'default_settings', ...settings })
      });
      if (!response.ok) throw new Error('Failed to save salary settings');
    } catch (err) {
      console.error('Error saving salary settings:', err);
      throw err;
    }
  },

  // Increment History
  async getIncrementHistory() {
    try {
      const response = await fetch('/api/db/increments?order=year');
      if (!response.ok) throw new Error('Failed to fetch increment history');
      return await response.json();
    } catch (err) {
      console.error('Error fetching increment history:', err);
      throw err;
    }
  },
  async saveIncrement(increment: IncrementHistory) {
    try {
      const response = await fetch('/api/db/increments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(increment)
      });
      if (!response.ok) throw new Error('Failed to save increment');
    } catch (err) {
      console.error('Error saving increment:', err);
      throw err;
    }
  },
  async deleteIncrement(id: string) {
    try {
      const response = await fetch(`/api/db/increments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete increment');
    } catch (err) {
      console.error('Error deleting increment:', err);
      throw err;
    }
  },

  // Leaves
  async getLeaves() {
    try {
      const response = await fetch('/api/db/leaves?order=appliedDate');
      if (!response.ok) throw new Error('Failed to fetch leaves');
      return await response.json();
    } catch (err) {
      console.error('Error fetching leaves:', err);
      throw err;
    }
  },
  async saveLeave(leave: LeaveApplication) {
    try {
      const response = await fetch('/api/db/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leave)
      });
      if (!response.ok) throw new Error('Failed to save leave');
    } catch (err) {
      console.error('Error saving leave:', err);
      throw err;
    }
  },
  async deleteLeave(id: string) {
    try {
      const response = await fetch(`/api/db/leaves/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete leave');
    } catch (err) {
      console.error('Error deleting leave:', err);
      throw err;
    }
  },

  // Bills
  async getBills() {
    try {
      const response = await fetch('/api/db/bills?order=date');
      if (!response.ok) throw new Error('Failed to fetch bills');
      return await response.json();
    } catch (err) {
      console.error('Error fetching bills:', err);
      throw err;
    }
  },
  async saveBill(bill: BillEntry) {
    try {
      const response = await fetch('/api/db/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill)
      });
      if (!response.ok) throw new Error('Failed to save bill');
    } catch (err) {
      console.error('Error saving bill:', err);
      throw err;
    }
  },
  async deleteBill(id: string) {
    try {
      const response = await fetch(`/api/db/bills/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete bill');
    } catch (err) {
      console.error('Error deleting bill:', err);
      throw err;
    }
  },

  // Reminders
  async getReminders() {
    try {
      const response = await fetch('/api/db/reminders?order=date&ascending=true');
      if (!response.ok) throw new Error('Failed to fetch reminders');
      return await response.json();
    } catch (err) {
      console.error('Error fetching reminders:', err);
      throw err;
    }
  },
  async saveReminder(reminder: Reminder) {
    try {
      const response = await fetch('/api/db/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder)
      });
      if (!response.ok) throw new Error('Failed to save reminder');
    } catch (err) {
      console.error('Error saving reminder:', err);
      throw err;
    }
  },
  async deleteReminder(id: string) {
    try {
      const response = await fetch(`/api/db/reminders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete reminder');
    } catch (err) {
      console.error('Error deleting reminder:', err);
      throw err;
    }
  }
};
