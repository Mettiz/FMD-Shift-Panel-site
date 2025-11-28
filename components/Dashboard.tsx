
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
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#64748b" style={{ fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold', direction: 'rtl' }}>
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
  
  // Initialize from current props logic
  const [fromDate, setFromDate] = useState({ year: String(year), month: '09', day: '01' });
  const [toDate, setToDate] = useState({ year: String(year), month: '09', day: '30' });
  
  // The applied filter state (what actually drives the table)
  const [appliedFilter, setAppliedFilter] = useState<{
      from: { year: string, month: string, day: string },
      to: { year: string, month: string, day: string }
  } | null>(null);

  // Initialize defaults on mount once
  React.useEffect(() => {
     if (scheduleData.length > 0) {
         const first = scheduleData[0].date.split('/');
         const last = scheduleData[scheduleData.length - 1].date.split('/');
         
         const defFrom = { year: first[0], month: first[1], day: first[2] };
         const defTo = { year: last[0], month: last[1], day: last[2] };
         
         setFromDate(defFrom);
         setToDate(defTo);
         // Don't auto-apply appliedFilter here to allow month view by default
     }
  }, [scheduleData.length]); // Only run if data length changes drastically (like month change)

  const handleApplyFilter = () => {
      setAppliedFilter({ from: fromDate, to: toDate });
      setViewMode('RANGE');
      setIsFiltersOpen(false);
  };

  const handleClearFilter = () => {
      setAppliedFilter(null);
      setViewMode('MONTH');
  };

  const filteredSchedule = useMemo(() => {
    if (viewMode === 'MONTH' || !appliedFilter) {
      // Standard Month View
      if (filterPerson === 'All') return scheduleData;
      return scheduleData.filter(
        (s) => s.dayShiftPerson === filterPerson || s.nightShiftPerson === filterPerson
      );
    } else {
      // Custom Range View
      const startStr = `${appliedFilter.from.year}/${appliedFilter.from.month}/${appliedFilter.from.day}`;
      const endStr = `${appliedFilter.to.year}/${appliedFilter.to.month}/${appliedFilter.to.day}`;
      
      const rangeData = fullSchedule.filter(s => s.date >= startStr && s.date <= endStr);
      
      if (filterPerson === 'All') return rangeData;
      return rangeData.filter(
        (s) => s.dayShiftPerson === filterPerson || s.nightShiftPerson === filterPerson
      );
    }
  }, [scheduleData, fullSchedule, viewMode, appliedFilter, filterPerson]);

  const stats = useMemo(() => {
    // We calculate stats based on the VIEWABLE data to reflect what's shown
    const dataToAnalyze = filteredSchedule;
    
    const result: StatEntry[] = shiftWorkers.map(worker => {
      let dayShifts = 0;
      let nightShifts = 0;
      let workedHours = 0;

      dataToAnalyze.forEach(entry => {
        if (entry.dayShiftPerson === worker) {
          dayShifts++;
          workedHours += 11; // 11 hours for day
        }
        if (entry.nightShiftPerson === worker) {
          nightShifts++;
          workedHours += 13; // 13 hours for night
        }
      });

      // Calculate weighted score (Day=11, Night=13*1.5)
      const weightedScore = (dayShifts * 11) + (nightShifts * 13 * 1.5);
      // Total actual hours
      const totalHours = (dayShifts * 11) + (nightShifts * 13);

      return {
        name: worker,
        dayShifts,
        nightShifts,
        totalHours, // Actual hours
        weightedScore, // Pressure score
        offHours: 0, 
        workedHours
      };
    });
    
    return result;
  }, [filteredSchedule, shiftWorkers]);

  // Derived Stats for Cards
  const totalShifts = filteredSchedule.length * 2; // Day + Night
  const totalHoursSum = stats.reduce((acc, curr) => acc + curr.totalHours, 0);
  
  // Top Performer Logic (Handling Ties) - BASED ON HOURS
  const topPerformer = useMemo(() => {
      if (stats.length === 0) return null;
      const maxHours = Math.max(...stats.map(s => s.totalHours));
      const bests = stats.filter(s => s.totalHours === maxHours);
      
      return {
          isTie: bests.length > 1,
          count: bests.length,
          names: bests.map(b => b.name),
          value: maxHours
      };
  }, [stats]);

  // Chart Data - Sorted by Total Hours
  const chartData = useMemo(() => {
    return stats
      .filter(s => s.totalHours > 0)
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [stats]);

  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const handlePrint = () => {
      window.print();
  };

  const getPrintDateRange = () => {
      if (filteredSchedule.length === 0) return '';
      const start = toPersianDigits(filteredSchedule[0].date);
      const end = toPersianDigits(filteredSchedule[filteredSchedule.length - 1].date);
      return `${start} - ${end}`;
  };

  return (
    <div className="dashboard-container space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 no-print">
         
         {/* Top Bar: Title & Month Nav */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                  <CalendarRange size={24} />
               </div>
               <div>
                  <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight">برنامه شیفت {monthName} {year}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                     {filteredSchedule.length} رکورد نمایش داده شده
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
               <button onClick={onPrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition disabled:opacity-50">
                  <ChevronRight size={20} />
               </button>
               <span className="font-bold text-slate-800 text-sm min-w-[100px] text-center">{monthName} {year}</span>
               <button onClick={onNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition disabled:opacity-50">
                  <ChevronLeft size={20} />
               </button>
            </div>
         </div>

         {/* Toolbar: Actions & Filters */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Left: Actions */}
             <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <button 
                  onClick={onRegenerate}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-600 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                  title="چیدمان مجدد هوشمند"
                >
                   <RefreshCw size={16} />
                   <span>چیدمان خودکار</span>
                </button>

                <button 
                  onClick={onToggleLock}
                  className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap ${isLocked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                   {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                   <span>{isLocked ? 'قفل شده' : 'باز (قابل ویرایش)'}</span>
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition shadow-sm whitespace-nowrap mr-auto md:mr-0"
                >
                   <Printer size={16} />
                   <span>چاپ برنامه</span>
                </button>
                 
                <button 
                  onClick={onOpenReport}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
                >
                   <FileText size={16} />
                   <span>گزارش فردی</span>
                </button>
             </div>

             {/* Right: Advanced Filter Toggle */}
             <div className="flex justify-end">
                <button 
                   onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border ${isFiltersOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                   <Filter size={16} />
                   <span>فیلترهای پیشرفته</span>
                   {isFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
             </div>
         </div>

         {/* Advanced Filters Panel */}
         {isFiltersOpen && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Person Filter */}
                  <div>
                     <label className="text-xs font-bold text-slate-500 mb-2 block">فیلتر پرسنل:</label>
                     <div className="flex flex-wrap gap-2">
                        <button 
                           onClick={() => setFilterPerson('All')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterPerson === 'All' ? 'bg-slate-800 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                           همه
                        </button>
                        {shiftWorkers.map(p => (
                           <button 
                              key={p}
                              onClick={() => setFilterPerson(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterPerson === p ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              {p.replace('مهندس', '')}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-xs font-bold text-slate-500 block">فیلتر بازه زمانی (اختیاری):</label>
                         {appliedFilter && (
                             <button onClick={handleClearFilter} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-0.5 rounded transition">
                                 حذف فیلتر
                             </button>
                         )}
                      </div>
                      
                      <div className="flex flex-col xl:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex flex-col md:flex-row gap-2 md:items-center">
                              {/* From Group */}
                              <div className="flex items-center gap-1 justify-center md:justify-start">
                                  <span className="text-xs font-bold text-slate-400 min-w-[20px]">از:</span>
                                  <DashboardDateSelect value={fromDate.day} onChange={(v) => setFromDate({...fromDate, day: v})} options={PERSIAN_DAYS} width="w-[50px]" />
                                  <DashboardDateSelect value={fromDate.month} onChange={(v) => setFromDate({...fromDate, month: v})} options={PERSIAN_MONTHS} width="w-[80px]" />
                                  <DashboardDateSelect value={fromDate.year} onChange={(v) => setFromDate({...fromDate, year: v})} options={['1403', '1404', '1405']} width="w-[60px]" />
                              </div>
                              
                              {/* To Group */}
                              <div className="flex items-center gap-1 justify-center md:justify-start">
                                  <span className="text-xs font-bold text-slate-400 min-w-[20px]">تا:</span>
                                  <DashboardDateSelect value={toDate.day} onChange={(v) => setToDate({...toDate, day: v})} options={PERSIAN_DAYS} width="w-[50px]" />
                                  <DashboardDateSelect value={toDate.month} onChange={(v) => setToDate({...toDate, month: v})} options={PERSIAN_MONTHS} width="w-[80px]" />
                                  <DashboardDateSelect value={toDate.year} onChange={(v) => setToDate({...toDate, year: v})} options={['1403', '1404', '1405']} width="w-[60px]" />
                              </div>
                          </div>

                          <div className="mr-auto flex gap-1 justify-end w-full xl:w-auto pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200">
                                <button 
                                    onClick={() => {
                                        setAppliedFilter(null);
                                        setViewMode('MONTH');
                                    }}
                                    className="h-9 px-3 flex items-center justify-center bg-white border border-slate-300 text-slate-400 rounded-lg hover:border-red-400 hover:text-red-500 transition gap-1"
                                    title="لغو فیلتر"
                                >
                                    <XCircle size={18} />
                                    <span className="text-xs font-bold xl:hidden">لغو</span>
                                </button>
                                <button 
                                    onClick={handleApplyFilter}
                                    className="h-9 px-3 flex items-center justify-center bg-white border border-slate-300 text-slate-400 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition gap-1"
                                    title="اعمال فیلتر"
                                >
                                    <CheckCircle2 size={18} />
                                    <span className="text-xs font-bold xl:hidden">اعمال</span>
                                </button>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Schedule Table (3 cols wide) */}
        <div className="lg:col-span-3 space-y-6">
            
            {/* Today Hero */}
            <TodayHero schedule={fullSchedule} />

            {/* Print Header (Visible only in Print) */}
            <div className="hidden print:flex flex-row justify-between items-center mb-2 border border-black rounded-lg p-3">
                {/* Right */}
                <div className="flex flex-col items-start gap-1">
                    <h1 className="text-lg font-black text-black">برنامه شیفت</h1>
                    <span className="text-sm font-bold text-black">واحد تولید FMD</span>
                </div>

                {/* Center */}
                <div className="flex items-center justify-center">
                    <h2 className="text-2xl font-black text-black">{monthName} {toPersianDigits(year)}</h2>
                </div>

                {/* Left */}
                <div className="flex flex-col items-end gap-1 text-right">
                     <div className="flex items-center gap-1 text-xs font-bold bg-gray-50 border border-black rounded px-2 py-0.5">
                        <span>بازه زمانی:</span>
                        <span dir="ltr">{getPrintDateRange()}</span>
                     </div>
                     <div className="text-[10px] font-bold text-black">
                        تعداد پرسنل: {toPersianDigits(shiftWorkers.length)} نفر
                     </div>
                     <span className="text-[10px] font-bold text-black">
                        تاریخ گزارش: {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}
                     </span>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden md:block print:block print:shadow-none print:border-0 print:rounded-none print:overflow-visible">
               <div className="overflow-x-auto print:overflow-visible">
                 <table className="w-full text-sm text-center border-collapse print:table-fixed print:text-[9pt]">
                   {/* Define columns for print to ensure they fit */}
                   <colgroup className="hidden print:table-column-group">
                       <col style={{width: '6%'}} /> {/* Day Name */}
                       <col style={{width: '10%'}} /> {/* Date */}
                       <col style={{width: '28%'}} /> {/* Day Shift */}
                       <col style={{width: '28%'}} /> {/* Night Shift */}
                       <col style={{width: '28%'}} /> {/* Supervisor */}
                   </colgroup>
                   
                   <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 print:bg-gray-100 print:text-black print:border-black">
                     <tr>
                       <th className="p-4 print:p-1 border border-slate-200 print:border-black">روز</th>
                       <th className="p-4 print:p-1 border border-slate-200 print:border-black">تاریخ</th>
                       <th className="p-4 print:p-1 border border-slate-200 print:border-black">شیفت روز (۱۹ - ۰۸)</th>
                       <th className="p-4 print:p-1 border border-slate-200 print:border-black">شیفت شب (۰۸ - ۱۹)</th>
                       <th className="p-4 print:p-1 border border-slate-200 print:border-black">سرپرست (On-Call)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 print:divide-black">
                     {filteredSchedule.map((entry) => {
                       const isFriday = entry.dayName === 'جمعه';
                       const isHoliday = entry.isHoliday;
                       const isThursday = entry.dayName === 'پنج‌شنبه';
                       
                       // Styling Logic
                       let rowClass = 'hover:bg-slate-50 transition-colors'; // Default
                       if (isFriday || isHoliday) {
                           rowClass = 'bg-red-50 hover:bg-red-100 text-red-900 print:bg-gray-200 print:text-black'; // Print uses gray to distinguish
                       } else if (isThursday) {
                           rowClass = 'bg-[#f3e8ff] hover:bg-purple-100 text-purple-900 print:bg-white print:text-black';
                       }

                       return (
                         <tr key={entry.id} className={rowClass}>
                           <td className={`p-4 print:p-0.5 border border-slate-200 print:border-black font-bold ${isFriday || isHoliday ? 'text-red-600 print:text-black' : ''}`}>
                              <div className="flex flex-col items-center justify-center">
                                  <span>{entry.dayName}</span>
                                  {/* Holiday Text Removed for Print */}
                              </div>
                           </td>
                           <td className="p-4 print:p-0.5 border border-slate-200 print:border-black md:font-mono text-slate-500 print:text-black" dir="ltr">
                              <span className="print:hidden">{entry.date}</span>
                              <span className="hidden print:inline">{toPersianDigits(entry.date)}</span>
                           </td>
                           <td className="p-2 print:p-0.5 border border-slate-200 print:border-black">
                              <div className="print:hidden">
                                <ShiftUserCard 
                                    name={entry.dayShiftPerson} 
                                    type="Day" 
                                    originalName={entry.originalDayShiftPerson}
                                />
                              </div>
                              <span className="hidden print:block font-bold">{entry.dayShiftPerson}</span>
                           </td>
                           <td className="p-2 print:p-0.5 border border-slate-200 print:border-black">
                              <div className="print:hidden">
                                <ShiftUserCard 
                                    name={entry.nightShiftPerson} 
                                    type="Night" 
                                    originalName={entry.originalNightShiftPerson}
                                />
                              </div>
                              <span className="hidden print:block font-bold">{entry.nightShiftPerson}</span>
                           </td>
                           <td className="p-2 print:p-0.5 border border-slate-200 print:border-black">
                              <div className="print:hidden">
                                <ShiftUserCard name={entry.onCallPerson} type="Supervisor" />
                              </div>
                              <span className="hidden print:block font-bold">{entry.onCallPerson}</span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Mobile Cards (No Print) */}
            <div className="md:hidden space-y-4 print:hidden">
              {filteredSchedule.map(entry => {
                 const isFriday = entry.dayName === 'جمعه';
                 const isHoliday = entry.isHoliday;
                 const isThursday = entry.dayName === 'پنج‌شنبه';
                 
                 let cardBg = 'bg-white';
                 let borderColor = 'border-slate-200';
                 if (isFriday || isHoliday) {
                     cardBg = 'bg-red-50';
                     borderColor = 'border-red-200';
                 } else if (isThursday) {
                     cardBg = 'bg-[#f3e8ff]';
                     borderColor = 'border-purple-200';
                 }

                 return (
                  <div key={entry.id} className={`${cardBg} rounded-xl shadow-sm border ${borderColor} p-4`}>
                    <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                       <div className="flex items-center gap-2">
                          <span className={`font-black ${isFriday || isHoliday ? 'text-red-600' : 'text-slate-700'}`}>{entry.dayName}</span>
                          <span className="text-xs text-slate-400 font-mono" dir="ltr">{entry.date}</span>
                       </div>
                       {entry.isHoliday && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">تعطیل</span>}
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <Sun size={16} className="text-orange-400" />
                          <span className="text-xs font-bold w-12 text-slate-500">روز:</span>
                          <span className="flex-1 font-bold text-slate-800 text-sm">{entry.dayShiftPerson}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Moon size={16} className="text-indigo-400" />
                          <span className="text-xs font-bold w-12 text-slate-500">شب:</span>
                          <span className="flex-1 font-bold text-slate-800 text-sm">{entry.nightShiftPerson}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold w-12 text-slate-500">سرپرست:</span>
                          <span className="flex-1 font-medium text-slate-600 text-sm">{entry.onCallPerson}</span>
                       </div>
                    </div>
                  </div>
              );})}
            </div>
        </div>

        {/* Right: Stats & Charts (1 col) - Now at bottom or side */}
        <div className="space-y-6 print:hidden">
           
           {/* Chart Section */}
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-lg">نمودار توزیع کاری</h3>
                  <Scale size={16} className="text-slate-400" />
               </div>
               <div className="h-[200px] sm:h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="totalHours"
                        onClick={onPieClick}
                        onMouseEnter={onPieClick}
                      >
                         <div style={{ width: '100%', height: '100%' }}></div>
                        {chartData.map((entry, index) => (
                          <Cell 
                              key={`cell-${index}`} 
                              fill={CHART_COLORS[index % CHART_COLORS.length]} 
                              strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        iconSize={6}
                        formatter={(value) => <span className="text-[10px] text-slate-600 font-medium mr-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
           </div>

           {/* Stats Grid (2x2 Mosaic) */}
           <div className="grid grid-cols-2 gap-3 h-auto">
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="تعداد کل شیفت"
                    value={totalShifts}
                    icon={Activity}
                    colorClass="bg-blue-500"
                 />
              </div>
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="مجموع ساعات"
                    value={totalHoursSum}
                    icon={Clock}
                    colorClass="bg-emerald-500"
                 />
              </div>
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="نفرات فعال"
                    value={shiftWorkers.length}
                    icon={Users}
                    colorClass="bg-indigo-500"
                 />
              </div>
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="بیشترین کارکرد"
                    value={topPerformer ? (topPerformer.isTie ? `${toPersianDigits(topPerformer.count)} نفر` : topPerformer.names[0]) : '---'}
                    subtitle={topPerformer ? (topPerformer.isTie ? `مشترک (${toPersianDigits(topPerformer.value)} ساعت)` : `${toPersianDigits(topPerformer.value)} ساعت`) : ''}
                    icon={Trophy}
                    colorClass="bg-amber-500"
                 />
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
