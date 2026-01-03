import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { TransactionType, Category, AppData, Wallet, Transaction, CategoryItem } from '../types';

interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    onAdd: (t: Transaction) => void;
    onTransfer: (amount: number, from: string, to: string, note: string, date: string) => void;
    getDateTime: (d: string) => string;
    CategoryIcon: React.ComponentType<{ category: string, color?: string }>;
}

export const AddTransactionModal: React.FC<AddModalProps> = ({ isOpen, onClose, data, onAdd, onTransfer, getDateTime, CategoryIcon }) => {
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [category, setCategory] = useState<string>(Category.OTHER);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [toWalletId, setToWalletId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNote('');
            setCategory(Category.OTHER);
            setDate(new Date().toISOString().split('T')[0]);
            setType(TransactionType.EXPENSE);
            setToWalletId('');
        }
    }, [isOpen]);

    const calculateExpression = (expr: string): number | null => {
        const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return null;
        try {
            const parts = sanitized.split(/([+\-*/])/);
            let total = parseFloat(parts[0]);
            for (let i = 1; i < parts.length; i += 2) {
                const operator = parts[i];
                const nextVal = parseFloat(parts[i+1]);
                if (isNaN(nextVal)) continue;
                if (operator === '+') total += nextVal;
                else if (operator === '-') total -= nextVal;
                else if (operator === '*') total *= nextVal;
                else if (operator === '/') total /= nextVal;
            }
            return (isFinite(total) && !isNaN(total)) ? total : null;
        } catch (e) {
            return null;
        }
    };

    const handleSave = () => {
        if (!amount) return;
        
        const calculated = calculateExpression(amount);
        if (calculated === null || calculated <= 0) return;

        const numAmount = parseFloat(calculated.toFixed(2));
        
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
                note,
                walletId: data.currentWalletId
            };
            onAdd(newTx);
        }
    };

    const handleAmountBlur = () => {
        const calculated = calculateExpression(amount);
        if (calculated !== null) {
            setAmount(parseFloat(calculated.toFixed(2)).toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen) return null;

    const availableCategories = data.categories.filter((c: CategoryItem) => c.type === type);

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-50 bg-card w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-main">New Transaction</h2>
                     <button onClick={onClose} className="p-2 bg-surface rounded-full text-muted hover:text-main"><X size={20}/></button>
                </div>

                <div className="flex bg-surface p-1 rounded-xl mb-6">
                    <button onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Expense</button>
                    <button onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Income</button>
                    <button onClick={() => setType(TransactionType.TRANSFER)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${type === TransactionType.TRANSFER ? 'bg-blue-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Transfer</button>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{data.settings.currencySymbol}</span>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            onBlur={handleAmountBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="0.00" 
                            className="w-full bg-surface text-main text-2xl font-bold p-4 pl-12 rounded-2xl outline-none border border-white/5 focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    {type === TransactionType.TRANSFER ? (
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-muted uppercase ml-1">To Wallet</label>
                             <div className="grid grid-cols-2 gap-2">
                                 {data.wallets.filter((w: Wallet) => w.id !== data.currentWalletId).map((w: Wallet) => (
                                     <button 
                                        key={w.id} 
                                        onClick={() => setToWalletId(w.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${toWalletId === w.id ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-muted hover:border-white/20'}`}
                                     >
                                         <span className="text-sm font-bold block truncate">{w.name}</span>
                                     </button>
                                 ))}
                             </div>
                         </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                            {availableCategories.map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => setCategory(cat.name)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === cat.name ? 'bg-primary/20 border-primary' : 'bg-surface border-transparent hover:bg-surface/80'}`}
                                >
                                    <div className={`${category === cat.name ? 'scale-110' : 'scale-100'} transition-transform`}>
                                        <CategoryIcon category={cat.name} color={cat.color} />
                                    </div>
                                    <span className={`text-[9px] mt-1 font-medium truncate w-full text-center ${category === cat.name ? 'text-primary' : 'text-muted'}`}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="flex-1 bg-surface rounded-xl p-3 border border-white/5 flex items-center gap-2">
                             <CalendarIcon size={16} className="text-muted" />
                             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm text-main w-full outline-none" />
                        </div>
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="Add a note... (#tags allowed)" 
                        value={note} 
                        onChange={e => setNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-surface text-main p-4 rounded-xl outline-none border border-white/5 focus:border-primary transition-colors text-sm"
                    />

                    <button 
                        onClick={handleSave} 
                        disabled={!amount}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Save Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};