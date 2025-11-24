
import React, { useMemo, useState, useEffect } from 'react';
import { SHIFT_WEIGHTS, StatEntry, ShiftEntry, DashboardProps } from '../types';
import { Calendar, Moon, Filter, ChevronRight, ChevronLeft, Lock, Unlock, Sun, RefreshCw, Printer, FileText, CalendarRange, XCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ShiftUserCard } from './ShiftUserCard';
import { TodayHero } from './TodayHero';

// --- Constants for Date Selectors ---
const PERSIAN_MONTHS = [
  { value: '01', label: 'فروردین' },
  { value: '02', label: 'اردیبهشت' },
  { value: '03', label: 'خرداد' },
  { value: '04', label: 'تیر' },
  { value: '05', label: 'مرداد' },
  { value: '06', label: 'شهریور' },
  { value: '07', label: 'مهر' },
  { value: '08', label: 'آبان' },
  { value: '09', label: 'آذر' },
  { value: '10', label: 'دی' },
  { value: '11', label: 'بهمن' },
  { value: '12', label: 'اسفند' },
];

const PERSIAN_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

// Helper to convert digits to Persian
const toPersianDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// Reusable Date Select Component for Dashboard (High Contrast)
const DashboardDateSelect = ({ value, onChange, options, width = "w-[60px]" }: { value: string, onChange: (val: string) => void, options: any[], width?: string }) => (
  <div className={`relative h-9 ${width}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full appearance-none bg-white border-2 border-slate-700 hover:border-black rounded-lg px-1 text-sm font-bold text-black focus:ring-2 focus:ring-black focus:border-black outline-none transition-all cursor-pointer text-center dir-ltr"
        style={{ textAlign: 'center', textAlignLast: 'center' }}
      >
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>
            {o.label || o}
          </option>
        ))}
      </select>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  scheduleData, 
  fullSchedule,
  shiftWorkers, 
  supervisors,
  monthName, 
  year,
  onPrevMonth, 
  onNextMonth,
  onUpdateShift,
  onToggleHoliday,
  onOpenReport,
  isLocked,
  onToggleLock,
  onRegenerate
}) => {
  const [filterPerson, setFilterPerson] = useState<string | 'All'>('All');
  
  // --- Date Range Filter State ---
  const [viewMode, setViewMode] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Initialize with "Today"
  const [fromDate, setFromDate] = useState({ y: '1404', m: '01', d: '01' });
  const [toDate, setToDate] = useState({ y: '1404', m: '01', d: '01' });

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set(fullSchedule.map(s => s.date.split('/')[0]));
    const sorted = Array.from(years).sort();
    return sorted.length > 0 ? sorted : [String(year)]; 
  }, [fullSchedule, year]);

  // Set default date to today on mount
  useEffect(() => {
    const now = new Date();
    const parts = now.toLocaleDateString('fa-IR-u-nu-latn').split('/');
    if (parts.length === 3) {
       const def = { y: parts[0], m: parts[1], d: parts[2] };
       setFromDate(def);
       setToDate(def);
    }
  }, []);

  const handleDateFilterChange = (type: 'FROM' | 'TO', field: 'y'|'m'|'d', val: string) => {
      if (type === 'FROM') setFromDate(prev => ({ ...prev, [field]: val }));
      else setToDate(prev => ({ ...prev, [field]: val }));
      
      // Automatically switch to range view when user touches filters
      setViewMode('RANGE');
  };

  const handleMonthNavigation = (direction: 'PREV' | 'NEXT') => {
      if (direction === 'PREV') onPrevMonth();
      else onNextMonth();
      // Switch back to month view
      setViewMode('MONTH');
  };

  // --- Data Derivation ---
  
  // 1. Determine Source Data (Month vs Range)
  const sourceSchedule = useMemo(() => {
      if (viewMode === 'MONTH') {
          return scheduleData;
      } else {
          const start = `${fromDate.y}/${fromDate.m}/${fromDate.d}`;
          const end = `${toDate.y}/${toDate.m}/${toDate.d}`;
          // Filter full schedule
          return fullSchedule.filter(s => s.date >= start && s.date <= end).sort((a, b) => a.date.localeCompare(b.date));
      }
  }, [viewMode, scheduleData, fullSchedule, fromDate, toDate]);

  // 2. Apply Person Filter
  const visibleSchedule = useMemo(() => {
     if (filterPerson === 'All') return sourceSchedule;
     return sourceSchedule.filter(s => 
        s.dayShiftPerson === filterPerson || 
        s.nightShiftPerson === filterPerson || 
        s.onCallPerson === filterPerson
     );
  }, [sourceSchedule, filterPerson]);

  const getCellOpacity = (personName: string) => {
    if (filterPerson === 'All') return 1;
    return personName === filterPerson ? 1 : 0.3; // Highlight specific person
  };

  // Print Handler
  const handlePrint = () => {
    // Only print what is currently visible
    document.body.classList.add('print-mode-dashboard');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-dashboard');
    }, 1000);
  };

  return (
    <div className="space-y-6 dashboard-container">
      
      {/* 1. Today Hero Section (Only show in Month view or if requested) */}
      {viewMode === 'MONTH' && <TodayHero schedule={fullSchedule} />}

      {/* Main Schedule Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 no-print bg-slate-50/50">
          
          {/* Top Row: Title & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Left: Title & Month Nav */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                   <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <Calendar className="text-emerald-600" size={24}/>
                     <span className="hidden sm:inline">سامانه شیفت تولید</span>
                   </h2>
                </div>
                
                {/* Month Navigation (Active in Month Mode) */}
                <div className={`flex items-center bg-white border border-slate-200 rounded-lg p-1 transition-opacity ${viewMode === 'RANGE' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                    <button onClick={() => handleMonthNavigation('PREV')} className="p-1 hover:bg-slate-100 rounded-md transition text-slate-500">
                      <ChevronRight size={20} />
                    </button>
                    <span className="px-3 text-sm font-bold text-slate-700 min-w-[120px] text-center">{monthName} {year}</span>
                    <button onClick={() => handleMonthNavigation('NEXT')} className="p-1 hover:bg-slate-100 rounded-md transition text-slate-500">
                      <ChevronLeft size={20} />
                    </button>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                  {!isLocked && (
                    <button 
                        onClick={onRegenerate}
                        className="p-2 rounded-lg transition-colors bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100"
                        title="چیدمان مجدد (Auto Arrange)"
                    >
                        <RefreshCw size={20} />
                    </button>
                  )}

                  <button 
                    onClick={onToggleLock}
                    className={`p-2 rounded-lg transition-colors border ${isLocked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                    title={isLocked ? "باز کردن قفل" : "قفل کردن نهایی (ثبت)"}
                  >
                    {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                  </button>

                  <div className="w-px h-8 bg-slate-200 mx-1"></div>

                  <button 
                    onClick={onOpenReport}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">گزارش فردی</span>
                  </button>
                  
                  <button 
                    onClick={handlePrint}
                    className="p-2 rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    title="چاپ لیست"
                  >
                    <Printer size={20} />
                  </button>
              </div>
          </div>

          {/* Filter Collapsible Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
             <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
             >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Filter size={18} className="text-emerald-600" />
                    <span>فیلترهای پیشرفته (تاریخ و پرسنل)</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
             </button>
             
             {isFiltersOpen && (
                 <div className="p-4 border-t border-slate-200 flex flex-col xl:flex-row items-center gap-4 justify-center animate-in slide-in-from-top-2 fade-in duration-200">
                     
                     {/* Date Range Selectors */}
                     <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto justify-center">
                         <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <CalendarRange size={18} className="text-slate-400" />
                            <span>فیلتر تاریخ:</span>
                         </div>
                         
                         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 mx-1">از:</span>
                            <DashboardDateSelect width="w-[50px]" value={fromDate.d} onChange={(v) => handleDateFilterChange('FROM', 'd', v)} options={PERSIAN_DAYS} />
                            <DashboardDateSelect width="w-[85px]" value={fromDate.m} onChange={(v) => handleDateFilterChange('FROM', 'm', v)} options={PERSIAN_MONTHS} />
                            <DashboardDateSelect width="w-[65px]" value={fromDate.y} onChange={(v) => handleDateFilterChange('FROM', 'y', v)} options={availableYears} />
                         </div>

                         <div className="hidden md:block w-4 h-0.5 bg-slate-300 rounded-full"></div>

                         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 mx-1">تا:</span>
                            <DashboardDateSelect width="w-[50px]" value={toDate.d} onChange={(v) => handleDateFilterChange('TO', 'd', v)} options={PERSIAN_DAYS} />
                            <DashboardDateSelect width="w-[85px]" value={toDate.m} onChange={(v) => handleDateFilterChange('TO', 'm', v)} options={PERSIAN_MONTHS} />
                            <DashboardDateSelect width="w-[65px]" value={toDate.y} onChange={(v) => handleDateFilterChange('TO', 'y', v)} options={availableYears} />
                         </div>

                         {viewMode === 'RANGE' && (
                             <button 
                               onClick={() => setViewMode('MONTH')}
                               className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition"
                               title="لغو فیلتر تاریخ (بازگشت به ماه جاری)"
                             >
                               <XCircle size={20} />
                             </button>
                         )}
                     </div>

                     <div className="hidden xl:block w-px h-8 bg-slate-200 mx-2"></div>

                     {/* Person Filter */}
                     <div className="flex items-center w-full xl:w-auto bg-slate-50 rounded-lg px-2 border border-slate-100">
                       <Filter size={16} className="text-slate-400 mr-2 ml-1" />
                       <select 
                         className="bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 cursor-pointer w-full py-2"
                         value={filterPerson}
                         onChange={(e) => setFilterPerson(e.target.value)}
                       >
                         <option value="All">نمایش همه پرسنل</option>
                         {shiftWorkers.map(name => (
                           <option key={name} value={name}>{name}</option>
                         ))}
                       </select>
                     </div>

                 </div>
             )}
          </div>
          
          {/* Active Filter Badge */}
          {viewMode === 'RANGE' && (
             <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                 <Search size={16} />
                 <span>نمایش نتایج فیلتر شده از <b>{toPersianDigits(`${fromDate.y}/${fromDate.m}/${fromDate.d}`)}</b> تا <b>{toPersianDigits(`${toDate.y}/${toDate.m}/${toDate.d}`)}</b></span>
             </div>
          )}

        </div>

        {/* Improved Print Header - DYNAMIC */}
        <div className="hidden print:flex flex-col items-center justify-center w-full mb-6 border-b-2 border-black pb-4 pt-4">
             <div className="flex justify-between items-end w-full px-4 mb-4">
                 <h1 className="text-3xl font-black text-black">سامانه شیفت تولید</h1>
                 <div className="text-sm font-bold text-black border border-black px-2 py-1 rounded">
                     تاریخ چاپ: {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}
                 </div>
             </div>
             
             <div className="w-full text-center mb-2">
                 <h2 className="text-xl font-black text-black mb-2">
                     {viewMode === 'MONTH' 
                        ? `برنامه شیفت: ${monthName} ${toPersianDigits(year)}`
                        : 'گزارش کارکرد (بازه انتخابی)'
                     }
                 </h2>
                 {viewMode === 'RANGE' && (
                     <div className="inline-block bg-white border-2 border-black text-black px-6 py-2 rounded-lg text-lg font-bold shadow-sm">
                        بازه: {toPersianDigits(`${fromDate.y}/${fromDate.m}/${fromDate.d}`)} تا {toPersianDigits(`${toDate.y}/${toDate.m}/${toDate.d}`)}
                     </div>
                 )}
                 {filterPerson !== 'All' && (
                     <div className="mt-2 text-sm font-bold text-slate-700">فیلتر پرسنل: {filterPerson}</div>
                 )}
             </div>
        </div>

        {isLocked && viewMode === 'MONTH' && (
          <div className="bg-red-50 text-red-800 px-6 py-2 text-xs flex items-center gap-2 border-b border-red-100 no-print">
            <Lock size={14} />
            این ماه قفل شده است. برای ویرایش یا چیدمان مجدد، قفل را باز کنید.
          </div>
        )}

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-4 p-4 no-print bg-slate-50">
          {visibleSchedule.length > 0 ? (
            visibleSchedule.map((entry) => {
             const isFriday = entry.dayName === 'جمعه';
             const isManualHoliday = entry.isHoliday && !isFriday;
             
             return (
               <div 
                 key={entry.id} 
                 className={`bg-white rounded-xl shadow-sm border p-4 space-y-4 transition-opacity duration-300
                    ${isFriday ? 'border-red-200 bg-red-50/10' : 'border-slate-200'} 
                    ${isManualHoliday ? 'border-pink-300 bg-pink-50' : ''}
                 `}
               >
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                   <div className="flex items-center gap-2">
                     <span className={`font-bold ${isFriday ? 'text-red-500' : 'text-slate-700'}`}>{entry.dayName}</span>
                     <span className="text-sm text-slate-500 font-mono">{entry.date}</span>
                   </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex flex-col gap-1 items-stretch">
                        <span className="text-[10px] text-slate-400 font-medium text-right">سرپرست</span>
                        <div className="w-full">
                           <ShiftUserCard name={entry.onCallPerson} type="Supervisor" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                        <div className="flex flex-col gap-1 w-full" style={{ opacity: getCellOpacity(entry.dayShiftPerson) }}>
                            <span className="text-[10px] text-slate-400 font-medium text-right">شیفت روز</span>
                            <ShiftUserCard name={entry.dayShiftPerson} originalName={entry.originalDayShiftPerson} type="Day" />
                        </div>

                        <div className="flex flex-col gap-1 w-full" style={{ opacity: getCellOpacity(entry.nightShiftPerson) }}>
                             <span className="text-[10px] text-slate-400 font-medium text-right">شیفت شب</span>
                             <ShiftUserCard name={entry.nightShiftPerson} originalName={entry.originalNightShiftPerson} type="Night" />
                        </div>
                    </div>
                 </div>
               </div>
             );
          })
          ) : (
             <div className="text-center py-10 text-slate-400">موردی یافت نشد.</div>
          )}
        </div>

        {/* DESKTOP & PRINT TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto print:overflow-visible print:block w-full">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white print:bg-slate-100 print:text-black">
                <th className="p-4 print:p-2 font-medium w-24 text-center print:border print:border-black">روز</th>
                <th className="p-4 print:p-2 font-medium w-32 text-center print:border print:border-black">تاریخ</th>
                <th className="p-4 print:p-2 font-medium bg-amber-500/20 text-amber-50 border-l border-emerald-500/30 print:bg-transparent print:text-black print:border print:border-black text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Sun size={16} className="print:hidden"/>
                    شیفت روز (۰۸-۱۹)
                  </div>
                </th>
                <th className="p-4 print:p-2 font-medium bg-indigo-900/20 text-indigo-50 border-l border-emerald-500/30 print:bg-transparent print:text-black print:border print:border-black text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Moon size={16} className="print:hidden"/>
                    شیفت شب (۱۹-۰۸)
                  </div>
                </th>
                <th className="p-4 print:p-2 font-medium w-48 border-l border-emerald-500/30 print:border print:border-black text-center">سرپرست</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {visibleSchedule.length > 0 ? (
                visibleSchedule.map((entry) => {
                const isFriday = entry.dayName === 'جمعه';
                const isManualHoliday = entry.isHoliday && !isFriday;
                
                return (
                  <tr 
                    key={entry.id} 
                    className={`hover:bg-slate-50 transition-all duration-300 break-inside-avoid
                      ${isFriday ? 'bg-red-50/30 print:bg-transparent' : ''}
                      ${isManualHoliday ? 'bg-pink-100 print:bg-pink-100' : ''}
                    `}
                  >
                    <td 
                      className={`p-4 print:p-1 font-medium text-center align-middle print:border print:border-black
                        ${isFriday ? 'text-red-500' : ''}
                        ${isManualHoliday ? 'text-pink-700' : ''}
                        ${!isFriday && !isManualHoliday ? 'text-slate-700' : ''}
                      `}
                    >
                      {entry.dayName}
                    </td>

                    <td 
                      className={`p-4 print:p-1 text-center align-middle print:border print:border-black
                        ${isFriday ? 'text-red-500' : ''}
                        ${isManualHoliday ? 'text-pink-700' : ''}
                        ${!isFriday && !isManualHoliday ? 'text-slate-600' : ''}
                      `} 
                    >
                      {toPersianDigits(entry.date)}
                    </td>

                    <td className="p-0 print:p-0 border-l border-slate-100 print:border print:border-black align-middle transition-opacity duration-300" style={{ opacity: getCellOpacity(entry.dayShiftPerson) }}>
                        <div className="w-full h-full min-h-[56px] print:min-h-0">
                             <div className="print:hidden h-full">
                                <ShiftUserCard name={entry.dayShiftPerson} originalName={entry.originalDayShiftPerson} type="Day" />
                             </div>
                             <div className="hidden print:flex user-card-print items-center justify-center gap-1 p-0 w-full">
                                <span className="details text-xs font-bold truncate">{entry.dayShiftPerson.replace('مهندس', '').trim()}</span>
                            </div>
                        </div>
                    </td>

                    <td className="p-0 print:p-0 border-l border-slate-100 print:border print:border-black align-middle transition-opacity duration-300" style={{ opacity: getCellOpacity(entry.nightShiftPerson) }}>
                        <div className="w-full h-full min-h-[56px] print:min-h-0">
                             <div className="print:hidden h-full">
                                <ShiftUserCard name={entry.nightShiftPerson} originalName={entry.originalNightShiftPerson} type="Night" />
                             </div>
                             <div className="hidden print:flex user-card-print items-center justify-center gap-1 p-0 w-full">
                                <span className="details text-xs font-bold truncate">{entry.nightShiftPerson.replace('مهندس', '').trim()}</span>
                            </div>
                        </div>
                    </td>

                    <td className="p-0 print:p-0 border-l border-slate-100 print:border print:border-black align-middle transition-opacity duration-300" style={{ opacity: getCellOpacity(entry.onCallPerson) }}>
                         <div className="w-full h-full min-h-[56px] print:min-h-0">
                             <div className="print:hidden h-full">
                                <ShiftUserCard name={entry.onCallPerson} type="Supervisor" />
                             </div>
                             <div className="hidden print:flex user-card-print items-center justify-center gap-1 p-0 w-full">
                                <span className="details text-xs font-bold truncate text-gray-500">{entry.onCallPerson.replace('مهندس', '').trim()}</span>
                            </div>
                        </div>
                    </td>
                  </tr>
                );
              })
              ) : (
                 <tr>
                     <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">موردی یافت نشد.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
