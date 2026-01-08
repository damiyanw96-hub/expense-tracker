
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Transaction, ViewState, TransactionType, Category, AppData, Wallet, WalletType, Debt } from './types';
import * as StorageService from './services/storage';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { DebtView } from './components/DebtView';
import { AnalyticsView } from './components/AnalyticsView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Sidebar } from './components/Sidebar';
import { AccountView, BudgetsView, CategoriesView, GeneralSettingsView } from './components/SettingsPages';
import { 
  Trash2, Coffee, Car, 
  ChevronDown, 
  Utensils, Cookie, CreditCard, Banknote, X, PlusCircle, Check,
  Menu, ShoppingBag, Zap, Music, Bike, MoreHorizontal, Activity, Landmark,
  Briefcase, GraduationCap, ArrowRightLeft, UtensilsCrossed, RotateCcw
} from 'lucide-react';

// --- Helpers ---

const CategoryIcon = ({ category, color }: { category: string, color?: string }) => {
  const props = { size: 20, strokeWidth: 2 };
  const style = color ? { color } : {};

  switch (category) {
    case Category.SALARY: return <Banknote {...props} className="text-emerald-400" />;
    case Category.GIG: return <Briefcase {...props} className="text-blue-400" />;
    case Category.TUITION: return <GraduationCap {...props} className="text-purple-400" />;
    case Category.LOAN: return <Landmark {...props} className="text-amber-400" />;
    case Category.BREAKFAST: return <Coffee {...props} className="text-orange-400" />;
    case Category.LUNCH: return <UtensilsCrossed {...props} className="text-orange-500" />;
    case Category.DINNER: return <Utensils {...props} className="text-rose-500" />;
    case Category.FOODPANDA: return <Bike {...props} className="text-rose-500" />;
    case Category.SNACKS: return <Cookie {...props} className="text-amber-300" />;
    case Category.LOAN_PAYMENT: return <CreditCard {...props} className="text-red-400" />;
    case Category.TRANSPORT: return <Car {...props} className="text-sky-400" />;
    case Category.SHOPPING: return <ShoppingBag {...props} className="text-pink-400" />;
    case Category.BILLS: return <Zap {...props} className="text-yellow-400" />;
    case Category.ENTERTAINMENT: return <Music {...props} className="text-purple-400" />;
    case Category.HEALTH: return <Activity {...props} className="text-emerald-400" />;
    case Category.TRANSFER: return <ArrowRightLeft {...props} className="text-main" />;
    default: return <div style={style}><MoreHorizontal {...props} className={!color ? "text-muted" : ""} /></div>;
  }
};

const getDateTime = (dateStr: string) => {
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  return date.toISOString();
};

const formatMoney = (amount: number, symbol: string) => {
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: symbol || 'BDT',
        minimumFractionDigits: 0 
      }).format(amount);
    } catch (e) {
      return `৳${amount.toFixed(0)}`;
    }
};

// --- Skeletons ---
const SkeletonPulse = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-surface/50 ${className}`} />
);

const AppSkeleton = () => (
    <div className="h-full w-full bg-dark p-5 pt-safe space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                    <SkeletonPulse className="w-20 h-3 rounded" />
                    <SkeletonPulse className="w-32 h-5 rounded" />
                </div>
            </div>
             <SkeletonPulse className="w-24 h-8 rounded-full" />
        </div>
        <SkeletonPulse className="w-full h-48 rounded-3xl" />
        <div className="flex gap-4">
             <SkeletonPulse className="flex-1 h-20 rounded-2xl" />
             <SkeletonPulse className="flex-1 h-20 rounded-2xl" />
        </div>
        <div className="space-y-4">
            <SkeletonPulse className="w-32 h-4 rounded" />
            <SkeletonPulse className="w-full h-16 rounded-2xl" />
            <SkeletonPulse className="w-full h-16 rounded-2xl" />
            <SkeletonPulse className="w-full h-16 rounded-2xl" />
        </div>
    </div>
);

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-card w-full max-w-xs rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-main mb-2">Delete Item?</h3>
                    <p className="text-sm text-muted mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-sm hover:bg-black/10 transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Toast Component ---
const Toast = ({ message, onUndo, visible }: { message: string, onUndo: () => void, visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-[#2c2c2e] text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10">
                <span className="text-sm font-medium">{message}</span>
                <button 
                    onClick={onUndo}
                    className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                    <RotateCcw size={12} />
                    Undo
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addModalData, setAddModalData] = useState<{ type: TransactionType, category?: string, amount?: number, note?: string }>({ type: TransactionType.EXPENSE });
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const [data, setData] = useState<AppData | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<{ past: AppData[], future: AppData[] }>({ past: [], future: [] });
  const MAX_HISTORY = 30;

  // Toast State
  const [toast, setToast] = useState<{ message: string, timer?: any } | null>(null);

  useEffect(() => {
    // Load from IndexedDB
    const load = async () => {
        const start = Date.now();
        const d = await StorageService.getAppData();
        const end = Date.now();
        if (end - start < 300) {
            await new Promise(r => setTimeout(r, 400)); 
        }
        setData(d);
    };
    load();
  }, []);

  useEffect(() => {
    if (data) {
      StorageService.saveAppData(data);
      document.body.className = `theme-${data.settings.theme} ${data.settings.darkMode ? '' : 'light-mode'}`;
    }
  }, [data]);

  // Back Button / History Management
  useEffect(() => {
     window.history.pushState(null, '', window.location.href);
     const onPopState = (e: PopStateEvent) => {
        let handled = false;
        
        // Priority checks for back button
        if (isSidebarOpen) { setIsSidebarOpen(false); handled = true; } 
        else if (isWalletModalOpen) { setIsWalletModalOpen(false); handled = true; } 
        else if (isAddOpen) { setIsAddOpen(false); setEditingTx(null); handled = true; } 
        else if (deleteConfirmation.isOpen) { setDeleteConfirmation({ isOpen: false, id: null }); handled = true; } 
        else if (view !== 'dashboard') { setView('dashboard'); handled = true; }

        if (handled) window.history.pushState(null, '', window.location.href);
     };

     window.addEventListener('popstate', onPopState);
     return () => window.removeEventListener('popstate', onPopState);
  }, [isSidebarOpen, isWalletModalOpen, isAddOpen, deleteConfirmation, view]);

  const showToast = (message: string) => {
      if (toast?.timer) clearTimeout(toast.timer);
      const timer = setTimeout(() => setToast(null), 4000);
      setToast({ message, timer });
  };

  const updateData = (newData: Partial<AppData>, saveHistory = true) => {
    setData(currentData => {
        if (!currentData) return null;
        
        if (saveHistory) {
            setHistory(prev => ({
                past: [...prev.past, currentData].slice(-MAX_HISTORY),
                future: []
            }));
        }
        
        return { ...currentData, ...newData };
    });
  };

  const handleUndo = () => {
      if (history.past.length === 0) return;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      
      setData(current => {
          if (!current) return null;
          setHistory(prev => ({
              past: newPast,
              future: [current, ...prev.future]
          }));
          return previous;
      });
      setToast(null); // Dismiss toast on undo
  };

  const handleRedo = () => {
      if (history.future.length === 0) return;
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      
      setData(current => {
          if (!current) return null;
          setHistory(prev => ({
              past: [...prev.past, current],
              future: newFuture
          }));
          return next;
      });
  };

  const handleOnboardingComplete = (name: string, balance: number, dailyGoal: number) => {
      if (!data) return;
      
      let newTransactions = [...data.transactions];
      
      // Create initial balance transaction if amount > 0
      if (balance > 0) {
          const initTx: Transaction = {
              id: 'init_balance_' + Date.now(),
              amount: balance,
              type: TransactionType.INCOME,
              category: 'Other',
              date: new Date().toISOString(),
              note: 'Initial Balance Adjustment',
              walletId: data.currentWalletId
          };
          newTransactions = [initTx, ...newTransactions];
      }

      updateData({
          profile: { ...data.profile, name, dailyGoal },
          settings: { ...data.settings, hasOnboarded: true },
          transactions: newTransactions
      }, false); 
  };

  const handleAddWallet = (name: string, type: WalletType, target: number) => {
    if (!data) return;
    const newWallet: Wallet = { id: Date.now().toString(), name, type, targetAmount: target };
    updateData({ wallets: [...data.wallets, newWallet], currentWalletId: newWallet.id });
    setIsWalletModalOpen(false);
    showToast(`Created wallet "${name}"`);
  };

  const handleAddTransaction = (t: Transaction) => {
    if (!data) return;
    updateData({ transactions: [t, ...data.transactions] });
    setIsAddOpen(false);
    showToast('Transaction added');
  };
  
  const handleEditTransaction = (updatedTx: Transaction) => {
      if (!data) return;
      const updatedTransactions = data.transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
      updateData({ transactions: updatedTransactions });
      setIsAddOpen(false);
      setEditingTx(null);
      showToast('Transaction updated');
  };

  const handleAddDebt = (debt: Debt) => {
      if (!data) return;
      updateData({ debts: [debt, ...data.debts] });
      showToast('Debt record added');
  };

  const handleTransfer = (amount: number, fromId: string, toId: string, note: string, dateStr: string) => {
    if (!data) return;
    const timestamp = Date.now();
    const dateTime = getDateTime(dateStr);
    const txOut: Transaction = { id: timestamp.toString(), amount, type: TransactionType.EXPENSE, category: Category.TRANSFER, date: dateTime, note: `To: ${data.wallets.find(w => w.id === toId)?.name} - ${note}`, walletId: fromId };
    const txIn: Transaction = { id: (timestamp + 1).toString(), amount, type: TransactionType.INCOME, category: Category.TRANSFER, date: dateTime, note: `From: ${data.wallets.find(w => w.id === fromId)?.name} - ${note}`, walletId: toId };
    updateData({ transactions: [txIn, txOut, ...data.transactions] });
    setIsAddOpen(false);
    showToast('Transfer complete');
  };

  const openAddModal = (e?: React.MouseEvent, type: TransactionType = TransactionType.EXPENSE, quickData?: { category?: string, amount?: number, note?: string }) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setEditingTx(null);
      setAddModalData({ type, ...quickData });
      setIsAddOpen(true);
  };
  
  const openEditModal = (t: Transaction) => {
      setEditingTx(t);
      setIsAddOpen(true);
  };

  const confirmDelete = () => {
    if (deleteConfirmation.id && data) {
        updateData({ transactions: data.transactions.filter(t => t.id !== deleteConfirmation.id) });
        setDeleteConfirmation({ isOpen: false, id: null });
        showToast('Transaction deleted');
    }
  };

  if (!data) return <AppSkeleton />;

  const isMainView = ['dashboard', 'history', 'debts', 'analytics'].includes(view);
  const isFirstUse = data.transactions.length === 0 && !data.settings.hasOnboarded;

  return (
    <div className="h-[100dvh] w-full bg-dark text-main font-sans selection:bg-primary/30 transition-colors duration-300 flex flex-col overflow-hidden relative">
      <OnboardingModal isOpen={!data.settings.hasOnboarded} onComplete={handleOnboardingComplete} />
      
      <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          data={data} 
          updateData={updateData} 
          onViewChange={setView}
      />
      
      {/* Header (Only show on main views) */}
      {isMainView && (
          <div className="flex-none pt-safe pt-2 px-5 pb-4 z-40 bg-dark/80 backdrop-blur-md">
             <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                 <div className="flex items-center gap-3">
                     <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-muted hover:text-main rounded-full hover:bg-surface transition-colors active:scale-95 duration-200">
                       <Menu size={24} />
                     </button>
                     <div className="flex flex-col items-start">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{isFirstUse ? 'Welcome,' : 'Welcome back,'}</span>
                          <h1 className="text-xl font-bold text-main tracking-wide leading-none">{data.profile.name}</h1>
                     </div>
                 </div>
                 <button onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-2 bg-surface hover:bg-surface/80 active:scale-95 transition-all py-1.5 px-3 rounded-full border border-white/5 max-w-[120px]">
                     <span className="text-xs font-semibold text-main truncate">{data.wallets.find(w => w.id === data.currentWalletId)?.name}</span>
                     <ChevronDown size={14} className="text-muted shrink-0" />
                 </button>
             </div>
          </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto overflow-hidden relative pb-[calc(88px+env(safe-area-inset-bottom))]">
        <div className={`h-full w-full transition-all duration-300 ${view === 'dashboard' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
            <div className="h-full overflow-y-auto no-scrollbar p-5">
                <DashboardView 
                    data={data} 
                    setView={setView} 
                    updateData={updateData} 
                    formatMoney={formatMoney} 
                    CategoryIcon={CategoryIcon} 
                    onAddTransactionRequest={(t, q) => openAddModal(undefined, t, q)} 
                    onEditTransaction={openEditModal}
                />
            </div>
        </div>

        <div className={`h-full w-full transition-all duration-300 ${view === 'history' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <HistoryView 
                    data={data} 
                    onRequestDelete={(id) => setDeleteConfirmation({ isOpen: true, id })} 
                    formatMoney={formatMoney} 
                    CategoryIcon={CategoryIcon} 
                    onEditTransaction={openEditModal}
                />
            </div>
        </div>

         <div className={`h-full w-full transition-all duration-300 ${view === 'debts' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <DebtView data={data} updateData={updateData} formatMoney={formatMoney} onSettleTransaction={handleAddTransaction} />
            </div>
        </div>

        <div className={`h-full w-full transition-all duration-300 ${view === 'analytics' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <AnalyticsView data={data} formatMoney={formatMoney} />
            </div>
        </div>

        {/* Full Page Views (Overlays) */}
        {view === 'account' && (
            <div className="absolute inset-0 z-50 bg-dark animate-in slide-in-from-right">
                <AccountView data={data} updateData={updateData} onBack={() => setView('dashboard')} />
            </div>
        )}
        {view === 'budgets' && (
            <div className="absolute inset-0 z-50 bg-dark animate-in slide-in-from-right">
                <BudgetsView data={data} updateData={updateData} onBack={() => setView('dashboard')} />
            </div>
        )}
        {view === 'categories' && (
            <div className="absolute inset-0 z-50 bg-dark animate-in slide-in-from-right">
                <CategoriesView data={data} updateData={updateData} onBack={() => setView('dashboard')} />
            </div>
        )}
        {view === 'settings' && (
            <div className="absolute inset-0 z-50 bg-dark animate-in slide-in-from-right">
                <GeneralSettingsView data={data} updateData={updateData} onBack={() => setView('dashboard')} />
            </div>
        )}
      </main>

      <Toast message={toast?.message || ''} visible={!!toast} onUndo={handleUndo} />
      
      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddOpen} 
        onClose={() => { setIsAddOpen(false); setEditingTx(null); }} 
        data={data} 
        onAdd={handleAddTransaction} 
        onEdit={handleEditTransaction}
        onTransfer={handleTransfer} 
        onAddDebt={handleAddDebt} 
        getDateTime={getDateTime} 
        CategoryIcon={CategoryIcon} 
        initialData={addModalData} 
        editingTransaction={editingTx}
      />
      
      <DeleteConfirmationModal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} onConfirm={confirmDelete} />

       {isWalletModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWalletModalOpen(false)}></div>
                <div className="relative bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 mb-safe">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-main">Select Wallet</h3>
                        <button onClick={() => setIsWalletModalOpen(false)} className="p-1 bg-surface rounded-full text-muted active:scale-90"><X size={20} /></button>
                    </div>
                    <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                        {data.wallets.map(w => (
                            <button key={w.id} onClick={() => { updateData({ currentWalletId: w.id }); setIsWalletModalOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] ${w.id === data.currentWalletId ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-transparent text-muted hover:bg-black/10'}`}>
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-main">{w.name}</span>
                                    {w.type === 'GOAL' && <span className="text-[10px] text-emerald-500 font-bold uppercase">Savings Goal</span>}
                                </div>
                                {w.id === data.currentWalletId && <Check size={18} />}
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('walletName') as HTMLInputElement).value;
                                const isGoal = (form.elements.namedItem('isGoal') as HTMLInputElement).checked;
                                const target = isGoal ? parseFloat((form.elements.namedItem('target') as HTMLInputElement).value || '0') : 0;
                                if(name) handleAddWallet(name, isGoal ? 'GOAL' : 'STANDARD', target);
                            }} className="flex flex-col gap-3">
                            <input name="walletName" placeholder="New Wallet Name" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-main focus:border-primary outline-none" required />
                            <div className="flex items-center gap-3 px-1">
                                <input type="checkbox" id="isGoal" name="isGoal" className="w-4 h-4 rounded-md accent-primary" onChange={(e) => {
                                    const targetInput = document.getElementById('targetInput');
                                    if(targetInput) targetInput.style.display = e.target.checked ? 'block' : 'none';
                                }}/>
                                <label htmlFor="isGoal" className="text-sm text-muted font-medium">This is a Savings Goal</label>
                            </div>
                            <input id="targetInput" name="target" type="number" placeholder="Target Amount" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-main focus:border-primary outline-none hidden" />
                            <button type="submit" className="bg-primary text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"><PlusCircle size={20} /> Create Wallet</button>
                        </form>
                    </div>
                </div>
            </div>
        )}
      
      {isMainView && <NavBar currentView={view} onChangeView={setView} onAddClick={(e) => openAddModal(e, TransactionType.EXPENSE)} />}
    </div>
  );
}
