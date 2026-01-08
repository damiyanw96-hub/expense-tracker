
import React from 'react';
import { User, Settings, CreditCard, Palette, ChevronRight, LogOut, X } from 'lucide-react';
import { AppData, ViewState } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    updateData: (d: Partial<AppData>) => void;
    onViewChange: (v: ViewState) => void;
}

// Reusable IOS-style List Item
const NavItem = ({ icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors group border-b border-white/5 last:border-0">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2c2c2e] text-white shadow-sm border border-white/5">
                <Icon size={20} />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">{label}</span>
        </div>
        <ChevronRight size={16} className="text-muted/40 group-hover:text-white transition-colors" />
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, data, onViewChange }) => {
    
    const handleNav = (view: ViewState) => {
        onViewChange(view);
        onClose();
    };

    return (
      <>
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
        
        <div className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#000000] z-[101] transform transition-transform duration-300 flex flex-col shadow-2xl border-r border-white/10 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           
            <div className="pt-safe pt-12 pb-8 px-6 bg-black relative flex flex-col border-b border-white/5">
                <button onClick={onClose} className="absolute top-safe right-4 p-2 text-muted hover:text-white"><X size={20}/></button>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1c1c1e] to-black flex items-center justify-center text-white border border-white/10 shadow-lg">
                        <span className="text-2xl font-bold">{data.profile.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{data.profile.name}</h2>
                        <p className="text-sm text-muted font-medium">Free Plan</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar">
                
                <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-white/5">
                    <NavItem 
                        icon={User} 
                        label="Account & Goals" 
                        onClick={() => handleNav('account')} 
                    />
                    <NavItem 
                        icon={CreditCard} 
                        label="Budgets & Limits" 
                        onClick={() => handleNav('budgets')} 
                    />
                    <NavItem 
                        icon={Palette} 
                        label="Categories" 
                        onClick={() => handleNav('categories')} 
                    />
                </div>

                <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-white/5">
                    <NavItem 
                        icon={Settings} 
                        label="App Preferences" 
                        onClick={() => handleNav('settings')} 
                    />
                </div>

                <div className="px-2 pt-10">
                    <button onClick={onClose} className="flex items-center gap-2 text-muted hover:text-rose-500 transition-colors text-xs font-bold uppercase tracking-wider">
                        <LogOut size={14} /> Close Menu
                    </button>
                    <p className="text-[10px] text-muted/30 font-medium mt-4">Version 4.2.0</p>
                </div>
            </div>
        </div>
      </>
    );
};
