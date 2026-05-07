/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ChevronDown, 
  PieChart, 
  History,
  Calendar,
  Wallet,
  CheckCircle2,
  X,
  Utensils,
  Home,
  Banknote,
  Film,
  ShoppingBag,
  Car,
  Zap,
  Wifi,
  HeartPulse,
  MoreHorizontal,
  CreditCard,
  Edit3,
  Gift,
  Coins,
  PiggyBank,
  Briefcase,
  ReceiptText,
  Sun,
  Moon,
  BellRing,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionType, CATEGORIES, MONTHS, YEARS, DPSAccount, DPSDeposit, IncrementHistory, LeaveApplication, LeaveType, LeaveStatus, BillEntry, BillType, Reminder } from './types';
import { dbService } from './services/db';
import { supabase } from './lib/supabase';

export default function App() {
  // View State
  const [currentView, setCurrentView] = useState<'financial' | 'dps' | 'salary' | 'leave' | 'bills' | 'reminders'>('financial');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) return JSON.parse(saved);
    
    // Initial sample data to match screenshot
    return [
      {
        id: '1',
        type: 'expense',
        category: 'Rent',
        amount: 3500,
        date: '2026-04-12',
        description: 'Rent'
      },
      {
        id: '2',
        type: 'expense',
        category: 'Food',
        amount: 2500,
        date: '2026-04-11',
        description: 'Food'
      }
    ];
  });

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDpsAccountId, setEditingDpsAccountId] = useState<string | null>(null);
  const [editingDpsDepositId, setEditingDpsDepositId] = useState<string | null>(null);
  const [editingIncrementId, setEditingIncrementId] = useState<string | null>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [showLeaveSummary, setShowLeaveSummary] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'financial' | 'dps-deposit' | 'dps-account' | 'salary-increment' | 'leave-application' | 'bill-entry' | 'reminder' } | null>(null);
  const [viewingScheduleId, setViewingScheduleId] = useState<string | null>(null);
  const [dpsHistoryFilter, setDpsHistoryFilter] = useState<string>('all');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Supabase Data Loading
  useEffect(() => {
    const loadAllData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [
          remoteTransactions,
          remoteDPSAccounts,
          remoteDPSDeposits,
          remoteIncrementHistory,
          remoteLeaves,
          remoteBills,
          remoteReminders,
          remoteSalarySettings
        ] = await Promise.all([
          dbService.getTransactions(),
          dbService.getDPSAccounts(),
          dbService.getDPSDeposits(),
          dbService.getIncrementHistory(),
          dbService.getLeaves(),
          dbService.getBills(),
          dbService.getReminders(),
          dbService.getSalarySettings()
        ]);

        if (remoteTransactions.length > 0) setTransactions(remoteTransactions);
        if (remoteDPSAccounts.length > 0) setDpsAccounts(remoteDPSAccounts);
        if (remoteDPSDeposits.length > 0) setDpsDeposits(remoteDPSDeposits);
        if (remoteIncrementHistory.length > 0) setIncrementHistory(remoteIncrementHistory);
        if (remoteLeaves.length > 0) setLeaves(remoteLeaves);
        if (remoteBills.length > 0) setBills(remoteBills);
        if (remoteReminders.length > 0) setReminders(remoteReminders);
        
        if (remoteSalarySettings) {
          setGrossSalary(remoteSalarySettings.grossSalary || '');
          setBaseDeduction(remoteSalarySettings.baseDeduction || '');
          setMedical(remoteSalarySettings.medical || '');
          setConveyance(remoteSalarySettings.conveyance || '');
          setFood(remoteSalarySettings.food || '');
          setAttendanceBonus(remoteSalarySettings.attendanceBonus || '');
          setDays(remoteSalarySettings.days || '');
          setRate(remoteSalarySettings.rate || '');
          setCasualLimit(remoteSalarySettings.casualLimit || '15');
          setMedicalLimit(remoteSalarySettings.medicalLimit || '15');
          setAnnualLimit(remoteSalarySettings.annualLimit || '20');
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        showNotification('Failed to load data from cloud. Using local data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Welcome Effect
  useEffect(() => {
    // Show welcome popup with a slight delay
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // DPS State
  const [dpsAccounts, setDpsAccounts] = useState<DPSAccount[]>(() => {
    const saved = localStorage.getItem('dpsAccounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [dpsDeposits, setDpsDeposits] = useState<DPSDeposit[]>(() => {
    const saved = localStorage.getItem('dpsDeposits');
    return saved ? JSON.parse(saved) : [];
  });

  // DPS Form State
  const [dpsBankName, setDpsBankName] = useState('');
  const [dpsMonthlyDeposit, setDpsMonthlyDeposit] = useState('');
  const [dpsPeriodYears, setDpsPeriodYears] = useState('');
  const [dpsProfitPercentage, setDpsProfitPercentage] = useState('');
  const [dpsStartDate, setDpsStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dpsFormType, setDpsFormType] = useState<'account' | 'deposit'>('account');

  // DPS Deposit Form State
  const [selectedDpsAccountId, setSelectedDpsAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNote, setDepositNote] = useState('');
  const [salaryFormType, setSalaryFormType] = useState<'payslip' | 'increment'>('payslip');

  // Salary Info State
  const [grossSalary, setGrossSalary] = useState(() => localStorage.getItem('grossSalary') || '');
  const [baseDeduction, setBaseDeduction] = useState(() => localStorage.getItem('baseDeduction') || '');
  const [medical, setMedical] = useState(() => localStorage.getItem('medical') || '');
  const [conveyance, setConveyance] = useState(() => localStorage.getItem('conveyance') || '');
  const [food, setFood] = useState(() => localStorage.getItem('food') || '');
  const [attendanceBonus, setAttendanceBonus] = useState(() => localStorage.getItem('attendanceBonus') || '');
  const [days, setDays] = useState(() => localStorage.getItem('days') || '');
  const [rate, setRate] = useState(() => localStorage.getItem('rate') || '');

  // Increment State
  const [effectiveYear, setEffectiveYear] = useState(new Date().getFullYear().toString());
  const [percentIncrease, setPercentIncrease] = useState('');
  const [incrementHistory, setIncrementHistory] = useState<IncrementHistory[]>(() => {
    const saved = localStorage.getItem('incrementHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Leave Info State
  const [leaves, setLeaves] = useState<LeaveApplication[]>(() => {
    const saved = localStorage.getItem('leaves');
    return saved ? JSON.parse(saved) : [];
  });

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [leaveStatus, setLeaveStatus] = useState<LeaveStatus>('Pending');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFormType, setLeaveFormType] = useState<'leave' | 'limit'>('leave');
  const [leaveFilterYear, setLeaveFilterYear] = useState(new Date().getFullYear().toString());

  // Leave limits
  const [casualLimit, setCasualLimit] = useState(() => localStorage.getItem('casualLimit') || '15');
  const [medicalLimit, setMedicalLimit] = useState(() => localStorage.getItem('medicalLimit') || '15');
  const [annualLimit, setAnnualLimit] = useState(() => localStorage.getItem('annualLimit') || '20');

  // Bill Info State
  const [bills, setBills] = useState<BillEntry[]>(() => {
    const saved = localStorage.getItem('bills');
    return saved ? JSON.parse(saved) : [];
  });
  const [billType, setBillType] = useState<BillType>('Electric');
  const [billAmount, setBillAmount] = useState('');
  const [billMonth, setBillMonth] = useState(MONTHS[new Date().getMonth()]);
  const [billYear, setBillYear] = useState(new Date().getFullYear().toString());
  const [billFormType, setBillFormType] = useState<'Electric' | 'Wifi'>('Electric');
  const [billFilterYear, setBillFilterYear] = useState(new Date().getFullYear().toString());
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Reminder State
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const getTimeRemaining = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const now = new Date();
    targetDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1) return `${diffDays} days left`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return "";
  };

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills));
  }, [bills]);

  const availableLeaveYears = useMemo(() => {
    const years = new Set<string>();
    leaves.forEach(l => {
      years.add(new Date(l.startDate).getFullYear().toString());
    });
    // Fallback to current year if no entries
    if (years.size === 0) years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [leaves]);

  const leaveSummaryData = useMemo(() => {
    const summary: Record<string, Record<LeaveType, number>> = {};
    
    leaves.filter(l => l.status === 'Approved').forEach(l => {
      const year = new Date(l.startDate).getFullYear().toString();
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (!summary[year]) {
        summary[year] = { 'Casual Leave': 0, 'Medical Leave': 0, 'Annual Leave': 0 };
      }
      summary[year][l.type] += diffDays;
    });
    
    return Object.entries(summary).sort((a, b) => b[0].localeCompare(a[0]));
  }, [leaves]);

  const billStats = useMemo(() => {
    const year = Number(billFilterYear);
    const filteredBills = bills.filter(b => b.year === year.toString());
    
    const stats: Record<BillType, { total: number; count: number; avg: number }> = {
      'Electric': { total: 0, count: 0, avg: 0 },
      'Wifi': { total: 0, count: 0, avg: 0 }
    };

    filteredBills.forEach(b => {
      if (stats[b.type]) {
        stats[b.type].total += b.amount;
        stats[b.type].count += 1;
      }
    });

    Object.keys(stats).forEach(key => {
      const type = key as BillType;
      if (stats[type].count > 0) {
        stats[type].avg = Math.round(stats[type].total / stats[type].count);
      }
    });

    return stats;
  }, [bills, billFilterYear]);

  const availableBillYears = useMemo(() => {
    const years = new Set<string>();
    bills.forEach(b => {
      years.add(b.year);
    });
    // Fallback to current year if no entries
    if (years.size === 0) years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('incrementHistory', JSON.stringify(incrementHistory));
  }, [incrementHistory]);

  const salaryCalculations = useMemo(() => {
    const gross = Number(grossSalary) || 0;
    const deduction = Number(baseDeduction) || 0;
    const med = Number(medical) || 0;
    const conv = Number(conveyance) || 0;
    const f = Number(food) || 0;
    const att = Number(attendanceBonus) || 0;
    const d = Number(days) || 0;
    const r = Number(rate) || 0;
    const tiffin = d * r;
    
    const basic = (gross - deduction) / 1.5;
    const houseRent = basic / 2;
    const yearlyBonus = gross / 1.5;
    const eidBonus = (gross - deduction) / 1.5;

    const totalEarnings = Math.round(basic) + Math.round(houseRent) + med + conv + f + att + tiffin;

    return {
      basicSalary: Math.round(basic),
      houseRent: Math.round(houseRent),
      yearlyBonus: Math.round(yearlyBonus),
      eidUlFitrBonus: Math.round(eidBonus),
      eidUlAdhaBonus: Math.round(eidBonus),
      totalEarnings,
      tiffinAmount: tiffin
    };
  }, [grossSalary, baseDeduction, medical, conveyance, food, attendanceBonus, days, rate]);

  const incrementCalculations = useMemo(() => {
    const previousTotal = Number(grossSalary) || 0; 
    const deduction = Number(baseDeduction) || 0;
    const increase = Number(percentIncrease) || 0;
    const amountPlus = (previousTotal * increase) / 100;
    const grossTotal = previousTotal + amountPlus;

    return {
      previousTotal,
      baseDeduction: deduction,
      amountPlus: Math.round(amountPlus),
      grossTotal: Math.round(grossTotal)
    };
  }, [grossSalary, baseDeduction, percentIncrease]);

  const leaveStats = useMemo(() => {
    const year = Number(leaveFilterYear);
    const yearLeaves = leaves.filter(l => new Date(l.startDate).getFullYear() === year);

    const stats = {
      'Casual Leave': { used: 0, limit: Number(casualLimit) || 0 },
      'Medical Leave': { used: 0, limit: Number(medicalLimit) || 0 },
      'Annual Leave': { used: 0, limit: Number(annualLimit) || 0 },
    };

    yearLeaves.filter(l => l.status === 'Approved').forEach(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (stats[l.type as keyof typeof stats]) {
        stats[l.type as keyof typeof stats].used += diffDays;
      }
    });

    return stats;
  }, [leaves, leaveFilterYear, casualLimit, medicalLimit, annualLimit]);

  const filteredLeavesByYear = useMemo(() => {
    return leaves.filter(l => new Date(l.startDate).getFullYear() === Number(leaveFilterYear))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leaves, leaveFilterYear]);

  const handleSavePaySlip = async () => {
    const settings = {
      grossSalary,
      baseDeduction,
      medical,
      conveyance,
      food,
      attendanceBonus,
      days,
      rate,
      casualLimit,
      medicalLimit,
      annualLimit
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveSalarySettings(settings);
      }
      
      localStorage.setItem('grossSalary', grossSalary);
      localStorage.setItem('baseDeduction', baseDeduction);
      localStorage.setItem('medical', medical);
      localStorage.setItem('conveyance', conveyance);
      localStorage.setItem('food', food);
      localStorage.setItem('attendanceBonus', attendanceBonus);
      localStorage.setItem('days', days);
      localStorage.setItem('rate', rate);
      showNotification('Pay Slip saved');
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveIncrement = async () => {
    if (!percentIncrease) {
      showNotification('Please enter percentage increase', 'error');
      return;
    }

    const newIncrement: IncrementHistory = {
      id: editingIncrementId || crypto.randomUUID(),
      year: effectiveYear,
      percentIncrease: Number(percentIncrease),
      amountPlus: incrementCalculations.amountPlus,
      grossTotal: incrementCalculations.grossTotal
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveIncrement(newIncrement);

        if (!editingIncrementId) {
          // Also update salary settings if it's a new increment
          const settings = {
            grossSalary: incrementCalculations.grossTotal.toString(),
            baseDeduction,
            medical,
            conveyance,
            food,
            attendanceBonus,
            days,
            rate,
            casualLimit,
            medicalLimit,
            annualLimit
          };
          await dbService.saveSalarySettings(settings);
        }
      }

      if (editingIncrementId) {
        setIncrementHistory(prev => prev.map(inc => inc.id === editingIncrementId ? newIncrement : inc));
        setEditingIncrementId(null);
        showNotification('Increment updated successfully');
      } else {
        setIncrementHistory([newIncrement, ...incrementHistory]);
        setGrossSalary(incrementCalculations.grossTotal.toString());
        showNotification('Increment saved successfully');
      }
      
      setPercentIncrease('');
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditIncrement = (inc: IncrementHistory) => {
    setEditingIncrementId(inc.id);
    setEffectiveYear(inc.year);
    setPercentIncrease(inc.percentIncrease.toString());
    setSalaryFormType('increment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteIncrement = (id: string) => {
    confirmDelete(id, 'salary-increment');
  };

  // Notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food': return <Utensils size={14} />;
      case 'Rent': return <Home size={14} />;
      case 'Salary': return <Banknote size={14} />;
      case 'Entertainment': return <Film size={14} />;
      case 'Shopping': return <ShoppingBag size={14} />;
      case 'Transport': return <Car size={14} />;
      case 'Utilities': return <Zap size={14} />;
      case 'Health': return <HeartPulse size={14} />;
      case 'Salary Info': return <Banknote size={14} />;
      case 'Leave Info': return <Calendar size={14} />;
      default: return <MoreHorizontal size={14} />;
    }
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('dpsAccounts', JSON.stringify(dpsAccounts));
  }, [dpsAccounts]);

  useEffect(() => {
    localStorage.setItem('dpsDeposits', JSON.stringify(dpsDeposits));
  }, [dpsDeposits]);

  // Calculations
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const tMonth = MONTHS[tDate.getMonth()];
      const tYear = tDate.getFullYear().toString();
      return tMonth === filterMonth && tYear === filterYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterMonth, filterYear]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const balance = totals.income - totals.expense;

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    // Always include current year
    years.add(new Date().getFullYear().toString());
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const breakdown = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const calculateDpsMaturity = (monthly: number, years: number, rate: number) => {
    const totalMonths = years * 12;
    const monthlyRate = rate / 12 / 100;
    let balance = 0;
    let totalPrincipal = 0;
    const schedule = [];
    
    for (let i = 1; i <= totalMonths; i++) {
      const deposit = monthly;
      // Profit is calculated on the balance BEFORE adding the current month's deposit
      // because the new deposit hasn't stayed for a full month yet.
      // However, the user says "1st month deposit profit shows in next month".
      // So for month 1: profit is 0.
      // For month 2: profit is on month 1's deposit.
      
      const monthlyProfit = i === 1 ? 0 : (balance * monthlyRate);
      balance += deposit + monthlyProfit;
      totalPrincipal += deposit;
      
      schedule.push({
        month: i,
        deposit,
        totalPrincipal,
        monthlyProfit: Math.round(monthlyProfit),
        balance: Math.round(balance)
      });
    }
    
    return {
      totalPrincipal,
      maturityAmount: Math.round(balance),
      totalProfit: Math.round(balance - totalPrincipal),
      schedule
    };
  };

  // Handlers
  const handleAddTransaction = async () => {
    if (!amount || isNaN(Number(amount))) return;

    const newTransaction: Transaction = {
      id: editingId || crypto.randomUUID(),
      type,
      category,
      amount: Number(amount),
      date,
      description
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveTransaction(newTransaction);
      }
      
      if (editingId) {
        setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t));
        setEditingId(null);
        showNotification('Transaction updated successfully!');
      } else {
        setTransactions(prev => [newTransaction, ...prev]);
        showNotification('Transaction added successfully!');
      }
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message || 'Check database tables'}`, 'error');
    } finally {
      setIsSyncing(false);
    }

    // Reset form
    setAmount('');
    setDescription('');
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setCategory(t.category);
    setAmount(t.amount.toString());
    setDate(t.date);
    setDescription(t.description);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id: string, type: 'financial' | 'dps-deposit' | 'dps-account' | 'salary-increment' | 'leave-application' | 'bill-entry' | 'reminder') => {
    setDeleteConfirm({ id, type });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (supabase) {
        setIsSyncing(true);
        if (deleteConfirm.type === 'financial') {
          await dbService.deleteTransaction(deleteConfirm.id);
        } else if (deleteConfirm.type === 'dps-deposit') {
          await dbService.deleteDPSDeposit(deleteConfirm.id);
        } else if (deleteConfirm.type === 'dps-account') {
          await dbService.deleteDPSAccount(deleteConfirm.id);
        } else if (deleteConfirm.type === 'salary-increment') {
          await dbService.deleteIncrement(deleteConfirm.id);
        } else if (deleteConfirm.type === 'leave-application') {
          await dbService.deleteLeave(deleteConfirm.id);
        } else if (deleteConfirm.type === 'bill-entry') {
          await dbService.deleteBill(deleteConfirm.id);
        } else if (deleteConfirm.type === 'reminder') {
          await dbService.deleteReminder(deleteConfirm.id);
        }
      }

      if (deleteConfirm.type === 'financial') {
        setTransactions(prev => prev.filter(t => t.id !== deleteConfirm.id));
        showNotification('Transaction deleted successfully!', 'error');
      } else if (deleteConfirm.type === 'dps-deposit') {
        setDpsDeposits(prev => prev.filter(d => d.id !== deleteConfirm.id));
        showNotification('DPS Deposit deleted successfully!', 'error');
      } else if (deleteConfirm.type === 'dps-account') {
        setDpsAccounts(prev => prev.filter(a => a.id !== deleteConfirm.id));
        setDpsDeposits(prev => prev.filter(d => d.accountId !== deleteConfirm.id));
        showNotification('DPS Account and associated deposits deleted!', 'error');
      } else if (deleteConfirm.type === 'salary-increment') {
        setIncrementHistory(prev => prev.filter(inc => inc.id !== deleteConfirm.id));
        showNotification('Increment deleted successfully!', 'error');
      } else if (deleteConfirm.type === 'leave-application') {
        setLeaves(prev => prev.filter(l => l.id !== deleteConfirm.id));
        showNotification('Leave application deleted!', 'error');
      } else if (deleteConfirm.type === 'bill-entry') {
        setBills(prev => prev.filter(b => b.id !== deleteConfirm.id));
        showNotification('Bill record deleted!', 'error');
      } else if (deleteConfirm.type === 'reminder') {
        setReminders(prev => prev.filter(r => r.id !== deleteConfirm.id));
        showNotification('Reminder deleted successfully!', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showNotification(`Delete failed: ${error.message || 'Check database'}`, 'error');
    } finally {
      setIsSyncing(false);
      setDeleteConfirm(null);
    }
  };

  // Leave Handlers
  const handleApplyLeave = async () => {
    if (!leaveReason) {
      showNotification('Please provide a reason', 'error');
      return;
    }

    const newLeave: LeaveApplication = {
      id: editingLeaveId || crypto.randomUUID(),
      type: leaveType,
      status: leaveStatus,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      appliedDate: new Date().toISOString()
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveLeave(newLeave);
      }

      if (editingLeaveId) {
        setLeaves(prev => prev.map(l => l.id === editingLeaveId ? newLeave : l));
        setEditingLeaveId(null);
        showNotification('Leave application updated successfully');
      } else {
        setLeaves(prev => [newLeave, ...prev]);
        showNotification('Leave application submitted successfully');
      }
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
      setLeaveReason('');
    }
  };

  // Reminder Handlers
  const handleAddReminder = async () => {
    if (!reminderTitle) {
      showNotification('Please enter a title', 'error');
      return;
    }

    const newReminder: Reminder = {
      id: editingReminderId || crypto.randomUUID(),
      title: reminderTitle,
      description: reminderDescription,
      date: reminderDate,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveReminder(newReminder);
      }

      if (editingReminderId) {
        setReminders(prev => prev.map(r => r.id === editingReminderId ? { ...newReminder, isActive: r.isActive } : r));
        setEditingReminderId(null);
        showNotification('Reminder updated successfully');
      } else {
        setReminders(prev => [newReminder, ...prev]);
        showNotification('Reminder added successfully');
      }
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
      setReminderTitle('');
      setReminderDescription('');
    }
  };

  const toggleReminderStatus = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const updatedReminder = { ...reminder, isActive: !reminder.isActive };
    
    try {
      setIsSyncing(true);
      await dbService.saveReminder(updatedReminder);
      setReminders(prev => prev.map(r => r.id === id ? updatedReminder : r));
      showNotification('Reminder status updated');
    } catch (error) {
      console.error(error);
      showNotification('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);
    setReminderTitle(reminder.title);
    setReminderDescription(reminder.description);
    setReminderDate(reminder.date);
    setCurrentView('reminders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLeaveLimits = async () => {
    const settings = {
      grossSalary,
      baseDeduction,
      medical,
      conveyance,
      food,
      attendanceBonus,
      days,
      rate,
      casualLimit,
      medicalLimit,
      annualLimit
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveSalarySettings(settings);
      }
      
      localStorage.setItem('casualLimit', casualLimit);
      localStorage.setItem('medicalLimit', medicalLimit);
      localStorage.setItem('annualLimit', annualLimit);
      showNotification('Leave limits saved');
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Bill Handlers
  const handleApplyBill = async () => {
    if (!billAmount) {
      showNotification('Please enter the bill amount', 'error');
      return;
    }

    const newBill: BillEntry = {
      id: editingBillId || Math.random().toString(36).substring(2, 9),
      type: billFormType,
      amount: Number(billAmount),
      month: billMonth,
      year: billYear,
      date: new Date().toISOString().split('T')[0],
      appliedDate: new Date().toISOString()
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveBill(newBill);
      }

      if (editingBillId) {
        setBills(prev => prev.map(b => b.id === editingBillId ? newBill : b));
        setEditingBillId(null);
        showNotification('Bill information updated successfully');
      } else {
        setBills(prev => [newBill, ...prev]);
        showNotification('Bill information saved successfully');
      }
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
      setBillAmount('');
    }
  };

  const handleEditBill = (bill: BillEntry) => {
    setEditingBillId(bill.id);
    setBillFormType(bill.type);
    setBillAmount(bill.amount.toString());
    setBillMonth(bill.month);
    setBillYear(bill.year);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditLeave = (leave: LeaveApplication) => {
    setEditingLeaveId(leave.id);
    setLeaveType(leave.type);
    setLeaveStatus(leave.status);
    setLeaveStartDate(leave.startDate);
    setLeaveEndDate(leave.endDate);
    setLeaveReason(leave.reason);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // DPS Handlers
  const handleAddDPSAccount = async () => {
    if (!dpsBankName || !dpsMonthlyDeposit || !dpsPeriodYears) return;

    const monthly = Number(dpsMonthlyDeposit);
    const years = Number(dpsPeriodYears);
    const profit = Number(dpsProfitPercentage) || 0;
    
    const { totalPrincipal, maturityAmount } = calculateDpsMaturity(monthly, years, profit);

    const maturityDate = new Date(dpsStartDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + years);

    const newAccount: DPSAccount = {
      id: editingDpsAccountId || crypto.randomUUID(),
      bankName: dpsBankName,
      monthlyDeposit: monthly,
      periodYears: years,
      profitPercentage: profit,
      startDate: dpsStartDate,
      targetTotal: maturityAmount,
      maturityDate: maturityDate.toISOString().split('T')[0]
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveDPSAccount(newAccount);
      }

      if (editingDpsAccountId) {
        setDpsAccounts(prev => prev.map(a => a.id === editingDpsAccountId ? newAccount : a));
        setEditingDpsAccountId(null);
        showNotification('DPS Account updated successfully!');
      } else {
        setDpsAccounts(prev => [...prev, newAccount]);
        showNotification('DPS Account created successfully!');
      }
      
      // Reset
      setDpsBankName('');
      setDpsMonthlyDeposit('');
      setDpsPeriodYears('');
      setDpsProfitPercentage('');
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditDPSAccount = (acc: DPSAccount) => {
    setEditingDpsAccountId(acc.id);
    setDpsBankName(acc.bankName);
    setDpsMonthlyDeposit(acc.monthlyDeposit.toString());
    setDpsPeriodYears(acc.periodYears.toString());
    setDpsProfitPercentage(acc.profitPercentage.toString());
    setDpsStartDate(acc.startDate);
    setDpsFormType('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddDPSDeposit = async () => {
    if (!selectedDpsAccountId || !depositAmount) return;

    // Check if a deposit already exists for this account in the same month/year
    const dDate = new Date(depositDate);
    const dMonth = dDate.getMonth();
    const dYear = dDate.getFullYear();

    const isDuplicate = dpsDeposits.some(d => {
      if (d.accountId !== selectedDpsAccountId) return false;
      if (editingDpsDepositId && d.id === editingDpsDepositId) return false;
      const existingDate = new Date(d.date);
      return existingDate.getMonth() === dMonth && existingDate.getFullYear() === dYear;
    });

    if (isDuplicate) {
      showNotification('A deposit for this account already exists in the selected month', 'error');
      return;
    }

    const newDeposit: DPSDeposit = {
      id: editingDpsDepositId || crypto.randomUUID(),
      accountId: selectedDpsAccountId,
      amount: Number(depositAmount),
      date: depositDate,
      description: depositNote
    };

    try {
      if (supabase) {
        setIsSyncing(true);
        await dbService.saveDPSDeposit(newDeposit);
      }

      if (editingDpsDepositId) {
        setDpsDeposits(prev => prev.map(d => d.id === editingDpsDepositId ? newDeposit : d));
        setEditingDpsDepositId(null);
        showNotification('DPS Deposit updated successfully!');
      } else {
        setDpsDeposits(prev => [...prev, newDeposit]);
        showNotification('DPS Deposit recorded successfully!');
      }
      
      // Reset
      setDepositAmount('');
      setDepositNote('');
    } catch (error: any) {
      console.error(error);
      showNotification(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditDPSDeposit = (d: DPSDeposit) => {
    setEditingDpsDepositId(d.id);
    setSelectedDpsAccountId(d.accountId);
    setDepositAmount(d.amount.toString());
    setDepositDate(d.date);
    setDepositNote(d.description);
    setDpsFormType('deposit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dpsStats = useMemo(() => {
    const totalDeposited = dpsDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    const totalProfit = dpsAccounts.reduce((sum, acc) => {
      const accDeposits = dpsDeposits.filter(d => d.accountId === acc.id);
      const { schedule } = calculateDpsMaturity(acc.monthlyDeposit, acc.periodYears, acc.profitPercentage);
      const monthsPaid = Math.min(schedule.length, accDeposits.length);
      
      if (monthsPaid === 0) return sum;
      // Accumulated profit is balance - principal for the months paid
      const currentBalance = schedule[monthsPaid - 1].balance;
      const currentPrincipal = acc.monthlyDeposit * monthsPaid;
      return sum + (currentBalance - currentPrincipal);
    }, 0);

    return {
      totalDeposited,
      totalProfit,
      grandTotal: totalDeposited + totalProfit
    };
  }, [dpsAccounts, dpsDeposits]);

  const currentDpsCalculations = useMemo(() => {
    const monthly = Number(dpsMonthlyDeposit) || 0;
    const years = Number(dpsPeriodYears) || 0;
    const profit = Number(dpsProfitPercentage) || 0;
    
    const { totalPrincipal, maturityAmount, totalProfit } = calculateDpsMaturity(monthly, years, profit);

    const maturityDate = new Date(dpsStartDate);
    if (!isNaN(maturityDate.getTime())) {
      maturityDate.setFullYear(maturityDate.getFullYear() + years);
    }

    return {
      totalPrincipal,
      maturityAmount,
      totalProfit,
      maturityDate: maturityDate.toISOString().split('T')[0]
    };
  }, [dpsMonthlyDeposit, dpsPeriodYears, dpsProfitPercentage, dpsStartDate]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
        <p className="text-sm font-bold tracking-widest uppercase opacity-50">Syncing with Cloud...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 80, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed left-1/2 z-50 flex items-center gap-3 border px-4 py-3 rounded-2xl shadow-xl min-w-[300px] ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 shadow-slate-950/50' 
                : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              notification.type === 'success' 
                ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600') 
                : (isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-100 text-rose-600')
            }`}>
              <CheckCircle2 size={18} />
            </div>
            <p className={`text-sm font-bold flex-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{notification.message}</p>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`border-b px-6 py-2 flex items-center justify-between sticky top-0 z-[100] transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Left: Branding */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
            <Wallet size={18} />
          </div>
          <h1 className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>My Book</h1>
        </div>

        {/* Center: Pill Navigation */}
        <div className="flex items-center gap-4">
          <nav className={`absolute left-1/2 -translate-x-1/2 border shadow-sm rounded-full p-1 hidden md:flex items-center gap-1 transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}>
          {[
            { id: 'financial', label: 'Financial', icon: Wallet },
            { id: 'dps', label: 'DPS', icon: PiggyBank },
            { id: 'salary', label: 'Salary', icon: Briefcase },
            { id: 'leave', label: 'Leave', icon: Calendar },
            { id: 'bills', label: 'Bills', icon: ReceiptText },
            { id: 'reminders', label: 'Reminder', icon: BellRing },
          ].map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-md shadow-blue-900/20"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon size={16} />
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

        {/* Right Area: Theme Toggle & More */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Syncing</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile: View Switcher Dropdown */}
          <div className="md:hidden group relative">
            <button className={`flex items-center gap-1 p-2 rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
            }`}>
              <MoreHorizontal size={20} />
            </button>
            <div className={`absolute top-full right-0 mt-1 w-40 border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200'
            }`}>
              <div className="p-1">
                {[
                  { id: 'financial', label: 'Financial', icon: Wallet },
                  { id: 'dps', label: 'DPS', icon: PiggyBank },
                  { id: 'salary', label: 'Salary', icon: Briefcase },
                  { id: 'leave', label: 'Leave', icon: Calendar },
                  { id: 'bills', label: 'Bills', icon: ReceiptText },
                  { id: 'reminders', label: 'Reminder', icon: BellRing },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                      currentView === item.id 
                        ? (isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                        : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {currentView === 'financial' ? (
          <>
            {/* Left Sidebar - Form */}
            <aside className="lg:col-span-3 space-y-6">
          <section className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Financial Info / Add Entry</h2>
            </div>
            
            <div className="p-3 space-y-2">
              {/* Type Toggle */}
              <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                <button 
                  onClick={() => setType('expense')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                    type === 'expense' 
                    ? 'bg-rose-500 text-white shadow-md' 
                    : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  EXPENSE
                </button>
                <button 
                  onClick={() => setType('income')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                    type === 'income' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  INCOME
                </button>
              </div>

              {/* Category Selection */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Category Selection</label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-1.5 text-sm appearance-none focus:outline-none focus:ring-2 transition-all ${
                      isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10 focus:border-purple-500' 
                      : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20 focus:border-purple-400'
                    }`}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Amount (৳)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10 focus:border-purple-500' 
                      : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20 focus:border-purple-400'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Transaction Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                        isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10 focus:border-purple-500' 
                        : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20 focus:border-purple-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Short Description</label>
                <input 
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly Grocery"
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10 focus:border-purple-500' 
                    : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20 focus:border-purple-400'
                  }`}
                />
              </div>

              {/* Add Button */}
              <button 
                onClick={handleAddTransaction}
                className={`w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                  isDarkMode ? 'shadow-lg shadow-blue-900/40' : 'shadow-lg shadow-blue-200'
                }`}
              >
                <Plus size={18} />
                {editingId ? 'UPDATE TRANSACTION' : 'ADD TRANSACTION'}
              </button>
            </div>
          </section>

          {/* Filter Section */}
          <section className={`rounded-2xl shadow-sm border p-3 space-y-2 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <ChevronDown size={14} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">View Data by Month/Year</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Month</label>
                <div className="relative">
                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs appearance-none focus:outline-none focus:ring-2 transition-all ${
                      isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                      : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                    }`}
                  >
                    {MONTHS.map(m => <option key={m} value={m} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Year</label>
                <div className="relative">
                  <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs appearance-none focus:outline-none focus:ring-2 transition-all ${
                      isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                      : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                    }`}
                  >
                    {availableYears.map(y => <option key={y} value={y} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Right Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-indigo-900/80 shadow-indigo-900/20' : 'bg-indigo-600 shadow-indigo-100'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Total Balance</p>
              <h3 className="text-2xl font-bold">৳{balance.toLocaleString()}</h3>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-emerald-900/80 shadow-emerald-900/20' : 'bg-emerald-500 shadow-emerald-100'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Total Income</p>
              <h3 className="text-2xl font-bold">৳{totals.income.toLocaleString()}</h3>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-rose-900/80 shadow-rose-900/20' : 'bg-rose-500 shadow-rose-100'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Total Expense</p>
              <h3 className="text-2xl font-bold">৳{totals.expense.toLocaleString()}</h3>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detailed Breakdown */}
            <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                <PieChart size={16} className="text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Detailed Breakdown (Expense)</h2>
              </div>
              <div className="p-4 flex-1 space-y-4">
                {breakdown.length > 0 ? (
                  breakdown.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg ${
                            idx % 3 === 0 
                              ? (isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                              : idx % 3 === 1 
                                ? (isDarkMode ? 'bg-rose-900/50 text-rose-400' : 'bg-rose-50 text-rose-600') 
                                : (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                          }`}>
                            {getCategoryIcon(item.name)}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          ৳{item.amount.toLocaleString()} <span className="text-slate-400 font-medium">({item.percentage}%)</span>
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${
                            idx % 3 === 0 ? 'bg-indigo-500' : idx % 3 === 1 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <PieChart size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">No expenses recorded for this period</p>
                  </div>
                )}
              </div>
            </section>

            {/* Transaction History */}
            <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                <History size={16} className="text-orange-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-orange-500">Transaction History</h2>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px] space-y-3">
                <AnimatePresence initial={false}>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <motion.div 
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`group flex items-center gap-3 p-2 rounded-xl border transition-all relative border-l-4 ${
                          isDarkMode 
                            ? 'bg-slate-800/50 border-slate-700 hover:border-blue-900 hover:bg-blue-900/10' 
                            : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-blue-50/30'
                        } ${
                          t.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          t.type === 'income' 
                            ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600') 
                            : (isDarkMode ? 'bg-rose-900/50 text-rose-400' : 'bg-rose-100 text-rose-600')
                        }`}>
                          {getCategoryIcon(t.category)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-sm uppercase tracking-tight truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.category}</h4>
                          <p className={`text-[10px] font-medium flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {t.description && <span className="before:content-['•'] before:mx-1 truncate">{t.description}</span>}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-bold text-sm flex items-center justify-end gap-1 ${
                            t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {t.type === 'income' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                            ৳{t.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(t)}
                              className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => confirmDelete(t.id, 'financial')}
                              className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <History size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">No transactions found</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
          </>
        ) : currentView === 'dps' ? (
          <>
            {/* DPS View */}
            <aside className="lg:col-span-3 space-y-6">
              <section className={`rounded-2xl shadow-sm border overflow-hidden ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>DPS Management</h2>
                </div>
                
                <div className="p-3 space-y-3">
                  {/* DPS Form Toggle */}
                  <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                    <button 
                      onClick={() => setDpsFormType('account')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        dpsFormType === 'account' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      CREATE ACCOUNT
                    </button>
                    <button 
                      onClick={() => setDpsFormType('deposit')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        dpsFormType === 'deposit' 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ADD DEPOSIT
                    </button>
                  </div>

                  {dpsFormType === 'account' ? (
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Account/Bank Name</label>
                        <input 
                          type="text"
                          value={dpsBankName}
                          onChange={(e) => setDpsBankName(e.target.value)}
                          placeholder="e.g. Sonali Bank"
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Monthly Deposit</label>
                          <input 
                            type="number"
                            value={dpsMonthlyDeposit}
                            onChange={(e) => setDpsMonthlyDeposit(e.target.value)}
                            placeholder="0"
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Period (Years)</label>
                          <input 
                            type="number"
                            value={dpsPeriodYears}
                            onChange={(e) => setDpsPeriodYears(e.target.value)}
                            placeholder="0"
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Profit %</label>
                          <input 
                            type="number"
                            value={dpsProfitPercentage}
                            onChange={(e) => setDpsProfitPercentage(e.target.value)}
                            placeholder="0"
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Start Date</label>
                          <input 
                            type="date"
                            value={dpsStartDate}
                            onChange={(e) => setDpsStartDate(e.target.value)}
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                      </div>
                      
                      {/* Auto Calculated Fields */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">T. Deposit</label>
                          <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-700'
                          }`}>
                            ৳{currentDpsCalculations.totalPrincipal.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">T. Profit</label>
                          <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-emerald-500' : 'bg-slate-200 border-slate-300 text-emerald-600'
                          }`}>
                            ৳{currentDpsCalculations.totalProfit.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Maturity Am.</label>
                          <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-slate-200 border-slate-300 text-indigo-600'
                          }`}>
                            ৳{currentDpsCalculations.maturityAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddDPSAccount}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isDarkMode ? 'shadow-lg shadow-indigo-950' : 'shadow-lg shadow-indigo-100'
                        }`}
                      >
                        <Plus size={18} />
                        {editingDpsAccountId ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Account Name</label>
                        <select 
                          value={selectedDpsAccountId}
                          onChange={(e) => {
                            const accountId = e.target.value;
                            setSelectedDpsAccountId(accountId);
                            const account = dpsAccounts.find(a => a.id === accountId);
                            if (account) {
                              setDepositAmount(account.monthlyDeposit.toString());
                            } else {
                              setDepositAmount("");
                            }
                          }}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        >
                          <option value="" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Select Account</option>
                          {dpsAccounts.map(acc => (
                            <option key={acc.id} value={acc.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{acc.bankName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Amount (৳)</label>
                          <input 
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Payment Date</label>
                          <input 
                            type="date"
                            value={depositDate}
                            onChange={(e) => setDepositDate(e.target.value)}
                            className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                              isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                              : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Description/Note</label>
                        <input 
                          type="text"
                          value={depositNote}
                          onChange={(e) => setDepositNote(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        />
                      </div>
                      <button 
                        onClick={handleAddDPSDeposit}
                        className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isDarkMode ? 'shadow-lg shadow-emerald-950' : 'shadow-lg shadow-emerald-100'
                        }`}
                      >
                        <Plus size={18} />
                        ADD DEPOSIT
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </aside>

            {/* Right Content - DPS Stats & History */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-indigo-900/80 shadow-indigo-950/20' : 'bg-indigo-600 shadow-indigo-100'}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">T. Deposit</p>
                  <h3 className="text-2xl font-bold">৳{dpsStats.totalDeposited.toLocaleString()}</h3>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-emerald-900/80 shadow-emerald-950/20' : 'bg-emerald-500 shadow-emerald-100'}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">T. Profit</p>
                  <h3 className="text-2xl font-bold">৳{dpsStats.totalProfit.toLocaleString()}</h3>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`rounded-2xl p-4 text-white shadow-xl ${isDarkMode ? 'bg-blue-900/80 shadow-blue-950/20' : 'bg-blue-500 shadow-blue-100'}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Total Amount</p>
                  <h3 className="text-2xl font-bold">৳{dpsStats.grandTotal.toLocaleString()}</h3>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Info */}
                <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <CreditCard size={16} className="text-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Account Information</h2>
                  </div>
                  <div className="p-4 flex-1 space-y-4 overflow-y-auto max-h-[500px]">
                    {dpsAccounts.length > 0 ? (
                      dpsAccounts.map(acc => {
                        const accDeposits = dpsDeposits.filter(d => d.accountId === acc.id);
                        const currentPrincipal = accDeposits.reduce((sum, d) => sum + d.amount, 0);
                        
                        // Calculate current balance with compounding interest
                        const today = new Date();
                        const currentBalance = Math.round(accDeposits.reduce((total, d) => {
                          const dDate = new Date(d.date);
                          const monthsPassed = (today.getFullYear() - dDate.getFullYear()) * 12 + (today.getMonth() - dDate.getMonth());
                          if (monthsPassed <= 0) return total + d.amount;
                          
                          const monthlyRate = acc.profitPercentage / 12 / 100;
                          const amountWithInterest = d.amount * Math.pow(1 + monthlyRate, monthsPassed);
                          return total + amountWithInterest;
                        }, 0));

                        return (
                          <div key={acc.id} className={`group p-3 rounded-xl border space-y-2 relative transition-all ${
                            isDarkMode ? 'bg-slate-800/40 border-slate-800 hover:border-indigo-900' : 'bg-slate-50/30 border-slate-100 hover:border-indigo-100'
                          }`}>
                            <div className="flex justify-between items-start">
                              <h4 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{acc.bankName}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                  {acc.periodYears} Years
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleEditDPSAccount(acc)}
                                    className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => confirmDelete(acc.id, 'dps-account')}
                                    className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                              <div>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Monthly</p>
                                <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>৳{acc.monthlyDeposit.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Profit %</p>
                                <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{acc.profitPercentage}%</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Start Date</p>
                                <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(acc.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Maturity Date</p>
                                <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(acc.maturityDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div className={`pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">T. Deposit</p>
                                <p className="text-emerald-500 font-bold">৳{currentPrincipal.toLocaleString()}</p>
                              </div>
                              <div className={`pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Target Deposit</p>
                                <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>৳{(acc.monthlyDeposit * acc.periodYears * 12).toLocaleString()}</p>
                              </div>
                              <div className={`pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">T. Profit</p>
                                <p className="text-emerald-500 font-bold">
                                  ৳{(() => {
                                    const { schedule } = calculateDpsMaturity(acc.monthlyDeposit, acc.periodYears, acc.profitPercentage);
                                    const monthsPaid = Math.min(schedule.length, accDeposits.length);
                                    if (monthsPaid === 0) return "0";
                                    // Accumulated profit for this account
                                    const currentBalance = schedule[monthsPaid - 1].balance;
                                    const currentPrincipal = acc.monthlyDeposit * monthsPaid;
                                    return (currentBalance - currentPrincipal).toLocaleString();
                                  })()}
                                </p>
                              </div>
                              <div className={`pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Maturity Amount</p>
                                <p className="text-indigo-400 font-bold">৳{acc.targetTotal.toLocaleString()}</p>
                              </div>
                              
                              <div className="col-span-2 pt-1">
                                <button 
                                  onClick={() => setViewingScheduleId(acc.id)}
                                  className={`w-full py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1 ${
                                    isDarkMode ? 'text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/60' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                  }`}
                                >
                                  <PieChart size={12} />
                                  View Profit Schedule
                                </button>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="col-span-2 pt-2 space-y-1">
                                {(() => {
                                  const totalMonths = acc.periodYears * 12;
                                  const monthsPaid = Math.min(totalMonths, accDeposits.length);
                                  const remainingMonths = Math.max(0, totalMonths - monthsPaid);
                                  const progressPercent = (monthsPaid / totalMonths) * 100;
                                  
                                  return (
                                    <>
                                      <div className={`h-3 rounded-full overflow-hidden border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                                        <div 
                                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                                        <span className="text-indigo-500">Complete: {monthsPaid}M</span>
                                        <span className="text-slate-400">Remaining: {remainingMonths}M</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <CreditCard size={48} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">No DPS accounts created</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* DPS Transaction History */}
                <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-4 border-b flex items-center justify-between gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-emerald-500" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-500">DPS Transaction History</h2>
                    </div>
                    
                    {/* Account Filter */}
                    <div className="relative">
                      <select 
                        value={dpsHistoryFilter}
                        onChange={(e) => setDpsHistoryFilter(e.target.value)}
                        className={`appearance-none border rounded-lg px-3 py-1 pr-8 text-[10px] font-bold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      >
                        <option value="all" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>All Accounts</option>
                        {dpsAccounts.map(acc => (
                          <option key={acc.id} value={acc.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{acc.bankName}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto max-h-[500px] space-y-3">
                    {(() => {
                      const filteredDeposits = dpsDeposits.filter(d => 
                        dpsHistoryFilter === 'all' || d.accountId === dpsHistoryFilter
                      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      return filteredDeposits.length > 0 ? (
                        filteredDeposits.map(d => {
                          const acc = dpsAccounts.find(a => a.id === d.accountId);
                          return (
                            <div key={d.id} className={`group flex items-center gap-3 p-2 rounded-xl border border-l-4 transition-all ${
                              isDarkMode 
                                ? 'bg-emerald-900/10 border-slate-800 border-l-emerald-500 hover:border-emerald-900' 
                                : 'bg-emerald-50/10 border-slate-100 border-l-emerald-500 hover:border-emerald-200'
                            }`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isDarkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                <Banknote size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{acc?.bankName || 'Unknown Account'}</h4>
                                <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {d.description && `• ${d.description}`}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm text-emerald-500">৳{d.amount.toLocaleString()}</p>
                                <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button                                    onClick={() => handleEditDPSDeposit(d)}
                                    className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => confirmDelete(d.id, 'dps-deposit')}
                                    className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                          <History size={48} strokeWidth={1} className="mb-4 opacity-20" />
                          <p className="text-sm font-medium">No deposits found</p>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : currentView === 'salary' ? (
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Forms (DPS Style) */}
              <aside className="lg:col-span-3 space-y-6">
                <section className={`rounded-2xl shadow-sm border overflow-hidden ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Salary Information</h2>
                  </div>
                  <div className={`p-3 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-200/50'}`}>
                      <button 
                        onClick={() => setSalaryFormType('payslip')}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                          salaryFormType === 'payslip' 
                            ? (isDarkMode ? 'bg-rose-600' : 'bg-indigo-600') + ' text-white shadow-md'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        PAY SLIP
                      </button>
                      <button 
                        onClick={() => setSalaryFormType('increment')}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                          salaryFormType === 'increment' 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ADD INCREMENT
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {salaryFormType === 'payslip' ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Gross Salary</label>
                            <input 
                              type="number"
                              value={grossSalary}
                              onChange={(e) => setGrossSalary(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Base Deduction</label>
                            <input 
                              type="number"
                              value={baseDeduction}
                              onChange={(e) => setBaseDeduction(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Medical</label>
                            <input 
                              type="number"
                              value={medical}
                              onChange={(e) => setMedical(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Conveyance</label>
                            <input 
                              type="number"
                              value={conveyance}
                              onChange={(e) => setConveyance(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Food</label>
                            <input 
                              type="number"
                              value={food}
                              onChange={(e) => setFood(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Attendance Bonus</label>
                            <input 
                              type="number"
                              value={attendanceBonus}
                              onChange={(e) => setAttendanceBonus(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Days</label>
                            <input 
                              type="number"
                              value={days}
                              onChange={(e) => setDays(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Rate</label>
                            <input 
                              type="number"
                              value={rate}
                              onChange={(e) => setRate(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                        </div>

                        <button 
                          onClick={handleSavePaySlip}
                          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                            isDarkMode ? 'shadow-indigo-950/20' : 'shadow-indigo-100'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                          SAVE PAY SLIP
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Previous Total</label>
                          <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            ৳ {incrementCalculations.previousTotal.toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Effective Year</label>
                            <div className="relative">
                              <select 
                                value={effectiveYear}
                                onChange={(e) => setEffectiveYear(e.target.value)}
                                className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 appearance-none transition-all ${
                                  isDarkMode 
                                  ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                  : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                                }`}
                              >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                  <option key={y} value={y} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{y}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Base Deduction</label>
                            <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                              ৳ {incrementCalculations.baseDeduction.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">% Increase</label>
                            <input 
                              type="number"
                              value={percentIncrease}
                              onChange={(e) => setPercentIncrease(e.target.value)}
                              placeholder="0"
                              className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                                isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                                : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Amount +</label>
                            <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                              isDarkMode ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                              ৳ {incrementCalculations.amountPlus.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Gross Total</label>
                          <div className={`w-full border rounded-xl px-3 py-1.5 text-sm font-bold ${
                            isDarkMode ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            ৳ {incrementCalculations.grossTotal.toLocaleString()}
                          </div>
                        </div>

                        <button 
                          onClick={handleSaveIncrement}
                          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                            isDarkMode ? 'shadow-emerald-950/20' : 'shadow-emerald-100'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                          SAVE INCREMENT
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </aside>

              {/* Right Column: Display Cards & History */}
              <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left sub-column: Cards stacked vertically */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Earnings & Allowances Card */}
                    <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <div className={`p-4 border-b flex items-center gap-2 ${
                      isDarkMode ? 'border-slate-800 bg-blue-900/10' : 'border-slate-100 bg-blue-50/30'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">EARNINGS & ALLOWANCES</h2>
                    </div>
                    <div className="p-5 space-y-5 flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>BASIC SALARY</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.basicSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>HOUSE RENT ALLOWANCE</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.houseRent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>MEDICAL ALLOWANCE</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {(Number(medical) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CONVEYANCE ALLOWANCE</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {(Number(conveyance) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>FOOD ALLOWANCE</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {(Number(food) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ATTENDANCE BONUS</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {(Number(attendanceBonus) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>TIFFIN {days || '0'} DAYS</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.tiffinAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`p-4 m-4 rounded-2xl flex justify-between items-center shadow-lg ${
                      isDarkMode ? 'bg-blue-900 shadow-blue-950/20' : 'bg-blue-600 shadow-blue-200'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">TOTAL EARNINGS</span>
                      <span className="text-xl font-bold text-white">৳ {salaryCalculations.totalEarnings.toLocaleString()}</span>
                    </div>
                  </section>

                  {/* Bonus Breakdown Card */}
                  <section className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`p-4 border-b flex items-center gap-2 ${
                      isDarkMode ? 'border-slate-800 bg-emerald-900/10' : 'border-slate-100 bg-emerald-50/30'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">BONUS BREAKDOWN</h2>
                    </div>
                    <div className="p-5 space-y-8 flex-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-emerald-600">
                          <Gift size={18} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">YEARLY BONUS</span>
                        </div>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.yearlyBonus.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-emerald-600">
                          <Coins size={18} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">EID-UL-FITR BONUS</span>
                        </div>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.eidUlFitrBonus.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-emerald-600">
                          <Coins size={18} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">EID-UL-ADHA BONUS</span>
                        </div>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {salaryCalculations.eidUlAdhaBonus.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`p-4 m-4 rounded-2xl flex justify-between items-center shadow-lg ${
                      isDarkMode ? 'bg-emerald-900 shadow-emerald-950/20' : 'bg-emerald-600 shadow-emerald-200'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">TOTAL BONUS</span>
                      <span className="text-xl font-bold text-white">৳ {(salaryCalculations.yearlyBonus + salaryCalculations.eidUlFitrBonus + salaryCalculations.eidUlAdhaBonus).toLocaleString()}</span>
                    </div>
                  </section>
                </div>

                {/* Right sub-column: Increment History Table */}
                <div className="lg:col-span-7">
                  <section className={`rounded-2xl shadow-sm border overflow-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`p-4 border-b flex items-center gap-2 ${
                      isDarkMode ? 'border-slate-800 bg-orange-900/10' : 'border-slate-100 bg-orange-50/30'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400' : 'text-orange-800'}`}>Increment History</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'bg-orange-900/5 border-orange-900/20' : 'bg-orange-50/50 border-orange-100'}`}>
                          <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400/80' : 'text-orange-800'}`}>YEAR</th>
                          <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400/80' : 'text-orange-800'}`}>% INCREASE</th>
                          <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400/80' : 'text-orange-800'}`}>AMOUNT +</th>
                          <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400/80' : 'text-orange-800'}`}>G.TOTAL</th>
                          <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400/80' : 'text-orange-800'} text-right`}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {incrementHistory.length > 0 ? (
                          incrementHistory.map((inc) => (
                            <tr key={inc.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/50'}`}>
                              <td className={`px-6 py-5 text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{inc.year}</td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                  isDarkMode ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {inc.percentIncrease}%
                                </span>
                              </td>
                              <td className={`px-6 py-5 text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                +৳ {inc.amountPlus.toLocaleString()}
                              </td>
                              <td className={`px-6 py-5 text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                ৳ {inc.grossTotal.toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button 
                                    onClick={() => handleEditIncrement(inc)}
                                    className={`p-1.5 transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-400 hover:text-blue-600'}`}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteIncrement(inc.id)}
                                    className={`p-1.5 transition-colors ${isDarkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-400 hover:text-rose-600'}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs font-medium italic">
                              No increment history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : currentView === 'leave' ? (
      <div className="lg:col-span-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Leave Form & Limits */}
          <aside className="lg:col-span-3 space-y-6">
            <section className={`rounded-2xl shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Leave Information</h2>
              </div>
              
              <div className={`p-3 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-200/50'}`}>
                  <button 
                    onClick={() => setLeaveFormType('leave')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      leaveFormType === 'leave' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    LEAVE
                  </button>
                  <button 
                    onClick={() => setLeaveFormType('limit')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      leaveFormType === 'limit' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    LIMIT
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {leaveFormType === 'leave' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Leave Type</label>
                        <select 
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        >
                          <option value="Casual Leave" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Casual Leave</option>
                          <option value="Medical Leave" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Medical Leave</option>
                          <option value="Annual Leave" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Annual Leave</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Status</label>
                        <select 
                          value={leaveStatus}
                          onChange={(e) => setLeaveStatus(e.target.value as LeaveStatus)}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        >
                          <option value="Pending" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Pending</option>
                          <option value="Approved" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Approved</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Start Date</label>
                        <input 
                          type="date"
                          value={leaveStartDate}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">End Date</label>
                        <input 
                          type="date"
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                            : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Detailed Reason</label>
                      <textarea 
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="Briefly explain the purpose..."
                        rows={2}
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 resize-none transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                          : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                        }`}
                      />
                    </div>

                    <button 
                      onClick={handleApplyLeave}
                      className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                        isDarkMode ? 'shadow-indigo-950/20' : 'shadow-indigo-100'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                      {editingLeaveId ? 'UPDATE APPLICATION' : 'SUBMIT APPLICATION'}
                    </button>

                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between mb-1.5 px-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-none">View Data by Year</label>
                        <button 
                          onClick={() => setShowLeaveSummary(true)}
                          className={`p-1 px-2.5 rounded-full transition-all flex items-center gap-1.5 border shadow-sm ${
                            isDarkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200' : 'bg-slate-100/80 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                          }`}
                          title="View Leave Summary"
                        >
                          <History size={11} className="text-indigo-500" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">Summary</span>
                        </button>
                      </div>
                      <div className="relative">
                        <select 
                          value={leaveFilterYear}
                          onChange={(e) => setLeaveFilterYear(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer text-center ${
                            isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-400'
                          }`}
                        >
                          {availableLeaveYears.map(y => (
                            <option key={y} value={y} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{y}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {editingLeaveId && (
                      <button 
                        onClick={() => {
                          setEditingLeaveId(null);
                          setLeaveReason('');
                        }}
                        className={`w-full font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <X size={18} />
                        CANCEL EDIT
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Casual Leave Limit</label>
                      <input 
                        type="number"
                        value={casualLimit}
                        onChange={(e) => setCasualLimit(e.target.value)}
                        placeholder="0"
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                          : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Medical Leave Limit</label>
                      <input 
                        type="number"
                        value={medicalLimit}
                        onChange={(e) => setMedicalLimit(e.target.value)}
                        placeholder="0"
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                          : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Annual Leave Limit</label>
                      <input 
                        type="number"
                        value={annualLimit}
                        onChange={(e) => setAnnualLimit(e.target.value)}
                        placeholder="0"
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-purple-500/10' 
                          : 'bg-white border-purple-300 text-slate-900 focus:ring-purple-500/20'
                        }`}
                      />
                    </div>

                    <button 
                      onClick={handleSaveLeaveLimits}
                      className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                        isDarkMode ? 'shadow-emerald-950/20' : 'shadow-emerald-100'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                      SAVE LIMITS
                    </button>
                  </div>
                )}
              </div>
            </section>
          </aside>

          {/* Right Column: Leave Stats & History */}
          <div className="lg:col-span-9 space-y-6">
            {/* Leave Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['Casual Leave', 'Medical Leave', 'Annual Leave'] as LeaveType[]).map((type) => {
                const stats = leaveStats[type];
                const available = stats.limit - stats.used;
                
                const progress = stats.limit > 0 ? (stats.used / stats.limit) * 100 : 0;
                
                // Colors based on design image
                const borderColor = type === 'Casual Leave' ? 'border-amber-200' : type === 'Medical Leave' ? 'border-rose-200' : 'border-blue-200';
                const iconColor = type === 'Casual Leave' ? 'text-indigo-600' : type === 'Medical Leave' ? 'text-rose-600' : 'text-emerald-600';
                const progressBarColor = type === 'Casual Leave' ? 'bg-indigo-600' : type === 'Medical Leave' ? 'bg-rose-500' : 'bg-emerald-500';
                
                return (
                  <div key={type} className={`border-2 ${borderColor} rounded-[1.5rem] p-4 shadow-sm transition-all hover:shadow-md ${
                    isDarkMode ? 'bg-slate-900 shadow-slate-950/20' : 'bg-white'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-[14px] font-bold uppercase tracking-tight leading-none mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{type} {leaveFilterYear}</h3>
                        <span className="text-[9px] font-semibold uppercase text-slate-400 tracking-[0.1em] leading-none">BALANCE</span>
                      </div>
                      <div className={`${iconColor}`}>
                        <Calendar size={20} />
                      </div>
                    </div>
                    
                    <div className="mt-4 mb-3">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border shadow-sm ${
                        isDarkMode 
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {available} DAYS AVAILABLE
                      </span>
                    </div>

                    <div className={`h-1 rounded-full mb-4 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100/50'}`}>
                      <div 
                        className={`h-full ${progressBarColor} transition-all duration-500 rounded-full`} 
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-xl p-3 flex flex-col border ${
                        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-[0.1em] mb-1 leading-none">TOTAL LIMIT</span>
                        <span className={`text-base font-bold leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{stats.limit} Days</span>
                      </div>
                      <div className={`rounded-xl p-3 flex flex-col border ${
                        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-[0.1em] mb-1 leading-none">TOTAL USED</span>
                        <span className={`text-base font-bold leading-none ${stats.used > 0 ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : 'text-slate-400'}`}>{stats.used} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave History Section Split into Approved and Pending */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approved Section */}
              <section className={`rounded-[1.5rem] shadow-sm border overflow-hidden flex flex-col min-h-[300px] ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h2 className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>APPROVED ({leaveFilterYear})</h2>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isDarkMode ? 'border-emerald-500/20' : 'border-emerald-500/30'}`}>
                    <CheckCircle2 size={10} className="text-emerald-500" />
                  </div>
                </div>
                
                <div className="overflow-x-auto flex-1 h-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-slate-800/10 border-b border-slate-800' : 'bg-slate-50/20 border-b border-slate-50'}`}>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">TYPE / APPLIED</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 text-center">DURATION</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                      {filteredLeavesByYear.filter(l => l.status === 'Approved').length > 0 ? (
                        filteredLeavesByYear.filter(l => l.status === 'Approved').map((leave) => {
                          const start = new Date(leave.startDate);
                          const end = new Date(leave.endDate);
                          const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          
                          return (
                            <tr key={leave.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                              <td className="px-5 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-[11px] font-bold uppercase leading-tight mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{leave.type}</span>
                                  <span className={`text-[8px] font-semibold uppercase tracking-tight ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>On: {new Date(leave.appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col items-center">
                                  <span className={`text-[9px] font-semibold uppercase tracking-tight mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} — {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                  </span>
                                  <span className={`text-[12px] font-bold tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{diffDays} Days</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleEditLeave(leave)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                    isDarkMode ? 'bg-indigo-950 text-indigo-400 hover:bg-indigo-900' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
                                  }`}>
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => confirmDelete(leave.id, 'leave-application')} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                    isDarkMode ? 'bg-rose-950 text-rose-400 hover:bg-rose-900' : 'bg-rose-50 text-rose-400 hover:bg-rose-100'
                                  }`}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-5 py-20 text-center">
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>NO ENTRIES</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Pending Section */}
              <section className={`rounded-[1.5rem] shadow-sm border overflow-hidden flex flex-col min-h-[300px] ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <h2 className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDarkMode ? 'text-amber-500' : 'text-[#A35200]'}`}>PENDING/REJECTED ({leaveFilterYear})</h2>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isDarkMode ? 'border-amber-500/20' : 'border-amber-500/30'}`}>
                    <History size={10} className="text-amber-500" />
                  </div>
                </div>
                
                <div className="overflow-x-auto flex-1 h-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50/20 border-slate-50'}`}>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">TYPE / APPLIED</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 text-center">DURATION</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                      {filteredLeavesByYear.filter(l => l.status !== 'Approved').length > 0 ? (
                        filteredLeavesByYear.filter(l => l.status !== 'Approved').map((leave) => {
                          const start = new Date(leave.startDate);
                          const end = new Date(leave.endDate);
                          const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          
                          return (
                            <tr key={leave.id} className={`${isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'} transition-colors`}>
                              <td className="px-5 py-3">
                                <div className="flex flex-col">
                                  <span className={`text-[11px] font-bold uppercase leading-tight mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{leave.type}</span>
                                  <span className={`text-[8px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>On: {new Date(leave.appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col items-center">
                                  <span className={`text-[9px] font-semibold uppercase tracking-tight mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} — {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                  </span>
                                  <span className={`text-[12px] font-bold tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{diffDays} Days</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleEditLeave(leave)} 
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                      isDarkMode ? 'bg-slate-800 text-indigo-400 hover:text-indigo-200 hover:bg-slate-700' : 'bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100'
                                    }`}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => confirmDelete(leave.id, 'leave-application')} 
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                      isDarkMode ? 'bg-slate-800 text-rose-400 hover:text-rose-200 hover:bg-slate-700' : 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100'
                                    }`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-5 py-20 text-center">
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>NO ENTRIES</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    ) : currentView === 'bills' ? (
      <div className="lg:col-span-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Bill Form */}
          <aside className="lg:col-span-3 space-y-6">
            <section className={`rounded-2xl shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bill Information</h2>
              </div>
              
              <div className={`p-3 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-200/50'}`}>
                  <button 
                    onClick={() => setBillFormType('Electric')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      billFormType === 'Electric' 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ELECTRIC
                  </button>
                  <button 
                    onClick={() => setBillFormType('Wifi')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      billFormType === 'Wifi' 
                        ? 'bg-cyan-600 text-white shadow-md' 
                        : isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    WIFI
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Bill Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                      <input 
                        type="number"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/20' 
                          : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Month</label>
                      <select 
                        value={billMonth}
                        onChange={(e) => setBillMonth(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm appearance-none focus:outline-none transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200' 
                          : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        {MONTHS.map(m => (
                          <option key={m} value={m} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Year</label>
                      <input 
                        type="number"
                        value={billYear}
                        onChange={(e) => setBillYear(e.target.value)}
                        placeholder="Year"
                        className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/20' 
                          : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleApplyBill}
                    className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                      isDarkMode ? 'shadow-indigo-950/20' : 'shadow-indigo-100'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    {editingBillId ? 'UPDATE BILL' : 'SAVE BILL INFO'}
                  </button>

                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block text-center">View Data by Year</label>
                    <div className="relative">
                      <select 
                        value={billFilterYear}
                        onChange={(e) => setBillFilterYear(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer text-center ${
                          isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-indigo-500/20' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-indigo-500/20'
                        }`}
                      >
                        {availableBillYears.map(y => (
                          <option key={y} value={y} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {editingBillId && (
                    <button 
                      onClick={() => {
                        setEditingBillId(null);
                        setBillAmount('');
                      }}
                      className={`w-full font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <X size={18} />
                      CANCEL EDIT
                    </button>
                  )}
                </div>
              </div>
            </section>
          </aside>

          {/* Right Column: Bill Stats & History */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['Electric', 'Wifi'] as BillType[]).map((type) => {
                const stats = billStats[type];
                const borderColor = type === 'Electric' ? 'border-amber-200' : 'border-cyan-200';
                const iconColor = type === 'Electric' ? 'text-amber-500' : 'text-cyan-600';
                const Icon = type === 'Electric' ? Zap : Wifi;
                
                return (
                  <div key={type} className={`border-2 ${borderColor} rounded-[1.5rem] p-4 shadow-sm transition-all hover:shadow-md ${
                    isDarkMode ? 'bg-slate-900 shadow-slate-950/20' : 'bg-white'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-[15px] font-bold uppercase tracking-tight leading-none mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{type === 'Electric' ? 'ELECTRIC BILLS' : 'WIFI BILLS'}</h3>
                        <span className="text-[9px] font-semibold uppercase text-slate-400 tracking-[0.1em] leading-none">{billFilterYear} OVERVIEW</span>
                      </div>
                      <div className={`${iconColor}`}>
                        <Icon size={22} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`border rounded-2xl p-4 flex flex-col ${
                        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-[0.1em] mb-1.5 leading-none">TOTAL PAID</span>
                        <span className={`text-xl font-bold leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>৳ {stats.total.toLocaleString()}</span>
                      </div>
                      <div className={`border rounded-2xl p-4 flex flex-col ${
                        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-[0.1em] mb-1.5 leading-none">AVG ({stats.count} MO)</span>
                        <span className={`text-xl font-bold leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>৳ {stats.avg.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className={`rounded-[2rem] shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-5 border-b flex items-center justify-between ${
                isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                    isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-bold leading-none mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Payment History</h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{billFilterYear} Transactions</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'bg-slate-800/10 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Month / Year</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                    {bills.filter(b => b.year === billFilterYear).length > 0 ? (
                      bills.filter(b => b.year === billFilterYear).map((bill) => (
                        <tr key={bill.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{bill.month}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{bill.year}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${
                              bill.type === 'Electric' 
                                ? (isDarkMode ? 'bg-amber-950/30 text-amber-500 border-amber-900' : 'bg-amber-50 text-amber-600 border-amber-100') 
                                : (isDarkMode ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900' : 'bg-cyan-50 text-cyan-600 border-cyan-100')
                            }`}>
                              {bill.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>৳ {bill.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditBill(bill)}
                                className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all ${
                                  isDarkMode 
                                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:bg-slate-700' 
                                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => confirmDelete(bill.id, 'bill-entry')}
                                className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all ${
                                  isDarkMode 
                                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-700' 
                                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-xs font-medium italic">
                          No bill history found for {billFilterYear}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    ) : currentView === 'reminders' ? (
      <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Add Reminder Form */}
        <aside className="lg:col-span-3 space-y-6">
          <section className={`rounded-2xl shadow-sm border overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Add Reminder</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Title</label>
                <input 
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="What needs to be reminded?"
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Date</label>
                <input 
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Description</label>
                <textarea 
                  value={reminderDescription}
                  onChange={(e) => setReminderDescription(e.target.value)}
                  placeholder="Add some details..."
                  rows={3}
                  className={`w-full border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                    isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/10' 
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20'
                  }`}
                />
              </div>

              <button 
                onClick={handleAddReminder}
                className={`w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                  isDarkMode ? 'shadow-indigo-950/20' : 'shadow-indigo-100'
                }`}
              >
                <Plus size={18} />
                {editingReminderId ? 'UPDATE REMINDER' : 'ADD REMINDER'}
              </button>

              {editingReminderId && (
                <button 
                  onClick={() => {
                    setEditingReminderId(null);
                    setReminderTitle('');
                    setReminderDescription('');
                  }}
                  className={`w-full font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <X size={18} />
                  CANCEL EDIT
                </button>
              )}
            </div>
          </section>
        </aside>

        {/* Right Columns: Active and Closed Reminders */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Reminders */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="text-indigo-600" size={18} />
              <h2 className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Active Reminders</h2>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isDarkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
              }`}>{reminders.filter(r => r.isActive).length}</span>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {reminders.filter(r => r.isActive).length > 0 ? (
                  reminders.filter(r => r.isActive).map(reminder => (
                    <motion.div
                      layout
                      key={reminder.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md relative group ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-bold text-sm mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{reminder.title}</h3>
                          <div className="flex items-center gap-2">
                            <p className={`text-[10px] flex items-center gap-1 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Calendar size={10} /> {new Date(reminder.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            {(() => {
                              const timeStatus = getTimeRemaining(reminder.date);
                              const isOverdue = timeStatus.includes('ago') || timeStatus === 'Yesterday';
                              return (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                                  isOverdue
                                    ? (isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600')
                                    : (isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                }`}>
                                  {timeStatus}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditReminder(reminder)}
                              className={`p-1.5 rounded-lg border text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all ${
                                isDarkMode ? 'border-slate-800' : 'border-slate-100'
                              }`}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => confirmDelete(reminder.id, 'reminder')}
                              className={`p-1.5 rounded-lg border text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all ${
                                isDarkMode ? 'border-slate-800' : 'border-slate-100'
                              }`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <button 
                            onClick={() => toggleReminderStatus(reminder.id)}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-relaxed mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{reminder.description}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className={`p-8 rounded-3xl border border-dashed text-center space-y-2 ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                    <BellRing size={24} className="mx-auto opacity-30" />
                    <p className="text-xs font-medium italic">No active reminders</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Closed Reminders */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <h2 className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Closed Reminders</h2>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isDarkMode ? 'bg-emerald-900 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
              }`}>{reminders.filter(r => !r.isActive).length}</span>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {reminders.filter(r => !r.isActive).length > 0 ? (
                  reminders.filter(r => !r.isActive).map(reminder => (
                    <motion.div
                      layout
                      key={reminder.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md relative group opacity-60 grayscale-[0.5] ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-bold text-sm mb-0.5 line-through ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{reminder.title}</h3>
                          <div className="flex items-center gap-2">
                            <p className={`text-[10px] flex items-center gap-1 font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Calendar size={10} /> {new Date(reminder.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            {(() => {
                              const timeStatus = getTimeRemaining(reminder.date);
                              const isOverdue = timeStatus.includes('ago') || timeStatus === 'Yesterday';
                              return (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter opacity-70 ${
                                  isOverdue
                                    ? (isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600')
                                    : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')
                                }`}>
                                  {timeStatus}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => confirmDelete(reminder.id, 'reminder')}
                            className={`p-1.5 rounded-lg border text-rose-400/50 hover:bg-rose-50 hover:text-rose-600 transition-all ${
                              isDarkMode ? 'border-slate-800' : 'border-slate-100'
                            }`}
                          >
                            <Trash2 size={12} />
                          </button>
                          <button 
                            onClick={() => toggleReminderStatus(reminder.id)}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/20`}
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-relaxed mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{reminder.description}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className={`p-8 rounded-3xl border border-dashed text-center space-y-2 ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                    <CheckCircle2 size={24} className="mx-auto opacity-30" />
                    <p className="text-xs font-medium italic">No closed reminders</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    ) : null}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showLeaveSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaveSummary(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative rounded-[2.5rem] shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`p-6 border-b flex items-center justify-between ${
                isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                    isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Leave Usage Summary</h3>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Year-by-year approved breakdown</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLeaveSummary(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                {leaveSummaryData.length > 0 ? (
                  leaveSummaryData.map(([year, types]) => (
                    <div key={year} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                          isDarkMode ? 'text-slate-300 bg-slate-800' : 'text-slate-900 bg-slate-100'
                        }`}>{year} Records</span>
                        <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(types).map(([type, days]) => {
                          const colorClass = type === 'Casual Leave' 
                                             ? (isDarkMode ? 'text-indigo-400 bg-indigo-950/30 border-indigo-900/50' : 'text-indigo-600 bg-indigo-50 border-indigo-100') : 
                                             type === 'Medical Leave' 
                                             ? (isDarkMode ? 'text-rose-400 bg-rose-950/30 border-rose-900/50' : 'text-rose-600 bg-rose-50 border-rose-100') : 
                                             (isDarkMode ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' : 'text-emerald-600 bg-emerald-50 border-emerald-100');
                          return (
                            <div key={type} className={`p-4 rounded-2xl border flex flex-col items-center justify-center group transition-all hover:shadow-md ${colorClass}`}>
                              <span className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-80">{type}</span>
                              <span className="text-xl font-bold leading-none">{days} <span className="text-[10px] uppercase">Days</span></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      isDarkMode ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-slate-50 text-slate-300'
                    }`}>
                      <History size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No approved data found</p>
                      <p className="text-xs text-slate-400">Apply and approve leaves to see summary analysis.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`p-6 border-t ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <button 
                  onClick={() => setShowLeaveSummary(false)}
                  className={`w-full font-bold py-3 rounded-2xl shadow-xl transition-all uppercase text-[11px] tracking-widest ${
                    isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-950/40' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  CLOSE SUMMARY
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Are you sure?</h3>
                <p className="text-sm text-slate-500">
                  This action cannot be undone. This will permanently delete the selected item.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DPS Schedule Modal */}
      <AnimatePresence>
        {viewingScheduleId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingScheduleId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div>
                  <h3 className="font-bold text-lg">DPS Profit Schedule</h3>
                  <p className="text-xs opacity-80">
                    {dpsAccounts.find(a => a.id === viewingScheduleId)?.bankName} • 
                    ৳{dpsAccounts.find(a => a.id === viewingScheduleId)?.monthlyDeposit.toLocaleString()}/month
                  </p>
                </div>
                <button 
                  onClick={() => setViewingScheduleId(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="text-slate-400 uppercase tracking-tighter border-b border-slate-100">
                      <th className="py-2 px-1">মাস</th>
                      <th className="py-2 px-1">কিস্তি (৳)</th>
                      <th className="py-2 px-1">আসল জমা (৳)</th>
                      <th className="py-2 px-1">মুনাফা (৳)</th>
                      <th className="py-2 px-1 text-right">ব্যালেন্স (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const acc = dpsAccounts.find(a => a.id === viewingScheduleId);
                      if (!acc) return null;
                      const { schedule } = calculateDpsMaturity(acc.monthlyDeposit, acc.periodYears, acc.profitPercentage);
                      return schedule.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-1 font-medium text-slate-500">{row.month}</td>
                          <td className="py-2 px-1 text-slate-600">{row.deposit.toLocaleString()}</td>
                          <td className="py-2 px-1 text-slate-600 font-bold">{row.totalPrincipal.toLocaleString()}</td>
                          <td className="py-2 px-1 text-emerald-600 font-bold">+{row.monthlyProfit.toLocaleString()}</td>
                          <td className="py-2 px-1 text-indigo-600 font-bold text-right">{row.balance.toLocaleString()}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setViewingScheduleId(null)}
                  className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWelcome(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-6 overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-60" />
              <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60" />

              <motion.div 
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 rotate-3"
              >
                <div className="relative">
                  <Home size={40} className="relative z-10" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white rounded-full blur-md"
                  />
                </div>
              </motion.div>

              <div className="space-y-2">
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black text-slate-900 tracking-tight"
                >
                  Welcome Back!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-medium text-slate-500 leading-relaxed"
                >
                  Ready to manage your finances and track your information?
                </motion.p>
              </div>

              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWelcome(false)}
                className="w-full py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all text-sm uppercase tracking-widest"
              >
                Get Started
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
