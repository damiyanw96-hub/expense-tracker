
import React, { useState, useRef } from 'react';
import { TrendingUp, Eye, EyeOff, Target, Zap, RotateCw, Check, X } from 'lucide-react';
import { Transaction, TransactionType, AppData, Wallet, CategoryItem, Category } from '../types';

interface DashboardProps {
    data: AppData;
    setView: (view: any) => void;
    updateData: (data: Partial<AppData>) => void;
    formatMoney: (val: number, sym: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
    onAddTransactionRequest: (type: TransactionType, quickData?: any) => void;
    onEditTransaction: (t: Transaction) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ data, setView, updateData, formatMoney, CategoryIcon, onAddTransactionRequest, onEditTransaction }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState('');

    const pullStart = useRef<number>(0);
    const pullRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const walletTransactions = data.transactions.filter((t: Transaction) => t.walletId === data.currentWalletId);
    
    // Stats
    const totalIncome = walletTransactions.filter((t: Transaction) => t.type === TransactionType.INCOME).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const totalExpense = walletTransactions.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Daily Budget Logic
    const today = new Date().toISOString().split('T')[0];
    const dailySpent = data.transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(today))
        .reduce((sum, t) => sum + t.amount, 0);
    const dailyLimit = data.profile.dailyGoal || 0;
    const dailyProgress = dailyLimit > 0 ? Math.min((dailySpent / dailyLimit) * 100, 100) : 0;
    const isOverBudget = dailyLimit > 0 && dailySpent > dailyLimit;

    // Frequent Transactions (Quick Actions) Logic
    const getSmartQuickActions = () => {
        const counts: Record<string, number> = {};
        walletTransactions.slice(0, 150).forEach(t => {
            if (t.type === TransactionType.EXPENSE) {
                counts[t.category] = (counts[t.category] || 0) + 1;
            }
        });

        const sortedCategories = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);

        const hour = new Date().getHours();
        let timeSuggestion = Category.SNACKS;

        if (hour >= 5 && hour < 11) timeSuggestion = Category.BREAKFAST;
        else if (hour >= 11 && hour < 16) timeSuggestion = Category.LUNCH;
        else if (hour >= 16 && hour < 21) timeSuggestion = Category.DINNER;
        else timeSuggestion = Category.SNACKS;

        const actions: string[] = [];
        
        for (const cat of sortedCategories) {
            if (actions.length < 2 && cat !== timeSuggestion) actions.push(cat);
        }

        actions.push(timeSuggestion);

        for (const cat of sortedCategories) {
            if (actions.length < 4 && !actions.includes(cat)) actions.push(cat);
        }

        const defaults = [Category.TRANSPORT, Category.SHOPPING, Category.BILLS];
        for (const def of defaults) {
            if (actions.length < 4 && !actions.includes(def)) actions.push(def);
        }
        
        return actions.slice(0, 4);
    };
    
    const quickActions = getSmartQuickActions();

    // Budget Status
    const expensesByCategory = walletTransactions
        .filter((t: Transaction) => t.type === TransactionType.EXPENSE)
        .reduce((acc: any, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    
    const budgetAlerts = Object.entries(data.settings.budgetLimits || {})
        .map(([cat, limit]: any) => ({ cat, limit, spent: expensesByCategory[cat] || 0 }))
        .filter((b: any) => b.limit > 0 && b.spent > b.limit * 0.8)
        .sort((a: any, b: any) => (b.spent/b.limit) - (a.spent/a.limit));

    // Goal Wallets
    const goalWallets = data.wallets.filter((w: Wallet) => w.type === 'GOAL');
    const currentWallet = data.wallets.find((w: Wallet) => w.id === data.currentWalletId);
    
    const goalProgress = currentWallet?.type === 'GOAL' ? Math.min((balance / (currentWallet.targetAmount || 1)) * 100, 100) : 0;

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (e.detail === 2) {
             updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } });
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const scroller = (e.target as HTMLElement).closest('.overflow-y-auto');
        if (scroller && scroller.scrollTop === 0) {
            pullStart.current = e.targetTouches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pullStart.current) return;
        const touchY = e.targetTouches[0].clientY;
        const diff = touchY - pullStart.current;

        if (diff > 0 && diff < 200) {
             if (pullRef.current) {
                 pullRef.current.style.transition = 'none';
                 pullRef.current.style.transform = `translateY(${diff * 0.4}px)`;
                 pullRef.current.style.opacity = `${Math.min(diff / 100, 1)}`;
                 pullRef.current.style.transform += ` rotate(${diff * 2}deg)`;
             }
        }
    };

    const handleTouchEnd = () => {
        if (!pullStart.current) return;
        
        if (pullRef.current) {
             pullRef.current.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
             
             const currentOpacity = parseFloat(pullRef.current.style.opacity || '0');
             
             if (currentOpacity > 0.6) {
                 setRefreshing(true);
                 pullRef.current.style.transform = 'translateY(40px) rotate(0deg)';
                 pullRef.current.style.opacity = '1';
                 
                 setTimeout(() => {
                     setRefreshing(false);
                     if (pullRef.current) {
                        pullRef.current.style.transform = 'translateY(0px)';
                        pullRef.current.style.opacity = '0';
                     }
                 }, 1500);
             } else {
                 pullRef.current.style.transform = 'translateY(0px)';
                 pullRef.current.style.opacity = '0';
             }
        }
        pullStart.current = 0;
    };

    const saveGoal = () => {
        const val = parseFloat(tempGoal);
        if (!isNaN(val) && val >= 0) {
            updateData({ profile: { ...data.profile, dailyGoal: val }});
        }
        setIsEditingGoal(false);
    };

    return (
      <div 
        ref={containerRef}
        className="space-y-6 mt-0 relative min-h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
            {/* Pull Indicator */}
            <div ref={pullRef} className="absolute top-0 left-0 w-full flex justify-center -mt-10 pointer-events-none z-0 opacity-0">
                <div className={`p-2.5 rounded-full bg-surface shadow-xl border border-white/10 ${refreshing ? 'animate-spin' : ''}`}>
                    <RotateCw size={18} className="text-primary" />
                </div>
            </div>

            {/* Minimalist Balance Card */}
            <div onClick={handleDoubleTap} className="relative rounded-3xl p-6 overflow-hidden select-none cursor-pointer group z-10 transition-transform active:scale-[0.99] bg-[#1c1c1e] border border-white/5 flex flex-col gap-8 shadow-sm">
               
               {/* Header: Label + Privacy */}
               <div className="flex justify-between items-center relative z-10">
                   <p className="text-xs text-muted font-bold uppercase tracking-wider">
                       {currentWallet?.type === 'GOAL' ? 'Goal Balance' : 'Current Balance'}
                   </p>
                   <button onClick={(e) => { e.stopPropagation(); updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } }) }} className="text-muted hover:text-white transition-colors p-1 active:scale-90">
                       {data.settings.privacyMode ? <Eye size={16}/> : <EyeOff size={16}/>}
                   </button>
               </div>
               
               {/* Balance */}
               <div className="relative z-10">
                   <h1 className="text-4xl font-sans font-bold text-white tracking-tight">
                       {!data.settings.privacyMode ? formatMoney(balance, data.settings.currencySymbol) : '•••• ••••'}
                   </h1>
               </div>

               {/* Buttons inside card - Minimalist */}
               {currentWallet?.type !== 'GOAL' ? (
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.INCOME); }} 
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex items-center justify-between transition-colors active:scale-95 group/btn"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Income</span>
                                <span className="text-sm font-bold text-white">
                                    {!data.settings.privacyMode ? formatMoney(totalIncome, data.settings.currencySymbol) : '••••'}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <TrendingUp size={16} />
                            </div>
                        </button>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.EXPENSE); }} 
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex items-center justify-between transition-colors active:scale-95 group/btn"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Expense</span>
                                <span className="text-sm font-bold text-white">
                                    {!data.settings.privacyMode ? formatMoney(totalExpense, data.settings.currencySymbol) : '••••'}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <TrendingUp size={16} className="rotate-180" />
                            </div>
                        </button>
                    </div>
               ) : (
                    <div className="mt-auto">
                        <div className="flex justify-between text-xs text-muted mb-2 font-medium">
                            <span>{Math.round(goalProgress)}% Achieved</span>
                            <span>Target: {formatMoney(currentWallet.targetAmount || 0, data.settings.currencySymbol)}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${goalProgress}%` }} />
                        </div>
                    </div>
               )}
            </div>

            {/* Quick Actions - Minimalist */}
            {quickActions.length > 0 && (
                <div className="px-1">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 pl-1">Quick Add</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {quickActions.map((category, idx) => (
                            <button 
                                key={idx}
                                onClick={() => onAddTransactionRequest(TransactionType.EXPENSE, { category })}
                                className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-all opacity-80 hover:opacity-100"
                            >
                                <div className="w-14 h-14 bg-[#1c1c1e] rounded-2xl border border-white/5 flex items-center justify-center shadow-sm">
                                    <CategoryIcon category={category} color={data.categories.find(c => c.name === category)?.color} />
                                </div>
                                <span className="text-[10px] font-medium text-muted truncate max-w-full">{category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Budget - Minimalist */}
            <div className={`bg-[#1c1c1e] border border-white/5 rounded-3xl p-5 flex flex-col gap-3 transition-all duration-500 ${isOverBudget ? 'border-rose-500/30' : ''}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isOverBudget ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                            <Zap size={18} />
                        </div>
                        <span className="text-sm font-bold text-main">Daily Budget</span>
                    </div>

                    {isEditingGoal ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <input 
                                autoFocus
                                type="number" 
                                className="w-20 bg-black/20 text-main text-xs px-2 py-1.5 rounded-lg outline-none border border-primary/50"
                                value={tempGoal}
                                onChange={e => setTempGoal(e.target.value)}
                                placeholder="Amount"
                            />
                            <button onClick={saveGoal} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg"><Check size={14}/></button>
                            <button onClick={() => setIsEditingGoal(false)} className="p-1.5 bg-white/5 text-muted rounded-lg"><X size={14}/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setTempGoal(dailyLimit > 0 ? dailyLimit.toString() : ''); setIsEditingGoal(true); }} 
                            className="text-xs font-bold text-muted hover:text-white transition-colors"
                        >
                            {dailyLimit > 0 ? `${formatMoney(dailySpent, data.settings.currencySymbol)} / ${formatMoney(dailyLimit, data.settings.currencySymbol)}` : 'Set Limit'}
                        </button>
                    )}
                </div>
                
                {!isEditingGoal && dailyLimit > 0 && (
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
                        <div className={`h-full transition-all duration-700 ease-out rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${dailyProgress}%` }} />
                    </div>
                )}
            </div>

            {/* Recent List - Flat Design */}
            <div className="pb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-bold text-main">Recent</h2>
                  <button onClick={() => setView('history')} className="text-xs text-primary font-bold active:opacity-70">See All</button>
              </div>
              <div className="space-y-0 border-t border-white/5">
                  {walletTransactions.slice(0, 5).map((t: Transaction) => (
                      <div key={t.id} onClick={() => onEditTransaction(t)} className="py-4 px-1 flex items-center justify-between active:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-white/5">
                                  <CategoryIcon category={t.category} color={data.categories.find((c: CategoryItem) => c.name === t.category)?.color} />
                              </div>
                              <div>
                                  <p className="font-semibold text-main text-sm leading-tight">{t.note || t.category}</p>
                                  <p className="text-[11px] text-muted mt-0.5">{new Date(t.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-secondary' : 'text-main'}`}>
                              {t.type === TransactionType.INCOME ? '+' : ''}{formatMoney(t.amount, data.settings.currencySymbol)}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
      </div>
    );
};
