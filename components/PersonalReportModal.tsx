
import React, { useMemo, useState } from 'react';
import { ShiftEntry, PersonName } from '../types';
import { X, Printer, Clock, AlertCircle, CalendarRange, FileDown, Filter, ChevronDown } from 'lucide-react';

interface PersonalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ShiftEntry[]; // Displayed month (default view)
  fullSchedule: ShiftEntry[]; // Full history for lookback and filtering
  staffList: PersonName[];
  monthName: string;
}

type FilterType = 'VIEW' | 'ALL' | 'CUSTOM';

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

// High contrast compact date select
const CompactDateSelect = ({ value, onChange, options, label, width = 'w-20' }: { value: string, onChange: (val: string) => void, options: any[], label: string, width?: string }) => (
    <div className="flex flex-col">
        {label && <label className="text-[10px] text-black font-black mb-1 text-center">{label}</label>}
        <div className={`relative h-8 ${width}`}>
            <select 
                className="w-full h-full appearance-none bg-white border border-slate-400 rounded-md py-0 px-2 text-xs font-bold text-black focus:ring-1 focus:ring-black outline-none cursor-pointer text-center"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ textAlign: 'center', textAlignLast: 'center' }}
            >
                {options.map(o => <option key={o.value || o} value={o.value || o} className="text-black bg-white">{o.label || o}</option>)}
            </select>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <ChevronDown size={10} strokeWidth={2} />
            </div>
        </div>
    </div>
);


export const PersonalReportModal: React.FC<PersonalReportModalProps> = ({
  isOpen, onClose, schedule, fullSchedule, staffList, monthName
}) => {
  const [selectedUser, setSelectedUser] = useState<PersonName>(staffList[0]);
  
  // Filter States
  const [filterType, setFilterType] = useState<FilterType>('VIEW');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Extract unique sorted years for the dropdowns
  const availableYears = useMemo(() => {
    const years = new Set(fullSchedule.map(s => s.date.split('/')[0]));
    const sorted = Array.from(years).sort();
    if (sorted.length === 0) return ['1404'];
    return sorted;
  }, [fullSchedule]);

  // Helper functions for date parts
  const getDateParts = (dateStr: string) => {
    if (!dateStr) return { y: '', m: '', d: '' };
    const parts = dateStr.split('/');
    return { y: parts[0] || '', m: parts[1] || '', d: parts[2] || '' };
  };

  const updateDatePart = (isStart: boolean, field: 'y'|'m'|'d', val: string) => {
      const current = isStart ? customStart : customEnd;
      const parts = getDateParts(current);
      
      // Defaults if starting fresh
      const defaultYear = availableYears[0];
      
      const newParts = {
          y: parts.y || defaultYear,
          m: parts.m || '01',
          d: parts.d || '01',
          [field]: val
      };
      
      const newDateStr = `${newParts.y}/${newParts.m}/${newParts.d}`;
      if (isStart) setCustomStart(newDateStr);
      else setCustomEnd(newDateStr);
  };

  // 1. Determine the list of shifts to analyze based on FilterType
  const targetSchedule = useMemo(() => {
    switch (filterType) {
        case 'ALL':
            // Return full history sorted by date
            return [...fullSchedule].sort((a, b) => a.date.localeCompare(b.date));
        
        case 'CUSTOM':
            if (!customStart && !customEnd) return schedule;
            return fullSchedule.filter(s => {
                if (customStart && s.date < customStart) return false;
                if (customEnd && s.date > customEnd) return false;
                return true;
            }).sort((a, b) => a.date.localeCompare(b.date));

        case 'VIEW':
        default:
            // Default to the month passed from dashboard
            return schedule;
    }
  }, [filterType, customStart, customEnd, schedule, fullSchedule]);

  // 2. Detailed Breakdown Calculation
  const detailedStats = useMemo(() => {
    const stats = {
      normalHours: 0,       // Sat-Wed (Non-Holiday)
      holidayThursdayHours: 0, // Thursday OR Holiday (Non-Friday)
      fridayHours: 0,       // Friday Only
      nightHours: 0,        // Total Night Hours (13h blocks)
      totalSum: 0
    };

    const history = targetSchedule.map(entry => {
      // Initialize Row Data
      let shiftType = 'OFF';
      let hours = 0;
      let description = '';
      let timeRange = 'OFF'; 
      let statusClass = ''; 
      let badgeColor = '';

      // --- CONTEXT GATHERING ---
      const isFriday = entry.dayName === 'جمعه';
      const isThursday = entry.dayName === 'پنج‌شنبه';
      // Q1: Is Today Holiday? (Thursday, Friday OR Official Holiday)
      const isHolidayDay = isThursday || isFriday || entry.isHoliday;

      // Assignments
      const isDayShift = entry.dayShiftPerson === selectedUser;
      const isNightShift = entry.nightShiftPerson === selectedUser;

      // Lookback Context
      const fullIndex = fullSchedule.findIndex(s => s.id === entry.id);
      
      let prevEntry: ShiftEntry | undefined;
      let twoDaysAgoEntry: ShiftEntry | undefined;

      if (fullIndex !== -1) {
          prevEntry = fullSchedule[fullIndex - 1];
          twoDaysAgoEntry = fullSchedule[fullIndex - 2];
      } else {
          // Fallback logic
          const dateIdx = fullSchedule.findIndex(s => s.date === entry.date);
          if (dateIdx !== -1) {
              prevEntry = fullSchedule[dateIdx - 1];
              twoDaysAgoEntry = fullSchedule[dateIdx - 2];
          }
      }

      const wasNightYesterday = prevEntry?.nightShiftPerson === selectedUser;
      const wasNightTwoDaysAgo = twoDaysAgoEntry?.nightShiftPerson === selectedUser;

      // --- LOGIC TREE ---

      // 1. QUESTION ONE: Is Today Holiday?
      if (isHolidayDay) {
        if (isDayShift) {
           shiftType = 'Day';
           timeRange = '۰۸:۰۰ - ۱۹:۰۰';
           hours = 11;
           description = isFriday ? 'جمعه کاری' : (isThursday ? 'شیفت پنج‌شنبه' : 'تعطیل کاری');
           badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
           
           if (isFriday) stats.fridayHours += 11;
           else stats.holidayThursdayHours += 11;
        } 
        else if (isNightShift) {
           shiftType = 'Night';
           timeRange = '۱۹:۰۰ - ۰۸:۰۰';
           hours = 13;
           description = 'شیفت شب تعطیل';
           badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
           
           stats.nightHours += 13;
        } 
        else {
           // Holiday OFF
           if (wasNightYesterday) {
               shiftType = 'Rest';
               timeRange = 'خروج ۰۸:۰۰';
               description = 'استراحت (خروج از شب)';
               statusClass = 'text-slate-400 italic';
               badgeColor = 'bg-slate-100 text-slate-500';
           } else {
               shiftType = 'OFF';
               timeRange = 'OFF';
               description = isFriday ? 'جمعه' : 'تعطیل';
               statusClass = 'text-slate-300';
               badgeColor = 'bg-slate-50 text-slate-400 border-slate-100';
           }
        }
      } 
      else {
        // NORMAL DAY (Sat-Wed)
        
        // 2. QUESTION TWO: Night Shift Cycle Check
        
        // State A: Tonight is Night Shift?
        if (isNightShift) {
             shiftType = 'Night';
             timeRange = '۱۹:۰۰ - ۰۸:۰۰';
             hours = 13;
             description = 'شیفت شب (شروع ۱۹)';
             badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
             
             stats.nightHours += 13;
        }
        // State B: Last Night was Night Shift?
        else if (wasNightYesterday) {
             shiftType = 'Rest';
             timeRange = 'خروج ۰۸:۰۰';
             description = 'استراحت (پایان شب‌کاری)';
             statusClass = 'bg-slate-50 text-slate-500 italic';
             badgeColor = 'bg-slate-100 text-slate-500';
        }
        // State C: 2 Days Ago was Night Shift? (The 48h Rule)
        else if (wasNightTwoDaysAgo) {
             shiftType = 'NormalLong';
             timeRange = '۰۸:۰۰ - ۱۹:۰۰'; 
             hours = 11;
             description = 'قانون ۴۸ ساعت (تا ۱۹)';
             statusClass = 'text-emerald-700 font-bold';
             badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
             
             stats.normalHours += 11;
        }
        // 3. QUESTION THREE: Default Normal Day (Work 08-17)
        else {
             shiftType = 'Normal';
             timeRange = '۰۸:۰۰ - ۱۷:۰۰'; 
             hours = 9;
             description = 'کار عادی';
             statusClass = 'text-slate-700';
             badgeColor = 'bg-white border-slate-200 text-slate-600';
             
             stats.normalHours += 9;
        }
      }

      return { ...entry, shiftType, hours, description, timeRange, statusClass, badgeColor };
    });

    stats.totalSum = stats.normalHours + stats.holidayThursdayHours + stats.fridayHours + stats.nightHours;
    return { stats, history };
  }, [targetSchedule, fullSchedule, selectedUser]);

  const handlePrint = () => {
    const originalTitle = document.title;
    let fileName = `Report-${selectedUser.replace(/\s+/g, '_')}`;

    if (filterType === 'VIEW') {
            fileName += `-${monthName.replace(/\s+/g, '_')}`;
    } else if (filterType === 'ALL') {
            fileName += '-All_Records';
    } else if (filterType === 'CUSTOM') {
            const start = customStart ? customStart.replace(/\//g, '-') : 'Start';
            const end = customEnd ? customEnd.replace(/\//g, '-') : 'End';
            fileName += `-${start}_to_${end}`;
    }

    document.title = fileName;
    document.body.classList.add('print-mode-modal');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-mode-modal');
        document.title = originalTitle;
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      
      {/* Overlay to close on click outside */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal Container - Max height 80vh to ensure it fits */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden print:max-h-none print:max-w-none print:shadow-none">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-3 md:p-4 border-b border-slate-200 flex flex-col gap-3 print:hidden bg-slate-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileDown size={20} className="text-emerald-600"/>
                    گزارش کارکرد
                </h3>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select 
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="flex-1 sm:flex-none bg-white text-black border border-slate-300 rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    >
                        {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition font-bold shadow text-xs"
                    >
                        <Printer size={16} />
                        <span className="hidden sm:inline">چاپ</span>
                    </button>
                    
                    <button onClick={onClose} className="bg-white border border-slate-200 text-slate-400 hover:text-red-500 p-2 rounded-lg transition">
                         <X size={18} />
                    </button>
                </div>
            </div>

            {/* Compact Filters */}
            <div className="flex flex-col lg:flex-row items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-1 font-bold whitespace-nowrap text-slate-500">
                    <Filter size={14} />
                    بازه:
                </div>
                
                <div className="flex gap-1 w-full sm:w-auto justify-center">
                    <button onClick={() => setFilterType('VIEW')} className={`px-2 py-1 rounded transition font-bold border ${filterType === 'VIEW' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>ماه جاری</button>
                    <button onClick={() => setFilterType('ALL')} className={`px-2 py-1 rounded transition font-bold border ${filterType === 'ALL' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>کل</button>
                    <button onClick={() => setFilterType('CUSTOM')} className={`px-2 py-1 rounded transition font-bold border ${filterType === 'CUSTOM' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>دستی</button>
                </div>

                {filterType === 'CUSTOM' && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 lg:pt-0 lg:border-r lg:pr-2 lg:mr-2 border-slate-100 border-t lg:border-t-0 w-full lg:w-auto">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">از:</span>
                            <CompactDateSelect width="w-12" label="" value={getDateParts(customStart).d || ''} onChange={(v) => updateDatePart(true, 'd', v)} options={PERSIAN_DAYS} />
                            <CompactDateSelect width="w-16" label="" value={getDateParts(customStart).m || ''} onChange={(v) => updateDatePart(true, 'm', v)} options={PERSIAN_MONTHS} />
                            <CompactDateSelect width="w-14" label="" value={getDateParts(customStart).y || ''} onChange={(v) => updateDatePart(true, 'y', v)} options={availableYears} />
                        </div>
                        <span className="text-slate-300">-</span>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">تا:</span>
                            <CompactDateSelect width="w-12" label="" value={getDateParts(customEnd).d || ''} onChange={(v) => updateDatePart(false, 'd', v)} options={PERSIAN_DAYS} />
                            <CompactDateSelect width="w-16" label="" value={getDateParts(customEnd).m || ''} onChange={(v) => updateDatePart(false, 'm', v)} options={PERSIAN_MONTHS} />
                            <CompactDateSelect width="w-14" label="" value={getDateParts(customEnd).y || ''} onChange={(v) => updateDatePart(false, 'y', v)} options={availableYears} />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:flex justify-between items-end border-b-2 border-black pb-4 mb-6 pt-4 px-8">
             <div>
                 <h1 className="text-2xl font-black text-black">گزارش کارکرد پرسنل</h1>
                 <div className="mt-2 flex items-center gap-2">
                    <span>نام پرسنل:</span>
                    <span className="font-bold bg-black text-white px-3 py-0.5 rounded-md print:bg-gray-200 print:text-black">{selectedUser}</span>
                 </div>
             </div>
             <div className="text-left">
                 <div className="text-sm font-bold border border-black px-3 py-1 rounded mb-2">
                    {filterType === 'VIEW' ? `بازه: ${monthName}` : 
                     filterType === 'ALL' ? 'بازه: کل سابقه' : 
                     `بازه: ${customStart || '...'} تا ${customEnd || '...'}`}
                 </div>
                 <p className="text-xs text-black font-medium">تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</p>
             </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 print:p-0 print:overflow-visible bg-white">
          
          {/* Guide */}
          <div className="mb-6 bg-blue-50 border-r-4 border-blue-500 p-3 text-xs text-blue-900 flex items-start gap-2 print:hidden rounded">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
              <div className="leading-5">
                  <span className="font-bold block mb-1">محاسبه ساعت کاری:</span>
                  تعطیل/پنج‌شنبه (روز ۱۱، شب ۱۳) | عادی (۹ ساعت) | قانون ۴۸ساعت (تا ۱۹:۰۰ = ۱۱ ساعت)
              </div>
          </div>

          {/* Summary Table */}
          <div className="mb-6 overflow-x-auto border border-slate-200 rounded-lg print:border-black print:overflow-visible">
             <table className="w-full text-center text-xs min-w-[500px]">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 print:border-black print:text-black">
                   <tr>
                      <th className="p-2 border-l border-slate-200 print:border-black">عادی</th>
                      <th className="p-2 border-l border-slate-200 print:border-black">تعطیل/۵شنبه</th>
                      <th className="p-2 border-l border-slate-200 print:border-black">جمعه</th>
                      <th className="p-2 border-l border-slate-200 print:border-black">شب</th>
                      <th className="p-2 bg-slate-100 print:bg-gray-200 font-black">مجموع</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="divide-x divide-x-reverse divide-slate-200 print:divide-black text-sm">
                      <td className="p-3 font-bold">{detailedStats.stats.normalHours}</td>
                      <td className="p-3 text-amber-700 font-bold print:text-black">{detailedStats.stats.holidayThursdayHours}</td>
                      <td className="p-3 text-red-600 font-bold print:text-black">{detailedStats.stats.fridayHours}</td>
                      <td className="p-3 text-indigo-700 font-bold print:text-black">{detailedStats.stats.nightHours}</td>
                      <td className="p-3 font-black bg-slate-50 print:bg-gray-100">{detailedStats.stats.totalSum}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Detailed Table */}
          <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2 print:text-black">
              <Clock size={16} className="text-emerald-600 print:hidden" />
              ریز کارکرد
              <span className="text-xs font-normal text-slate-500 print:text-gray-600">({detailedStats.history.length} مورد)</span>
          </h4>
          
          <div className="overflow-x-auto border border-slate-200 rounded-lg print:border-black print:overflow-visible">
            <table className="w-full text-xs text-right border-collapse min-w-[600px]">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 print:bg-gray-200 print:border-black">
                    <th className="p-2 font-bold text-slate-700 border-l print:border-black print:text-black text-center w-24">تاریخ</th>
                    <th className="p-2 font-bold text-slate-700 border-l print:border-black print:text-black text-center w-16">روز</th>
                    <th className="p-2 font-bold text-slate-700 border-l print:border-black print:text-black text-center w-24">شیفت</th>
                    <th className="p-2 font-bold text-slate-700 border-l print:border-black print:text-black text-center w-24">حضور</th>
                    <th className="p-2 font-bold text-slate-700 border-l print:border-black print:text-black">توضیحات</th>
                    <th className="p-2 font-bold text-slate-700 w-12 text-center print:text-black">ساعت</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-black">
                {detailedStats.history.length > 0 ? (
                    detailedStats.history.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-50 print:hover:bg-transparent break-inside-avoid ${row.shiftType === 'OFF' ? 'print:hidden' : ''}`}>
                            <td className="p-2 text-slate-800 font-bold border-l print:border-black text-center" dir="ltr">{row.date}</td>
                            <td className={`p-2 font-bold border-l print:border-black text-center ${row.isHoliday || row.dayName === 'جمعه' ? 'text-red-600 print:text-black' : 'text-slate-700 print:text-black'}`}>{row.dayName}</td>
                            <td className="p-2 border-l print:border-black text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-block w-full ${row.badgeColor} print:border-0 print:p-0 print:text-black print:bg-transparent`}>
                                {row.shiftType === 'Day' ? 'روز' : 
                                    row.shiftType === 'Night' ? 'شب' : 
                                    row.shiftType === 'Normal' ? 'عادی' : 
                                    row.shiftType === 'NormalLong' ? 'عادی(۱۱)' : 
                                    row.shiftType === 'Rest' ? 'استراحت' : '-'}
                                </span>
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-700 border-l print:border-black text-center print:text-black" dir="ltr">
                                {row.timeRange}
                            </td>
                            <td className={`p-2 font-medium border-l print:border-black ${row.statusClass || 'text-slate-600'} print:text-black truncate max-w-[150px]`}>
                                {row.description}
                            </td>
                            <td className="p-2 text-slate-900 font-black text-center bg-slate-50/50 print:bg-transparent print:text-black">
                                {row.hours > 0 ? row.hours : '-'}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                            رکوردی یافت نشد.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
          </div>
          
          <div className="hidden print:block mt-6 pt-6 border-t-2 border-black break-inside-avoid px-8">
              <div className="flex justify-between text-center text-xs font-bold">
                  <div>امضاء سرپرست قسمت</div>
                  <div>امضاء امور اداری</div>
                  <div>امضاء پرسنل</div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
