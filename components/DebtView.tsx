import React, { useState } from 'react';
import { PlusCircle, Check, Trash2, AlertTriangle, Calendar as CalendarIcon, Clock, User, ArrowUpRight, ArrowDownRight, X, ArrowRight } from 'lucide-react';
import { Debt, AppData, Transaction, TransactionType, Category } from '../types';

interface DebtProps {
    data: AppData;
    updateData: (d: Partial<AppData>) => void;
    formatMoney: (val: number, sym: string) => string;
    onSettleTransaction: (t: Transaction) => void;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-card w-full max-w-xs rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-main mb-2">Are you sure?</h3>
                    <p className="text-sm text-muted mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-sm hover:bg-black/10 transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DebtView: React.FC<DebtProps> = ({ data, updateData, formatMoney, onSettleTransaction }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'I_OWE' | 'OWES_ME'>('OWES_ME');
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleAddDebt = () => {
        if (!amount) return;
        const newDebt: Debt = {
            id: Date.now().toString(),
            person: person.trim() || "Unspecified",
            amount: parseFloat(amount),
            type,
            note,
            isSettled: false,
            dueDate: dueDate || undefined
        };
        updateData({ debts: [newDebt, ...(data.debts || [])] });
        setIsAddOpen(false);
        setPerson(''); setAmount(''); setNote(''); setDueDate('');
    };

    const toggleSettle = (debt: Debt) => {
        const isSettling = !debt.isSettled;
        
        // Update Debt Status
        const updated = data.debts.map((d: Debt) => d.id === debt.id ? { ...d, isSettled: isSettling } : d);
        updateData({ debts: updated });

        // If creating a settlement, add transaction
        if (isSettling) {
            const isExpense = debt.type === 'I_OWE';
            const newTx: Transaction = {
                id: Date.now().toString(),
                amount: debt.amount,
                type: isExpense ? TransactionType.EXPENSE : TransactionType.INCOME,
                category: isExpense ? Category.LOAN_PAYMENT : Category.LOAN,
                date: new Date().toISOString(),
                note: isExpense ? `Debt paid to ${debt.person}` : `Debt repayment from ${debt.person}`,
                walletId: data.currentWalletId
            };
            onSettleTransaction(newTx);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            updateData({ debts: data.debts.filter((d: Debt) => d.id !== deleteId) });
            setDeleteId(null);
        }
    };

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
    };

    // Calculate Summary
    const totalIOwe = data.debts.filter((d:Debt) => !d.isSettled && d.type === 'I_OWE').reduce((a:number,b:Debt)=>a+b.amount,0);
    const totalOwesMe = data.debts.filter((d:Debt) => !d.isSettled && d.type === 'OWES_ME').reduce((a:number,b:Debt)=>a+b.amount,0);
    const netPosition = totalOwesMe - totalIOwe;

    return (
        <div className="animate-in fade-in duration-500 space-y-6 pb-24">
            
            {/* Summary Card */}
            <div className="flex-none">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-main">Debt Tracker</h2>
                    <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-surface hover:bg-surface/80 active:scale-95 transition-all py-2 px-4 rounded-full border border-white/10 text-xs font-bold text-main">
                        <PlusCircle size={16} /> Add Record
                    </button>
                </div>
                
                <div className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                         <div>
                             <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-1">Net Position</p>
                             <h1 className={`text-3xl font-bold ${netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {netPosition >= 0 ? '+' : ''}{formatMoney(netPosition, data.settings.currencySymbol)}
                             </h1>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                             <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                 <ArrowUpRight size={14} />
                                 <span>Get: {formatMoney(totalOwesMe, data.settings.currencySymbol)}</span>
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
                                 <ArrowDownRight size={14} />
                                 <span>Pay: {formatMoney(totalIOwe, data.settings.currencySymbol)}</span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {data.debts.length === 0 && (
                    <div className="text-center py-10 text-muted border border-dashed border-white/10 rounded-3xl bg-surface/30 flex flex-col items-center gap-2">
                        <User size={32} className="opacity-50"/>
                        <p className="text-sm">No active debts tracked.</p>
                    </div>
                )}
                
                {data.debts.map((d: Debt) => (
                    <div key={d.id} className={`glass-card p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${d.isSettled ? 'opacity-50 grayscale bg-black/5' : 'hover:bg-surface/70'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${d.type === 'OWES_ME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                {d.type === 'OWES_ME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div>
                                <h4 className="text-main font-bold text-sm leading-tight">{d.person}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold ${d.type === 'OWES_ME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {d.type === 'OWES_ME' ? 'OWES YOU' : 'YOU OWE'}
                                    </span>
                                    {d.isSettled ? (
                                        <span className="text-[10px] font-bold text-muted bg-black/10 px-1.5 py-0.5 rounded">SETTLED</span>
                                    ) : (
                                        d.dueDate && (
                                            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${isOverdue(d.dueDate) ? 'bg-rose-500 text-white' : 'bg-surface text-muted border border-white/10'}`}>
                                                <Clock size={8} />
                                                {new Date(d.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                             <span className="text-base font-bold text-main">{formatMoney(d.amount, data.settings.currencySymbol)}</span>
                             <div className="flex gap-2 mt-1">
                                 <button onClick={() => toggleSettle(d)} className={`p-1.5 rounded-full transition-colors ${d.isSettled ? 'bg-emerald-500 text-white shadow-sm' : 'bg-surface text-muted hover:text-emerald-500 border border-white/5'}`}>
                                     <Check size={14}/>
                                 </button>
                                 <button onClick={() => setDeleteId(d.id)} className="p-1.5 bg-surface rounded-full text-muted hover:text-rose-500 border border-white/5 transition-colors"><Trash2 size={14}/></button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Compact Debt Add Modal */}
            {isAddOpen && (
                 <div className="fixed inset-0 z-[5000] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsAddOpen(false)}/>
                    <div className="relative z-50 bg-card w-full max-w-md rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full pb-safe">
                         
                         {/* Header with Type Toggle */}
                         <div className="flex items-center justify-between p-4 pb-2">
                             <div className="flex bg-surface rounded-full p-1 border border-white/5">
                                 <button onClick={() => setType('OWES_ME')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${type === 'OWES_ME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>THEY OWE ME</button>
                                 <button onClick={() => setType('I_OWE')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${type === 'I_OWE' ? 'bg-rose-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>I OWE THEM</button>
                             </div>
                             <button onClick={() => setIsAddOpen(false)} className="p-2 bg-surface rounded-full text-muted hover:text-main"><X size={20}/></button>
                         </div>
                         
                         {/* Main Amount Input */}
                         <div className="px-6 py-2">
                            <div className="flex items-center justify-center relative">
                                <span className="text-2xl font-bold text-muted absolute left-0 top-1/2 -translate-y-1/2">{data.settings.currencySymbol}</span>
                                <input 
                                    type="number" 
                                    inputMode="decimal"
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    placeholder="0" 
                                    className="w-full bg-transparent text-center text-5xl font-bold text-main placeholder:text-muted/20 outline-none py-4"
                                    autoFocus
                                />
                            </div>
                         </div>

                         {/* Form Fields */}
                         <div className="px-4 space-y-3 mb-2">
                             <input 
                                 type="text" 
                                 placeholder="Person Name" 
                                 value={person} 
                                 onChange={e => setPerson(e.target.value)} 
                                 className="w-full bg-surface text-main p-4 rounded-2xl outline-none border border-white/5 focus:border-primary transition-colors text-sm font-semibold" 
                             />

                             <div className="space-y-3">
                                <div className="w-full bg-surface rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-muted shrink-0" />
                                    <span className="text-xs text-muted font-bold whitespace-nowrap">Due Date:</span>
                                    <input 
                                        type="date" 
                                        value={dueDate} 
                                        onChange={e => setDueDate(e.target.value)} 
                                        className="bg-transparent text-sm font-bold text-main w-full outline-none text-right placeholder-muted/50" 
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Add a note..." 
                                    value={note} 
                                    onChange={e => setNote(e.target.value)} 
                                    className="w-full bg-surface text-main px-4 py-3 rounded-2xl outline-none border border-white/5 focus:border-primary transition-colors text-sm"
                                 />
                             </div>

                             <button 
                                onClick={handleAddDebt} 
                                disabled={!amount} 
                                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                             >
                                 <span>Save Record</span>
                                 <ArrowRight size={18} />
                             </button>
                         </div>
                    </div>
                 </div>
            )}
            
            <ConfirmModal 
                isOpen={!!deleteId} 
                onClose={() => setDeleteId(null)} 
                onConfirm={confirmDelete}
                message="Delete this record permanently?" 
            />
        </div>
    );
};