
import React, { useMemo, useState } from 'react';
import { SHIFT_WEIGHTS, StatEntry, ShiftEntry, DashboardProps } from '../types';
import { Calendar, Moon, Filter, ChevronRight, ChevronLeft, Lock, Unlock, Sun, RefreshCw, Printer, FileText, CalendarRange, XCircle, X, Search, ChevronDown, ChevronUp, Scale, Activity, Trophy, Clock, Users, CheckCircle2, CalendarCheck, Crown, ShieldCheck, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { ShiftUserCard } from './ShiftUserCard';
import { TodayHero } from './TodayHero';
import { StatsCard } from './StatsCard';
import { getTodayPersianDateStr } from '../utils/persianDate';
import { getPersonColor } from '../utils/personnelColors';

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

// Dynamic Color Mapping per Person
const GET_PERSON_COLOR = (name: string, list?: any[]): string => {
  return getPersonColor(name, list);
};

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
        {options.map((o) => {
          const val = typeof o === 'object' ? o.value : o;
          const label = typeof o === 'object' ? o.label : o;
          return (
            <option key={val} value={val}>
              {toPersianDigits(label)}
            </option>
          );
        })}
      </select>
  </div>
);

// Custom Sector Shape for Pie Chart supporting both slice hover and legend hover
const renderSectorShape = (props: any, activeIndex: number | null) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
  const isCurrentActive = index === activeIndex;

  if (isCurrentActive) {
    return (
      <g style={{ outline: 'none' }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={5}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 13}
          fill={fill}
          fillOpacity={0.3}
          cornerRadius={8}
        />
      </g>
    );
  }

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      fillOpacity={activeIndex !== null && activeIndex !== undefined ? 0.45 : 1}
      cornerRadius={4}
    />
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  scheduleData, 
  fullSchedule,
  shiftWorkers, 
  supervisors,
  personnelList,
  monthName, 
  year,
  onPrevMonth, 
  onNextMonth,
  onUpdateShift,
  onToggleHoliday,
  onOpenReport,
  isLocked,
  onToggleLock,
  onRegenerate,
  onNavigateToToday,
  isOwner,
  onOpenOwnerLogin,
  onLogoutOwner,
  publishedRange,
  onSavePublishedRange
}) => {
  const todayPersianDate = useMemo(() => getTodayPersianDateStr(), []);
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
  } | null>(() => {
    if (publishedRange && publishedRange.isActive) {
      return { from: publishedRange.from, to: publishedRange.to };
    }
    return null;
  });

  // Keep state synchronized with publishedRange
  React.useEffect(() => {
    if (publishedRange && publishedRange.isActive) {
      setAppliedFilter({ from: publishedRange.from, to: publishedRange.to });
      setFromDate(publishedRange.from);
      setToDate(publishedRange.to);
      setViewMode('RANGE');
    } else {
      // If not owner, always follow publishedRange (or default month if none)
      if (!isOwner) {
        setAppliedFilter(null);
        setViewMode('MONTH');
      }
    }
  }, [publishedRange, isOwner]);

  // Sync date picker defaults whenever month/scheduleData changes (if no range active)
  React.useEffect(() => {
     if (scheduleData.length > 0 && !publishedRange?.isActive && !appliedFilter) {
         const first = scheduleData[0].date.split('/');
         const last = scheduleData[scheduleData.length - 1].date.split('/');
         
         const defFrom = { year: first[0], month: first[1], day: first[2] };
         const defTo = { year: last[0], month: last[1], day: last[2] };
         
         setFromDate(defFrom);
         setToDate(defTo);
     }
  }, [scheduleData, year, publishedRange, appliedFilter]); 

  const handleApplyFilter = () => {
      // Validate ordering: if from > to, swap or correct
      const startStr = `${fromDate.year}/${fromDate.month}/${fromDate.day}`;
      const endStr = `${toDate.year}/${toDate.month}/${toDate.day}`;
      if (startStr > endStr) {
          setAppliedFilter({ from: toDate, to: fromDate });
          setFromDate(toDate);
          setToDate(fromDate);
      } else {
          setAppliedFilter({ from: fromDate, to: toDate });
      }
      setViewMode('RANGE');
      setIsFiltersOpen(false);
  };

  const handlePublishRangeForEveryone = () => {
      const startStr = `${fromDate.year}/${fromDate.month}/${fromDate.day}`;
      const endStr = `${toDate.year}/${toDate.month}/${toDate.day}`;
      let finalFrom = fromDate;
      let finalTo = toDate;
      if (startStr > endStr) {
          finalFrom = toDate;
          finalTo = fromDate;
          setFromDate(toDate);
          setToDate(fromDate);
      }
      const range = { isActive: true, from: finalFrom, to: finalTo };
      setAppliedFilter(range);
      setViewMode('RANGE');
      onSavePublishedRange(range);
      setIsFiltersOpen(false);
  };

  const handleClearPublishedRange = () => {
      onSavePublishedRange(null);
      setAppliedFilter(null);
      setViewMode('MONTH');
      if (scheduleData.length > 0) {
          const first = scheduleData[0].date.split('/');
          const last = scheduleData[scheduleData.length - 1].date.split('/');
          setFromDate({ year: first[0], month: first[1], day: first[2] });
          setToDate({ year: last[0], month: last[1], day: last[2] });
      }
  };

  const handleClearFilter = () => {
      // If there is an active published range and owner clears local filter, revert to published or full month
      if (publishedRange?.isActive) {
        setAppliedFilter({ from: publishedRange.from, to: publishedRange.to });
        setFromDate(publishedRange.from);
        setToDate(publishedRange.to);
        setViewMode('RANGE');
      } else {
        setAppliedFilter(null);
        setViewMode('MONTH');
        if (scheduleData.length > 0) {
            const first = scheduleData[0].date.split('/');
            const last = scheduleData[scheduleData.length - 1].date.split('/');
            setFromDate({ year: first[0], month: first[1], day: first[2] });
            setToDate({ year: last[0], month: last[1], day: last[2] });
        }
      }
  };

  // Quick Range Presets
  const applyQuickRange = (type: 'firstHalf' | 'secondHalf' | 'next7Days' | 'fullMonth') => {
      if (scheduleData.length === 0) return;
      const first = scheduleData[0].date.split('/');
      const last = scheduleData[scheduleData.length - 1].date.split('/');
      const currentYear = first[0];
      const currentMonth = first[1];

      if (type === 'firstHalf') {
          const from = { year: currentYear, month: currentMonth, day: '01' };
          const to = { year: currentYear, month: currentMonth, day: '15' };
          setFromDate(from);
          setToDate(to);
          setAppliedFilter({ from, to });
          setViewMode('RANGE');
      } else if (type === 'secondHalf') {
          const from = { year: currentYear, month: currentMonth, day: '16' };
          const to = { year: last[0], month: last[1], day: last[2] };
          setFromDate(from);
          setToDate(to);
          setAppliedFilter({ from, to });
          setViewMode('RANGE');
      } else if (type === 'next7Days') {
          const todayParts = todayPersianDate.split('/');
          const from = { year: todayParts[0], month: todayParts[1], day: todayParts[2] };
          // Find 7 days from today in fullSchedule
          const todayIdx = fullSchedule.findIndex(s => s.date === todayPersianDate);
          let targetEntry = todayIdx >= 0 && todayIdx + 6 < fullSchedule.length 
              ? fullSchedule[todayIdx + 6] 
              : fullSchedule[Math.min(todayIdx >= 0 ? todayIdx + 6 : fullSchedule.length - 1, fullSchedule.length - 1)];
          
          const toParts = (targetEntry ? targetEntry.date : todayPersianDate).split('/');
          const to = { year: toParts[0], month: toParts[1], day: toParts[2] };
          setFromDate(from);
          setToDate(to);
          setAppliedFilter({ from, to });
          setViewMode('RANGE');
      } else if (type === 'fullMonth') {
          handleClearFilter();
      }
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
    const dataToAnalyze = filteredSchedule;
    
    const result: StatEntry[] = shiftWorkers.map(worker => {
      let dayShifts = 0;
      let nightShifts = 0;
      let workedHours = 0;

      dataToAnalyze.forEach(entry => {
        if (entry.dayShiftPerson === worker) {
          dayShifts++;
          workedHours += 11; 
        }
        if (entry.nightShiftPerson === worker) {
          nightShifts++;
          workedHours += 13; 
        }
      });

      const weightedScore = (dayShifts * 11) + (nightShifts * 13 * 1.5);
      const totalHours = (dayShifts * 11) + (nightShifts * 13);

      return {
        name: worker,
        dayShifts,
        nightShifts,
        totalHours,
        weightedScore,
        offHours: 0, 
        workedHours
      };
    });
    
    return result;
  }, [filteredSchedule, shiftWorkers]);

  // Derived Stats for Cards
  const totalShifts = filteredSchedule.length * 2; 
  const totalHoursSum = stats.reduce((acc, curr) => acc + curr.totalHours, 0);
  
  // Top Performer Logic
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
  // Sync chartData with legend order strictly by sorting logic
  const chartData = useMemo(() => {
    return stats
      .filter(s => s.totalHours > 0)
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [stats]);

  // Active person for center chart display
  const activePerson = useMemo(() => {
    if (chartData.length === 0) return null;
    if (activeIndex !== null && chartData[activeIndex]) {
      return chartData[activeIndex];
    }
    return chartData[0];
  }, [chartData, activeIndex]);

  const renderCustomSector = (props: any) => {
    return renderSectorShape(props, activeIndex);
  };

  // Sync Legend Clicks with Chart Active Index
  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const handlePrint = () => {
    document.body.classList.remove('print-mode-modal');
    document.body.classList.add('print-mode-dashboard');
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
      
      {/* Today Hero (Live Status) */}
      <TodayHero schedule={fullSchedule} onNavigateToToday={onNavigateToToday} />

      {/* Header & Controls */}
      <div className="flex flex-col gap-4 no-print">
         
         {/* Top Bar: Title & Month Nav */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shadow-xs">
                  <CalendarRange size={24} />
               </div>
               <div>
                  <div className="flex items-center gap-2 flex-wrap">
                     <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight">
                        {viewMode === 'RANGE' && appliedFilter 
                           ? `نمایش بازه ${toPersianDigits(appliedFilter.from.year)}/${toPersianDigits(appliedFilter.from.month)}/${toPersianDigits(appliedFilter.from.day)} تا ${toPersianDigits(appliedFilter.to.year)}/${toPersianDigits(appliedFilter.to.month)}/${toPersianDigits(appliedFilter.to.day)}`
                           : `برنامه شیفت ${monthName} ${toPersianDigits(year)}`
                        }
                     </h2>
                     {viewMode === 'RANGE' && (
                        <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                           بازه محدود شده
                        </span>
                     )}
                     {filterPerson !== 'All' && (
                        <span className="bg-emerald-100 text-emerald-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                           فیلتر: {filterPerson.replace('مهندس', '')}
                        </span>
                     )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                     {toPersianDigits(filteredSchedule.length)} روز شیفت نمایش داده شده
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-center flex-wrap">
               {onNavigateToToday && (
                  <button 
                    onClick={onNavigateToToday}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="مشاهده ماه جاری و شیفت‌های امروز"
                  >
                    <CalendarCheck size={16} className="text-emerald-600" />
                    <span>امروز ({toPersianDigits(todayPersianDate)})</span>
                  </button>
               )}
               <div className="flex items-center gap-2 justify-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <button onClick={onPrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition disabled:opacity-50" title="ماه قبل">
                     <ChevronRight size={20} />
                  </button>
                  <span className="font-bold text-slate-800 text-sm min-w-[100px] text-center">{monthName} {toPersianDigits(year)}</span>
                  <button onClick={onNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition disabled:opacity-50" title="ماه بعد">
                     <ChevronLeft size={20} />
                  </button>
               </div>
            </div>
         </div>

         {/* Toolbar: Actions & Filters */}
         <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {/* 1. Update (Regenerate) - Owner Only */}
            {isOwner && (
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-600 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                title="چیدمان مجدد هوشمند"
              >
                 <RefreshCw size={16} />
                 <span className="hidden md:inline">آپدیت</span>
              </button>
            )}

            {/* 2. Lock - Owner Only */}
            {isOwner && (
              <button 
                onClick={onToggleLock}
                className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap ${isLocked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600'}`}
                title={isLocked ? 'قفل شده' : 'باز (قابل ویرایش)'}
              >
                 {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                 <span className="hidden md:inline">{isLocked ? 'قفل' : 'باز'}</span>
              </button>
            )}

            {/* 3. Range & Filter Toggle Button - OWNER ONLY */}
            {isOwner && (
              <button 
                 onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border whitespace-nowrap cursor-pointer ${
                    publishedRange?.isActive 
                       ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-200' 
                       : appliedFilter 
                          ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-200' 
                          : isFiltersOpen 
                             ? 'bg-amber-50 border-amber-200 text-amber-800' 
                             : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                 }`}
                 title="محدودسازی روزها و تعیین بازه برای نمایش به سایر کاربران"
              >
                 <Crown size={15} className={publishedRange?.isActive || appliedFilter ? 'text-white' : 'text-amber-600'} />
                 <span>محدودسازی روزها و بازه</span>
                 {publishedRange?.isActive ? (
                    <span className="bg-black/20 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                       منتشر شده برای همه
                    </span>
                 ) : appliedFilter ? (
                    <span className="bg-white/25 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                       پیش‌نمایش
                    </span>
                 ) : null}
                 {isFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {/* 4. Personal Report */}
            <button 
              onClick={onOpenReport}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
              title="گزارش فردی"
            >
               <FileText size={16} />
               <span className="hidden md:inline">کارکرد پرسنل</span>
            </button>
            
            {/* 5. Print */}
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition shadow-sm whitespace-nowrap"
              title="چاپ برنامه"
            >
               <Printer size={16} />
               <span className="hidden md:inline">پرینت</span>
            </button>
         </div>

         {/* --- BANNERS SECTION --- */}
         
         {/* Case 1: Owner viewing with a Published Range active */}
         {isOwner && publishedRange?.isActive && !isFiltersOpen && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/95 border border-amber-300 rounded-2xl p-3.5 sm:px-4 sm:py-3 text-xs text-amber-950 shadow-xs">
               <div className="flex items-center gap-2.5 flex-wrap font-medium">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                     <Crown size={18} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="font-black text-amber-900 text-sm">بازه عمومی محدودشده توسط شما (فعال برای همه کاربران):</span>
                        <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                           نمایش قفل شده
                        </span>
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="font-extrabold text-amber-950 dir-ltr bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                           {toPersianDigits(publishedRange.from.year)}/{toPersianDigits(publishedRange.from.month)}/{toPersianDigits(publishedRange.from.day)} تا {toPersianDigits(publishedRange.to.year)}/{toPersianDigits(publishedRange.to.month)}/{toPersianDigits(publishedRange.to.day)}
                        </span>
                        <span className="text-amber-800 font-bold">({toPersianDigits(filteredSchedule.length)} روز شیفت مجاز)</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                     onClick={() => setIsFiltersOpen(true)}
                     className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                     تغییر بازه
                  </button>
                  <button 
                     onClick={handleClearPublishedRange}
                     className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                     title="لغو انتشار بازه برای کاربران و بازگشت به نمایش تقویم عادی برای همه"
                  >
                     <X size={14} />
                     <span>لغو محدودیت عمومی</span>
                  </button>
               </div>
            </div>
         )}

         {/* Case 2: Owner with a temporary local filter applied (not yet published) */}
         {isOwner && !publishedRange?.isActive && appliedFilter && !isFiltersOpen && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/90 border border-blue-200 rounded-2xl p-3.5 sm:px-4 sm:py-3 text-xs text-blue-900 shadow-xs">
               <div className="flex items-center gap-2.5 flex-wrap font-medium">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                     <Filter size={18} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900">بازه موقت (پیش‌نمایش شخصی شما):</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                           هنوز برای سایر کاربران ذخیره نشده
                        </span>
                     </div>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-extrabold text-blue-950 dir-ltr bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                           {toPersianDigits(appliedFilter.from.year)}/{toPersianDigits(appliedFilter.from.month)}/{toPersianDigits(appliedFilter.from.day)} تا {toPersianDigits(appliedFilter.to.year)}/{toPersianDigits(appliedFilter.to.month)}/{toPersianDigits(appliedFilter.to.day)}
                        </span>
                        <span className="text-slate-500 font-bold">({toPersianDigits(filteredSchedule.length)} روز)</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <button 
                     onClick={handlePublishRangeForEveryone}
                     className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                     title="انتشار این بازه برای همه کاربران تا سایرین فقط این روزها را ببینند"
                  >
                     <Crown size={14} />
                     <span>انتشار برای همه کاربران</span>
                  </button>
                  <button 
                     onClick={() => setIsFiltersOpen(true)}
                     className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline px-2 py-1 cursor-pointer"
                  >
                     تغییر بازه
                  </button>
                  <button 
                     onClick={handleClearFilter}
                     className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                     <X size={14} />
                     <span>لغو</span>
                  </button>
               </div>
            </div>
         )}

         {/* Case 3: Non-Owner viewing when a Published Range is active */}
         {!isOwner && publishedRange?.isActive && (
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl p-3.5 sm:px-4 sm:py-3 text-xs text-blue-950 shadow-xs">
               <div className="flex items-center gap-2.5 flex-wrap font-medium">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                     <ShieldCheck size={18} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-900 text-sm">بازه زمانی مجاز (تعیین‌شده توسط مدیریت):</span>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                           بازه تایید شده
                        </span>
                     </div>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-black text-blue-950 dir-ltr bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                           {toPersianDigits(publishedRange.from.year)}/{toPersianDigits(publishedRange.from.month)}/{toPersianDigits(publishedRange.from.day)} تا {toPersianDigits(publishedRange.to.year)}/{toPersianDigits(publishedRange.to.month)}/{toPersianDigits(publishedRange.to.day)}
                        </span>
                        <span className="text-slate-600 font-bold">({toPersianDigits(filteredSchedule.length)} روز شیفت)</span>
                     </div>
                  </div>
               </div>
               <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                  تنها روزهای مجاز مشخص‌شده توسط مدیریت نمایش داده می‌شود.
               </div>
            </div>
         )}

         {/* Advanced Filters Panel - STRICTLY OWNER ONLY */}
         {isOwner && isFiltersOpen && (
            <div className="bg-white border border-amber-200/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-5 animate-in slide-in-from-top-2 ring-1 ring-amber-100">
               
               {/* Header of Filter Panel */}
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                     <Crown size={18} className="text-amber-500" />
                     <span className="font-extrabold text-slate-900 text-sm">مدیریت و محدودسازی بازه نمایش روزها (مخصوص مدیر پنل)</span>
                  </div>
                  <button 
                     onClick={() => setIsFiltersOpen(false)}
                     className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                     <X size={18} />
                  </button>
               </div>

               {/* Explanatory Tip */}
               <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 leading-5">
                  <p className="font-bold">
                     💡 برای اینکه دیگر کاربران و پرسنل صرفاً بازه مدنظر شما را ببینند و نتوانند آن را تغییر دهند:
                  </p>
                  <p className="text-amber-800 mt-0.5">
                     بازه روزها را انتخاب کرده و دکمه <strong>«انتشار و قفل برای همه کاربران»</strong> را بزنید. بقیه کاربران بدون امکان تغییر، تنها همین بازه انتخابی شما را مشاهده خواهند کرد.
                  </p>
               </div>

               {/* Quick Presets for Days Limitation */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-600 block">انتخاب سریع بازه روزها:</span>
                     {(appliedFilter || publishedRange?.isActive) && (
                        <button 
                           onClick={handleClearFilter}
                           className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition cursor-pointer"
                        >
                           <X size={12} />
                           حذف محدودیت
                        </button>
                     )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <button 
                        type="button"
                        onClick={() => applyQuickRange('firstHalf')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition cursor-pointer"
                     >
                        ۱ تا ۱۵ ماه (نیمه اول)
                     </button>
                     <button 
                        type="button"
                        onClick={() => applyQuickRange('secondHalf')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition cursor-pointer"
                     >
                        ۱۶ تا پایان ماه (نیمه دوم)
                     </button>
                     <button 
                        type="button"
                        onClick={() => applyQuickRange('next7Days')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 transition cursor-pointer"
                     >
                        ۷ روز از امروز به بعد
                     </button>
                     <button 
                        type="button"
                        onClick={() => applyQuickRange('fullMonth')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                           !appliedFilter && !publishedRange?.isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                     >
                        کل ماه
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                  {/* Date Range Selector */}
                  <div>
                      <label className="text-xs font-bold text-slate-600 block mb-2">محدود کردن دقیق روزها (از تاریخ ... تا تاریخ ...):</label>
                      
                      <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                              {/* From Group */}
                              <div className="flex items-center gap-1 w-full sm:w-auto justify-start">
                                  <span className="text-xs font-bold text-slate-500 min-w-[22px]">از:</span>
                                  <DashboardDateSelect value={fromDate.day} onChange={(v) => setFromDate({...fromDate, day: v})} options={PERSIAN_DAYS} width="w-[50px]" />
                                  <DashboardDateSelect value={fromDate.month} onChange={(v) => setFromDate({...fromDate, month: v})} options={PERSIAN_MONTHS} width="w-[82px]" />
                                  <DashboardDateSelect value={fromDate.year} onChange={(v) => setFromDate({...fromDate, year: v})} options={['1403', '1404', '1405']} width="w-[62px]" />
                              </div>
                              
                              {/* To Group */}
                              <div className="flex items-center gap-1 w-full sm:w-auto justify-start">
                                  <span className="text-xs font-bold text-slate-500 min-w-[22px]">تا:</span>
                                  <DashboardDateSelect value={toDate.day} onChange={(v) => setToDate({...toDate, day: v})} options={PERSIAN_DAYS} width="w-[50px]" />
                                  <DashboardDateSelect value={toDate.month} onChange={(v) => setToDate({...toDate, month: v})} options={PERSIAN_MONTHS} width="w-[82px]" />
                                  <DashboardDateSelect value={toDate.year} onChange={(v) => setToDate({...toDate, year: v})} options={['1403', '1404', '1405']} width="w-[62px]" />
                              </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80">
                                <span className="text-[11px] text-slate-500 block">
                                   بازه انتخابی: <strong className="text-slate-800 dir-ltr">{toPersianDigits(fromDate.year)}/{toPersianDigits(fromDate.month)}/{toPersianDigits(fromDate.day)}</strong> تا <strong className="text-slate-800 dir-ltr">{toPersianDigits(toDate.year)}/{toPersianDigits(toDate.month)}/{toPersianDigits(toDate.day)}</strong>
                                </span>
                          </div>
                      </div>
                  </div>

                  {/* Person Filter */}
                  <div>
                     <label className="text-xs font-bold text-slate-600 mb-2 block">فیلتر پرسنل (اختیاری):</label>
                     <div className="flex flex-wrap gap-2">
                        <button 
                           onClick={() => setFilterPerson('All')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterPerson === 'All' ? 'bg-slate-800 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                           همه
                        </button>
                        {shiftWorkers.map(p => (
                           <button 
                              key={p}
                              onClick={() => setFilterPerson(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterPerson === p ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              {p.replace('مهندس', '')}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Bottom Actions for Owner */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                     {publishedRange?.isActive && (
                        <button 
                           type="button"
                           onClick={handleClearPublishedRange}
                           className="h-9 px-3 flex items-center justify-center bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition gap-1 cursor-pointer"
                           title="لغو انتشار بازه برای کاربران و بازگشت به نمایش تقویم عادی"
                        >
                           <X size={14} />
                           <span>لغو بازه عمومی (نمایش کامل برای همه)</span>
                        </button>
                     )}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                     <button 
                         type="button"
                         onClick={handleApplyFilter}
                         className="h-9 px-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition gap-1.5 cursor-pointer"
                         title="اعمال موقت فقط در نشست فعلی شما"
                     >
                         <CheckCircle2 size={15} className="text-slate-600" />
                         <span>پیش‌نمایش برای خودم</span>
                     </button>
                     <button 
                         type="button"
                         onClick={handlePublishRangeForEveryone}
                         className="h-9 px-5 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition gap-2 shadow-md hover:shadow-lg cursor-pointer"
                         title="ذخیره و محدودسازی نمایش فقط به این بازه برای تمام کاربران"
                     >
                         <Crown size={15} />
                         <span>انتشار و قفل برای همه کاربران</span>
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block print:w-full">
        
        {/* Left: Schedule Table */}
        <div className="lg:col-span-3 space-y-6 print:col-span-full print:w-full print:space-y-0">
            
            {/* --- DEDICATED EXECUTIVE PRINT VIEW --- */}
            <div className="hidden print:block w-full text-slate-900 font-sans" id="dashboard-print-view">
                
                {/* 1. Official Header Frame */}
                <div className="border-2 border-slate-800 rounded-xl p-3 bg-white mb-2 shadow-2xs">
                    <div className="grid grid-cols-3 items-center gap-2">
                        {/* Right: Organization & Department */}
                        <div className="flex flex-col items-start text-right">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs shrink-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    FMD
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 leading-tight">سامانه مدیریت شیفت تولید</h2>
                                    <p className="text-[9.5pt] font-extrabold text-slate-700 leading-tight">مرکز مدیریت و هماهنگی عملیات</p>
                                </div>
                            </div>
                            <p className="text-[8.5pt] font-bold text-slate-600">واحد تولید و پایش ۲۴/۷ سامانه‌ها</p>
                            <span className="text-[7.5pt] font-semibold text-slate-500 mt-0.5">اداره پایش نوبت‌کاری پرسنل</span>
                        </div>

                        {/* Center: Main Document Title & Period */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="inline-block bg-slate-900 text-white px-3 py-0.5 rounded-full text-[8.5pt] font-black tracking-wide mb-1">
                                جدول زمان‌بندی و برنامه شیفت کاری
                            </div>
                            <h1 className="text-xl font-black text-slate-900">
                                {viewMode === 'RANGE' && appliedFilter 
                                   ? `بازه ${toPersianDigits(appliedFilter.from.year)}/${toPersianDigits(appliedFilter.from.month)}/${toPersianDigits(appliedFilter.from.day)} تا ${toPersianDigits(appliedFilter.to.year)}/${toPersianDigits(appliedFilter.to.month)}/${toPersianDigits(appliedFilter.to.day)}`
                                   : `${monthName} ماه ${toPersianDigits(year)}`
                                }
                            </h1>
                            <div className="flex items-center gap-1.5 text-[8pt] font-bold text-slate-600 mt-0.5">
                                <span>پوشش نوبت‌کاری:</span>
                                <span>روز (۱۹ - ۰۸) | شب (۰۸ - ۱۹) | سرپرست On-Call</span>
                            </div>
                        </div>

                        {/* Left: Administrative Metadata */}
                        <div className="flex flex-col items-end text-left space-y-0.5 text-[8pt]">
                            <div className="bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-[7.5pt] font-black text-slate-800">
                                کد سند: DOC-FMD-ROSTER
                            </div>
                            <div className="text-slate-800 font-bold">
                                تاریخ چاپ: <span className="font-black">{toPersianDigits(new Date().toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' }))}</span>
                            </div>
                            <div className="text-slate-600 font-bold">
                                زمان چاپ: <span className="font-black">{toPersianDigits(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }))}</span>
                            </div>
                            <div className="text-slate-700 font-bold">
                                بازه زمانی: <span dir="ltr" className="font-black">{getPrintDateRange()}</span>
                            </div>
                            <div className="text-emerald-800 font-black text-[7.5pt]">
                                وضعیت: نسخه رسمی و مصوب
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Key Metrics & Legend Ribbon */}
                <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 mb-2 text-[8pt]">
                    {/* Summary Badges */}
                    <div className="flex items-center gap-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">کل روزهای دوره:</span>
                            <span className="font-black bg-white px-1.5 py-0.5 rounded border border-slate-300">{toPersianDigits(filteredSchedule.length)} روز</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">روزهای عادی کاری:</span>
                            <span className="font-black bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-900">{toPersianDigits(filteredSchedule.filter(s => !s.isHoliday && s.dayName !== 'جمعه').length)} روز</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">تعطیل رسمی و جمعه:</span>
                            <span className="font-black bg-white px-1.5 py-0.5 rounded border border-slate-300 text-red-600">{toPersianDigits(filteredSchedule.filter(s => s.isHoliday || s.dayName === 'جمعه').length)} روز</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">پرسنل شیفت:</span>
                            <span className="font-black bg-white px-1.5 py-0.5 rounded border border-slate-300">{toPersianDigits(shiftWorkers.length)} نفر</span>
                        </div>
                    </div>

                    {/* Shift Legend */}
                    <div className="flex items-center gap-3 text-[7.5pt] font-black text-slate-700">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600"></span>
                            <span>شیفت روز: ۰۸:۰۰ الی ۱۹:۰۰</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <span>شیفت شب: ۱۹:۰۰ الی ۰۸:۰۰</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            <span>سرپرست: ۲۴ ساعته</span>
                        </span>
                    </div>
                </div>

                {/* 3. The Beautified Print Table */}
                <table className="w-full text-center border-collapse border-2 border-slate-800 text-[8.5pt]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '19%' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-slate-800 text-white font-black">
                            <th className="border border-slate-700 py-1.5 px-1 text-center">ردیف</th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">روز</th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">تاریخ</th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">نوع روز</th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">
                                شیفت روز (۱۹ - ۰۸)
                            </th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">
                                شیفت شب (۰۸ - ۱۹)
                            </th>
                            <th className="border border-slate-700 py-1.5 px-1 text-center">
                                سرپرست (On-Call)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                        {filteredSchedule.map((entry, index) => {
                            const isFriday = entry.dayName === 'جمعه';
                            const isHoliday = entry.isHoliday;
                            const isThursday = entry.dayName === 'پنج‌شنبه';

                            let rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
                            if (isFriday || isHoliday) {
                                rowBg = 'bg-red-50/80 text-red-950 font-semibold';
                            } else if (isThursday) {
                                rowBg = 'bg-purple-50/50';
                            }

                            const isDaySwapped = entry.originalDayShiftPerson && entry.originalDayShiftPerson !== entry.dayShiftPerson;
                            const isNightSwapped = entry.originalNightShiftPerson && entry.originalNightShiftPerson !== entry.nightShiftPerson;

                            return (
                                <tr key={`print-row-${entry.id}`} className={rowBg} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                    {/* Row Number */}
                                    <td className="border border-slate-400 py-1 px-1 text-center font-bold text-slate-700">
                                        {toPersianDigits(index + 1)}
                                    </td>

                                    {/* Day Name */}
                                    <td className={`border border-slate-400 py-1 px-1 text-center font-black ${isFriday || isHoliday ? 'text-red-700' : isThursday ? 'text-purple-800' : 'text-slate-800'}`}>
                                        {entry.dayName}
                                    </td>

                                    {/* Persian Date */}
                                    <td className="border border-slate-400 py-1 px-1 text-center font-bold text-slate-800 dir-ltr">
                                        {toPersianDigits(entry.date)}
                                    </td>

                                    {/* Day Status */}
                                    <td className="border border-slate-400 py-1 px-1 text-center">
                                        {isHoliday ? (
                                            <span className="inline-block bg-red-100 text-red-700 border border-red-300 px-1 py-0.5 rounded text-[7pt] font-black">
                                                تعطیل رسمی
                                            </span>
                                        ) : isFriday ? (
                                            <span className="inline-block bg-red-100 text-red-700 border border-red-300 px-1 py-0.5 rounded text-[7pt] font-black">
                                                جمعه
                                            </span>
                                        ) : isThursday ? (
                                            <span className="inline-block bg-purple-100 text-purple-700 border border-purple-200 px-1 py-0.5 rounded text-[7pt] font-bold">
                                                پنج‌شنبه
                                            </span>
                                        ) : (
                                            <span className="text-[7.5pt] font-medium text-slate-600">
                                                عادی
                                            </span>
                                        )}
                                    </td>

                                    {/* Day Shift */}
                                    <td className="border border-slate-400 py-1 px-1.5 text-center">
                                        <div className="flex flex-col items-center justify-center leading-tight">
                                            <span className="font-black text-[9pt] text-slate-900">
                                                {entry.dayShiftPerson}
                                            </span>
                                            {isDaySwapped && (
                                                <span className="text-[6.5pt] text-amber-900 font-bold bg-amber-50 px-1 rounded border border-amber-200 mt-0.5">
                                                    (جابجایی با {entry.originalDayShiftPerson})
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Night Shift */}
                                    <td className="border border-slate-400 py-1 px-1.5 text-center">
                                        <div className="flex flex-col items-center justify-center leading-tight">
                                            <span className="font-black text-[9pt] text-slate-900">
                                                {entry.nightShiftPerson}
                                            </span>
                                            {isNightSwapped && (
                                                <span className="text-[6.5pt] text-amber-900 font-bold bg-amber-50 px-1 rounded border border-amber-200 mt-0.5">
                                                    (جابجایی با {entry.originalNightShiftPerson})
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Supervisor */}
                                    <td className="border border-slate-400 py-1 px-1.5 text-center">
                                        <span className="font-extrabold text-[8.5pt] text-slate-800">
                                            {entry.onCallPerson}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* 4. Signatures & Official Approvals Box */}
                <div className="mt-2.5 border-2 border-slate-800 rounded-xl p-2.5 bg-white" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="text-[8pt] font-black text-slate-700 mb-1.5 border-b border-slate-200 pb-1 flex items-center justify-between">
                        <span>گردش کار اداری و تأییدیه‌های سازمانی:</span>
                        <span className="text-[7pt] text-slate-500 font-normal">این سند بدون امضای سه‌گانه فاقد اعتبار اجرایی است.</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        {/* 1. Planner */}
                        <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between h-20">
                            <div>
                                <span className="text-[8pt] font-black text-slate-800 block">تنظیم‌کننده برنامه</span>
                                <span className="text-[7pt] text-slate-500">کارشناس برنامه‌ریزی شیفت</span>
                            </div>
                            <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between items-center text-[7pt] text-slate-600 px-1">
                                <span>امضا: ....................</span>
                                <span>تاریخ: ...../...../.....</span>
                            </div>
                        </div>

                        {/* 2. Shift Supervisor */}
                        <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between h-20">
                            <div>
                                <span className="text-[8pt] font-black text-slate-800 block">بررسی و هماهنگی</span>
                                <span className="text-[7pt] text-slate-500">سرپرست مرکز عملیات شیفت</span>
                            </div>
                            <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between items-center text-[7pt] text-slate-600 px-1">
                                <span>امضا: ....................</span>
                                <span>تاریخ: ...../...../.....</span>
                            </div>
                        </div>

                        {/* 3. Division Manager */}
                        <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between h-20">
                            <div>
                                <span className="text-[8pt] font-black text-slate-800 block">تأیید نهایی و ابلاغ</span>
                                <span className="text-[7pt] text-slate-500">مدیر واحد تولید و عملیات</span>
                            </div>
                            <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between items-center text-[7pt] text-slate-600 px-1">
                                <span>امضا: ....................</span>
                                <span>تاریخ: ...../...../.....</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Official Footer Legal Note */}
                <div className="mt-1.5 flex items-center justify-between text-[7pt] font-medium text-slate-500 px-1" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <p>
                        ملاحظات اداری: این سند مبنای حضور، غیاب و صدور کارکرد ماهانه پرسنل بوده و هرگونه جابجایی صرفاً با تأیید کتبی سرپرست معتبر است.
                    </p>
                    <p className="font-bold text-slate-700">
                        سامانه یکپارچه مدیریت شیفت ShiftFlow
                    </p>
                </div>
            </div>

            {/* Desktop Table (Screen Only) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden md:block print:hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-center border-collapse">
                   <colgroup className="hidden print:table-column-group">
                       <col style={{width: '8%'}} />
                       <col style={{width: '12%'}} />
                       <col style={{width: '26.6%'}} />
                       <col style={{width: '26.6%'}} />
                       <col style={{width: '26.6%'}} />
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
                       const isToday = entry.date === todayPersianDate;
                       const isFriday = entry.dayName === 'جمعه';
                       const isHoliday = entry.isHoliday;
                       const isThursday = entry.dayName === 'پنج‌شنبه';
                       
                       let rowClass = 'hover:bg-slate-50 transition-colors'; 
                       if (isToday) {
                           rowClass = 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-semibold ring-2 ring-emerald-500/50 print:bg-white print:text-black';
                       } else if (isFriday || isHoliday) {
                           rowClass = 'bg-red-50 hover:bg-red-100 text-red-900 print:bg-gray-200 print:text-black';
                       } else if (isThursday) {
                           rowClass = 'bg-[#f3e8ff] hover:bg-purple-100 text-purple-900 print:bg-white print:text-black';
                       }

                       return (
                         <tr key={entry.id} className={rowClass}>
                           <td className={`p-4 print:p-0.5 border border-slate-200 print:border-black font-bold ${isToday ? 'text-emerald-800 font-black' : isFriday || isHoliday ? 'text-red-600 print:text-black' : ''}`}>
                              <div className="flex flex-col items-center justify-center">
                                  <span>{entry.dayName}</span>
                              </div>
                           </td>
                           <td className="p-4 print:p-0.5 border border-slate-200 print:border-black text-slate-700 print:text-black font-bold">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                 <span>{toPersianDigits(entry.date)}</span>
                                 {isToday && (
                                   <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs print:hidden">
                                     امروز
                                   </span>
                                 )}
                              </div>
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
                     {filteredSchedule.length === 0 && (
                       <tr>
                         <td colSpan={5} className="p-8 text-center text-slate-500 bg-slate-50/50">
                            <div className="flex flex-col items-center justify-center gap-2">
                               <CalendarRange size={32} className="text-slate-300" />
                               <p className="font-bold text-sm text-slate-600">در بازه زمانی انتخاب شده رکوردی یافت نشد</p>
                               <button 
                                  onClick={handleClearFilter}
                                  className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                                >
                                  بازگشت به نمایش کل ماه
                               </button>
                            </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 print:hidden">
              {filteredSchedule.length === 0 && (
                 <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <CalendarRange size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-600">در بازه زمانی انتخاب شده رکوردی یافت نشد</p>
                    <button 
                       onClick={handleClearFilter}
                       className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                       بازگشت به نمایش کل ماه
                    </button>
                 </div>
              )}
              {filteredSchedule.map(entry => {
                 const isToday = entry.date === todayPersianDate;
                 const isFriday = entry.dayName === 'جمعه';
                 const isHoliday = entry.isHoliday;
                 const isThursday = entry.dayName === 'پنج‌شنبه';
                 
                 let cardBg = 'bg-white';
                 let borderColor = 'border-slate-200';
                 if (isToday) {
                     cardBg = 'bg-emerald-50/70';
                     borderColor = 'border-emerald-500 ring-1 ring-emerald-400';
                 } else if (isFriday || isHoliday) {
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
                          <span className={`font-black ${isToday ? 'text-emerald-800' : isFriday || isHoliday ? 'text-red-600' : 'text-slate-700'}`}>{entry.dayName}</span>
                          <span className="text-xs text-slate-500 font-bold">{toPersianDigits(entry.date)}</span>
                          {isToday && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                              امروز
                            </span>
                          )}
                       </div>
                       {entry.isHoliday && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">تعطیل</span>}
                    </div>
                    
                    <div className="space-y-3">
                       {/* Day Shift */}
                       <div className="flex items-start gap-2">
                          <Sun size={16} className="text-orange-400 mt-0.5" />
                          <span className="text-xs font-bold w-12 text-slate-500 mt-0.5">روز:</span>
                          <div className="flex-1 flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{entry.dayShiftPerson}</span>
                              {entry.originalDayShiftPerson && entry.originalDayShiftPerson !== entry.dayShiftPerson && (
                                  <span className="text-[10px] text-red-400 line-through decoration-red-300">
                                      {entry.originalDayShiftPerson}
                                  </span>
                              )}
                          </div>
                       </div>
                       
                       {/* Night Shift */}
                       <div className="flex items-start gap-2">
                          <Moon size={16} className="text-indigo-400 mt-0.5" />
                          <span className="text-xs font-bold w-12 text-slate-500 mt-0.5">شب:</span>
                          <div className="flex-1 flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{entry.nightShiftPerson}</span>
                              {entry.originalNightShiftPerson && entry.originalNightShiftPerson !== entry.nightShiftPerson && (
                                  <span className="text-[10px] text-red-400 line-through decoration-red-300">
                                      {entry.originalNightShiftPerson}
                                  </span>
                              )}
                          </div>
                       </div>

                       {/* Supervisor */}
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

        {/* Right: Stats & Charts */}
        <div className="space-y-6 print:hidden">
           
           {/* Chart Section */}
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-lg">نمودار توزیع کاری</h3>
                  <Scale size={16} className="text-slate-400" />
               </div>
               <div className="flex flex-col items-center w-full">
                  {/* Donut Chart Container with Center Info */}
                  <div className="h-64 sm:h-72 w-full relative flex items-center justify-center">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={chartData as any}
                           cx="50%"
                           cy="50%"
                           innerRadius="62%"
                           outerRadius="84%"
                           paddingAngle={3}
                           dataKey="totalHours"
                           nameKey="name"
                           shape={renderCustomSector}
                           onClick={onPieClick}
                           onMouseEnter={onPieClick}
                         >
                           {chartData.map((entry, index) => (
                             <Cell 
                                 key={`cell-${index}`} 
                                 fill={GET_PERSON_COLOR(entry.name, personnelList)} 
                                 style={{ outline: "none" }}
                             />
                           ))}
                         </Pie>
                       </PieChart>
                     </ResponsiveContainer>

                     {/* Center Display: Always centered in the donut, shows the hovered person's name and hours */}
                     {activePerson && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-150">
                         <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-tight">
                           {activePerson.name.replace("مهندس", "").trim()}
                         </span>
                         <span className="text-xs sm:text-sm font-extrabold text-slate-600 mt-1" dir="rtl">
                           {toPersianDigits(activePerson.totalHours)} ساعت
                         </span>
                       </div>
                     )}
                  </div>

                  {/* Personnel Name Pills (Legend) */}
                  <ul className="flex flex-wrap justify-center gap-2 mt-2 px-1">
                     {chartData.map((entry, index) => {
                         const isActive = index === activeIndex;
                         const color = GET_PERSON_COLOR(entry.name, personnelList);
                         
                         return (
                            <li 
                                key={`legend-item-${index}`} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 border-2 select-none ${
                                  isActive 
                                    ? "bg-white shadow-md scale-105 ring-2 ring-offset-1 ring-slate-200" 
                                    : "bg-transparent border-transparent opacity-65 hover:opacity-100 hover:bg-slate-50"
                                }`}
                                style={{
                                    borderColor: isActive ? color : "transparent"
                                }}
                                onClick={() => setActiveIndex(index)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${isActive ? "scale-125" : ""}`} style={{ backgroundColor: color }}></span>
                                <span 
                                    className={`text-xs transition-colors duration-200 ${isActive ? "font-black" : "font-medium text-slate-700"}`}
                                    style={{ color: isActive ? color : undefined }}
                                >
                                  {entry.name.replace("مهندس", "").trim()}
                                </span>
                            </li>
                         );
                     })}
                  </ul>
               </div>
           </div>

           {/* Stats Grid (2x2 Mosaic) */}
           <div className="grid grid-cols-2 gap-3 h-auto">
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="تعداد کل شیفت"
                    value={toPersianDigits(totalShifts)}
                    icon={Activity}
                    colorClass="bg-blue-500"
                 />
              </div>
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="مجموع ساعات"
                    value={toPersianDigits(totalHoursSum)}
                    icon={Clock}
                    colorClass="bg-emerald-500"
                 />
              </div>
              <div className="aspect-square">
                 <StatsCard 
                    type="square"
                    title="نفرات فعال"
                    value={toPersianDigits(shiftWorkers.length)}
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
