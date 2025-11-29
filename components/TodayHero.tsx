
import React, { useEffect, useState } from 'react';
import { ShiftEntry } from '../types';
import { ShiftUserCard } from './ShiftUserCard';
import { Calendar, Clock } from 'lucide-react';

interface TodayHeroProps {
  schedule: ShiftEntry[];
}

const toPersianDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const TodayHero: React.FC<TodayHeroProps> = ({ schedule }) => {
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [todayEntry, setTodayEntry] = useState<ShiftEntry | undefined>(undefined);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Get Persian Date String matching our data format: YYYY/MM/DD
      const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
      const persianDate = now.toLocaleDateString('fa-IR-u-nu-latn', dateOptions);
      setCurrentDateStr(persianDate);

      // Get Time
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      setCurrentTimeStr(now.toLocaleTimeString('fa-IR', timeOptions));

      const entry = schedule.find(s => s.date === persianDate);
      setTodayEntry(entry);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); 

    return () => clearInterval(timer);
  }, [schedule]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden relative no-print">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Date & Time Section */}
        <div className="flex flex-col items-center md:items-start gap-2 min-w-[200px]">
           <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             وضعیت زنده
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mt-2 text-center md:text-right">
             {new Date().toLocaleDateString('fa-IR', { weekday: 'long' })}
           </h2>
           
           {/* LTR Container: Icon Date | Icon Time */}
           <div className="flex items-center gap-4 text-slate-500 font-medium mt-1" dir="ltr">
             <div className="flex items-center gap-2">
               <Calendar size={18} className="text-emerald-500" />
               <span className="text-lg font-bold">{toPersianDigits(currentDateStr)}</span>
             </div>
             <div className="w-px h-5 bg-slate-300 mx-1"></div>
             <div className="flex items-center gap-2">
               <Clock size={18} className="text-blue-500" />
               <span className="text-lg font-bold">{toPersianDigits(currentTimeStr)}</span>
             </div>
           </div>
        </div>

        {/* Vertical Divider (Desktop) */}
        <div className="hidden md:block w-px h-24 bg-slate-100"></div>

        {/* Shifts Section */}
        <div className="flex-1 w-full">
           {todayEntry ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Supervisor */}
               <div className="flex flex-col gap-1 items-stretch">
                 <span className="text-xs font-bold text-slate-400 pr-1 text-right">سرپرست</span>
                 <ShiftUserCard name={todayEntry.onCallPerson} type="Supervisor" showIcon={true} />
               </div>
               
               {/* Day Shift */}
               <div className="flex flex-col gap-1 items-stretch">
                 <span className="text-xs font-bold text-slate-400 pr-1 text-right">شیفت روز (۱۹ - ۰۸)</span>
                 <ShiftUserCard name={todayEntry.dayShiftPerson} type="Day" showIcon={true} />
               </div>

               {/* Night Shift */}
               <div className="flex flex-col gap-1 items-stretch">
                 <span className="text-xs font-bold text-slate-400 pr-1 text-right">شیفت شب (۰۸ - ۱۹)</span>
                 <ShiftUserCard name={todayEntry.nightShiftPerson} type="Night" showIcon={true} />
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 h-full">
               <Calendar size={40} className="text-slate-300 mb-2" />
               <p className="text-slate-500 font-medium">برای تاریخ امروز ({toPersianDigits(currentDateStr)}) برنامه‌ای ثبت نشده است.</p>
               <p className="text-xs text-slate-400 mt-1">ممکن است تقویم به سال ۱۴۰۴ تنظیم شده باشد.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
