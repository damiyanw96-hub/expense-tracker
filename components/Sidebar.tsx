import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Settings, TrendingUp, HandCoins, X, GripVertical, Moon, Sun, Globe, Download, Upload, Trash2, Check, Plus } from 'lucide-react';
import { AppData, TransactionType, CategoryItem } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    updateData: (d: Partial<AppData>) => void;
    onViewChange: (v: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, data, updateData, onViewChange }) => {
    const [sidebarView, setSidebarView] = useState<'menu' | 'account' | 'settings' | 'budgets' | 'categories'>('menu');
    const [localProfile, setLocalProfile] = useState(data.profile);
    const [localSettings, setLocalSettings] = useState(data.settings);
    
    // Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newCatColor, setNewCatColor] = useState('#5e5ce6');
    
    // Budget State
    const [budgetCat, setBudgetCat] = useState('');
    const [budgetLimit, setBudgetLimit] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalProfile(data.profile);
            setLocalSettings(data.settings);
            setSidebarView('menu');
        }
    }, [isOpen, data]);

    const handleSave = () => {
        updateData({ profile: localProfile, settings: localSettings });
        setSidebarView('menu');
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
        .sort((a, b) => b[1] - a[1]); // Sort by highest limit

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
            setBudgetCat(''); // Reset selection
        }
    };

    const removeBudget = (cat: string) => {
        const newLimits = { ...localSettings.budgetLimits };
        delete newLimits[cat];
        setLocalSettings({ ...localSettings, budgetLimits: newLimits });
    };

    // Auto-select first available category when view opens or options change
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
                    <button onClick={() => setSidebarView('account')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary"><User size={18}/></div>
                            <span className="text-sm font-semibold text-main">My Account</span>
                        </div>
                    </button>

                    <button onClick={() => setSidebarView('settings')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400"><Settings size={18}/></div>
                            <span className="text-sm font-semibold text-main">Settings</span>
                        </div>
                    </button>

                     <button onClick={() => setSidebarView('budgets')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400"><TrendingUp size={18}/></div>
                            <span className="text-sm font-semibold text-main">Manage Budgets</span>
                        </div>
                    </button>

                    <button onClick={() => setSidebarView('categories')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-500/10 text-orange-400"><GripVertical size={18}/></div>
                            <span className="text-sm font-semibold text-main">Categories</span>
                        </div>
                    </button>

                    <button onClick={() => { onViewChange('debts'); onClose(); }} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-500/10 text-rose-400"><HandCoins size={18}/></div>
                            <span className="text-sm font-semibold text-main">Debt Tracker</span>
                        </div>
                    </button>
                </div>
                
                <div className="p-4 border-t border-white/5 bg-dark">
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-surface text-muted font-medium hover:text-main flex items-center justify-center gap-2">
                    <X size={16} /> Close Menu
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
                         <div className="flex gap-2">
                             <input type="text" placeholder="Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-black/20 rounded-lg px-3 py-2 text-sm text-main outline-none" />
                             <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent cursor-pointer" />
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => setNewCatType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${newCatType === TransactionType.EXPENSE ? 'bg-rose-500 text-white' : 'bg-black/20 text-muted'}`}>EXPENSE</button>
                            <button onClick={() => setNewCatType(TransactionType.INCOME)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${newCatType === TransactionType.INCOME ? 'bg-emerald-500 text-white' : 'bg-black/20 text-muted'}`}>INCOME</button>
                         </div>
                         <button onClick={handleAddCategory} className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold">Add Category</button>
                     </div>

                     <div className="space-y-2">
                         {data.categories.map((cat: CategoryItem) => (
                             <div key={cat.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                     <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                     <span className="text-sm font-medium text-main">{cat.name}</span>
                                 </div>
                                 {!cat.isSystem && (
                                     <button onClick={() => handleDeleteCategory(cat.id)} className="text-muted hover:text-rose-500"><Trash2 size={14}/></button>
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
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-dark flex gap-3">
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
                                 <div className="relative">
                                    <select 
                                        value={budgetCat} 
                                        onChange={e => setBudgetCat(e.target.value)}
                                        className="w-full bg-black/20 text-main text-sm rounded-xl px-3 py-3 border border-white/10 appearance-none outline-none focus:border-primary"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {availableForBudget.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                                        <GripVertical size={14} />
                                    </div>
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
                                    className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
                 <div className="p-4 border-t border-white/5 bg-dark flex gap-3">
                    <button onClick={() => setSidebarView('menu')} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-xs">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs">Save Budgets</button>
                </div>
              </>
           )}

           {sidebarView === 'settings' && (
             <>
                <MenuHeader title="Settings" />
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    <div className="bg-surface p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {localSettings.darkMode ? <Moon size={16} className="text-muted"/> : <Sun size={16} className="text-muted"/>}
                                <span className="text-sm font-medium text-main">Dark Mode</span>
                            </div>
                            <button onClick={() => setLocalSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))} className={`w-11 h-6 rounded-full relative transition-colors ${localSettings.darkMode ? 'bg-primary' : 'bg-slate-500'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${localSettings.darkMode ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Currency */}
                    <div className="bg-surface p-4 rounded-2xl border border-white/5">
                         <label className="text-[10px] uppercase font-bold text-muted block mb-3">Currency</label>
                         <div className="relative">
                            <select 
                                value={localSettings.currencySymbol || 'BDT'}
                                onChange={(e) => setLocalSettings({ ...localSettings, currencySymbol: e.target.value })}
                                className="w-full bg-black/20 text-main text-sm rounded-xl px-4 py-3 border border-white/10 appearance-none outline-none focus:border-primary"
                            >
                                <option value="BDT">BDT (৳)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                            <Globe size={16} className="absolute right-4 top-3.5 text-muted pointer-events-none"/>
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
                        <button onClick={() => { if(confirm("Reset?")) { localStorage.clear(); window.location.reload(); } }} className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 bg-rose-500/10 rounded-xl text-xs font-bold uppercase border border-rose-500/20"><Trash2 size={14} /> Reset Data</button>
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-dark flex gap-3">
                    <button onClick={() => setSidebarView('menu')} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-xs">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs">Save Changes</button>
                </div>
             </>
           )}
        </div>
      </>
    );
};