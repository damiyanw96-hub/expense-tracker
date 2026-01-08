
import React, { useState, useRef } from 'react';
import { ArrowLeft, Moon, Bell, AlertTriangle, Download, Upload, Trash2, Check, ChevronDown, ChevronRight, Palette, CreditCard, Shield } from 'lucide-react';
import { AppData, TransactionType, CategoryItem, ViewState } from '../types';

const COLOR_PRESETS = [
    '#5e5ce6', '#32d74b', '#ff453a', '#ff9f0a', '#0a84ff', '#bf5af2', '#ff375f', '#64d2ff', '#ac8e68', '#98989d'
];

const CURRENCIES = [
    { value: 'BDT', label: 'Bangladeshi Taka', symbol: '৳' },
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

const Header = ({ title, onBack, onSave }: { title: string, onBack: () => void, onSave?: () => void }) => (
   <div className="pt-safe pt-2 px-5 pb-4 z-40 bg-dark/80 backdrop-blur-md sticky top-0 border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:text-primary rounded-full transition-colors active:scale-90 bg-surface/50 border border-white/5">
              <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
      </div>
      {onSave && <button onClick={onSave} className="text-primary text-sm font-bold active:opacity-70 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Save</button>}
   </div>
);

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-12 h-7 rounded-full relative transition-all duration-300 ${checked ? 'bg-primary' : 'bg-[#3a3a3c]'}`}
    >
        <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
);

export const AccountView = ({ data, updateData, onBack }: { data: AppData, updateData: (d: Partial<AppData>) => void, onBack: () => void }) => {
    const [localProfile, setLocalProfile] = useState(data.profile);

    const handleSave = () => {
        updateData({ profile: localProfile });
        onBack();
    };

    return (
        <div className="h-full bg-dark overflow-y-auto pb-safe">
            <Header title="Account & Goals" onBack={onBack} onSave={handleSave} />
            <div className="p-5 space-y-6">
                <div className="bg-[#1c1c1e] rounded-3xl border border-white/5 overflow-hidden p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-2 block tracking-wider">Display Name</label>
                        <input 
                            type="text" 
                            value={localProfile.name}
                            onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                            className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-lg font-medium outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-2 block tracking-wider">Monthly Budget Goal</label>
                        <div className="relative">
                            <span className="absolute left-5 top-4 text-muted font-bold">{data.settings.currencySymbol}</span>
                            <input 
                                type="number" 
                                value={localProfile.monthlyGoal}
                                onChange={(e) => setLocalProfile({ ...localProfile, monthlyGoal: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-black border border-white/5 rounded-2xl pl-10 pr-5 py-4 text-white text-lg font-medium outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-2 block tracking-wider">Daily Spending Limit</label>
                        <div className="relative">
                            <span className="absolute left-5 top-4 text-muted font-bold">{data.settings.currencySymbol}</span>
                            <input 
                                type="number" 
                                placeholder="Disabled"
                                value={localProfile.dailyGoal || ''}
                                onChange={(e) => setLocalProfile({ ...localProfile, dailyGoal: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-black border border-white/5 rounded-2xl pl-10 pr-5 py-4 text-white text-lg font-medium outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <p className="text-[10px] text-muted mt-2 ml-1">Set to 0 or leave empty to disable daily tracking.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CategoriesView = ({ data, updateData, onBack }: { data: AppData, updateData: (d: Partial<AppData>) => void, onBack: () => void }) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);

    const handleAddCategory = () => {
        if (!newCatName) return;
        const newCat: CategoryItem = {
            id: `cat_${Date.now()}`,
            name: newCatName,
            type: newCatType,
            color: newCatColor,
            isSystem: false
        };
        updateData({ categories: [...data.categories, newCat] });
        setNewCatName('');
        setNewCatColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    };

    const handleDeleteCategory = (id: string) => {
        if (data.transactions.some((t) => t.category === data.categories.find(c => c.id === id)?.name)) {
            alert("Cannot delete category with existing transactions.");
            return;
        }
        updateData({ categories: data.categories.filter((c: CategoryItem) => c.id !== id) });
    };

    return (
        <div className="h-full bg-dark overflow-y-auto pb-safe">
            <Header title="Categories" onBack={onBack} />
            <div className="p-5 space-y-6">
                <div className="bg-[#1c1c1e] p-5 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex bg-black rounded-xl p-1 border border-white/5">
                         <button onClick={() => setNewCatType(TransactionType.EXPENSE)} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${newCatType === TransactionType.EXPENSE ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-muted'}`}>Expense</button>
                         <button onClick={() => setNewCatType(TransactionType.INCOME)} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${newCatType === TransactionType.INCOME ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-muted'}`}>Income</button>
                    </div>
                    <div className="space-y-4">
                         <input type="text" placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50 transition-colors" />
                         <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-1">
                            {COLOR_PRESETS.map(c => (
                                <button key={c} onClick={() => setNewCatColor(c)} className={`w-10 h-10 rounded-full shrink-0 border-2 transition-all ${newCatColor === c ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                            ))}
                         </div>
                    </div>
                    <button onClick={handleAddCategory} disabled={!newCatName} className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-30 active:scale-[0.98] transition-all">Add Category</button>
                </div>
                <div className="space-y-1">
                     <p className="text-xs font-bold text-muted uppercase px-2 mb-2">Existing Categories</p>
                     <div className="bg-[#1c1c1e] rounded-3xl overflow-hidden border border-white/5">
                         {data.categories.filter(c => c.type === newCatType).map((cat, idx) => (
                             <div key={cat.id} className={`flex items-center justify-between p-4 ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
                                 <div className="flex items-center gap-4">
                                     <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                     <span className="text-sm font-bold text-white">{cat.name}</span>
                                 </div>
                                 {!cat.isSystem && <button onClick={() => handleDeleteCategory(cat.id)} className="text-muted hover:text-rose-500 p-2"><Trash2 size={16}/></button>}
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export const BudgetsView = ({ data, updateData, onBack }: { data: AppData, updateData: (d: Partial<AppData>) => void, onBack: () => void }) => {
    const [budgetCat, setBudgetCat] = useState('');
    const [budgetLimit, setBudgetLimit] = useState('');
    const [openDropdown, setOpenDropdown] = useState(false);

    const expenseCategories = data.categories.filter(c => c.type === TransactionType.EXPENSE).map(c => c.name);
    const activeBudgets = Object.entries(data.settings.budgetLimits).filter(([_, limit]) => limit > 0).sort((a, b) => b[1] - a[1]);
    const availableForBudget = expenseCategories.filter(cat => !data.settings.budgetLimits[cat]);

    const handleAddBudget = () => {
        if (!budgetCat || !budgetLimit) return;
        const limit = parseFloat(budgetLimit);
        if (limit > 0) {
            updateData({ settings: { ...data.settings, budgetLimits: { ...data.settings.budgetLimits, [budgetCat]: limit } } });
            setBudgetLimit(''); setBudgetCat(''); setOpenDropdown(false);
        }
    };

    const removeBudget = (cat: string) => {
        const newLimits = { ...data.settings.budgetLimits };
        delete newLimits[cat];
        updateData({ settings: { ...data.settings, budgetLimits: newLimits } });
    };

    return (
        <div className="h-full bg-dark overflow-y-auto pb-safe">
            <Header title="Budgets & Limits" onBack={onBack} />
            <div className="p-5 space-y-6">
                 {availableForBudget.length > 0 && (
                     <div className="bg-[#1c1c1e] p-5 rounded-3xl border border-white/5 space-y-4">
                         <div className="flex gap-3">
                             <div className="relative flex-1">
                                <button onClick={() => setOpenDropdown(!openDropdown)} className="w-full bg-black border border-white/5 text-white text-sm font-bold rounded-2xl px-4 py-4 flex items-center justify-between">
                                    <span className="truncate">{budgetCat || "Select Category"}</span>
                                    <ChevronDown size={16} className="text-muted" />
                                </button>
                                {openDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#2c2c2e] rounded-2xl border border-white/10 overflow-hidden shadow-xl z-20 max-h-48 overflow-y-auto">
                                        {availableForBudget.map(c => (
                                            <button key={c} onClick={() => { setBudgetCat(c); setOpenDropdown(false); }} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-white/5 border-b border-white/5 last:border-0 font-medium">{c}</button>
                                        ))}
                                    </div>
                                )}
                             </div>
                             <div className="relative w-32">
                                 <span className="absolute left-4 top-4 text-muted text-sm font-bold">{data.settings.currencySymbol}</span>
                                 <input type="number" placeholder="Limit" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} className="w-full bg-black border border-white/5 text-white text-sm font-bold rounded-2xl pl-8 pr-4 py-4 outline-none" />
                             </div>
                         </div>
                         <button onClick={handleAddBudget} disabled={!budgetCat || !budgetLimit} className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50">Set Limit</button>
                     </div>
                 )}
                 <div className="space-y-1">
                     <p className="text-xs font-bold text-muted uppercase px-2 mb-2">Active Budgets</p>
                     <div className="bg-[#1c1c1e] rounded-3xl overflow-hidden border border-white/5">
                        {activeBudgets.length === 0 && <div className="p-6 text-center text-sm text-muted">No specific limits set.</div>}
                        {activeBudgets.map(([cat, limit], idx) => (
                             <div key={cat} className={`flex items-center justify-between p-5 ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
                                 <div>
                                     <span className="text-sm font-bold text-white block">{cat}</span>
                                     <span className="text-xs font-semibold text-emerald-400">Max: {data.settings.currencySymbol}{limit}</span>
                                 </div>
                                 <button onClick={() => removeBudget(cat)} className="p-2.5 bg-black/40 text-muted hover:text-rose-500 rounded-xl"><Trash2 size={16} /></button>
                             </div>
                        ))}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export const GeneralSettingsView = ({ data, updateData, onBack }: { data: AppData, updateData: (d: Partial<AppData>) => void, onBack: () => void }) => {
    const [localSettings, setLocalSettings] = useState(data.settings);
    const [openDropdown, setOpenDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Save immediately on toggle
    const updateSettings = (newSettings: any) => {
        setLocalSettings(newSettings);
        updateData({ settings: newSettings });
    };

    const toggleNotification = async (type: 'expense' | 'debt') => {
        if (!('Notification' in window)) {
             alert('Not supported'); return;
        }
        const currentVal = type === 'expense' ? localSettings.expenseReminders : localSettings.debtReminders;
        if (!currentVal) {
             const p = await Notification.requestPermission();
             if (p !== 'granted') return;
        }
        updateSettings({ ...localSettings, [type === 'expense' ? 'expenseReminders' : 'debtReminders']: !currentVal });
    };

    return (
        <div className="h-full bg-dark overflow-y-auto pb-safe">
            <Header title="Preferences" onBack={onBack} />
            <div className="p-5 space-y-6">
                <div className="bg-[#1c1c1e] rounded-3xl border border-white/5 overflow-hidden">
                     <div className="p-5 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400"><Moon size={20} /></div>
                            <span className="text-sm font-bold text-white">Dark Mode</span>
                        </div>
                        <Switch checked={localSettings.darkMode} onChange={() => updateSettings({ ...localSettings, darkMode: !localSettings.darkMode })} />
                     </div>
                     <div className="p-5 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><Bell size={20} /></div>
                            <span className="text-sm font-bold text-white">Daily Reminders</span>
                        </div>
                        <Switch checked={localSettings.expenseReminders} onChange={() => toggleNotification('expense')} />
                     </div>
                     <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400"><AlertTriangle size={20} /></div>
                            <span className="text-sm font-bold text-white">Debt Alerts</span>
                        </div>
                        <Switch checked={localSettings.debtReminders} onChange={() => toggleNotification('debt')} />
                     </div>
                </div>

                <div className="bg-[#1c1c1e] p-5 rounded-3xl border border-white/5">
                    <label className="text-xs font-bold text-muted uppercase mb-3 block tracking-wide">Primary Currency</label>
                    <div className="relative">
                        <button onClick={() => setOpenDropdown(!openDropdown)} className="w-full bg-black border border-white/5 text-white text-sm font-bold rounded-2xl px-5 py-4 flex items-center justify-between">
                            <span className="flex items-center gap-3">
                                <span className="text-primary">{CURRENCIES.find(c => c.value === localSettings.currencySymbol)?.symbol}</span>
                                <span>{CURRENCIES.find(c => c.value === localSettings.currencySymbol)?.label}</span>
                            </span>
                            <ChevronDown size={18} className="text-muted" />
                        </button>
                        {openDropdown && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#2c2c2e] rounded-2xl border border-white/10 overflow-hidden shadow-xl z-20 max-h-56 overflow-y-auto">
                                {CURRENCIES.map(c => (
                                    <button key={c.value} onClick={() => { updateSettings({ ...localSettings, currencySymbol: c.value }); setOpenDropdown(false); }} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0">
                                        <span className="text-sm text-white font-medium">{c.label}</span>
                                        {localSettings.currencySymbol === c.value && <Check size={18} className="text-primary"/>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1c1c1e] rounded-3xl border border-white/5 overflow-hidden">
                    <button onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
                        const dlAnchorElem = document.createElement('a');
                        dlAnchorElem.setAttribute("href", dataStr);
                        dlAnchorElem.setAttribute("download", "backup.json");
                        dlAnchorElem.click();
                    }} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#2c2c2e] rounded-xl text-white"><Download size={20} /></div>
                            <span className="text-sm font-bold text-white">Backup Data</span>
                        </div>
                        <ChevronRight size={18} className="text-muted/50" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#2c2c2e] rounded-xl text-white"><Upload size={20} /></div>
                            <span className="text-sm font-bold text-white">Restore Data</span>
                        </div>
                         <ChevronRight size={18} className="text-muted/50" />
                    </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => {
                                 try { updateData(JSON.parse(ev.target?.result as string)); alert('Restored'); } catch(err){ alert('Error'); }
                             };
                             reader.readAsText(file);
                         }
                    }} />
                    <button onClick={() => { if(confirm("Reset all data? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } }} className="w-full flex items-center justify-between p-5 hover:bg-rose-500/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500"><Trash2 size={20} /></div>
                            <span className="text-sm font-bold text-rose-500">Reset All Data</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
