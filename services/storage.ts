import { AppData, TransactionType, Category, CategoryItem } from '../types';

const STORAGE_KEY = 'zenwallet_v4_data';

const DEFAULT_CATEGORIES: CategoryItem[] = [
    { id: 'cat_salary', name: Category.SALARY, type: TransactionType.INCOME, color: '#10b981', isSystem: true },
    { id: 'cat_gig', name: Category.GIG, type: TransactionType.INCOME, color: '#3b82f6', isSystem: true },
    { id: 'cat_tuition', name: Category.TUITION, type: TransactionType.INCOME, color: '#8b5cf6', isSystem: true },
    { id: 'cat_loan_in', name: Category.LOAN, type: TransactionType.INCOME, color: '#f59e0b', isSystem: true },
    
    { id: 'cat_break', name: Category.BREAKFAST, type: TransactionType.EXPENSE, color: '#fb923c', isSystem: true },
    { id: 'cat_dinner', name: Category.DINNER, type: TransactionType.EXPENSE, color: '#f97316', isSystem: true },
    { id: 'cat_fp', name: Category.FOODPANDA, type: TransactionType.EXPENSE, color: '#ef4444', isSystem: true },
    { id: 'cat_snack', name: Category.SNACKS, type: TransactionType.EXPENSE, color: '#fcd34d', isSystem: true },
    { id: 'cat_loan_out', name: Category.LOAN_PAYMENT, type: TransactionType.EXPENSE, color: '#ef4444', isSystem: true },
    { id: 'cat_trans', name: Category.TRANSPORT, type: TransactionType.EXPENSE, color: '#38bdf8', isSystem: true },
    { id: 'cat_shop', name: Category.SHOPPING, type: TransactionType.EXPENSE, color: '#ec4899', isSystem: true },
    { id: 'cat_bill', name: Category.BILLS, type: TransactionType.EXPENSE, color: '#eab308', isSystem: true },
    { id: 'cat_ent', name: Category.ENTERTAINMENT, type: TransactionType.EXPENSE, color: '#a855f7', isSystem: true },
    { id: 'cat_health', name: Category.HEALTH, type: TransactionType.EXPENSE, color: '#10b981', isSystem: true },
    { id: 'cat_other', name: Category.OTHER, type: TransactionType.EXPENSE, color: '#94a3b8', isSystem: true },
    { id: 'cat_transfer', name: Category.TRANSFER, type: TransactionType.EXPENSE, color: '#64748b', isSystem: true },
];

const DEFAULT_DATA: AppData = {
  wallets: [{ id: 'main', name: 'Main Wallet', type: 'STANDARD' }],
  transactions: [],
  debts: [],
  categories: DEFAULT_CATEGORIES,
  currentWalletId: 'main',
  settings: {
    theme: 'indigo',
    darkMode: true,
    notificationsEnabled: false,
    privacyMode: false,
    lastOpened: new Date().toISOString(),
    currencySymbol: 'BDT',
    budgetLimits: {}
  },
  profile: {
    name: 'User',
    monthlyGoal: 5000
  }
};

export const getAppData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_DATA;
    
    // Merge with default to ensure new fields exist for existing users
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_DATA,
      ...parsed,
      wallets: parsed.wallets.map((w: any) => ({ ...w, type: w.type || 'STANDARD' })),
      categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
      debts: parsed.debts || [],
      settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
      profile: { ...DEFAULT_DATA.profile, ...parsed.profile }
    };
  } catch (e) {
    console.error("Failed to load app data", e);
    return DEFAULT_DATA;
  }
};

export const saveAppData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const seedInitialData = (): AppData => {
  return getAppData();
};