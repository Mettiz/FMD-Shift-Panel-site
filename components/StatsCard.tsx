import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, colorClass }) => {
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