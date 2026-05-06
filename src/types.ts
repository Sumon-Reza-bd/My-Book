export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // ISO string
  description: string;
}

export interface DPSAccount {
  id: string;
  bankName: string;
  monthlyDeposit: number;
  periodYears: number;
  profitPercentage: number;
  startDate: string;
  targetTotal: number;
  maturityDate: string;
}

export interface DPSDeposit {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  description: string;
}

export type LeaveType = 'Casual Leave' | 'Medical Leave' | 'Annual Leave';
export type LeaveStatus = 'Pending' | 'Approved';

export type BillType = 'Electric' | 'Wifi';

export interface BillEntry {
  id: string;
  type: BillType;
  amount: number;
  month: string;
  year: string;
  date: string;
  appliedDate: string;
}

export interface LeaveApplication {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason: string;
  appliedDate: string;
}

export const CATEGORIES = [
  'Food',
  'Rent',
  'Salary',
  'Salary Info',
  'Leave Info',
  'Entertainment',
  'Shopping',
  'Transport',
  'Utilities',
  'Health',
  'Other'
];

export interface SalaryInfo {
  grossSalary: number;
  baseDeduction: number;
  basicSalary: number;
  houseRent: number;
  medical: number;
  conveyance: number;
  food: number;
  attendanceBonus: number;
  tiffinManagement: number;
  days: number;
  rate: number;
  yearlyBonus: number;
  eidUlFitrBonus: number;
  eidUlAdhaBonus: number;
}

export interface IncrementInfo {
  previousTotal: number;
  effectiveYear: string;
  baseDeduction: number;
  percentIncrease: number;
  amountPlus: number;
  grossTotal: number;
}

export interface IncrementHistory {
  id: string;
  year: string;
  percentIncrease: number;
  amountPlus: number;
  grossTotal: number;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];
