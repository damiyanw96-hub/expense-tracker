import React from 'react';
import { TrendingUp, Eye, EyeOff, Target } from 'lucide-react';
import { Transaction, TransactionType, AppData, Wallet, CategoryItem } from '../types';

interface DashboardProps {
    data: AppData;
    setView: (view: any) => void;
    updateData: (data: Partial<AppData>) => void;
    formatMoney: (val: number, sym: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
}

export const DashboardView: React.FC<DashboardProps> = ({ data, setView, updateData, formatMoney, CategoryIcon }) => {
    const walletTransactions = data.transactions.filter((t: Transaction) => t.walletId === data.currentWalletId);
    
    // Stats
    const totalIncome = walletTransactions.filter((t: Transaction) => t.type === TransactionType.INCOME).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const totalExpense = walletTransactions.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

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
    
    // Calculate Goal Progress if current wallet is goal
    const goalProgress = currentWallet?.type === 'GOAL' ? Math.min((balance / (currentWallet.targetAmount || 1)) * 100, 100) : 0;

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (e.detail === 2) {
             updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } });
        }
    };

    return (
      <div className="space-y-6 mt-4 animate-in fade-in duration-500">
            {/* Balance Hero */}
            <div onClick={handleDoubleTap} className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-sm select-none cursor-pointer group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full group-active:scale-110 transition-transform duration-500" />
               <div className="flex justify-between items-start mb-2">
                 <p className="text-muted text-xs font-semibold uppercase tracking-wider">{currentWallet?.type === 'GOAL' ? 'Goal Progress' : 'Total Balance'}</p>
                 <button onClick={(e) => { e.stopPropagation(); updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } }) }} className="text-muted hover:text-main transition-colors p-2 -mr-2">
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
                       <div className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5">
                           <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                               <div className="p-1 bg-emerald-500/10 rounded-full"><TrendingUp size={12}/></div>
                               <span className="text-[10px] font-bold uppercase">Income</span>
                           </div>
                           <p className="text-lg font-semibold text-main">{!data.settings.privacyMode ? formatMoney(totalIncome, data.settings.currencySymbol) : '••••'}</p>
                       </div>
                       <div className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5">
                           <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                               <div className="p-1 bg-rose-500/10 rounded-full"><TrendingUp size={12} className="rotate-180"/></div>
                               <span className="text-[10px] font-bold uppercase">Expense</span>
                           </div>
                           <p className="text-lg font-semibold text-main">{!data.settings.privacyMode ? formatMoney(totalExpense, data.settings.currencySymbol) : '••••'}</p>
                       </div>
                   </div>
               )}
            </div>

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider px-1">At Risk Budgets</h3>
                    {budgetAlerts.map((b: any) => (
                        <div key={b.cat} className="bg-surface border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
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
                                <button key={w.id} onClick={() => updateData({ currentWalletId: w.id })} className="bg-surface p-4 rounded-2xl border border-white/5 text-left hover:border-primary/50 transition-colors">
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
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-bold text-main">Recent Activity</h2>
                  <button onClick={() => setView('history')} className="text-xs text-primary font-bold active:opacity-70">See All</button>
              </div>
              <div className="space-y-3">
                  {walletTransactions.slice(0, 5).map((t: Transaction) => (
                      <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
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