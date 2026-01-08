
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Info, ArrowRight, Wallet as WalletIcon, Save, AlertCircle } from 'lucide-react';
import { TransactionType, Category, AppData, Wallet, Transaction, CategoryItem, Debt } from '../types';

interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    onAdd: (t: Transaction) => void;
    onEdit?: (t: Transaction) => void;
    onTransfer: (amount: number, from: string, to: string, note: string, date: string) => void;
    onAddDebt?: (debt: Debt) => void;
    getDateTime: (d: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
    initialData?: { type: TransactionType, category?: string, amount?: number, note?: string };
    editingTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddModalProps> = ({ isOpen, onClose, data, onAdd, onEdit, onTransfer, onAddDebt, getDateTime, CategoryIcon, initialData, editingTransaction }) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [category, setCategory] = useState<string>(Category.OTHER);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [toWalletId, setToWalletId] = useState('');
    const [lenderName, setLenderName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                setType(editingTransaction.type);
                setAmount(editingTransaction.amount.toString());
                setNote(editingTransaction.note || '');
                setCategory(editingTransaction.category);
                setDate(editingTransaction.date.split('T')[0]);
                setToWalletId('');
                setLenderName('');
            } else {
                setType(initialData?.type || TransactionType.EXPENSE);
                setAmount(initialData?.amount ? initialData.amount.toString() : '');
                setNote(initialData?.note || '');
                setCategory(initialData?.category || Category.OTHER);
                setDate(new Date().toISOString().split('T')[0]);
                setToWalletId('');
                setLenderName('');
            }
        }
    }, [isOpen, initialData, editingTransaction]);

    const calculateExpression = (expr: string): number | null => {
        const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return null;
        try {
            // eslint-disable-next-line no-eval
            const result = eval(sanitized); 
            // Simple eval for basic math (user input safety handled by regex above)
            return (isFinite(result) && !isNaN(result)) ? result : null;
        } catch (e) {
            return null;
        }
    };

    const handleSave = () => {
        if (!amount) return;
        
        const calculated = calculateExpression(amount);
        if (calculated === null || calculated <= 0) return;

        const numAmount = parseFloat(calculated.toFixed(2));
        
        if (editingTransaction && onEdit) {
            // Edit Mode
            const updatedTx: Transaction = {
                ...editingTransaction,
                amount: numAmount,
                type,
                category,
                date: getDateTime(date),
                note: lenderName ? `${note ? note + ' ' : ''}(Lender: ${lenderName})` : note,
            };
            onEdit(updatedTx);
        } else {
            // Add Mode
            if (type === TransactionType.TRANSFER) {
                if (!toWalletId || toWalletId === data.currentWalletId) {
                    alert("Please select a valid destination wallet");
                    return;
                }
                onTransfer(numAmount, data.currentWalletId, toWalletId, note, date);
            } else {
                const newTx: Transaction = {
                    id: Date.now().toString(),
                    amount: numAmount,
                    type,
                    category,
                    date: getDateTime(date),
                    note: lenderName ? `${note ? note + ' ' : ''}(Lender: ${lenderName})` : note,
                    walletId: data.currentWalletId
                };
                
                if (type === TransactionType.INCOME && category === Category.LOAN && lenderName && onAddDebt) {
                    const newDebt: Debt = {
                        id: Date.now().toString(),
                        person: lenderName,
                        amount: numAmount,
                        type: 'I_OWE',
                        note: `Added via Income (Loan): ${note}`,
                        isSettled: false,
                        dueDate: undefined 
                    };
                    onAddDebt(newDebt);
                }

                onAdd(newTx);
            }
        }
    };

    // --- Budget Prediction Logic ---
    const dailyStats = useMemo(() => {
        if (type !== TransactionType.EXPENSE) return null;
        
        const dailyGoal = data.profile.dailyGoal || 0;
        if (dailyGoal <= 0) return null;

        const currentVal = calculateExpression(amount) || 0;
        const today = new Date().toISOString().split('T')[0];
        
        // Sum today's expenses excluding current editing transaction if any
        const spentToday = data.transactions
            .filter(t => 
                t.type === TransactionType.EXPENSE && 
                t.date.startsWith(today) && 
                t.walletId === data.currentWalletId &&
                (editingTransaction ? t.id !== editingTransaction.id : true)
            )
            .reduce((acc, t) => acc + t.amount, 0);

        const projectedTotal = spentToday + currentVal;
        const percentUsed = (projectedTotal / dailyGoal) * 100;
        const remaining = dailyGoal - projectedTotal;

        let message = "You're doing great! 🌟";
        let color = "bg-primary";
        let textColor = "text-primary";

        if (percentUsed > 100) {
            message = "Budget exceeded! 🚨 Slow down!";
            color = "bg-rose-500";
            textColor = "text-rose-500";
        } else if (percentUsed > 80) {
            message = "Careful, approaching limit! ⚠️";
            color = "bg-amber-500";
            textColor = "text-amber-500";
        } else if (percentUsed > 50) {
            message = "Pacing well. 👍";
            color = "bg-emerald-500";
            textColor = "text-emerald-500";
        }

        return { percentUsed, remaining, message, color, textColor, dailyGoal };
    }, [amount, type, data.transactions, data.profile.dailyGoal, editingTransaction]);

    if (!isOpen) return null;

    const availableCategories = data.categories.filter((c: CategoryItem) => c.type === type);
    const otherWallets = data.wallets.filter((w: Wallet) => w.id !== data.currentWalletId);
    const isEditing = !!editingTransaction;

    return (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Modal Content */}
            <div className="relative z-50 bg-card w-full max-w-md rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe mb-safe">
                
                {/* 1. Header & Tabs */}
                <div className="flex items-center justify-between p-5 pb-4">
                     <div className="flex bg-surface rounded-full p-1 border border-white/5 shadow-inner">
                        {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map(t => (
                            <button 
                                key={t} 
                                onClick={() => !isEditing && setType(t)}
                                disabled={isEditing && t !== type}
                                className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase transition-all ${type === t ? (t === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : t === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30') : 'text-muted hover:text-main'} ${isEditing && t !== type ? 'opacity-30' : ''}`}
                            >
                                {t}
                            </button>
                        ))}
                     </div>
                     <button onClick={onClose} className="p-3 bg-surface rounded-full text-muted hover:text-main active:scale-90 transition-all border border-white/5"><X size={20}/></button>
                </div>

                {/* 2. Main Amount Input */}
                <div className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-muted/50 pb-2">{data.settings.currencySymbol}</span>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            placeholder="0" 
                            className="w-auto max-w-[240px] bg-transparent text-center text-6xl font-bold text-main placeholder:text-muted/10 outline-none"
                            autoFocus
                        />
                    </div>
                    
                    {/* Live Budget Impact Bar */}
                    {dailyStats && (
                        <div className="mt-4 mb-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-end mb-1.5 px-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${dailyStats.textColor}`}>{dailyStats.message}</span>
                                <span className="text-[10px] text-muted font-medium">
                                    Remaining: <span className={dailyStats.remaining < 0 ? 'text-rose-500' : 'text-main'}>{data.settings.currencySymbol}{dailyStats.remaining.toFixed(0)}</span>
                                </span>
                            </div>
                            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden w-full ring-1 ring-white/5">
                                <div 
                                    className={`h-full transition-all duration-500 ease-out ${dailyStats.color}`} 
                                    style={{ width: `${Math.min(dailyStats.percentUsed, 100)}%` }} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Details Row */}
                <div className="px-6 space-y-5 pb-6">
                    
                    {/* Note & Date Combined */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-surface rounded-2xl px-5 py-3.5 flex items-center gap-3 border border-white/5 focus-within:border-primary/50 focus-within:bg-surface/80 transition-all">
                            <input 
                                type="text" 
                                placeholder="Add a note..." 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                                className="bg-transparent w-full text-sm text-main placeholder:text-muted outline-none font-medium"
                            />
                        </div>
                         <div className="bg-surface rounded-2xl px-4 py-3.5 flex items-center gap-2 border border-white/5 min-w-[120px]">
                             <CalendarIcon size={16} className="text-muted" />
                             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-xs font-bold text-main w-full outline-none" />
                        </div>
                    </div>

                    {/* Transfer specific or Category Scroll */}
                    {type === TransactionType.TRANSFER && !isEditing ? (
                         <div className="bg-surface rounded-2xl p-5 border border-white/5">
                             <label className="text-[10px] font-bold text-muted uppercase block mb-3 tracking-wide">Transfer To</label>
                             
                             {otherWallets.length === 0 ? (
                                <div className="text-center py-6 px-4 rounded-xl bg-black/20 text-muted border border-dashed border-white/10">
                                    <div className="flex justify-center mb-2 opacity-50"><WalletIcon size={24} /></div>
                                    <p className="text-xs font-semibold">No other wallets found.</p>
                                    <p className="text-[10px] mt-1 opacity-70">Create another wallet in the side menu to transfer funds.</p>
                                </div>
                             ) : (
                                 <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                     {otherWallets.map((w: Wallet) => (
                                         <button 
                                            key={w.id} 
                                            type="button"
                                            onClick={() => setToWalletId(w.id)}
                                            className={`flex-shrink-0 px-5 py-3 rounded-xl border text-xs font-bold transition-all ${toWalletId === w.id ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 text-muted hover:bg-black/30'}`}
                                         >
                                             {w.name}
                                         </button>
                                     ))}
                                 </div>
                             )}
                         </div>
                    ) : (
                        <div className="relative w-full">
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
                                {availableCategories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setCategory(cat.name)}
                                        className={`flex-shrink-0 snap-start flex flex-col items-center gap-2 min-w-[64px] transition-all group ${category === cat.name ? 'opacity-100 scale-100' : 'opacity-60 hover:opacity-100 scale-95'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${category === cat.name ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-surface border-white/5 group-hover:border-white/20'}`}>
                                            <CategoryIcon category={cat.name} color={category === cat.name ? cat.color : undefined} />
                                        </div>
                                        <span className={`text-[10px] font-bold truncate max-w-[64px] ${category === cat.name ? 'text-primary' : 'text-muted'}`}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Loan Source Input */}
                            {type === TransactionType.INCOME && category === Category.LOAN && !isEditing && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <input 
                                        type="text" 
                                        placeholder="Lender Name" 
                                        value={lenderName} 
                                        onChange={e => setLenderName(e.target.value)}
                                        className="w-full bg-amber-500/10 text-amber-200 placeholder:text-amber-500/50 text-sm px-5 py-3.5 rounded-2xl outline-none border border-amber-500/20 focus:border-amber-500/50 transition-colors"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        onClick={handleSave} 
                        disabled={!amount}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <span>{isEditing ? 'Update Transaction' : 'Save Transaction'}</span>
                        {isEditing ? <Save size={18} /> : <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
