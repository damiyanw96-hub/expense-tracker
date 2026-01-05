
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export enum Category {
  // Income specific
  LOAN = 'Loan',
  GIG = 'Gig',
  TUITION = 'Tuition',
  SALARY = 'Salary',
  
  // Expense specific
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
  FOODPANDA = 'Foodpanda',
  SNACKS = 'Snacks',
  LOAN_PAYMENT = 'Loan Payment',
  TRANSPORT = 'Transportation',
  SHOPPING = 'Shopping',
  BILLS = 'Bills & Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health & Fitness',
  
  // System
  TRANSFER = 'Transfer',
  OTHER = 'Other'
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
  isSystem?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
  note?: string;
  walletId: string;
}

export type WalletType = 'STANDARD' | 'GOAL';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  targetAmount?: number;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  type: 'I_OWE' | 'OWES_ME';
  note?: string;
  dueDate?: string;
  isSettled: boolean;
}

export type ThemeOption = 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue';

export interface UserSettings {
  theme: ThemeOption;
  darkMode: boolean;
  notificationsEnabled: boolean;
  expenseReminders: boolean; // New
  debtReminders: boolean; // New
  privacyMode: boolean;
  lastOpened: string;
  currencySymbol: string; 
  budgetLimits: Record<string, number>; // Category -> Limit
  hasOnboarded: boolean; // New: For welcome popup
}

export interface UserProfile {
  name: string;
  monthlyGoal: number; // General spending limit
  dailyGoal: number; // Daily spending limit
}

export interface AppData {
  wallets: Wallet[];
  transactions: Transaction[];
  debts: Debt[];
  categories: CategoryItem[];
  currentWalletId: string;
  settings: UserSettings;
  profile: UserProfile;
}

export type ViewState = 'dashboard' | 'history' | 'debts' | 'analytics';
