import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Search, X, FileText, Calendar as CalendarIcon, PieChart, Shuffle, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Transaction, TransactionType, AppData, CategoryItem } from '../types';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface HistoryProps {
    data: AppData;
    onRequestDelete: (id: string) => void;
    formatMoney: (val: number, sym: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
}

type SortKey = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

// Helper for highlighting text
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? <mark key={i} className="highlight">{part}</mark> : <span key={i}>{part}</span>
            )}
        </span>
    );
};

const CalendarView = ({ transactions, onSelectDate }: { transactions: Transaction[], onSelectDate: (d: string) => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [...Array(daysInMonth)].map((_, i) => i + 1);
    const empties = [...Array(firstDayOfMonth)].map((_, i) => i);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <div className="mt-2 select-none animate-in fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={prevMonth} className="p-2 hover:bg-surface rounded-full text-muted hover:text-main"><ChevronLeft size={20}/></button>
                <h3 className="text-main font-bold text-lg">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={nextMonth} className="p-2 hover:bg-surface rounded-full text-muted hover:text-main"><ChevronRight size={20}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-bold text-muted py-2">{d}</div>)}
                
                {empties.map(i => <div key={`empty-${i}`} />)}

                {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const daysTx = transactions.filter(t => t.date.startsWith(dateStr));
                    const hasExpense = daysTx.some(t => t.type === TransactionType.EXPENSE);
                    const hasIncome = daysTx.some(t => t.type === TransactionType.INCOME);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <button key={day} onClick={() => onSelectDate(dateStr)} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all ${isToday ? 'bg-primary/20 border-primary text-primary' : 'bg-surface/50 border-transparent text-main hover:bg-surface hover:border-white/10'}`}>
                            <span className="text-xs font-medium">{day}</span>
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const SankeyChart = ({ transactions, categories }: { transactions: Transaction[], categories: CategoryItem[] }) => {
    // 1. Process Data
    const incomeCats: Record<string, number> = {};
    const expenseCats: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.type === TransactionType.INCOME) {
            incomeCats[t.category] = (incomeCats[t.category] || 0) + t.amount;
            totalIncome += t.amount;
        } else if (t.type === TransactionType.EXPENSE) {
            expenseCats[t.category] = (expenseCats[t.category] || 0) + t.amount;
            totalExpense += t.amount;
        }
    });

    const savings = Math.max(0, totalIncome - totalExpense);
    const deficit = Math.max(0, totalExpense - totalIncome);

    // Sort to make chart look nice
    const sortedIncomes = Object.entries(incomeCats).sort((a,b) => b[1] - a[1]);
    const sortedExpenses = Object.entries(expenseCats).sort((a,b) => b[1] - a[1]);

    if (totalIncome === 0 && totalExpense === 0) {
        return <div className="h-64 flex items-center justify-center text-muted">No data to display flow</div>;
    }

    // 2. SVG Calculations
    const width = 320;
    const height = Math.max(300, Math.max(sortedIncomes.length, sortedExpenses.length) * 40);
    const padding = 20;
    const barWidth = 10;
    const graphHeight = height - (padding * 2);
    const totalFlow = Math.max(totalIncome, totalExpense);
    const scale = totalFlow > 0 ? graphHeight / totalFlow : 0;

    const leftX = padding;
    const rightX = width - padding - barWidth;

    let leftY = padding;
    let rightY = padding;

    // 3. Render Nodes & Links
    const links: React.ReactElement[] = [];
    const nodes: React.ReactElement[] = [];

    // Left Nodes (Income)
    sortedIncomes.forEach(([name, amount]) => {
        const nodeHeight = amount * scale;
        const color = categories.find(c => c.name === name)?.color || '#10b981';
        
        nodes.push(
            <g key={`l-${name}`}>
                <rect x={leftX} y={leftY} width={barWidth} height={nodeHeight} fill={color} rx={4} />
                <text x={leftX + 14} y={leftY + nodeHeight/2 + 4} className="text-[9px] fill-muted" textAnchor="start">{name}</text>
            </g>
        );
        leftY += nodeHeight + 5;
    });

    if (deficit > 0) {
        const h = deficit * scale;
        nodes.push(
             <g key="deficit">
                <rect x={leftX} y={leftY} width={barWidth} height={h} fill="#ef4444" rx={4} opacity={0.5} />
                <text x={leftX + 14} y={leftY + h/2 + 4} className="text-[9px] fill-rose-500" textAnchor="start">Deficit</text>
            </g>
        );
        leftY += h + 5;
    }

    // Right Nodes (Expenses)
    let linkLeftY = padding; 
    let linkRightY = padding;

    sortedExpenses.forEach(([name, amount]) => {
        const nodeHeight = amount * scale;
        const color = categories.find(c => c.name === name)?.color || '#ef4444';
        
        nodes.push(
            <g key={`r-${name}`}>
                <rect x={rightX} y={linkRightY} width={barWidth} height={nodeHeight} fill={color} rx={4} />
                 <text x={rightX - 6} y={linkRightY + nodeHeight/2 + 4} className="text-[9px] fill-muted" textAnchor="end">{name}</text>
            </g>
        );

        const leftCenter = linkLeftY + (nodeHeight / 2);
        const rightCenter = linkRightY + (nodeHeight / 2);

        links.push(
            <path 
                key={`link-${name}`}
                d={`M ${leftX + barWidth} ${leftCenter} C ${leftX + width/2} ${leftCenter}, ${rightX - width/2} ${rightCenter}, ${rightX} ${rightCenter}`}
                stroke={color}
                strokeWidth={Math.max(1, nodeHeight)}
                fill="none"
                opacity={0.3}
                className="hover:opacity-60 transition-opacity"
            />
        );

        linkLeftY += nodeHeight; 
        linkRightY += nodeHeight + 5; 
    });

    // Savings Node
    if (savings > 0) {
        const h = savings * scale;
        nodes.push(
            <g key="savings">
                <rect x={rightX} y={linkRightY} width={barWidth} height={h} fill="#10b981" rx={4} />
                <text x={rightX - 6} y={linkRightY + h/2 + 4} className="text-[9px] fill-emerald-500" textAnchor="end">Savings</text>
            </g>
        );
        const leftCenter = linkLeftY + (h / 2);
        const rightCenter = linkRightY + (h / 2);
        links.push(
            <path 
                key="link-savings"
                d={`M ${leftX + barWidth} ${leftCenter} C ${leftX + width/2} ${leftCenter}, ${rightX - width/2} ${rightCenter}, ${rightX} ${rightCenter}`}
                stroke="#10b981"
                strokeWidth={h}
                fill="none"
                opacity={0.3}
            />
        );
    }

    return (
        <div className="overflow-x-auto no-scrollbar animate-in fade-in">
            <svg width={width} height={Math.max(linkRightY, leftY) + 20} className="mx-auto">
                {links}
                {nodes}
            </svg>
        </div>
    );
};

export const HistoryView: React.FC<HistoryProps> = ({ data, onRequestDelete, formatMoney, CategoryIcon }) => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats' | 'flow'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Sort State
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(20);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const walletTransactions = data.transactions.filter((t: Transaction) => t.walletId === data.currentWalletId);
    
    const allTags = Array.from(new Set(walletTransactions.flatMap(t => {
        const matches = t.note?.match(/#[\w]+/g);
        return matches || [];
    })));

    const filteredTransactions = useMemo(() => {
        let filtered = walletTransactions.filter(t => {
            const matchSearch = searchTerm ? (t.note?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm)) : true;
            const matchStart = dateRange.start ? t.date >= dateRange.start : true;
            const matchEnd = dateRange.end ? t.date <= dateRange.end + 'T23:59:59' : true;
            return matchSearch && matchStart && matchEnd;
        });

        // Sorting Logic
        filtered.sort((a, b) => {
            let valA, valB;
            
            if (sortKey === 'amount') {
                valA = a.amount;
                valB = b.amount;
            } else if (sortKey === 'category') {
                valA = a.category;
                valB = b.category;
            } else {
                // Default to date
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [walletTransactions, searchTerm, dateRange, sortKey, sortDirection]);

    const visibleTransactions = useMemo(() => {
        return filteredTransactions.slice(0, visibleCount);
    }, [filteredTransactions, visibleCount]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [visibleTransactions]);

    const exportCSV = () => {
        const headers = ["Date", "Type", "Category", "Amount", "Note"];
        const rows = filteredTransactions.map(t => [t.date.split('T')[0], t.type, t.category, t.amount, t.note || '']);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const pieData = Object.entries(filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value);

    const COLORS = ['#5e5ce6', '#32d74b', '#ff453a', '#ff9f0a', '#64d2ff', '#bf5af2', '#ff375f'];

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc'); // Default to ascending for text/amount when switching, though date usually descends.
            if (key === 'date') setSortDirection('desc'); // Exception for date
        }
    };

    return (
      <div className="animate-in fade-in duration-500">
           <div className="mb-4 pt-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-main">History</h2>
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="p-2 bg-surface rounded-full text-muted hover:text-main border border-white/5 active:scale-90 transition-transform"><Download size={18}/></button>
                </div>
           </div>

           {/* Sticky Header Container with adjusted margins for consistent padding */}
           <div className="sticky top-0 z-20 bg-dark/95 backdrop-blur-xl -mx-5 px-5 pb-2 pt-1 border-b border-white/5 mb-4 shadow-lg shadow-black/20">
               {/* Filter Bar */}
               <div className="space-y-3 mb-3">
                   <div className="flex items-center gap-2 bg-surface/50 rounded-xl px-3 py-2 border border-white/5 group focus-within:border-primary/50 transition-colors">
                       <Search size={16} className="text-muted group-focus-within:text-primary transition-colors"/>
                       <input 
                          type="text" 
                          placeholder="Search or #tag..." 
                          value={searchTerm} 
                          onChange={e => { setSearchTerm(e.target.value); setVisibleCount(20); }}
                          className="bg-transparent text-sm text-main w-full outline-none"
                       />
                       {searchTerm && (
                           <button onClick={() => setSearchTerm('')} className="text-muted hover:text-main">
                               <X size={14} />
                           </button>
                       )}
                   </div>
                   
                   {allTags.length > 0 && (
                       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                           {allTags.map(tag => (
                               <button 
                                 key={tag} 
                                 onClick={() => setSearchTerm(prev => prev === tag ? '' : tag)}
                                 className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors active:scale-95 ${searchTerm === tag ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-white/5 hover:border-primary/30'}`}
                               >
                                   {tag}
                               </button>
                           ))}
                       </div>
                   )}

                   <div className="flex gap-2">
                       <input type="date" className="bg-surface/50 text-main text-xs rounded-lg px-2 py-2 w-full outline-none border border-white/5" onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}/>
                       <input type="date" className="bg-surface/50 text-main text-xs rounded-lg px-2 py-2 w-full outline-none border border-white/5" onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}/>
                   </div>
               </div>

                {/* Controls Row: View Toggles & Sort */}
               <div className="flex items-center justify-between gap-2">
                   <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                       {[
                           { id: 'list', icon: FileText },
                           { id: 'calendar', icon: CalendarIcon },
                           { id: 'stats', icon: PieChart },
                           { id: 'flow', icon: Shuffle }
                       ].map((mode: any) => (
                           <button 
                             key={mode.id} 
                             onClick={() => setViewMode(mode.id as any)}
                             className={`w-9 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === mode.id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-main'}`}
                           >
                               <mode.icon size={16} />
                           </button>
                       ))}
                   </div>
                   
                   {/* Sort Controls (Only visible in list view) */}
                   {viewMode === 'list' && filteredTransactions.length > 0 && (
                       <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-xl border border-white/5">
                            <button onClick={() => toggleSort('date')} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${sortKey === 'date' ? 'bg-primary text-white' : 'text-muted'}`}>
                                Date {sortKey === 'date' && (sortDirection === 'asc' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>)}
                            </button>
                            <button onClick={() => toggleSort('amount')} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-primary text-white' : 'text-muted'}`}>
                                Amt {sortKey === 'amount' && (sortDirection === 'asc' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>)}
                            </button>
                       </div>
                   )}
               </div>
           </div>

           {viewMode === 'list' && (
               <div className="space-y-3 min-h-[300px]">
                 {filteredTransactions.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-muted border border-white/5 rounded-3xl bg-surface/30 border-dashed">
                         <p className="text-sm">No transactions found</p>
                     </div>
                 ) : (
                    <>
                    {visibleTransactions.map((t: Transaction) => (
                        <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-transform">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center border border-white/5 text-muted">
                                    <CategoryIcon category={t.category} color={data.categories.find((c: CategoryItem) => c.name === t.category)?.color} />
                                </div>
                                <div>
                                    <p className="font-semibold text-main text-sm">
                                        <HighlightText text={t.note || t.category} highlight={searchTerm} />
                                    </p>
                                    <p className="text-[11px] text-muted mt-0.5">
                                        {new Date(t.date).toLocaleDateString()} • <HighlightText text={t.category} highlight={searchTerm} />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-secondary' : 'text-main'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : ''}{formatMoney(t.amount, data.settings.currencySymbol)}
                                </span>
                                <button onClick={() => onRequestDelete(t.id)} className="text-muted hover:text-danger p-2 rounded-full hover:bg-white/5 transition-colors active:scale-90">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Infinite Scroll trigger */}
                    {visibleCount < filteredTransactions.length && (
                        <div ref={loadMoreRef} className="py-4 text-center text-xs text-muted">
                             Loading more...
                        </div>
                    )}
                    </>
                 )}
               </div>
           )}

           {viewMode === 'calendar' && (
               <CalendarView 
                  transactions={filteredTransactions} 
                  onSelectDate={(d) => { setDateRange({ start: d, end: d }); setViewMode('list'); }} 
               />
           )}

           {viewMode === 'flow' && (
                <div className="bg-surface rounded-3xl p-6 border border-white/5 animate-in fade-in">
                    <h3 className="text-main font-bold mb-4 text-center">Cash Flow</h3>
                    <SankeyChart transactions={filteredTransactions} categories={data.categories} />
                </div>
           )}

           {viewMode === 'stats' && (
               <div className="bg-surface rounded-3xl p-6 border border-white/5 animate-in fade-in">
                   <h3 className="text-main font-bold mb-4">Spending Distribution</h3>
                   <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie 
                                    data={pieData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={data.categories.find((c: CategoryItem) => c.name === entry.name)?.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-main)' }}
                                    formatter={(val: number) => formatMoney(val, data.settings.currencySymbol)}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-xs text-muted font-bold uppercase">Total</span>
                                <p className="text-xl font-bold text-main">{formatMoney(pieData.reduce((a:any,b:any)=>a+b.value,0), data.settings.currencySymbol)}</p>
                            </div>
                        </div>
                   </div>
                   <div className="space-y-2 mt-4">
                       {pieData.map((entry: any, index: number) => (
                           <div key={entry.name} className="flex items-center justify-between text-sm">
                               <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.categories.find((c: CategoryItem) => c.name === entry.name)?.color || COLORS[index % COLORS.length] }} />
                                   <span className="text-muted">{entry.name}</span>
                               </div>
                               <span className="font-bold text-main">{formatMoney(entry.value as number, data.settings.currencySymbol)}</span>
                           </div>
                       ))}
                   </div>
               </div>
           )}
      </div>
    );
};