import React from 'react';
import { Home, Plus, Clock } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAddClick: (e: React.MouseEvent) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView, onAddClick }) => {
  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
      currentView === view ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[88px] glass z-50 pb-5 border-t border-white/5">
      <div className="flex justify-around items-center h-full px-4 max-w-md mx-auto relative">
        <button onClick={() => onChangeView('dashboard')} className={navItemClass('dashboard')}>
          <Home size={26} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </button>

        {/* Floating Action Button Container */}
        <div className="relative -top-6 z-50">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onAddClick(e);
            }}
            className="flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full shadow-glow active:scale-95 transition-transform border-4 border-[#000000] z-50"
          >
            <Plus size={32} />
          </button>
        </div>

        <button onClick={() => onChangeView('history')} className={navItemClass('history')}>
          <Clock size={26} strokeWidth={currentView === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">History</span>
        </button>
      </div>
    </div>
  );
};