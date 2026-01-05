
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

            {/* Credit Card Style Balance Hero */}
            <div onClick={handleDoubleTap} className="relative rounded-3xl p-5 overflow-hidden select-none cursor-pointer group z-10 transition-transform active:scale-[0.99] shadow-2xl bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] border border-white/10 flex flex-col gap-6">
               
               {/* Noise & Glow */}
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
               <div className={`absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-3xl rounded-full group-active:scale-110 transition-transform duration-500 ${refreshing ? 'scale-125 opacity-20' : ''}`} />
               
               {/* Header: Label + Privacy */}
               <div className="flex justify-between items-center relative z-10">
                   <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
                       {currentWallet?.type === 'GOAL' ? 'Goal Balance' : 'Total Balance'}
                   </p>
                   <button onClick={(e) => { e.stopPropagation(); updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } }) }} className="text-white/30 hover:text-white transition-colors p-1 active:scale-90">
                       {data.settings.privacyMode ? <Eye size={16}/> : <EyeOff size={16}/>}
                   </button>
               </div>
               
               {/* Balance */}
               <div className="relative z-10">
                   <h1 className="text-4xl font-sans font-bold text-white tracking-tight">
                       {!data.settings.privacyMode ? formatMoney(balance, data.settings.currencySymbol) : '•••• ••••'}
                   </h1>
               </div>

               {/* Buttons inside card */}
               {currentWallet?.type !== 'GOAL' ? (
                    <div className="grid grid-cols-2 gap-3 relative z-10 mt-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.INCOME); }} 
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 group/btn"
                        >
                            <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 group-hover/btn:scale-110 transition-transform">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-wide">Income</span>
                            {!data.settings.privacyMode && <span className="text-xs font-bold text-emerald-400">{formatMoney(totalIncome, data.settings.currencySymbol)}</span>}
                        </button>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.EXPENSE); }} 
                            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 group/btn"
                        >
                            <div className="p-1.5 bg-rose-500/20 rounded-full text-rose-400 group-hover/btn:scale-110 transition-transform">
                                <TrendingUp size={16} className="rotate-180" />
                            </div>
                            <span className="text-[10px] font-bold text-rose-100/70 uppercase tracking-wide">Expense</span>
                            {!data.settings.privacyMode && <span className="text-xs font-bold text-rose-400">{formatMoney(totalExpense, data.settings.currencySymbol)}</span>}
                        </button>
                    </div>
               ) : (
                    <div className="mt-auto">
                        {/* Goal Progress Bar */}
                        <div className="flex justify-between text-xs text-white/50 mb-1.5 font-medium">
                            <span>{Math.round(goalProgress)}% Achieved</span>
                            <span>Target: {formatMoney(currentWallet.targetAmount || 0, data.settings.currencySymbol)}</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${goalProgress}%` }} />
                        </div>
                    </div>
               )}
            </div>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
                <div className="px-1">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 pl-2">Quick Add</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {quickActions.map((category, idx) => (
                            <button 
                                key={idx}
                                onClick={() => onAddTransactionRequest(TransactionType.EXPENSE, { category })}
                                className="glass-card flex flex-col items-center justify-center gap-2 rounded-2xl p-3 active:scale-95 transition-all hover:bg-surface/80"
                            >
                                <div className="p-2.5 bg-black/10 rounded-full text-muted shadow-sm">
                                    <CategoryIcon category={category} color={data.categories.find(c => c.name === category)?.color} />
                                </div>
                                <span className="text-[10px] font-medium text-main truncate max-w-full">{category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Budget */}
            <div className={`glass-card rounded-3xl p-4 flex items-center gap-4 transition-all duration-500 ${isOverBudget ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : ''}`}>
                <div className={`p-3.5 rounded-full shadow-sm ${isOverBudget ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                    <Zap size={22} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-main">Daily Budget</span>
                        
                        {isEditingGoal ? (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
                                <input 
                                    autoFocus
                                    type="number" 
                                    className="w-20 bg-black/20 text-main text-xs px-2 py-1 rounded outline-none border border-primary"
                                    value={tempGoal}
                                    onChange={e => setTempGoal(e.target.value)}
                                    placeholder="Amount"
                                />
                                <button onClick={saveGoal} className="p-1 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30"><Check size={14}/></button>
                                <button onClick={() => setIsEditingGoal(false)} className="p-1 bg-white/5 text-muted rounded hover:bg-white/10"><X size={14}/></button>
                            </div>
                        ) : (
                            dailyLimit > 0 ? (
                                <button onClick={() => { setTempGoal(dailyLimit.toString()); setIsEditingGoal(true); }} className={`text-xs font-bold ${isOverBudget ? 'text-rose-500' : 'text-muted'} hover:text-primary transition-colors`}>
                                    {formatMoney(dailySpent, data.settings.currencySymbol)} / {formatMoney(dailyLimit, data.settings.currencySymbol)}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => { setTempGoal(''); setIsEditingGoal(true); }} 
                                    className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    Set Goal
                                </button>
                            )
                        )}
                    </div>
                    
                    {!isEditingGoal && (
                        <>
                        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden border border-white/5">
                            {dailyLimit > 0 ? (
                                <div className={`h-full transition-all duration-700 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${dailyProgress}%` }} />
                            ) : (
                                <div className="h-full bg-muted/10 w-full" />
                            )}
                        </div>
                        {isOverBudget && <p className="text-[10px] text-rose-500 font-bold mt-1.5 animate-in slide-in-from-top-1">You have exceeded your daily limit!</p>}
                        </>
                    )}
                </div>
            </div>

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider px-2">At Risk Budgets</h3>
                    {budgetAlerts.map((b: any) => (
                        <div key={b.cat} className="bg-surface/50 backdrop-blur-md border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-500/5">
                             <div>
                                 <p className="text-sm font-bold text-main">{b.cat}</p>
                                 <p className="text-xs text-rose-400 font-semibold">{Math.round((b.spent/b.limit)*100)}% Used</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-bold text-main">{formatMoney(b.spent, data.settings.currencySymbol)}</p>
                                 <p className="text-[10px] text-muted">of {formatMoney(b.limit, data.settings.currencySymbol)}</p>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goal Wallets Summary */}
            {goalWallets.length > 0 && currentWallet?.type !== 'GOAL' && (
                 <div className="space-y-3">
                    <div className="flex justify-between items-end px-2">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Your Goals</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {goalWallets.map((w: Wallet) => {
                            const wTx = data.transactions.filter((t: Transaction) => t.walletId === w.id);
                            const bal = wTx.reduce((acc: number, t: Transaction) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
                            const prog = Math.min((bal / (w.targetAmount || 1)) * 100, 100);
                            return (
                                <button key={w.id} onClick={() => updateData({ currentWalletId: w.id })} className="bg-surface/50 backdrop-blur p-4 rounded-2xl border border-white/5 text-left hover:border-primary/50 transition-all active:scale-[0.98]">
                                    <Target size={20} className="text-primary mb-2"/>
                                    <p className="font-bold text-main text-sm truncate">{w.name}</p>
                                    <div className="w-full h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${prog}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted mt-1 text-right">{Math.round(prog)}%</p>
                                </button>
                            )
                        })}
                    </div>
                 </div>
            )}

            {/* Recent List Placeholder */}
            <div className="pb-8">
              <div className="flex items-center justify-between mb-3 px-2">
                  <h2 className="text-lg font-bold text-main">Recent Activity</h2>
                  <button onClick={() => setView('history')} className="text-xs text-primary font-bold active:opacity-70 p-2 bg-primary/10 rounded-lg">See All</button>
              </div>
              <div className="space-y-3">
                  {walletTransactions.slice(0, 5).map((t: Transaction) => (
                      <div key={t.id} onClick={() => onEditTransaction(t)} className="glass-card p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-surface/80 flex items-center justify-center border border-white/5 text-muted shadow-sm">
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
