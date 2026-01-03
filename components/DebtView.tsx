import React, { useState } from 'react';
import { PlusCircle, Check, Trash2 } from 'lucide-react';
import { Debt, AppData } from '../types';

interface DebtProps {
    data: AppData;
    updateData: (d: Partial<AppData>) => void;
    formatMoney: (val: number, sym: string) => string;
}

export const DebtView: React.FC<DebtProps> = ({ data, updateData, formatMoney }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'I_OWE' | 'OWES_ME'>('OWES_ME');
    const [note, setNote] = useState('');

    const handleAddDebt = (e: React.FormEvent) => {
        e.preventDefault();
        const newDebt: Debt = {
            id: Date.now().toString(),
            person,
            amount: parseFloat(amount),
            type,
            note,
            isSettled: false,
            dueDate: new Date().toISOString()
        };
        updateData({ debts: [newDebt, ...(data.debts || [])] });
        setIsAddOpen(false);
        setPerson(''); setAmount(''); setNote('');
    };

    const toggleSettle = (id: string) => {
        const updated = data.debts.map((d: Debt) => d.id === id ? { ...d, isSettled: !d.isSettled } : d);
        updateData({ debts: updated });
    };

    const deleteDebt = (id: string) => {
        if(confirm("Delete this debt record?")) {
            updateData({ debts: data.debts.filter((d: Debt) => d.id !== id) });
        }
    };

    return (
        <div className="mt-4 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-main">Debt Tracker</h2>
                <button onClick={() => setIsAddOpen(true)} className="p-2 bg-primary text-white rounded-full shadow-lg"><PlusCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface p-4 rounded-3xl border border-white/5">
                    <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Total I Owe</p>
                    <p className="text-rose-400 text-lg font-bold">{formatMoney(data.debts.filter((d:Debt) => !d.isSettled && d.type === 'I_OWE').reduce((a:number,b:Debt)=>a+b.amount,0), data.settings.currencySymbol)}</p>
                </div>
                 <div className="bg-surface p-4 rounded-3xl border border-white/5">
                    <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Owes Me</p>
                    <p className="text-emerald-400 text-lg font-bold">{formatMoney(data.debts.filter((d:Debt) => !d.isSettled && d.type === 'OWES_ME').reduce((a:number,b:Debt)=>a+b.amount,0), data.settings.currencySymbol)}</p>
                </div>
            </div>

            <div className="space-y-3">
                {data.debts.length === 0 && <div className="text-center py-10 text-muted border border-dashed border-white/10 rounded-2xl">No active debts</div>}
                {data.debts.map((d: Debt) => (
                    <div key={d.id} className={`glass-card p-4 rounded-2xl flex items-center justify-between ${d.isSettled ? 'opacity-50' : ''}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.type === 'OWES_ME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {d.type === 'OWES_ME' ? 'THEY OWE YOU' : 'YOU OWE'}
                                </span>
                                {d.isSettled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500">SETTLED</span>}
                            </div>
                            <h4 className="text-main font-bold">{d.person}</h4>
                            {d.note && <p className="text-xs text-muted">{d.note}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <span className="text-lg font-bold text-main">{formatMoney(d.amount, data.settings.currencySymbol)}</span>
                             <div className="flex gap-2">
                                 <button onClick={() => toggleSettle(d.id)} className="p-1.5 bg-surface rounded-full text-emerald-400 hover:bg-emerald-500/20"><Check size={16}/></button>
                                 <button onClick={() => deleteDebt(d.id)} className="p-1.5 bg-surface rounded-full text-rose-400 hover:bg-rose-500/20"><Trash2 size={16}/></button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {isAddOpen && (
                 <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 transition-opacity" onClick={() => setIsAddOpen(false)}/>
                    <div className="relative z-50 bg-card w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
                         <h2 className="text-xl font-bold text-main mb-4">Add Debt Record</h2>
                         <form onSubmit={handleAddDebt} className="space-y-4">
                             <div className="flex bg-surface p-1 rounded-xl">
                                 <button type="button" onClick={() => setType('OWES_ME')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'OWES_ME' ? 'bg-emerald-500 text-white' : 'text-muted'}`}>OWES ME</button>
                                 <button type="button" onClick={() => setType('I_OWE')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'I_OWE' ? 'bg-rose-500 text-white' : 'text-muted'}`}>I OWE</button>
                             </div>
                             <input type="text" placeholder="Person Name" value={person} onChange={e => setPerson(e.target.value)} className="w-full bg-surface text-main p-3 rounded-xl outline-none" required/>
                             <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-surface text-main p-3 rounded-xl outline-none" required/>
                             <input type="text" placeholder="Note (Optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-surface text-main p-3 rounded-xl outline-none"/>
                             <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl">Save</button>
                         </form>
                    </div>
                 </div>
            )}
        </div>
    );
};