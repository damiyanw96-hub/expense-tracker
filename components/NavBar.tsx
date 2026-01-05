import React from 'react';
import { Home, Plus, Clock, PieChart, HandCoins } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAddClick: (e: React.MouseEvent) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView, onAddClick }) => {
  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 active:scale-90 ${
      currentView === view ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full glass z-50 border-t border-white/5 pb-safe-bottom">
      <div className="h-[60px] flex justify-between items-center px-2 max-w-md mx-auto relative">
        
        <button onClick={() => onChangeView('dashboard')} className={navItemClass('dashboard')}>
          <Home size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </button>

        <button onClick={() => onChangeView('debts')} className={navItemClass('debts')}>
          <HandCoins size={24} strokeWidth={currentView === 'debts' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Debts</span>
        </button>

        {/* Floating Action Button Container */}
        <div className="relative -top-8 z-50 px-2">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onAddClick(e);
            }}
            className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-glow active:scale-95 transition-transform border-4 border-[#1c1c1e] z-50"
          >
            <Plus size={28} />
          </button>
        </div>

        <button onClick={() => onChangeView('analytics')} className={navItemClass('analytics')}>
          <PieChart size={24} strokeWidth={currentView === 'analytics' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Analytics</span>
        </button>

        <button onClick={() => onChangeView('history')} className={navItemClass('history')}>
          <Clock size={24} strokeWidth={currentView === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">History</span>
        </button>
      </div>
    </div>
  );
};