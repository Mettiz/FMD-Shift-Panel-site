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
    const isLongText = typeof value === 'string' && value.length > 7;
    const isVeryLongText = typeof value === 'string' && value.length > 13;

    return (
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-between text-center transition hover:shadow-md h-full w-full overflow-hidden">
        {/* Icon */}
        <div className={`p-2 sm:p-2.5 rounded-full ${colorClass} bg-opacity-10 text-opacity-100 shrink-0 mt-0.5`}>
          <Icon size={22} className={`sm:w-6 sm:h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>

        {/* Content */}
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 px-0.5 my-1">
          <p className="text-[11px] sm:text-xs text-slate-500 font-bold mb-0.5 truncate max-w-full">
            {title}
          </p>
          <p 
            className={`font-black text-slate-800 leading-tight w-full break-words line-clamp-2 px-0.5 ${
              isVeryLongText 
                ? 'text-xs sm:text-sm' 
                : isLongText 
                  ? 'text-sm sm:text-base' 
                  : 'text-xl sm:text-2xl'
            }`}
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium truncate max-w-full">
              {subtitle}
            </p>
          )}
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