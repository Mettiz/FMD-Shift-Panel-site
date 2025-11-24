
import React from 'react';

interface ShiftUserCardProps {
  name: string;
  type: 'Day' | 'Night' | 'Supervisor';
  className?: string;
  originalName?: string; // New prop to show previous owner
}

export const ShiftUserCard: React.FC<ShiftUserCardProps> = ({ name, type, className = '', originalName }) => {
  const isDay = type === 'Day';
  const isNight = type === 'Night';
  const isSupervisor = type === 'Supervisor';
  
  // Clean name logic
  const displayName = name ? name.replace('مهندس', '').replace('خانم', '').replace('آقای', '').trim() : '---';
  const displayOriginal = originalName ? originalName.replace('مهندس', '').replace('خانم', '').replace('آقای', '').trim() : null;
  
  const firstLetter = displayName.charAt(0);

  // Styling Config
  let styles = {
    wrapper: '',
    avatar: '',
    subText: '',
    indicator: ''
  };

  if (isDay) {
    styles = {
      wrapper: 'bg-orange-50/80 hover:bg-orange-100 text-orange-900', // Warm transparent background
      avatar: 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-200',
      subText: 'text-orange-600/70',
      indicator: 'bg-orange-500' // Small color strip
    };
  } else if (isNight) {
    styles = {
      wrapper: 'bg-slate-100 hover:bg-slate-200 text-slate-800', // Cool slate background
      avatar: 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-300',
      subText: 'text-slate-500',
      indicator: 'bg-slate-600'
    };
  } else {
    // Supervisor
    styles = {
      wrapper: 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900',
      avatar: 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200',
      subText: 'text-emerald-600/70',
      indicator: 'bg-emerald-500'
    };
  }

  return (
    <div className={`
      relative flex items-center gap-3 px-4 py-3 w-full h-full transition-colors duration-200
      ${styles.wrapper} rounded-lg cursor-default ${className}
    `}>
      
      {/* Colored Indicator Strip (Right side) */}
      <div className={`absolute right-0 top-2 bottom-2 w-1 rounded-l-full ${styles.indicator} opacity-50`}></div>

      {/* Avatar */}
      <div className={`
        w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center 
        text-sm font-bold ml-1 ${styles.avatar}
      `}>
        {firstLetter}
      </div>

      {/* Details */}
      <div className="flex flex-col items-start z-10 min-w-0">
        <span className="text-sm font-bold tracking-tight truncate w-full text-right">
          {displayName}
        </span>
        
        {/* If swapped, show original name crossed out */}
        {displayOriginal && displayOriginal !== displayName && (
           <span className="text-[9px] text-red-400/80 line-through decoration-red-300 truncate w-full text-right" title={`تغییر یافته از: ${originalName}`}>
             {displayOriginal}
           </span>
        )}

        <span className={`text-[10px] font-medium ${styles.subText} truncate`}>
          {isSupervisor ? 'سرپرست شیفت' : 'مهندس شیفت'}
        </span>
      </div>
    </div>
  );
};
