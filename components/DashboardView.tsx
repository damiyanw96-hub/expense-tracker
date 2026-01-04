import React, { useState, useRef } from 'react';
import { TrendingUp, Eye, EyeOff, Target, Zap, RotateCw } from 'lucide-react';
import { Transaction, TransactionType, AppData, Wallet, CategoryItem } from '../types';

interface DashboardProps {
    data: AppData;
    setView: (view: any) => void;
    updateData: (data: Partial<AppData>) => void;
    formatMoney: (val: number, sym: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
    onAddTransactionRequest: (type: TransactionType, quickData?: any) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ data, setView, updateData, formatMoney, CategoryIcon, onAddTransactionRequest }) => {
    const [refreshing, setRefreshing] = useState(false);
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
    const isOverBudget = dailySpent > dailyLimit;

    // Frequent Transactions (Quick Actions)
    const getFrequentTransactions = () => {
        const counts: Record<string, { count: number, category: string, amount?: number, note?: string }> = {};
        
        walletTransactions.slice(0, 100).forEach(t => {
            if (t.type === TransactionType.EXPENSE) {
                // Key by category + approximate amount to suggest common purchases
                const key = `${t.category}-${Math.round(t.amount)}`;
                if (!counts[key]) counts[key] = { count: 0, category: t.category, amount: t.amount, note: t.note };
                counts[key].count++;
            }
        });

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4) // Top 4
            .filter(item => item.count > 1); // Must appear at least twice
    };
    
    const quickActions = getFrequentTransactions();

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

    // Pull to Refresh Logic
    const handleTouchStart = (e: React.TouchEvent) => {
        // Find the scrollable container (parent with overflow-y-auto)
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
                 // Fade in the spinner as you pull
                 pullRef.current.style.opacity = `${Math.min(diff / 100, 1)}`;
                 pullRef.current.style.transform += ` rotate(${diff * 2}deg)`;
             }
        }
    };

    const handleTouchEnd = () => {
        if (!pullStart.current) return;
        
        if (pullRef.current) {
             pullRef.current.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
             
             // Check if pulled enough (opacity is a proxy for distance here from Move logic)
             // Using transform to check distance is safer but this works with the logic above
             const currentOpacity = parseFloat(pullRef.current.style.opacity || '0');
             
             if (currentOpacity > 0.6) {
                 setRefreshing(true);
                 // Snap to refreshing position
                 pullRef.current.style.transform = 'translateY(40px) rotate(0deg)';
                 pullRef.current.style.opacity = '1';
                 
                 setTimeout(() => {
                     setRefreshing(false);
                     // Hide after refresh
                     if (pullRef.current) {
                        pullRef.current.style.transform = 'translateY(0px)';
                        pullRef.current.style.opacity = '0';
                     }
                 }, 1500);
             } else {
                 // Reset if not pulled enough
                 pullRef.current.style.transform = 'translateY(0px)';
                 pullRef.current.style.opacity = '0';
             }
        }
        pullStart.current = 0;
    };

    return (
      <div 
        ref={containerRef}
        className="space-y-6 mt-0 relative min-h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
            {/* Pull Indicator - Added opacity-0 default and z-index adjustment */}
            <div ref={pullRef} className="absolute top-0 left-0 w-full flex justify-center -mt-10 pointer-events-none z-0 opacity-0">
                <div className={`p-2.5 rounded-full bg-surface shadow-xl border border-white/10 ${refreshing ? 'animate-spin' : ''}`}>
                    <RotateCw size={18} className="text-primary" />
                </div>
            </div>

            {/* Balance Hero */}
            <div onClick={handleDoubleTap} className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-sm select-none cursor-pointer group z-10">
               <div className={`absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full group-active:scale-110 transition-transform duration-500 ${refreshing ? 'scale-125 opacity-100' : ''}`} />
               <div className="flex justify-between items-start mb-2">
                 <p className="text-muted text-xs font-semibold uppercase tracking-wider">{currentWallet?.type === 'GOAL' ? 'Goal Progress' : 'Total Balance'}</p>
                 <button onClick={(e) => { e.stopPropagation(); updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } }) }} className="text-muted hover:text-main transition-colors p-2 -mr-2 active:scale-90">
                     {data.settings.privacyMode ? <Eye size={16}/> : <EyeOff size={16}/>}
                 </button>
               </div>
               
               <h1 className="text-4xl font-bold text-main mb-4 tracking-tight flex items-center gap-2">
                   {!data.settings.privacyMode ? formatMoney(balance, data.settings.currencySymbol) : '••••••'}
               </h1>
               
               {currentWallet?.type === 'GOAL' && (
                   <div className="mb-4">
                       <div className="flex justify-between text-xs text-muted mb-1">
                           <span>{Math.round(goalProgress)}% of {formatMoney(currentWallet.targetAmount || 0, data.settings.currencySymbol)}</span>
                       </div>
                       <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5">
                           <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
                       </div>
                   </div>
               )}

               {currentWallet?.type !== 'GOAL' && (
                   <div className="flex gap-4 relative z-10">
                       <button onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.INCOME); }} className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5 hover:bg-black/20 transition-colors active:scale-[0.98]">
                           <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                               <div className="p-1 bg-emerald-500/10 rounded-full"><TrendingUp size={12}/></div>
                               <span className="text-[10px] font-bold uppercase">Income</span>
                           </div>
                           <p className="text-lg font-semibold text-main text-left">{!data.settings.privacyMode ? formatMoney(totalIncome, data.settings.currencySymbol) : '••••'}</p>
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); onAddTransactionRequest(TransactionType.EXPENSE); }} className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5 hover:bg-black/20 transition-colors active:scale-[0.98]">
                           <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                               <div className="p-1 bg-rose-500/10 rounded-full"><TrendingUp size={12} className="rotate-180"/></div>
                               <span className="text-[10px] font-bold uppercase">Expense</span>
                           </div>
                           <p className="text-lg font-semibold text-main text-left">{!data.settings.privacyMode ? formatMoney(totalExpense, data.settings.currencySymbol) : '••••'}</p>
                       </button>
                   </div>
               )}
            </div>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
                <div className="px-1">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Quick Add</h3>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {quickActions.map((qa, idx) => (
                            <button 
                                key={idx}
                                onClick={() => onAddTransactionRequest(TransactionType.EXPENSE, { category: qa.category, amount: qa.amount, note: qa.note })}
                                className="flex-shrink-0 bg-surface border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-1 min-w-[80px] active:scale-95 transition-transform"
                            >
                                <div className="p-2 bg-black/20 rounded-full text-muted">
                                    <CategoryIcon category={qa.category} color={data.categories.find(c => c.name === qa.category)?.color} />
                                </div>
                                <span className="text-[10px] font-medium text-main truncate max-w-[80px]">{qa.category}</span>
                                <span className="text-[10px] font-bold text-muted">{formatMoney(qa.amount || 0, data.settings.currencySymbol)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Budget */}
            {dailyLimit > 0 && (
                <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-colors duration-500 ${isOverBudget ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface border-white/5'}`}>
                    <div className={`p-3 rounded-full ${isOverBudget ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                        <Zap size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-main">Daily Budget</span>
                            <span className={`text-xs font-bold ${isOverBudget ? 'text-rose-500' : 'text-muted'}`}>
                                {formatMoney(dailySpent, data.settings.currencySymbol)} / {formatMoney(dailyLimit, data.settings.currencySymbol)}
                            </span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${dailyProgress}%` }} />
                        </div>
                        {isOverBudget && <p className="text-[10px] text-rose-500 font-bold mt-1">You have exceeded your daily limit!</p>}
                    </div>
                </div>
            )}

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider px-1">At Risk Budgets</h3>
                    {budgetAlerts.map((b: any) => (
                        <div key={b.cat} className="bg-surface border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-500/5">
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
                    <div className="flex justify-between items-end px-1">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Your Goals</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {goalWallets.map((w: Wallet) => {
                            const wTx = data.transactions.filter((t: Transaction) => t.walletId === w.id);
                            const bal = wTx.reduce((acc: number, t: Transaction) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
                            const prog = Math.min((bal / (w.targetAmount || 1)) * 100, 100);
                            return (
                                <button key={w.id} onClick={() => updateData({ currentWalletId: w.id })} className="bg-surface p-4 rounded-2xl border border-white/5 text-left hover:border-primary/50 transition-colors active:scale-[0.98]">
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
              <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-bold text-main">Recent Activity</h2>
                  <button onClick={() => setView('history')} className="text-xs text-primary font-bold active:opacity-70 p-2">See All</button>
              </div>
              <div className="space-y-3">
                  {walletTransactions.slice(0, 5).map((t: Transaction) => (
                      <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between active:scale-[0.99] transition-transform">
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center border border-white/5 text-muted">
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