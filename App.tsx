import React, { useState, useEffect, useRef } from 'react';
import { NavBar } from './components/NavBar';
import { Transaction, ViewState, TransactionType, Category, AppData, Wallet, ThemeOption, Debt, WalletType, CategoryItem } from './types';
import * as StorageService from './services/storage';
import { parseReceiptImage } from './services/geminiService';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { 
  Trash2, ShoppingBag, Coffee, Car, Home as HomeIcon, Smartphone, Heart, 
  DollarSign, Loader2, Save, Download, Upload, Wallet as WalletIcon, 
  ChevronDown, Clock, ArrowRightLeft, Utensils, Pizza, Cookie, CreditCard, Banknote, X, PlusCircle, Check,
  Menu, Bell, User, Settings, TrendingUp, AlertCircle, ShieldCheck, LogOut, RefreshCcw, LayoutDashboard,
  Eye, EyeOff, Globe, Lock, ChevronRight, ArrowLeft, ChevronLeft, Briefcase, GraduationCap, Zap, Music, Bike, MoreHorizontal, Activity, Landmark,
  Calendar as CalendarIcon, Search, FileText, Target, HandCoins, Sun, Moon, ScanLine, Calculator, Shuffle, Tag, GripVertical
} from 'lucide-react';

// --- Helpers ---

const CategoryIcon = ({ category, color }: { category: string, color?: string }) => {
  const props = { size: 20, strokeWidth: 2.5 };
  const style = color ? { color } : {};

  // Default mappings for system categories
  switch (category) {
    case Category.SALARY: return <Banknote {...props} className="text-emerald-400" />;
    case Category.GIG: return <Briefcase {...props} className="text-blue-400" />;
    case Category.TUITION: return <GraduationCap {...props} className="text-purple-400" />;
    case Category.LOAN: return <Landmark {...props} className="text-amber-400" />;
    case Category.BREAKFAST: return <Coffee {...props} className="text-orange-400" />;
    case Category.DINNER: return <Utensils {...props} className="text-orange-500" />;
    case Category.FOODPANDA: return <Bike {...props} className="text-rose-500" />;
    case Category.SNACKS: return <Cookie {...props} className="text-amber-300" />;
    case Category.LOAN_PAYMENT: return <CreditCard {...props} className="text-red-400" />;
    case Category.TRANSPORT: return <Car {...props} className="text-sky-400" />;
    case Category.SHOPPING: return <ShoppingBag {...props} className="text-pink-400" />;
    case Category.BILLS: return <Zap {...props} className="text-yellow-400" />;
    case Category.ENTERTAINMENT: return <Music {...props} className="text-purple-400" />;
    case Category.HEALTH: return <Activity {...props} className="text-emerald-400" />;
    case Category.TRANSFER: return <ArrowRightLeft {...props} className="text-main" />;
    // Default for custom categories
    default: return <div style={style}><MoreHorizontal {...props} className={!color ? "text-muted" : ""} /></div>;
  }
};

const getDateTime = (dateStr: string) => {
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  return date.toISOString();
};

const formatMoney = (amount: number, symbol: string) => {
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: symbol || 'BDT',
        minimumFractionDigits: 0 
      }).format(amount);
    } catch (e) {
      return `৳${amount.toFixed(0)}`;
    }
};

// --- Sub-Components ---

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-card w-full max-w-xs rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-main mb-2">Delete Item?</h3>
                    <p className="text-sm text-muted mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface text-muted font-bold text-sm hover:bg-black/10 transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose, data, updateData, onViewChange }: any) => {
    const [sidebarView, setSidebarView] = useState<'menu' | 'account' | 'settings' | 'budgets' | 'categories'>('menu');
    const [localProfile, setLocalProfile] = useState(data.profile);
    const [localSettings, setLocalSettings] = useState(data.settings);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newCatColor, setNewCatColor] = useState('#5e5ce6');
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
        if (data.transactions.some((t: Transaction) => {
            const cat = data.categories.find((c: CategoryItem) => c.id === id);
            return t.category === cat?.name;
        })) {
            alert("Cannot delete category with existing transactions.");
            return;
        }
        updateData({ categories: data.categories.filter((c: CategoryItem) => c.id !== id) });
    };

    const expenseCategories = data.categories.filter((c: CategoryItem) => c.type === TransactionType.EXPENSE).map((c: CategoryItem) => c.name);

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
                        <ChevronRight size={16} className="text-muted" />
                    </button>

                    <button onClick={() => setSidebarView('settings')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400"><Settings size={18}/></div>
                            <span className="text-sm font-semibold text-main">Settings</span>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                    </button>

                     <button onClick={() => setSidebarView('budgets')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400"><TrendingUp size={18}/></div>
                            <span className="text-sm font-semibold text-main">Manage Budgets</span>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                    </button>

                    <button onClick={() => setSidebarView('categories')} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-500/10 text-orange-400"><GripVertical size={18}/></div>
                            <span className="text-sm font-semibold text-main">Categories</span>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                    </button>

                    <button onClick={() => { onViewChange('debts'); onClose(); }} className="w-full p-4 flex items-center justify-between bg-surface/50 hover:bg-surface rounded-2xl border border-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-500/10 text-rose-400"><HandCoins size={18}/></div>
                            <span className="text-sm font-semibold text-main">Debt Tracker</span>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
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
                 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                     <p className="text-xs text-muted mb-2">Set monthly spending limits for categories.</p>
                     {expenseCategories.map((cat: string) => (
                         <div key={cat} className="flex flex-col gap-1">
                             <label className="text-xs font-bold text-muted uppercase">{cat}</label>
                             <div className="flex items-center gap-2">
                                <span className="text-main font-bold text-sm">{data.settings.currencySymbol}</span>
                                <input 
                                    type="number" 
                                    placeholder="No Limit"
                                    value={localSettings.budgetLimits[cat] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                                        setLocalSettings({ ...localSettings, budgetLimits: { ...localSettings.budgetLimits, [cat]: val } });
                                    }}
                                    className="w-full bg-surface rounded-xl px-3 py-2 text-sm text-main border border-white/10 outline-none focus:border-primary"
                                />
                             </div>
                         </div>
                     ))}
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

// --- Main Views ---

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
        
        // Node
        nodes.push(
            <g key={`l-${name}`}>
                <rect x={leftX} y={leftY} width={barWidth} height={nodeHeight} fill={color} rx={4} />
                <text x={leftX + 14} y={leftY + nodeHeight/2 + 4} className="text-[9px] fill-muted" textAnchor="start">{name}</text>
            </g>
        );

        // Links to Right (Distribute proportionally or just show as one big flow merging then splitting)
        // Simplified Logic: Connect this Income block to a virtual center "Pool" then to expenses?
        // Standard Sankey logic: We just draw lines. Since we don't know exactly which dollar went where,
        // we visualize the *magnitude*. 
        // Visual Trick: Draw a path from this income block to the "Total Pool" of expenses roughly.
        // Actually, easiest valid visual: Connect Left Side to Right Side via a Bezier.
        // Since we can't map specific income to specific expense, we treat it as a pool.
        
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
    // We need to map the "Flow" from left Y range to right Y range.
    // Let's reset cursors to draw the big paths first.
    let linkLeftY = padding; 
    let linkRightY = padding;

    // Draw Income Flows
    // We will draw one big path for each Expense Category, sourced from the "Total Income" vertical span.
    // This is a simplification but accurate enough for personal finance (money is fungible).
    
    sortedExpenses.forEach(([name, amount]) => {
        const nodeHeight = amount * scale;
        const color = categories.find(c => c.name === name)?.color || '#ef4444';
        
        // Node
        nodes.push(
            <g key={`r-${name}`}>
                <rect x={rightX} y={linkRightY} width={barWidth} height={nodeHeight} fill={color} rx={4} />
                 <text x={rightX - 6} y={linkRightY + nodeHeight/2 + 4} className="text-[9px] fill-muted" textAnchor="end">{name}</text>
            </g>
        );

        // Path: From [padding, padding + totalIncome*scale] -> [rightY, rightY + nodeHeight]
        // Actually, to make it look like a Sankey, the source of *this* expense should be a slice of the total Income.
        const sourceHeight = (amount / totalExpense) * (Math.min(totalIncome, totalExpense) * scale); // Scale flow source based on proportion
        
        // This math is tricky without a library.
        // Simple fallback: Just draw a path from (left Center) to (right node Center) with width proportional to amount.
        // Better: Stack links.
        
        const path = `M ${leftX + barWidth} ${linkLeftY + (nodeHeight/2)} 
                      C ${leftX + 100} ${linkLeftY + (nodeHeight/2)}, 
                        ${rightX - 100} ${linkRightY + (nodeHeight/2)}, 
                        ${rightX} ${linkRightY + (nodeHeight/2)}`;

        // Proper Area Path
        // Top Left -> Top Right -> Bottom Right -> Bottom Left
        // We need to track a 'cursor' on the left side too.
        // If Total Income >= Total Expense, we consume portions of Income.
        // If Deficit, we assume full income + deficit used.
        
        // Let's use simple thick lines with stroke-width.
        const strokeWidth = Math.max(1, nodeHeight);
        // Correct Left Y center. We need to advance a "used income" cursor.
        // But since money is fungible, we just map 0..TotalExpense on left to 0..TotalExpense on right.
        
        const leftCenter = linkLeftY + (nodeHeight / 2);
        const rightCenter = linkRightY + (nodeHeight / 2);

        links.push(
            <path 
                key={`link-${name}`}
                d={`M ${leftX + barWidth} ${leftCenter} C ${leftX + width/2} ${leftCenter}, ${rightX - width/2} ${rightCenter}, ${rightX} ${rightCenter}`}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.3}
                className="hover:opacity-60 transition-opacity"
            />
        );

        linkLeftY += nodeHeight; // Advance left cursor (assuming direct mapping)
        linkRightY += nodeHeight + 5; // Advance right cursor
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
        // Link for savings
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
        <div className="overflow-x-auto no-scrollbar">
            <svg width={width} height={Math.max(linkRightY, leftY) + 20} className="mx-auto">
                {links}
                {nodes}
            </svg>
        </div>
    );
};

const DebtView = ({ data, updateData }: any) => {
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
        <div className="mt-4 pb-24">
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
        <div className="mt-2 select-none">
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

const HistoryView = ({ data, onRequestDelete }: { data: AppData, onRequestDelete: (id: string) => void }) => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats' | 'flow'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const walletTransactions = data.transactions.filter((t: Transaction) => t.walletId === data.currentWalletId);
    
    // Extract Tags
    const allTags = Array.from(new Set(walletTransactions.flatMap(t => {
        const matches = t.note?.match(/#[\w]+/g);
        return matches || [];
    })));

    // Filter Logic
    const filteredTransactions = walletTransactions.filter(t => {
        const matchSearch = searchTerm ? (t.note?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm)) : true;
        const matchStart = dateRange.start ? t.date >= dateRange.start : true;
        const matchEnd = dateRange.end ? t.date <= dateRange.end + 'T23:59:59' : true;
        return matchSearch && matchStart && matchEnd;
    });

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

    // Stats Data
    const pieData = Object.entries(filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value);

    const COLORS = ['#5e5ce6', '#32d74b', '#ff453a', '#ff9f0a', '#64d2ff', '#bf5af2', '#ff375f'];

    return (
      <div className="mt-4 pb-24">
           <div className="px-1 mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-main">History</h2>
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="p-2 bg-surface rounded-full text-muted hover:text-main border border-white/5"><Download size={18}/></button>
                </div>
           </div>

           {/* Filter Bar */}
           <div className="bg-surface p-3 rounded-2xl border border-white/5 space-y-3 mb-4">
               <div className="flex items-center gap-2 bg-black/10 rounded-xl px-3 py-2 border border-white/5 group focus-within:border-primary/50 transition-colors">
                   <Search size={16} className="text-muted group-focus-within:text-primary transition-colors"/>
                   <input 
                      type="text" 
                      placeholder="Search or #tag..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-transparent text-sm text-main w-full outline-none"
                   />
                   {searchTerm && (
                       <button onClick={() => setSearchTerm('')} className="text-muted hover:text-main">
                           <X size={14} />
                       </button>
                   )}
               </div>
               
               {/* Tags List */}
               {allTags.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                       {allTags.map(tag => (
                           <button 
                             key={tag} 
                             onClick={() => setSearchTerm(prev => prev === tag ? '' : tag)}
                             className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors ${searchTerm === tag ? 'bg-primary text-white border-primary' : 'bg-black/20 text-muted border-white/5 hover:border-primary/30'}`}
                           >
                               {tag}
                           </button>
                       ))}
                   </div>
               )}

               <div className="flex gap-2">
                   <input type="date" className="bg-black/10 text-main text-xs rounded-lg px-2 py-2 w-full outline-none border border-white/5" onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}/>
                   <input type="date" className="bg-black/10 text-main text-xs rounded-lg px-2 py-2 w-full outline-none border border-white/5" onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}/>
               </div>
           </div>

           {/* View Toggles */}
           <div className="flex bg-surface p-1 rounded-xl mb-4 border border-white/5 overflow-x-auto no-scrollbar">
               {[
                   { id: 'list', icon: FileText, label: 'List' },
                   { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
                   { id: 'stats', icon: PieChart, label: 'Analysis' },
                   { id: 'flow', icon: Shuffle, label: 'Flow' }
               ].map((mode: any) => (
                   <button 
                     key={mode.id} 
                     onClick={() => setViewMode(mode.id as any)}
                     className={`flex-1 min-w-[80px] py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors ${viewMode === mode.id ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}
                   >
                       <mode.icon size={14} /> {mode.label}
                   </button>
               ))}
           </div>

           {viewMode === 'list' && (
               <div className="space-y-3 min-h-[300px]">
                 {filteredTransactions.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-muted border border-white/5 rounded-3xl bg-surface/30 border-dashed">
                         <p className="text-sm">No transactions found</p>
                     </div>
                 ) : (
                    filteredTransactions.slice().reverse().map((t: Transaction) => (
                        <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center border border-white/5 text-muted">
                                    <CategoryIcon category={t.category} color={data.categories.find(c => c.name === t.category)?.color} />
                                </div>
                                <div>
                                    <p className="font-semibold text-main text-sm">{t.note || t.category}</p>
                                    <p className="text-[11px] text-muted mt-0.5">{new Date(t.date).toLocaleDateString() • {t.category}}</p>
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
                    ))
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
                <div className="bg-surface rounded-3xl p-6 border border-white/5">
                    <h3 className="text-main font-bold mb-4 text-center">Cash Flow</h3>
                    <SankeyChart transactions={filteredTransactions} categories={data.categories} />
                </div>
           )}

           {viewMode === 'stats' && (
               <div className="bg-surface rounded-3xl p-6 border border-white/5">
                   <h3 className="text-main font-bold mb-4">Spending Distribution</h3>
                   <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={data.categories.find(c => c.name === entry.name)?.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-main)' }}
                                    formatter={(val: number) => formatMoney(val, data.settings.currencySymbol)}
                                />
                            </PieChart>
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
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.categories.find(c => c.name === entry.name)?.color || COLORS[index % COLORS.length] }} />
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

const DashboardView = ({ data, setView, updateData }: any) => {
    const walletTransactions = data.transactions.filter((t: Transaction) => t.walletId === data.currentWalletId);
    
    // Stats
    const totalIncome = walletTransactions.filter((t: Transaction) => t.type === TransactionType.INCOME).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const totalExpense = walletTransactions.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Budget Status
    const expensesByCategory = walletTransactions
        .filter((t: Transaction) => t.type === TransactionType.EXPENSE)
        .reduce((acc: any, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    
    const budgetAlerts = Object.entries(data.settings.budgetLimits || {})
        .map(([cat, limit]: any) => ({ cat, limit, spent: expensesByCategory[cat] || 0 }))
        .filter((b: any) => b.limit > 0 && b.spent > b.limit * 0.8)
        .sort((a: any, b: any) => (b.spent/b.limit) - (a.spent/a.limit));

    // Goal Wallets
    const goalWallets = data.wallets.filter((w: Wallet) => w.type === 'GOAL');
    const currentWallet = data.wallets.find((w: Wallet) => w.id === data.currentWalletId);
    
    // Calculate Goal Progress if current wallet is goal
    const goalProgress = currentWallet?.type === 'GOAL' ? Math.min((balance / (currentWallet.targetAmount || 1)) * 100, 100) : 0;

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (e.detail === 2) {
             updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } });
        }
    };

    return (
      <div className="space-y-6 mt-4">
            {/* Balance Hero */}
            <div onClick={handleDoubleTap} className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-sm select-none cursor-pointer">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
               <div className="flex justify-between items-start mb-2">
                 <p className="text-muted text-xs font-semibold uppercase tracking-wider">{currentWallet?.type === 'GOAL' ? 'Goal Progress' : 'Total Balance'}</p>
                 <button onClick={(e) => { e.stopPropagation(); updateData({ settings: { ...data.settings, privacyMode: !data.settings.privacyMode } }) }} className="text-muted hover:text-main transition-colors">
                     {data.settings.privacyMode ? <Eye size={16}/> : <EyeOff size={16}/>}
                 </button>
               </div>
               
               <h1 className="text-4xl font-bold text-main mb-4 tracking-tight flex items-center gap-2">
                   {!data.settings.privacyMode ? formatMoney(balance, data.settings.currencySymbol) : '••••••'}
               </h1>
               
               {currentWallet?.type === 'GOAL' && (
                   <div className="mb-4">
                       <div className="flex justify-between text-xs text-muted mb-1">
                           <span>{Math.round(goalProgress)}% of {formatMoney(currentWallet.targetAmount || 0, data.settings.currencySymbol)}</span>
                       </div>
                       <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5">
                           <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
                       </div>
                   </div>
               )}

               {currentWallet?.type !== 'GOAL' && (
                   <div className="flex gap-4 relative z-10">
                       <div className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5">
                           <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                               <div className="p-1 bg-emerald-500/10 rounded-full"><TrendingUp size={12}/></div>
                               <span className="text-[10px] font-bold uppercase">Income</span>
                           </div>
                           <p className="text-lg font-semibold text-main">{!data.settings.privacyMode ? formatMoney(totalIncome, data.settings.currencySymbol) : '••••'}</p>
                       </div>
                       <div className="flex-1 bg-black/10 rounded-xl p-3 backdrop-blur-md border border-white/5">
                           <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                               <div className="p-1 bg-rose-500/10 rounded-full"><TrendingUp size={12} className="rotate-180"/></div>
                               <span className="text-[10px] font-bold uppercase">Expense</span>
                           </div>
                           <p className="text-lg font-semibold text-main">{!data.settings.privacyMode ? formatMoney(totalExpense, data.settings.currencySymbol) : '••••'}</p>
                       </div>
                   </div>
               )}
            </div>

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider px-1">At Risk Budgets</h3>
                    {budgetAlerts.map((b: any) => (
                        <div key={b.cat} className="bg-surface border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-bold text-main">{b.cat}</p>
                                 <p className="text-xs text-rose-400 font-semibold">{Math.round((b.spent/b.limit)*100)}% Used</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-bold text-main">{formatMoney(b.spent, data.settings.currencySymbol)}</p>
                                 <p className="text-[10px] text-muted">of {formatMoney(b.limit, data.settings.currencySymbol)}</p>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goal Wallets Summary */}
            {goalWallets.length > 0 && currentWallet?.type !== 'GOAL' && (
                 <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Your Goals</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {goalWallets.map((w: Wallet) => {
                            const wTx = data.transactions.filter((t: Transaction) => t.walletId === w.id);
                            const bal = wTx.reduce((acc: number, t: Transaction) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
                            const prog = Math.min((bal / (w.targetAmount || 1)) * 100, 100);
                            return (
                                <button key={w.id} onClick={() => updateData({ currentWalletId: w.id })} className="bg-surface p-4 rounded-2xl border border-white/5 text-left hover:border-primary/50 transition-colors">
                                    <Target size={20} className="text-primary mb-2"/>
                                    <p className="font-bold text-main text-sm truncate">{w.name}</p>
                                    <div className="w-full h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${prog}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted mt-1 text-right">{Math.round(prog)}%</p>
                                </button>
                            )
                        })}
                    </div>
                 </div>
            )}

            {/* Recent List Placeholder */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-bold text-main">Recent Activity</h2>
                  <button onClick={() => setView('history')} className="text-xs text-primary font-bold active:opacity-70">See All</button>
              </div>
              <div className="space-y-3">
                  {walletTransactions.slice(0, 5).map((t: Transaction) => (
                      <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center border border-white/5 text-muted">
                                  <CategoryIcon category={t.category} color={data.categories.find(c => c.name === t.category)?.color} />
                              </div>
                              <div>
                                  <p className="font-semibold text-main text-sm leading-tight">{t.note || t.category}</p>
                                  <p className="text-[11px] text-muted mt-0.5">{new Date(t.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-secondary' : 'text-main'}`}>
                              {t.type === TransactionType.INCOME ? '+' : ''}{formatMoney(t.amount, data.settings.currencySymbol)}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
      </div>
    );
};

const AddTransactionModal = ({ isOpen, onClose, data, onAdd, onTransfer }: any) => {
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [category, setCategory] = useState<string>(Category.OTHER);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [toWalletId, setToWalletId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSave = () => {
        if (!amount) return;
        const numAmount = parseFloat(amount);
        
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

    const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            
            try {
                const result = await parseReceiptImage(base64Data);
                if (result) {
                    if (result.amount) setAmount(result.amount.toString());
                    if (result.date) setDate(result.date.split('T')[0]);
                    if (result.note) setNote(result.note);
                    if (result.category) setCategory(result.category as string);
                }
            } catch (error) {
                console.error("Failed to parse", error);
                alert("Could not parse receipt.");
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAmountBlur = () => {
        try {
            // Basic safety to only allow numbers and math operators
            const safeExpression = amount.replace(/[^0-9+\-*/.()]/g, '');
            if (safeExpression && safeExpression !== amount) {
                // If special chars were removed, don't eval to avoid confusion
                return; 
            }
            if (safeExpression && /[+\-*/]/.test(safeExpression)) {
                // eslint-disable-next-line
                const result = Function('"use strict";return (' + safeExpression + ')')();
                if (isFinite(result)) {
                    setAmount(parseFloat(result.toFixed(2)).toString());
                }
            }
        } catch (e) {
            // Ignore calc errors
        }
    };

    if (!isOpen) return null;

    // Filter categories by type
    const availableCategories = data.categories.filter((c: CategoryItem) => c.type === type);

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-50 bg-card w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-main">New Transaction</h2>
                     <button onClick={onClose} className="p-2 bg-surface rounded-full text-muted hover:text-main"><X size={20}/></button>
                </div>

                <div className="flex bg-surface p-1 rounded-xl mb-6">
                    <button onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Expense</button>
                    <button onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Income</button>
                    <button onClick={() => setType(TransactionType.TRANSFER)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === TransactionType.TRANSFER ? 'bg-blue-500 text-white shadow-lg' : 'text-muted hover:text-main'}`}>Transfer</button>
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
                            placeholder="0.00" 
                            className="w-full bg-surface text-main text-2xl font-bold p-4 pl-12 rounded-2xl outline-none border border-white/5 focus:border-primary transition-colors"
                            autoFocus
                        />
                         {type === TransactionType.EXPENSE && (
                             <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-surface border border-white/10 rounded-xl text-muted hover:text-primary transition-colors"
                                disabled={isScanning}
                             >
                                 {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ScanLine size={20} />}
                             </button>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanReceipt} />
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
                        className="w-full bg-surface text-main p-4 rounded-xl outline-none border border-white/5 focus:border-primary transition-colors text-sm"
                    />

                    <button 
                        onClick={handleSave} 
                        disabled={!amount || isScanning}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isScanning ? 'Processing...' : 'Save Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  useEffect(() => {
    const loadedData = StorageService.seedInitialData();
    setData(loadedData);

    const handleStorageChange = () => {
        const newData = StorageService.getAppData();
        setData(newData);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (data) {
      StorageService.saveAppData(data);
      document.body.className = `theme-${data.settings.theme} ${data.settings.darkMode ? '' : 'light-mode'}`;
    }
  }, [data]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => prev ? ({ ...prev, ...newData }) : null);
  };

  const handleAddWallet = (name: string, type: WalletType, target: number) => {
    if (!data) return;
    const newWallet: Wallet = { id: Date.now().toString(), name, type, targetAmount: target };
    updateData({ wallets: [...data.wallets, newWallet], currentWalletId: newWallet.id });
    setIsWalletModalOpen(false);
  };

  const handleAddTransaction = (t: Transaction) => {
    if (!data) return;
    updateData({ transactions: [t, ...data.transactions] });
    setIsAddOpen(false);
  };

  const handleTransfer = (amount: number, fromId: string, toId: string, note: string, dateStr: string) => {
    if (!data) return;
    const timestamp = Date.now();
    const dateTime = getDateTime(dateStr);
    const txOut: Transaction = { id: timestamp.toString(), amount, type: TransactionType.EXPENSE, category: Category.TRANSFER, date: dateTime, note: `To: ${data.wallets.find(w => w.id === toId)?.name} - ${note}`, walletId: fromId };
    const txIn: Transaction = { id: (timestamp + 1).toString(), amount, type: TransactionType.INCOME, category: Category.TRANSFER, date: dateTime, note: `From: ${data.wallets.find(w => w.id === fromId)?.name} - ${note}`, walletId: toId };
    updateData({ transactions: [txIn, txOut, ...data.transactions] });
    setIsAddOpen(false);
  };

  if (!data) return <div className="min-h-screen bg-dark flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-dark text-main font-sans selection:bg-primary/30 pb-safe transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} data={data} updateData={updateData} onViewChange={setView} />
      
      <div className="sticky top-0 z-40 glass pt-safe pt-2 px-4 pb-4 shadow-sm border-b border-white/5">
         <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-muted hover:text-main rounded-full hover:bg-surface transition-colors">
                   <Menu size={24} />
                 </button>
                 <div className="flex flex-col items-start">
                      <span className="text-[10px] text-muted font-medium uppercase tracking-wider">Welcome back</span>
                      <h1 className="text-lg font-bold text-main tracking-wide leading-none">{data.profile.name}</h1>
                 </div>
             </div>
             <button onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-2 bg-surface hover:bg-surface/80 transition-colors py-1.5 px-3 rounded-full border border-white/10 max-w-[120px]">
                 <span className="text-xs font-semibold text-main truncate">{data.wallets.find(w => w.id === data.currentWalletId)?.name}</span>
                 <ChevronDown size={14} className="text-muted shrink-0" />
             </button>
         </div>
      </div>
      
      <main className="container mx-auto max-w-md min-h-screen relative pb-32 px-4">
        {view === 'dashboard' && <DashboardView data={data} setView={setView} updateData={updateData} />}
        {view === 'history' && <HistoryView data={data} onRequestDelete={(id) => setDeleteConfirmation({ isOpen: true, id })} />}
        {view === 'debts' && <DebtView data={data} updateData={updateData} />}
      </main>
      
      <AddTransactionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} data={data} onAdd={handleAddTransaction} onTransfer={handleTransfer} />
      <DeleteConfirmationModal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} onConfirm={() => { if (deleteConfirmation.id) { updateData({ transactions: data.transactions.filter(t => t.id !== deleteConfirmation.id) }); setDeleteConfirmation({ isOpen: false, id: null }); }}} />

       {isWalletModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWalletModalOpen(false)}></div>
                <div className="relative bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-main">Select Wallet</h3>
                        <button onClick={() => setIsWalletModalOpen(false)} className="p-1 bg-surface rounded-full text-muted active:scale-90"><X size={20} /></button>
                    </div>
                    <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                        {data.wallets.map(w => (
                            <button key={w.id} onClick={() => { updateData({ currentWalletId: w.id }); setIsWalletModalOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] ${w.id === data.currentWalletId ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-transparent text-muted hover:bg-black/10'}`}>
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-main">{w.name}</span>
                                    {w.type === 'GOAL' && <span className="text-[10px] text-emerald-500 font-bold uppercase">Savings Goal</span>}
                                </div>
                                {w.id === data.currentWalletId && <Check size={18} />}
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('walletName') as HTMLInputElement).value;
                                const isGoal = (form.elements.namedItem('isGoal') as HTMLInputElement).checked;
                                const target = isGoal ? parseFloat((form.elements.namedItem('target') as HTMLInputElement).value || '0') : 0;
                                if(name) handleAddWallet(name, isGoal ? 'GOAL' : 'STANDARD', target);
                            }} className="flex flex-col gap-3">
                            <input name="walletName" placeholder="New Wallet Name" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-main focus:border-primary outline-none" required />
                            <div className="flex items-center gap-3 px-1">
                                <input type="checkbox" id="isGoal" name="isGoal" className="w-4 h-4 rounded-md accent-primary" onChange={(e) => {
                                    const targetInput = document.getElementById('targetInput');
                                    if(targetInput) targetInput.style.display = e.target.checked ? 'block' : 'none';
                                }}/>
                                <label htmlFor="isGoal" className="text-sm text-muted font-medium">This is a Savings Goal</label>
                            </div>
                            <input id="targetInput" name="target" type="number" placeholder="Target Amount" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-main focus:border-primary outline-none hidden" />
                            <button type="submit" className="bg-primary text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"><PlusCircle size={20} /> Create Wallet</button>
                        </form>
                    </div>
                </div>
            </div>
        )}
      
      <NavBar currentView={view} onChangeView={setView} onAddClick={() => setIsAddOpen(true)} />
    </div>
  );
}