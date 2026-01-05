
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Transaction, ViewState, TransactionType, Category, AppData, Wallet, WalletType, Debt } from './types';
import * as StorageService from './services/storage';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { DebtView } from './components/DebtView';
import { AnalyticsView } from './components/AnalyticsView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Sidebar } from './components/Sidebar';
import { 
  Trash2, Coffee, Car, 
  ChevronDown, 
  Utensils, Cookie, CreditCard, Banknote, X, PlusCircle, Check,
  Menu, ShoppingBag, Zap, Music, Bike, MoreHorizontal, Activity, Landmark,
  Briefcase, GraduationCap, ArrowRightLeft, UtensilsCrossed
} from 'lucide-react';

// --- Helpers ---

const CategoryIcon = ({ category, color }: { category: string, color?: string }) => {
  const props = { size: 20, strokeWidth: 2.5 };
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
    <div className="h-full w-full bg-dark p-5 pt-safe space-y-6">
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

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addModalData, setAddModalData] = useState<{ type: TransactionType, category?: string, amount?: number, note?: string }>({ type: TransactionType.EXPENSE });
  const [data, setData] = useState<AppData | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

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
        else if (isAddOpen) { setIsAddOpen(false); handled = true; } 
        else if (deleteConfirmation.isOpen) { setDeleteConfirmation({ isOpen: false, id: null }); handled = true; } 
        else if (view !== 'dashboard') { setView('dashboard'); handled = true; }

        if (handled) window.history.pushState(null, '', window.location.href);
     };

     window.addEventListener('popstate', onPopState);
     return () => window.removeEventListener('popstate', onPopState);
  }, [isSidebarOpen, isWalletModalOpen, isAddOpen, deleteConfirmation, view]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => prev ? ({ ...prev, ...newData }) : null);
  };

  const handleAddWallet = (name: string, type: WalletType, target: number) => {
    if (!data) return;
    const newWallet: Wallet = { id: Date.now().toString(), name, type, targetAmount: target };
    updateData({ wallets: [...data.wallets, newWallet], currentWalletId: newWallet.id });
    setIsWalletModalOpen(false);
  };

  const handleAddTransaction = (t: Transaction) => {
    if (!data) return;
    updateData({ transactions: [t, ...data.transactions] });
    setIsAddOpen(false);
  };

  const handleAddDebt = (debt: Debt) => {
      if (!data) return;
      updateData({ debts: [debt, ...data.debts] });
  };

  const handleTransfer = (amount: number, fromId: string, toId: string, note: string, dateStr: string) => {
    if (!data) return;
    const timestamp = Date.now();
    const dateTime = getDateTime(dateStr);
    const txOut: Transaction = { id: timestamp.toString(), amount, type: TransactionType.EXPENSE, category: Category.TRANSFER, date: dateTime, note: `To: ${data.wallets.find(w => w.id === toId)?.name} - ${note}`, walletId: fromId };
    const txIn: Transaction = { id: (timestamp + 1).toString(), amount, type: TransactionType.INCOME, category: Category.TRANSFER, date: dateTime, note: `From: ${data.wallets.find(w => w.id === fromId)?.name} - ${note}`, walletId: toId };
    updateData({ transactions: [txIn, txOut, ...data.transactions] });
    setIsAddOpen(false);
  };

  const openAddModal = (e?: React.MouseEvent, type: TransactionType = TransactionType.EXPENSE, quickData?: { category?: string, amount?: number, note?: string }) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setAddModalData({ type, ...quickData });
      setIsAddOpen(true);
  };

  if (!data) return <AppSkeleton />;

  return (
    <div className="h-[100dvh] w-full bg-dark text-main font-sans selection:bg-primary/30 transition-colors duration-300 flex flex-col overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} data={data} updateData={updateData} onViewChange={setView} />
      
      {/* Header */}
      <div className="flex-none pt-safe pt-2 px-5 pb-4 shadow-sm border-b border-white/5 z-40 glass">
         <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-muted hover:text-main rounded-full hover:bg-surface transition-colors active:scale-95 duration-200">
                   <Menu size={24} />
                 </button>
                 <div className="flex flex-col items-start">
                      <span className="text-[10px] text-muted font-medium uppercase tracking-wider">Welcome back</span>
                      <h1 className="text-lg font-bold text-main tracking-wide leading-none">{data.profile.name}</h1>
                 </div>
             </div>
             <button onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-2 bg-surface hover:bg-surface/80 active:scale-95 transition-all py-1.5 px-3 rounded-full border border-white/10 max-w-[120px]">
                 <span className="text-xs font-semibold text-main truncate">{data.wallets.find(w => w.id === data.currentWalletId)?.name}</span>
                 <ChevronDown size={14} className="text-muted shrink-0" />
             </button>
         </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto overflow-hidden relative pb-32">
        <div className={`h-full w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'dashboard' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
            <div className="h-full overflow-y-auto no-scrollbar p-5">
                <DashboardView data={data} setView={setView} updateData={updateData} formatMoney={formatMoney} CategoryIcon={CategoryIcon} onAddTransactionRequest={(t, q) => openAddModal(undefined, t, q)} />
            </div>
        </div>

        <div className={`h-full w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'history' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <HistoryView data={data} onRequestDelete={(id) => setDeleteConfirmation({ isOpen: true, id })} formatMoney={formatMoney} CategoryIcon={CategoryIcon} />
            </div>
        </div>

         <div className={`h-full w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'debts' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <DebtView data={data} updateData={updateData} formatMoney={formatMoney} onSettleTransaction={handleAddTransaction} />
            </div>
        </div>

        <div className={`h-full w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'analytics' ? 'opacity-100' : 'opacity-0 scale-95 absolute top-0 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar p-5">
                <AnalyticsView data={data} formatMoney={formatMoney} />
            </div>
        </div>
      </main>
      
      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        data={data} 
        onAdd={handleAddTransaction} 
        onTransfer={handleTransfer} 
        onAddDebt={handleAddDebt} 
        getDateTime={getDateTime} 
        CategoryIcon={CategoryIcon} 
        initialData={addModalData} 
      />
      
      <DeleteConfirmationModal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} onConfirm={() => { if (deleteConfirmation.id) { updateData({ transactions: data.transactions.filter(t => t.id !== deleteConfirmation.id) }); setDeleteConfirmation({ isOpen: false, id: null }); }}} />

       {isWalletModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWalletModalOpen(false)}></div>
                <div className="relative bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
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
      
      <NavBar currentView={view} onChangeView={setView} onAddClick={(e) => openAddModal(e, TransactionType.EXPENSE)} />
    </div>
  );
}