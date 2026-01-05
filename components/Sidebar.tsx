import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Settings, TrendingUp, X, GripVertical, Moon, Sun, Download, Upload, Trash2, Check, Plus, ChevronDown, ChevronRight, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { AppData, TransactionType, CategoryItem } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    updateData: (d: Partial<AppData>) => void;
    onViewChange: (v: any) => void;
}

const COLOR_PRESETS = [
    '#5e5ce6', // Indigo
    '#32d74b', // Green
    '#ff453a', // Red
    '#ff9f0a', // Orange
    '#0a84ff', // Blue
    '#bf5af2', // Purple
    '#ff375f', // Pink
    '#64d2ff', // Cyan
    '#ac8e68', // Brown
    '#98989d', // Gray
];

const CURRENCIES = [
    { value: 'BDT', label: 'Bangladeshi Taka', symbol: '৳' },
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

const CustomConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDanger }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-card w-full max-w-xs rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${isDanger ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-main mb-2">{title}</h3>
                    <p className="text-sm text-muted mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-sm hover:bg-black/10 transition-colors">Cancel</button>
                        <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-colors ${isDanger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary hover:bg-primary/90'}`}>Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, data, updateData, onViewChange }) => {
    const [sidebarView, setSidebarView] = useState<'menu' | 'account' | 'settings' | 'budgets' | 'categories'>('menu');
    const [localProfile, setLocalProfile] = useState(data.profile);
    const [localSettings, setLocalSettings] = useState(data.settings);
    
    // Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
    
    // Budget State
    const [budgetCat, setBudgetCat] = useState('');
    const [budgetLimit, setBudgetLimit] = useState('');
    
    // UI State for Inline Dropdowns
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalProfile(data.profile);
            setLocalSettings(data.settings);
            setSidebarView('menu');
            setOpenDropdown(null);
        }
    }, [isOpen, data]);

    const handleSave = () => {
        updateData({ profile: localProfile, settings: localSettings });
        setSidebarView('menu');
    };

    const toggleNotification = async (type: 'expense' | 'debt') => {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications.');
            return;
        }

        const currentVal = type === 'expense' ? localSettings.expenseReminders : localSettings.debtReminders;
        
        if (!currentVal) {
             const permission = await Notification.requestPermission();
             if (permission !== 'granted') {
                 alert('Permission denied. Please enable notifications in your browser settings.');
                 return;
             }
        }

        setLocalSettings(prev => ({
            ...prev,
            [type === 'expense' ? 'expenseReminders' : 'debtReminders']: !currentVal
        }));
    };

    // --- Category Logic ---
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

    // --- Budget Logic ---
    const expenseCategories = data.categories
        .filter((c: CategoryItem) => c.type === TransactionType.EXPENSE)
        .map((c: CategoryItem) => c.name);

    const activeBudgets = (Object.entries(localSettings.budgetLimits) as [string, number][])
        .filter(([_, limit]) => limit > 0)
        .sort((a, b) => b[1] - a[1]);

    const availableForBudget = expenseCategories.filter(cat => !localSettings.budgetLimits[cat] || localSettings.budgetLimits[cat] === 0);

    const handleAddBudget = () => {
        if (!budgetCat || !budgetLimit) return;
        const limit = parseFloat(budgetLimit);
        if (limit > 0) {
            setLocalSettings({
                ...localSettings,
                budgetLimits: { ...localSettings.budgetLimits, [budgetCat]: limit }
            });
            setBudgetLimit('');
            setBudgetCat('');
            setOpenDropdown(null);
        }
    };

    const removeBudget = (cat: string) => {
        const newLimits = { ...localSettings.budgetLimits };
        delete newLimits[cat];
        setLocalSettings({ ...localSettings, budgetLimits: newLimits });
    };

    useEffect(() => {
        if (sidebarView === 'budgets' && !budgetCat && availableForBudget.length > 0) {
            setBudgetCat(availableForBudget[0]);
        }
    }, [sidebarView, availableForBudget, budgetCat]);


    const MenuHeader = ({ title, onBack = () => setSidebarView('menu') }: { title: string, onBack?: () => void }) => (
       <div className="pt-safe pt-6 pb-6 px-6 bg-surface border-b border-white/5 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-main rounded-full transition-colors"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold text-main">{title}</h2>
          </div>
       </div>
    );

    return (
      <>
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
        <div className={`fixed inset-y-0 left-0 w-[85%] max-w-xs bg-dark border-r border-white/10 z-[101] transform transition-transform duration-300 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           
           {sidebarView === 'menu' && (
             <>
                <div className="pt-safe pt-6 pb-6 px-6 bg-surface border-b border-white/5 relative">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-dark flex items-center justify-center text-main overflow-hidden">
                                <span className="text-xl font-bold">{data.profile.name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-main leading-none mb-1">{data.profile.name}</h2>
                            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-start border border-primary/20">Pro Account</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
                    <button onClick={() => setSidebarView('account')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform"><User size={18}/></div>
                            <span className="text-sm font-semibold text-main">My Account</span>
                        </div>
                        <ChevronRight size={16} className="text-muted/50" />
                    </button>

                    <button onClick={() => setSidebarView('settings')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform"><Settings size={18}/></div>
                            <span className="text-sm font-semibold text-main">Settings</span>
                        </div>
                        <ChevronRight size={16} className="text-muted/50" />
                    </button>

                     <button onClick={() => setSidebarView('budgets')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><TrendingUp size={18}/></div>
                            <span className="text-sm font-semibold text-main">Manage Budgets</span>
                        </div>
                        <ChevronRight size={16} className="text-muted/50" />
                    </button>

                    <button onClick={() => setSidebarView('categories')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform"><GripVertical size={18}/></div>
                            <span className="text-sm font-semibold text-main">Categories</span>
                        </div>
                        <ChevronRight size={16} className="text-muted/50" />
                    </button>
                </div>
             </>
           )}

           {sidebarView === 'categories' && (
                <>
                <MenuHeader title="Categories" />
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                     <div className="bg-surface p-4 rounded-2xl border border-white/5 space-y-3">
                         <h3 className="text-xs font-bold text-muted uppercase">Add New</h3>
                         <div className="flex flex-col gap-3">
                             <input type="text" placeholder="Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-black/20 rounded-lg px-3 py-3 text-sm text-main outline-none border border-white/5 focus:border-primary/50" />
                             
                             {/* Color Swatches */}
                             <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {COLOR_PRESETS.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setNewCatColor(c)}
                                        className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all ${newCatColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                             </div>
                         </div>
                         <div className="flex gap-2 pt-1">
                            <button onClick={() => setNewCatType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${newCatType === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg' : 'bg-black/20 text-muted'}`}>EXPENSE</button>
                            <button onClick={() => setNewCatType(TransactionType.INCOME)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${newCatType === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'bg-black/20 text-muted'}`}>INCOME</button>
                         </div>
                         <button onClick={handleAddCategory} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold mt-1 shadow-lg shadow-primary/20">Add Category</button>
                     </div>

                     <div className="space-y-2 pb-4">
                         {data.categories.map((cat: CategoryItem) => (
                             <div key={cat.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                     <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                     <span className="text-sm font-medium text-main">{cat.name}</span>
                                 </div>
                                 {!cat.isSystem && (
                                     <button onClick={() => handleDeleteCategory(cat.id)} className="text-muted hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                                 )}
                             </div>
                         ))}
                     </div>
                </div>
                </>
           )}

           {sidebarView === 'account' && (
                <>
                <MenuHeader title="My Account" />
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    <div className="space-y-4">
                        <div className="group">
                            <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">Display Name</label>
                            <input 
                                type="text" 
                                value={localProfile.name}
                                onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                                className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-main border border-white/10 focus:border-primary outline-none transition-colors"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">Monthly Budget Goal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{data.settings.currencySymbol}</span>
                                <input 
                                type="number" 
                                value={localProfile.monthlyGoal}
                                onChange={(e) => setLocalProfile({ ...localProfile, monthlyGoal: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-surface rounded-xl pl-10 pr-4 py-3 text-sm text-main border border-white/10 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <p className="text-[10px] text-muted mt-2">This goal is used to calculate your budget progress bars.</p>
                        </div>
                        <div className="group">
                            <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">Daily Budget Goal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{data.settings.currencySymbol}</span>
                                <input 
                                type="number" 
                                placeholder="0 to disable"
                                value={localProfile.dailyGoal || ''}
                                onChange={(e) => setLocalProfile({ ...localProfile, dailyGoal: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-surface rounded-xl pl-10 pr-4 py-3 text-sm text-main border border-white/10 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <p className="text-[10px] text-muted mt-2">Set a target for daily spending. Set to 0 to disable.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-dark flex gap-3 pb-safe-bottom">
                    <button onClick={() => setSidebarView('menu')} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-xs hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors">Save Changes</button>
                </div>
                </>
            )}

           {sidebarView === 'budgets' && (
              <>
                 <MenuHeader title="Budget Limits" />
                 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                     {/* Active Budgets List */}
                     <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted uppercase">Active Budgets</h3>
                        {activeBudgets.length === 0 && <div className="text-center py-4 text-muted text-sm border border-dashed border-white/10 rounded-xl">No specific category limits set.</div>}
                        
                        {activeBudgets.map(([cat, limit]) => (
                             <div key={cat} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5">
                                 <div>
                                     <span className="text-sm font-bold text-main block">{cat}</span>
                                     <span className="text-xs text-muted">Limit: {data.settings.currencySymbol}{limit}</span>
                                 </div>
                                 <button onClick={() => removeBudget(cat)} className="p-2 text-muted hover:text-rose-500 bg-black/10 rounded-lg transition-colors">
                                     <Trash2 size={16} />
                                 </button>
                             </div>
                        ))}
                     </div>

                     {/* Add New Budget */}
                     {availableForBudget.length > 0 ? (
                         <div className="bg-surface p-4 rounded-2xl border border-white/5 space-y-3">
                             <h3 className="text-xs font-bold text-muted uppercase">Set New Limit</h3>
                             <div className="space-y-3">
                                 {/* Inline Dropdown for Category */}
                                 <div className="relative">
                                    <button 
                                        onClick={() => setOpenDropdown(openDropdown === 'budget' ? null : 'budget')}
                                        className="w-full bg-black/20 text-main text-sm rounded-xl px-3 py-3 border border-white/10 flex items-center justify-between hover:bg-black/30 transition-colors"
                                    >
                                        <span className={budgetCat ? "text-main" : "text-muted"}>{budgetCat || "Select Category"}</span>
                                        <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {openDropdown === 'budget' && (
                                        <div className="mt-2 bg-black/30 rounded-xl border border-white/10 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                {availableForBudget.map(c => (
                                                    <button 
                                                        key={c}
                                                        onClick={() => { setBudgetCat(c); setOpenDropdown(null); }}
                                                        className="w-full text-left px-4 py-3 text-sm text-main hover:bg-white/5 border-b border-white/5 last:border-0"
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                 </div>

                                 <div className="flex items-center gap-2">
                                     <span className="text-main font-bold text-sm bg-black/20 px-3 py-3 rounded-xl border border-white/10">{data.settings.currencySymbol}</span>
                                     <input 
                                        type="number" 
                                        placeholder="Limit Amount" 
                                        value={budgetLimit}
                                        onChange={e => setBudgetLimit(e.target.value)}
                                        className="w-full bg-black/20 text-main text-sm rounded-xl px-3 py-3 border border-white/10 outline-none focus:border-primary"
                                     />
                                 </div>

                                 <button 
                                    onClick={handleAddBudget}
                                    disabled={!budgetCat || !budgetLimit}
                                    className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                                 >
                                     <Plus size={16} /> Set Limit
                                 </button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center p-4 text-emerald-400 text-xs font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                             All categories have limits assigned!
                         </div>
                     )}
                 </div>
                 <div className="p-4 border-t border-white/5 bg-dark flex gap-3 pb-safe-bottom">
                    <button onClick={() => setSidebarView('menu')} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-xs">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs">Save Budgets</button>
                </div>
              </>
           )}

           {sidebarView === 'settings' && (
             <>
                <MenuHeader title="Settings" />
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    <div className="bg-surface p-4 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {localSettings.darkMode ? <Moon size={16} className="text-muted"/> : <Sun size={16} className="text-muted"/>}
                                <span className="text-sm font-medium text-main">Dark Mode</span>
                            </div>
                            <button onClick={() => setLocalSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))} className={`w-11 h-6 rounded-full relative transition-colors ${localSettings.darkMode ? 'bg-primary' : 'bg-slate-500'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${localSettings.darkMode ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                {localSettings.expenseReminders ? <Bell size={16} className="text-primary"/> : <BellOff size={16} className="text-muted"/>}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-main">Daily Reminders</span>
                                    <span className="text-[10px] text-muted">Update expenses daily</span>
                                </div>
                            </div>
                            <button onClick={() => toggleNotification('expense')} className={`w-11 h-6 rounded-full relative transition-colors ${localSettings.expenseReminders ? 'bg-primary' : 'bg-slate-500'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${localSettings.expenseReminders ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                {localSettings.debtReminders ? <Bell size={16} className="text-primary"/> : <BellOff size={16} className="text-muted"/>}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-main">Debt Reminders</span>
                                    <span className="text-[10px] text-muted">Alerts on due dates</span>
                                </div>
                            </div>
                            <button onClick={() => toggleNotification('debt')} className={`w-11 h-6 rounded-full relative transition-colors ${localSettings.debtReminders ? 'bg-primary' : 'bg-slate-500'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${localSettings.debtReminders ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Currency Inline Dropdown */}
                    <div className="bg-surface p-4 rounded-2xl border border-white/5">
                         <label className="text-[10px] uppercase font-bold text-muted block mb-3">Currency</label>
                         <div className="relative">
                            <button 
                                onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}
                                className="w-full bg-black/20 text-main text-sm rounded-xl px-4 py-3 border border-white/10 flex items-center justify-between hover:bg-black/30 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="font-bold text-primary">{CURRENCIES.find(c => c.value === localSettings.currencySymbol)?.symbol}</span>
                                    <span>{CURRENCIES.find(c => c.value === localSettings.currencySymbol)?.label}</span>
                                </span>
                                <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${openDropdown === 'currency' ? 'rotate-180' : ''}`} />
                            </button>

                            {openDropdown === 'currency' && (
                                <div className="mt-2 bg-black/30 rounded-xl border border-white/10 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                                    {CURRENCIES.map(c => (
                                        <button 
                                            key={c.value}
                                            onClick={() => { setLocalSettings({ ...localSettings, currencySymbol: c.value }); setOpenDropdown(null); }}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="font-bold text-primary w-6 text-center">{c.symbol}</span>
                                                <span className="text-sm text-main">{c.label}</span>
                                            </span>
                                            {localSettings.currencySymbol === c.value && <Check size={16} className="text-primary"/>}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>

                    <div className="space-y-3 pt-2">
                         <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { 
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
                                const dlAnchorElem = document.createElement('a');
                                dlAnchorElem.setAttribute("href", dataStr);
                                dlAnchorElem.setAttribute("download", "backup.json");
                                dlAnchorElem.click();
                            }} className="flex items-center justify-center gap-2 p-3 bg-surface rounded-xl text-xs font-semibold text-muted hover:text-main border border-white/5">
                                <Download size={14} /> Backup
                            </button>
                            <div className="relative">
                                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 bg-surface rounded-xl text-xs font-semibold text-muted hover:text-main border border-white/5">
                                    <Upload size={14} /> Restore
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
                            </div>
                        </div>
                        <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 bg-rose-500/10 rounded-xl text-xs font-bold uppercase border border-rose-500/20"><Trash2 size={14} /> Reset Data</button>
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-dark flex gap-3 pb-safe-bottom">
                    <button onClick={() => setSidebarView('menu')} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-xs">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs">Save Changes</button>
                </div>
             </>
           )}

           <CustomConfirmModal 
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={() => { localStorage.clear(); window.location.reload(); }}
                title="Reset All Data?"
                message="This will delete all wallets, transactions, and settings. This cannot be undone."
                isDanger={true}
           />
        </div>
      </>
    );
};