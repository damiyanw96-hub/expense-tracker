
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Info, ArrowRight, Wallet as WalletIcon, Save } from 'lucide-react';
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

    if (!isOpen) return null;

    const availableCategories = data.categories.filter((c: CategoryItem) => c.type === type);
    const otherWallets = data.wallets.filter((w: Wallet) => w.id !== data.currentWalletId);
    const isEditing = !!editingTransaction;

    return (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Modal Content - Designed for keyboard safety */}
            <div className="relative z-50 bg-card w-full max-w-md rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
                
                {/* 1. Header & Tabs */}
                <div className="flex items-center justify-between p-4 pb-2">
                     <div className="flex bg-surface rounded-full p-1 border border-white/5">
                        {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map(t => (
                            <button 
                                key={t} 
                                onClick={() => !isEditing && setType(t)}
                                disabled={isEditing && t !== type}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${type === t ? (t === TransactionType.EXPENSE ? 'bg-rose-500 text-white' : t === TransactionType.INCOME ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white') : 'text-muted hover:text-main'} ${isEditing && t !== type ? 'opacity-30' : ''}`}
                            >
                                {t}
                            </button>
                        ))}
                     </div>
                     <button onClick={onClose} className="p-2 bg-surface rounded-full text-muted active:scale-90"><X size={20}/></button>
                </div>

                {/* 2. Main Amount Input - The Hero */}
                <div className="px-6 py-2">
                    <div className="flex items-center justify-center relative">
                        <span className="text-2xl font-bold text-muted absolute left-0 top-1/2 -translate-y-1/2">{data.settings.currencySymbol}</span>
                        <input 
                            type="text" 
                            inputMode="decimal" // Better keyboard on iOS/Android
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            placeholder="0" 
                            className="w-full bg-transparent text-center text-5xl font-bold text-main placeholder:text-muted/20 outline-none py-4"
                            autoFocus
                        />
                    </div>
                </div>

                {/* 3. Compact Details Row */}
                <div className="px-4 space-y-4">
                    
                    {/* Note & Date Combined */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-surface rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/5 focus-within:border-primary/50 transition-colors">
                            <input 
                                type="text" 
                                placeholder="Add a note..." 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                                className="bg-transparent w-full text-sm text-main placeholder:text-muted outline-none"
                            />
                        </div>
                         <div className="bg-surface rounded-2xl px-3 py-3 flex items-center gap-2 border border-white/5 min-w-[110px]">
                             <CalendarIcon size={16} className="text-muted" />
                             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-xs font-bold text-main w-full outline-none" />
                        </div>
                    </div>

                    {/* Transfer specific or Category Scroll */}
                    {type === TransactionType.TRANSFER && !isEditing ? (
                         <div className="bg-surface rounded-2xl p-4 border border-white/5">
                             <label className="text-[10px] font-bold text-muted uppercase block mb-2">Transfer To</label>
                             
                             {otherWallets.length === 0 ? (
                                <div className="text-center py-4 px-4 rounded-xl bg-black/20 text-muted border border-dashed border-white/10">
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
                                            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${toWalletId === w.id ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 text-muted'}`}
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
                                        className={`flex-shrink-0 snap-start flex flex-col items-center gap-1 min-w-[60px] transition-opacity ${category === cat.name ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${category === cat.name ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-surface border-white/5'}`}>
                                            <CategoryIcon category={cat.name} color={category === cat.name ? cat.color : undefined} />
                                        </div>
                                        <span className={`text-[9px] font-medium truncate max-w-[64px] ${category === cat.name ? 'text-primary' : 'text-muted'}`}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Loan Source Input */}
                            {type === TransactionType.INCOME && category === Category.LOAN && !isEditing && (
                                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                    <input 
                                        type="text" 
                                        placeholder="Lender Name" 
                                        value={lenderName} 
                                        onChange={e => setLenderName(e.target.value)}
                                        className="w-full bg-amber-500/10 text-amber-200 placeholder:text-amber-500/50 text-sm px-4 py-2 rounded-xl outline-none border border-amber-500/20"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        onClick={handleSave} 
                        disabled={!amount}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                    >
                        <span>{isEditing ? 'Update Transaction' : 'Save Transaction'}</span>
                        {isEditing ? <Save size={18} /> : <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
