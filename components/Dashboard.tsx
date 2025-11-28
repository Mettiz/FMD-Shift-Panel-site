
import React, { useMemo, useState } from 'react';
import { SHIFT_WEIGHTS, StatEntry, ShiftEntry, DashboardProps } from '../types';
import { Calendar, Moon, Filter, ChevronRight, ChevronLeft, Lock, Unlock, Sun, RefreshCw, Printer, FileText, CalendarRange, XCircle, Search, ChevronDown, ChevronUp, Scale, Activity, Trophy, Clock, Users, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { ShiftUserCard } from './ShiftUserCard';
import { TodayHero } from './TodayHero';
import { StatsCard } from './StatsCard';

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

// Official Holidays for 1404 (Extracted from Calendar)
const OFFICIAL_HOLIDAYS_1404 = [
  "1404/01/01", "1404/01/02", "1404/01/03", "1404/01/04", // Nowruz
  "1404/01/10", "1404/01/11", // Eid Fetr
  "1404/01/12", // Republic Day
  "1404/01/13", // Nature Day
  "1404/02/04", // Martyrdom Imam Sadeq
  "1404/03/14", // Demise Imam Khomeini
  "1404/03/15", // 15 Khordad
  "1404/03/16", // Eid Ghorban
  "1404/03/24", // Eid Ghadir
  "1404/04/14", // Tasua
  "1404/04/15", // Ashura
  "1404/05/23", // Arbaeen
  "1404/05/31", // Demise Prophet & Imam Hassan
  "1404/06/02", // Martyrdom Imam Reza
  "1404/06/10", // Imamate Imam Mahdi
  "1404/06/19", // Birth Prophet
  "1404/09/03", // Martyrdom Hazrat Fatemeh
  "1404/10/13", // Birth Imam Ali
  "1404/10/27", // Mabas
  "1404/11/15", // Birth Imam Mahdi
  "1404/11/22", // Revolution Victory
  "1404/12/20", // Martyrdom Imam Ali
  "1404/12/29", // Oil Nationalization
];

// Expanded Palette for unique colors per person (20 Distinct Colors)
const CHART_COLORS = [
  '#2563eb', // Blue 600
  '#e11d48', // Rose 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#0891b2', // Cyan 600
  '#4f46e5', // Indigo 600
  '#db2777', // Pink 600
  '#65a30d', // Lime 600
  '#ea580c', // Orange 600
  '#0d9488', // Teal 600
  '#9333ea', // Purple 600
  '#be123c', // Rose 700
  '#1d4ed8', // Blue 700
  '#b45309', // Amber 700
  '#0e7490', // Cyan 700
  '#4338ca', // Indigo 700
  '#15803d', // Green 700
  '#a21caf', // Fuchsia 700
  '#c2410c', // Orange 700
];

// Helper to convert digits to Persian
const toPersianDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// Reusable Date Select Component for Dashboard (Coordinated Style)
const DashboardDateSelect = ({ value, onChange, options, width = "w-[60px]" }: { value: string, onChange: (val: string) => void, options: any[], width?: string }) => (
  <div className={`relative h-9 ${width}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full appearance-none bg-white border border-slate-300 hover:border-emerald-500 rounded-lg px-1 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer text-center dir-ltr"
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

// Custom Active Shape for Pie Chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  const name = payload.name.replace('مهندس', '').trim();

  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill="#334155" style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'inherit' }}>
        {name}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#94a3b8" style={{ fontSize: '11px', fontFamily: 'inherit', direction: 'rtl' }}>
        {toPersianDigits(value)} ساعت
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 7}
        outerRadius={outerRadius + 11}
        fill={fill}
        fillOpacity={0.2}
        cornerRadius={8}
      />
    </g>
  );
};

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
  
  // Chart Interaction State
  const [activeIndex, setActiveIndex] = useState(0);

  // UI States (What the user is selecting)
  // Initialize with current year
  const [fromDate, setFromDate] = useState({ y: String(year), m: '01', d: '01' });
  const [toDate, setToDate] = useState({ y: String(year), m: '01', d: '01' });

  // Applied States (What the table is actually showing)
  const [appliedFromDate, setAppliedFromDate] = useState({ y: String(year), m: '01', d: '01' });
  const [appliedToDate, setAppliedToDate] = useState({ y: String(year), m: '01', d: '01' });

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set(fullSchedule.map(s => s.date.split('/')[0]));
    const sorted = Array.from(years).sort();
    return sorted.length > 0 ? sorted : [String(year)]; 
  }, [fullSchedule, year]);

  const handleDateFilterChange = (type: 'FROM' | 'TO', field: 'y'|'m'|'d', val: string) => {
      if (type === 'FROM') setFromDate(prev => ({ ...prev, [field]: val }));
      else setToDate(prev => ({ ...prev, [field]: val }));
  };

  const applyDateFilter = () => {
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
      setViewMode('RANGE');
  };

  const handleMonthNavigation = (direction: 'PREV' | 'NEXT') => {
      if (direction === 'PREV') onPrevMonth();
      else onNextMonth();
      // Switch back to month view
      setViewMode('MONTH');
  };

  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handlePrintSchedule = () => {
    const originalTitle = document.title;
    document.title = `برنامه_شیفت_${monthName}_${year}`;
    document.body.classList.add('print-mode-dashboard');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-mode-dashboard');
        document.title = originalTitle;
    }, 500);
  };

  // --- Data Derivation ---
  
  // 1. Determine Source Data (Month vs Range)
  const sourceSchedule = useMemo(() => {
      if (viewMode === 'MONTH') {
          return scheduleData;
      } else {
          const start = `${appliedFromDate.y}/${appliedFromDate.m}/${appliedFromDate.d}`;
          const end = `${appliedToDate.y}/${appliedToDate.m}/${appliedToDate.d}`;
          return fullSchedule.filter(s => s.date >= start && s.date <= end);
      }
  }, [viewMode, scheduleData, fullSchedule, appliedFromDate, appliedToDate]);

  // 2. Filter by Person
  const filteredSchedule = useMemo(() => {
    if (filterPerson === 'All') return sourceSchedule;
    return sourceSchedule.filter(s => 
      s.dayShiftPerson === filterPerson || 
      s.nightShiftPerson === filterPerson
    );
  }, [sourceSchedule, filterPerson]);

  // 3. Stats Calculation
  const stats = useMemo(() => {
    const map = new Map<string, StatEntry>();
    shiftWorkers.forEach(name => {
       map.set(name, {
         name,
         dayShifts: 0,
         nightShifts: 0,
         totalHours: 0,
         weightedScore: 0,
         offHours: 0,
         workedHours: 0
       });
    });

    sourceSchedule.forEach(entry => {
       const dayP = map.get(entry.dayShiftPerson);
       if (dayP) {
           dayP.dayShifts++;
           dayP.totalHours += SHIFT_WEIGHTS.dayHours;
           dayP.workedHours += SHIFT_WEIGHTS.dayHours;
           dayP.weightedScore += SHIFT_WEIGHTS.dayHours;
       }
       const nightP = map.get(entry.nightShiftPerson);
       if (nightP) {
           nightP.nightShifts++;
           nightP.totalHours += SHIFT_WEIGHTS.nightHours;
           nightP.workedHours += SHIFT_WEIGHTS.nightHours;
           nightP.weightedScore += (SHIFT_WEIGHTS.nightHours * SHIFT_WEIGHTS.nightMultiplier);
       }
    });
    
    return Array.from(map.values()).sort((a,b) => b.totalHours - a.totalHours);
  }, [sourceSchedule, shiftWorkers]);

  // Handle Ties for Top Performer
  const topPerformer = useMemo(() => {
      if (stats.length === 0) return null;
      const maxScore = stats[0].totalHours;
      const winners = stats.filter(s => s.totalHours === maxScore);
      
      if (winners.length > 1) {
          return {
              name: `${toPersianDigits(winners.length)} نفر`,
              totalHours: maxScore,
              isShared: true
          };
      }
      return {
          name: winners[0].name,
          totalHours: winners[0].totalHours,
          isShared: false
      };
  }, [stats]);

  // Workaround for Recharts TS issue
  const PieAny = Pie as any;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Today's Hero Section */}
      <TodayHero schedule={fullSchedule} />

      {/* 2. Control Bar (Month Nav, Lock, Print) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-4">
            <button onClick={() => handleMonthNavigation('PREV')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800">
                <ChevronRight size={24} />
            </button>
            
            <div className="text-center min-w-[140px]">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                    <span className="inline sm:hidden">{viewMode === 'MONTH' ? monthName : 'بازه'}</span>
                    <span className="hidden sm:inline">{viewMode === 'MONTH' ? monthName : 'بازه انتخابی'}</span>
                </h2>
                <p className="text-sm font-bold text-slate-400 font-mono tracking-widest mt-0.5">{viewMode === 'MONTH' ? year : '---'}</p>
            </div>

            <button onClick={() => handleMonthNavigation('NEXT')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
            </button>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
            <button 
                onClick={onToggleLock}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition border ${isLocked ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}
                title={isLocked ? 'باز کردن قفل ویرایش' : 'قفل کردن برنامه'}
            >
                {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                <span className="hidden sm:inline">{isLocked ? 'قفل شده' : 'باز (قابل ویرایش)'}</span>
            </button>

            {!isLocked && (
                <button 
                    onClick={onRegenerate}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    title="چیدمان مجدد هوشمند"
                >
                    <RefreshCw size={18} />
                    <span className="hidden sm:inline">چیدمان مجدد</span>
                </button>
            )}
        </div>

        {/* Right: Report & Filter Toggle */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`p-2 rounded-xl border transition ${isFiltersOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                title="فیلترها"
            >
                <Filter size={20} />
            </button>
            
            <button 
                onClick={handlePrintSchedule}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                title="چاپ برنامه ماهانه"
            >
                <Printer size={18} />
                <span className="hidden sm:inline">چاپ برنامه</span>
            </button>

            <button 
                onClick={onOpenReport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                title="گزارش کارکرد پرسنل"
            >
                <FileText size={18} />
                <span className="hidden sm:inline">کارکرد پرسنل</span>
            </button>
        </div>
      </div>

      {/* 3. Filters Panel (Collapsible) */}
      {isFiltersOpen && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 animate-in slide-in-from-top-2 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <CalendarRange size={14} />
                          فیلتر بازه زمانی
                      </h3>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-400">از:</span>
                              <DashboardDateSelect value={fromDate.d} onChange={v => handleDateFilterChange('FROM', 'd', v)} options={PERSIAN_DAYS} width="w-12" />
                              <DashboardDateSelect value={fromDate.m} onChange={v => handleDateFilterChange('FROM', 'm', v)} options={PERSIAN_MONTHS} width="w-20" />
                              <DashboardDateSelect value={fromDate.y} onChange={v => handleDateFilterChange('FROM', 'y', v)} options={availableYears} width="w-16" />
                          </div>
                          <span className="text-slate-300">-</span>
                          <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-400">تا:</span>
                              <DashboardDateSelect value={toDate.d} onChange={v => handleDateFilterChange('TO', 'd', v)} options={PERSIAN_DAYS} width="w-12" />
                              <DashboardDateSelect value={toDate.m} onChange={v => handleDateFilterChange('TO', 'm', v)} options={PERSIAN_MONTHS} width="w-20" />
                              <DashboardDateSelect value={toDate.y} onChange={v => handleDateFilterChange('TO', 'y', v)} options={availableYears} width="w-16" />
                          </div>
                          <div className="flex items-center gap-1 mr-auto">
                              <button onClick={applyDateFilter} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition shadow-sm border border-transparent hover:border-blue-800">
                                  <CheckCircle2 size={16} />
                              </button>
                              <button onClick={() => {
                                  // Reset functionality can be added here if needed
                                  setIsFiltersOpen(false);
                              }} className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition border border-slate-200">
                                  <XCircle size={16} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Person Filter */}
                  <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Users size={14} />
                          نمایش شخص خاص
                      </h3>
                      <div className="flex gap-2">
                          <select 
                              value={filterPerson}
                              onChange={(e) => setFilterPerson(e.target.value)}
                              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                              <option value="All">نمایش همه</option>
                              {shiftWorkers.map(name => (
                                  <option key={name} value={name}>{name}</option>
                              ))}
                          </select>
                          {filterPerson !== 'All' && (
                              <button onClick={() => setFilterPerson('All')} className="h-11 px-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg border border-red-200">
                                  <XCircle size={20} />
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 5. Schedule Display */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0">
        
        {/* Header (Screen Only) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                برنامه شیفت
            </h3>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded text-slate-500 border border-slate-200">{filteredSchedule.length} رکورد</span>
        </div>
        
        {/* Mobile/Desktop List View (Screen Only) */}
        <div className="divide-y divide-slate-100 print:hidden">
             {filteredSchedule.length > 0 ? (
                 filteredSchedule.map((entry) => {
                     // Determine holiday status for styling
                     const isOfficialHoliday = OFFICIAL_HOLIDAYS_1404.includes(entry.date);
                     const isFriday = entry.dayName === 'جمعه';
                     const isHoliday = entry.isHoliday || isFriday || isOfficialHoliday;
                     const isThursday = entry.dayName === 'پنج‌شنبه';
                     
                     // Style Classes
                     let rowBgClass = "hover:bg-slate-50";
                     let dateColorClass = "text-slate-700";

                     if (isHoliday) {
                         rowBgClass = "bg-red-50/40 border-red-100";
                         dateColorClass = "text-red-500";
                     } else if (isThursday) {
                         rowBgClass = "bg-purple-50/40 border-purple-100";
                         dateColorClass = "text-purple-600";
                     }

                     return (
                        <div key={entry.id} className={`p-4 transition flex flex-col sm:flex-row items-center gap-4 ${rowBgClass}`}>
                            
                            {/* Date Badge */}
                            <div className="flex sm:flex-col items-center gap-2 sm:gap-0 w-full sm:w-24 shrink-0 justify-between sm:justify-center">
                                <span className={`text-sm font-black ${dateColorClass}`}>
                                    {entry.dayName}
                                </span>
                                <span className="text-xs font-mono text-slate-400 font-bold" dir="ltr">{entry.date}</span>
                            </div>

                            {/* Shifts */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <ShiftUserCard 
                                    name={entry.dayShiftPerson} 
                                    type="Day" 
                                    originalName={entry.originalDayShiftPerson}
                                    className="w-full"
                                />
                                <ShiftUserCard 
                                    name={entry.nightShiftPerson} 
                                    type="Night" 
                                    originalName={entry.originalNightShiftPerson}
                                    className="w-full"
                                />
                            </div>

                            {/* Supervisor */}
                            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end sm:justify-center">
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] text-slate-400 font-bold">سرپرست:</span>
                                    <span className="text-xs font-bold text-slate-700">{entry.onCallPerson}</span>
                                </div>
                            </div>
                        </div>
                     );
                 })
             ) : (
                 <div className="p-8 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                     <Search size={32} className="opacity-20" />
                     داده‌ای برای نمایش یافت نشد.
                 </div>
             )}
        </div>

        {/* Print-Only Table View */}
        <div className="hidden print:block w-full">
            <div className="mb-4 text-center border-b-2 border-black pb-2">
                <h1 className="text-xl font-black">برنامه شیفت تولید - {monthName} {year}</h1>
            </div>
            <table className="w-full text-right border-collapse text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border border-black font-bold">روز</th>
                        <th className="p-2 border border-black font-bold">تاریخ</th>
                        <th className="p-2 border border-black font-bold">شیفت روز (۱۹ - ۰۸)</th>
                        <th className="p-2 border border-black font-bold">شیفت شب (۰۸ - ۱۹)</th>
                        <th className="p-2 border border-black font-bold">سرپرست</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSchedule.map((entry) => {
                        const isOfficialHoliday = OFFICIAL_HOLIDAYS_1404.includes(entry.date);
                        const isFriday = entry.dayName === 'جمعه';
                        const isHoliday = entry.isHoliday || isFriday || isOfficialHoliday;
                        
                        let rowClass = "";
                        let textClass = "";
                        
                        if (isHoliday) {
                            rowClass = "bg-gray-100"; // Greyscale for print friendly highlighting
                            textClass = "font-black"; // Bold for holidays
                        }
                        
                        return (
                            <tr key={entry.id} className={rowClass}>
                                <td className={`p-2 border border-black ${textClass}`}>
                                    {entry.dayName} {isHoliday ? '(تعطیل)' : ''}
                                </td>
                                <td className="p-2 border border-black font-mono">{entry.date}</td>
                                <td className="p-2 border border-black">{entry.dayShiftPerson}</td>
                                <td className="p-2 border border-black">{entry.nightShiftPerson}</td>
                                <td className="p-2 border border-black">{entry.onCallPerson}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-8 flex justify-between px-8 text-sm font-bold">
                 <div>امضاء تنظیم کننده</div>
                 <div>امضاء تأیید کننده</div>
                 <div>امضاء مدیریت</div>
            </div>
        </div>
      </div>

      {/* 4. Stats Overview & Charts (Moved to Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-200 print:hidden">
        
        {/* Right: Pie Chart */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[250px] sm:h-[300px] h-[200px]">
            <h3 className="text-sm font-bold text-slate-500 mb-2 w-full text-right px-2">نمودار توزیع کاری</h3>
            <div className="w-full h-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <PieAny
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={stats as any}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            dataKey="totalHours"
                            onMouseEnter={onPieClick}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {stats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                            ))}
                        </PieAny>
                        <Legend 
                             verticalAlign="bottom" 
                             height={36} 
                             iconType="circle"
                             iconSize={8}
                             wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Left: Stats Cards (Mosaics) */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
             <StatsCard 
                type="square"
                title="مجموع شیفت‌ها" 
                value={filteredSchedule.length * 2} // Approx (Day + Night)
                subtitle={`${filteredSchedule.length} روز کاری`}
                icon={Activity} 
                colorClass="bg-blue-500" 
             />
             <StatsCard 
                type="square"
                title="ساعات کاری کل"
                value={stats.reduce((acc, curr) => acc + curr.totalHours, 0)}
                subtitle="مجموع ساعت پرسنل"
                icon={Clock}
                colorClass="bg-indigo-500"
             />
             <StatsCard 
                type="square"
                title="نفرات فعال" 
                value={shiftWorkers.length} 
                subtitle={`${supervisors.length} سرپرست`}
                icon={Users} 
                colorClass="bg-emerald-500" 
             />
             {topPerformer && (
                <StatsCard 
                    type="square"
                    title="بیشترین کارکرد" 
                    value={topPerformer.name} 
                    subtitle={topPerformer.isShared ? `مشترک (${toPersianDigits(topPerformer.totalHours)} ساعت)` : `${toPersianDigits(topPerformer.totalHours)} ساعت`}
                    icon={Trophy} 
                    colorClass="bg-amber-500" 
                />
             )}
        </div>
      </div>

    </div>
  );
};
