import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, amount, type }) => {
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(val);

  let icon, colorClass, bgClass;

  switch (type) {
    case 'income':
      icon = <ArrowUpRight className="text-emerald-400" size={20} />;
      colorClass = 'text-emerald-400';
      bgClass = 'bg-emerald-500/10';
      break;
    case 'expense':
      icon = <ArrowDownRight className="text-rose-400" size={20} />;
      colorClass = 'text-rose-400';
      bgClass = 'bg-rose-500/10';
      break;
    default:
      icon = <Wallet className="text-primary" size={20} />;
      colorClass = 'text-white';
      bgClass = 'bg-primary/20';
  }

  return (
    <div className={`p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex-1 ${type === 'balance' ? 'bg-gradient-to-br from-slate-800 to-slate-900 col-span-2' : 'bg-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${bgClass}`}>
          {icon}
        </div>
      </div>
      <h3 className={`text-xl font-bold ${colorClass}`}>
        {formatMoney(amount)}
      </h3>
    </div>
  );
};
