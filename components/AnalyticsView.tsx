
import React, { useMemo, useState } from 'react';
import { AppData, Transaction, TransactionType, CategoryItem, Debt } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, BrainCircuit, Activity } from 'lucide-react';

interface AnalyticsProps {
    data: AppData;
    formatMoney: (val: number, sym: string) => string;
}

export const AnalyticsView: React.FC<AnalyticsProps> = ({ data, formatMoney }) => {
    const [tab, setTab] = useState<'overview' | 'spending' | 'report'>('overview');

    const transactions = data.transactions.filter(t => t.walletId === data.currentWalletId);
    
    // --- Data Processing ---
    
    // Totals
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s: number, t: Transaction) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s: number, t: Transaction) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Debt
    const totalIOwe = data.debts.filter(d => !d.isSettled && d.type === 'I_OWE').reduce((s: number, d: Debt) => s + d.amount, 0);
    const totalOwesMe = data.debts.filter(d => !d.isSettled && d.type === 'OWES_ME').reduce((s: number, d: Debt) => s + d.amount, 0);
    const netDebt = totalOwesMe - totalIOwe;

    // Spending by Category (Top 5)
    const expenseByCategory = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc: Record<string, number>, t: Transaction) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    
    const sortedCategories = Object.entries(expenseByCategory)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Last 7 Days Spending
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const amt = transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(dateStr))
            .reduce((s: number, t: Transaction) => s + t.amount, 0);
        return { name: dayName, value: amt };
    });

    // Average Spending
    const avgDailySpend = totalExpense / (transactions.length > 0 ? 30 : 1); // Mock 30 days for now

    // --- Report Text Generation ---
    const getReportText = () => {
        const topCat = sortedCategories[0];
        const health = savingsRate > 20 ? "Excellent" : savingsRate > 0 ? "Stable" : "Needs Attention";
        
        let intro = `Hi ${data.profile.name.split(' ')[0] || 'there'}! Here is your financial snapshot.`;
        
        if (savingsRate < 0) {
            intro += ` You're currently spending more than you earn. Let's look at where the money is going.`;
        } else if (savingsRate > 20) {
            intro += ` You're doing a fantastic job saving money! Keep it up.`;
        } else {
             intro += ` You're balancing your budget well, but there's room to save more.`;
        }

        let habit = "";
        if (topCat) {
            habit = ` Your biggest expense recently has been **${topCat.name}**, taking up a significant chunk of your outflow.`;
        }

        let debtStatus = "";
        if (totalIOwe > 0) {
            debtStatus = ` You currently have active debts totaling ${formatMoney(totalIOwe, data.settings.currencySymbol)}. Prioritize clearing these to reduce financial stress.`;
        } else if (totalOwesMe > 0) {
             debtStatus = ` People owe you ${formatMoney(totalOwesMe, data.settings.currencySymbol)}. Might be time to send a friendly reminder!`;
        } else {
            debtStatus = ` You are debt-free! That is a major achievement.`;
        }

        return { intro, habit, debtStatus, health };
    };

    const report = getReportText();
    const COLORS = ['#5e5ce6', '#32d74b', '#ff453a', '#ff9f0a', '#64d2ff'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-main">Analytics</h2>
                <div className="flex bg-surface rounded-xl p-1 border border-white/5">
                    {(['overview', 'spending', 'report'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${tab === t ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-main'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'overview' && (
                <div className="space-y-4">
                     {/* Net Worth / Savings Card */}
                     <div className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <p className="text-muted text-xs font-bold uppercase tracking-wider">Financial Health</p>
                                 <h3 className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{report.health}</h3>
                             </div>
                             <div className={`p-2 rounded-full ${savingsRate >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                 <Activity size={24} />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <p className="text-[10px] text-muted uppercase font-bold">Savings Rate</p>
                                 <p className="text-lg font-bold text-main">{savingsRate.toFixed(1)}%</p>
                             </div>
                             <div>
                                 <p className="text-[10px] text-muted uppercase font-bold">Net Debt Pos</p>
                                 <p className={`text-lg font-bold ${netDebt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{netDebt >= 0 ? '+' : ''}{formatMoney(netDebt, data.settings.currencySymbol)}</p>
                             </div>
                         </div>
                     </div>

                     {/* Weekly Trend */}
                     <div className="bg-surface rounded-3xl p-5 border border-white/5">
                         <p className="text-main font-bold text-sm mb-4">Last 7 Days Spending</p>
                         <div className="h-40">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={last7Days}>
                                     <XAxis dataKey="name" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                                     <Tooltip 
                                        contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(val: number) => [formatMoney(val, data.settings.currencySymbol), 'Spent']}
                                     />
                                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                         {last7Days.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={entry.value > avgDailySpend * 1.5 ? '#ff453a' : '#5e5ce6'} />
                                         ))}
                                     </Bar>
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>
                     </div>
                </div>
            )}

            {tab === 'spending' && (
                 <div className="space-y-4">
                    <div className="bg-surface rounded-3xl p-6 border border-white/5 flex flex-col items-center">
                        <h3 className="text-main font-bold mb-4 self-start">Top Categories</h3>
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sortedCategories}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sortedCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => formatMoney(val, data.settings.currencySymbol)} contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: 'none', color: '#fff' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="text-xs text-muted font-bold uppercase">Total</span>
                                    <p className="text-lg font-bold text-main">{formatMoney(totalExpense, data.settings.currencySymbol)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                         {sortedCategories.map((cat, idx) => (
                             <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                     <span className="font-semibold text-main text-sm">{cat.name}</span>
                                 </div>
                                 <span className="font-bold text-main text-sm">{formatMoney(cat.value, data.settings.currencySymbol)}</span>
                             </div>
                         ))}
                    </div>
                 </div>
            )}

            {tab === 'report' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-6 rounded-3xl border border-indigo-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500 rounded-lg text-white">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Your Personal Report</h3>
                        </div>
                        <div className="space-y-4 text-sm leading-relaxed text-indigo-100/90">
                            <p>{report.intro}</p>
                            <p>{report.habit.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}</p>
                            <p>{report.debtStatus}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div className="bg-surface p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                 <TrendingUp size={18} />
                                 <span className="text-xs font-bold uppercase">Income</span>
                             </div>
                             <p className="text-lg font-bold text-main">{formatMoney(totalIncome, data.settings.currencySymbol)}</p>
                         </div>
                         <div className="bg-surface p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-2 mb-2 text-rose-400">
                                 <TrendingDown size={18} />
                                 <span className="text-xs font-bold uppercase">Expense</span>
                             </div>
                             <p className="text-lg font-bold text-main">{formatMoney(totalExpense, data.settings.currencySymbol)}</p>
                         </div>
                    </div>

                    <div className="bg-surface p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase mb-1">Goals Status</p>
                            <p className="text-sm text-main font-semibold">
                                {data.wallets.filter(w => w.type === 'GOAL').length} Active Saving Goals
                            </p>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
                            <Target size={20} />
                        </div>
                    </div>

                    {savingsRate > 10 && (
                        <div className="bg-surface p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted font-bold uppercase mb-1">Achievement</p>
                                <p className="text-sm text-main font-semibold">
                                    Super Saver Badge
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-full">
                                <Award size={20} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
