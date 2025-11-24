import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
  type?: 'horizontal' | 'square';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, type = 'horizontal' }) => {
  if (type === 'square') {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-3 transition hover:shadow-md h-full w-full">
        <div className={`p-4 rounded-full ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon size={32} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 space-x-reverse transition hover:shadow-md">
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};