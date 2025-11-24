
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { PersonalReportModal } from './components/PersonalReportModal';
import { DataManagement } from './components/DataManagement';
import { SCHEDULE_DATA } from './constants';
import { INITIAL_STAFF, generateNextMonth, getDaysInPersianMonth, validateSwap } from './utils/scheduler';
import { ShiftEntry, Personnel, AppData } from './types';
import { Settings, Plus, Trash2, Save, ArrowUp, ArrowDown, UserCog, Users, ArrowRightLeft, AlertCircle, CheckCircle2, Edit, Calendar as CalendarIcon, List, Table as TableIcon, Check, Lock, X } from 'lucide-react';

const MONTHS = [
    { name: 'آذر', code: '09' },
    { name: 'دی', code: '10' },
    { name: 'بهمن', code: '11' },
    { name: 'اسفند', code: '12' },
    { name: 'فروردین', code: '01' },
    { name: 'اردیبهشت', code: '02' },
    { name: 'خرداد', code: '03' },
    { name: 'تیر', code: '04' },
    { name: 'مرداد', code: '05' },
    { name: 'شهریور', code: '06' },
    { name: 'مهر', code: '07' },
    { name: 'آبان', code: '08' }
];

const STORAGE_KEYS = {
  SCHEDULE: 'shiftflow_schedule_v2',
  PERSONNEL: 'shiftflow_personnel_v2',
  LOCKED: 'shiftflow_locked_v2'
};

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  // --- PERSISTENCE LAYER ---
  const [schedule, setSchedule] = useState<ShiftEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      return saved ? JSON.parse(saved) : SCHEDULE_DATA;
    } catch (error) {
      console.error("Failed to load schedule from storage", error);
      return SCHEDULE_DATA;
    }
  });
  
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERSONNEL);
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch (error) {
      console.error("Failed to load personnel from storage", error);
      return INITIAL_STAFF;
    }
  });

  const [unlockedMonths, setUnlockedMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCKED);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }); // Format: YYYY/MM

  // --- SETTINGS LOCK STATE ---
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState('');

  const handleUnlockSettings = () => {
    if (settingsPassword === '1234') {
        setIsSettingsUnlocked(true);
        setSettingsPassword('');
        setIsPasswordModalOpen(false);
    } else {
        alert('رمز عبور اشتباه است.');
    }
  };

  const handleClosePasswordModal = () => {
      setIsPasswordModalOpen(false);
      setSettingsPassword('');
  };

  // --- AUTO SAVE EFFECTS ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(personnelList));
  }, [personnelList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCKED, JSON.stringify(unlockedMonths));
  }, [unlockedMonths]);


  // Calendar State
  const [currentYear, setCurrentYear] = useState(1404);
  const [monthIndex, setMonthIndex] = useState(0); // 0 = Azar (start of app data)
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Derived
  const currentMonth = MONTHS[monthIndex % MONTHS.length];
  const currentMonthKey = `${currentYear}/${currentMonth.code}`;
  
  // If a month is NOT in the unlocked list, it is LOCKED.
  const isCurrentMonthLocked = !unlockedMonths.includes(currentMonthKey);
  
  // Helpers
  const shiftWorkers = personnelList.filter(p => p.isActive && p.roles.includes('Shift')).map(p => p.name);
  const supervisors = personnelList.filter(p => p.isActive && p.roles.includes('Supervisor')).map(p => p.name);

  // --- SWAP & EDIT TOOL STATE ---
  const [swapTool, setSwapTool] = useState<{
    date: string;
    shiftType: 'Day' | 'Night';
    targetPerson: string;
    supervisorTarget: string;
  }>({
    date: '',
    shiftType: 'Day',
    targetPerson: '',
    supervisorTarget: ''
  });
  
  // New state for 2-step verification
  const [isSwapReady, setIsSwapReady] = useState(false);

  const [editViewMonth, setEditViewMonth] = useState<string>(''); // For full month edit view
  const [swapMessage, setSwapMessage] = useState<{type: 'error' | 'success' | 'info', text: string} | null>(null);

  // Helper to reset swap state when inputs change
  const updateSwapTool = (updates: Partial<typeof swapTool>) => {
    setSwapTool(prev => ({ ...prev, ...updates }));
    setIsSwapReady(false); // Reset readiness
    setSwapMessage(null);  // Clear messages
  };

  // --- PERSONNEL MANAGEMENT ---
  const [newPersonName, setNewPersonName] = useState('');
  
  const handleAddPersonnel = (role: 'Shift' | 'Supervisor') => {
    if (!newPersonName.trim()) return;
    if (personnelList.some(p => p.name === newPersonName.trim())) {
        alert('این نام قبلا ثبت شده است.');
        return;
    }
    
    setPersonnelList([...personnelList, {
      name: newPersonName.trim(),
      roles: [role],
      isActive: true
    }]);
    setNewPersonName('');
  };

  const handleRemovePersonnel = (name: string) => {
    if (confirm(`آیا از حذف ${name} اطمینان دارید؟`)) {
      setPersonnelList(personnelList.filter(p => p.name !== name));
    }
  };
  
  const handleToggleActive = (name: string) => {
      setPersonnelList(personnelList.map(p => 
          p.name === name ? { ...p, isActive: !p.isActive } : p
      ));
  };

  const movePersonnel = (name: string, direction: 'up' | 'down', roleFilter: 'Shift' | 'Supervisor') => {
    setPersonnelList(prev => {
      const relevantNames = prev
        .filter(p => p.roles.includes(roleFilter))
        .map(p => p.name);

      const currentIndexInRelevant = relevantNames.indexOf(name);
      if (currentIndexInRelevant === -1) return prev;

      if (direction === 'up' && currentIndexInRelevant === 0) return prev;
      if (direction === 'down' && currentIndexInRelevant === relevantNames.length - 1) return prev;

      const swapTargetName = direction === 'up' 
        ? relevantNames[currentIndexInRelevant - 1]
        : relevantNames[currentIndexInRelevant + 1];

      const realIndexA = prev.findIndex(p => p.name === name);
      const realIndexB = prev.findIndex(p => p.name === swapTargetName);

      if (realIndexA === -1 || realIndexB === -1) return prev;

      const newList = [...prev];
      [newList[realIndexA], newList[realIndexB]] = [newList[realIndexB], newList[realIndexA]];
      
      return newList;
    });
  };

  // --- SCHEDULING LOGIC ---
  const handleNextMonth = () => {
    const nextIdx = monthIndex + 1;
    const nextMonthObj = MONTHS[nextIdx % MONTHS.length];
    let nextYear = currentYear;
    if (currentMonth.code === '12' && nextMonthObj.code === '01') {
        nextYear = currentYear + 1;
    }
    
    const nextMonthKey = `${nextYear}/${nextMonthObj.code}`;
    const isNextLocked = !unlockedMonths.includes(nextMonthKey);
    const existingDays = schedule.filter(s => s.date.includes(`${nextYear}/${nextMonthObj.code}/`));
    const daysInNextMonth = getDaysInPersianMonth(nextMonthObj.code);

    if (!isNextLocked && existingDays.length < daysInNextMonth) {
             let startDayIndex = 6; 
             if (schedule.length > 0) {
                 const lastEntry = schedule[schedule.length - 1];
                 const lastDayName = lastEntry.dayName;
                 const weekDays = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
                 const lastDayIdx = weekDays.indexOf(lastDayName);
                 startDayIndex = (lastDayIdx + 1) % 7;
             }
             const newMonthData = generateNextMonth(
                 schedule, 
                 nextYear, 
                 nextMonthObj.code, 
                 startDayIndex, 
                 personnelList,
                 daysInNextMonth
             );
             setSchedule(prev => [...prev, ...newMonthData]);
    }

    setMonthIndex(nextIdx);
    if (nextYear !== currentYear) setCurrentYear(nextYear);
  };

  const handlePrevMonth = () => {
    if (monthIndex > 0) {
       const prevIdx = monthIndex - 1;
       const prevMonthObj = MONTHS[prevIdx % MONTHS.length];
       let prevYear = currentYear;
       if (currentMonth.code === '01' && prevMonthObj.code === '12') {
           prevYear = currentYear - 1;
       }
       setMonthIndex(prevIdx);
       setCurrentYear(prevYear);
    }
  };

  const handleUpdateShift = (id: number, field: 'dayShiftPerson' | 'nightShiftPerson' | 'onCallPerson', value: string) => {
    setSchedule(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleToggleHoliday = (id: number) => {
    setSchedule(prev => prev.map(item => 
      item.id === id ? { ...item, isHoliday: !item.isHoliday } : item
    ));
  };
  
  const handleToggleLock = () => {
      const key = currentMonthKey;
      if (unlockedMonths.includes(key)) {
          setUnlockedMonths(prev => prev.filter(m => m !== key));
      } else {
          setUnlockedMonths(prev => [...prev, key]);
      }
  };

  const handleRegenerate = () => {
      if (confirm('آیا از چیدمان مجدد این ماه اطمینان دارید؟ تمام تغییرات دستی این ماه حذف خواهد شد.')) {
          const monthCode = currentMonth.code;
          const yearStr = String(currentYear);
          const filteredSchedule = schedule.filter(s => !s.date.startsWith(`${yearStr}/${monthCode}`));
          
          let startDayIndex = 6; 
          if (filteredSchedule.length > 0) {
               const lastEntry = filteredSchedule[filteredSchedule.length - 1];
               const weekDays = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
               startDayIndex = (weekDays.indexOf(lastEntry.dayName) + 1) % 7;
          }

          const daysInMonth = getDaysInPersianMonth(monthCode);
          const newData = generateNextMonth(
              filteredSchedule,
              currentYear,
              monthCode,
              startDayIndex,
              personnelList,
              daysInMonth
          );

          setSchedule([...filteredSchedule, ...newData]);
      }
  };
  
  const handleImport = (data: AppData) => {
      if (data.schedule) setSchedule(data.schedule);
      if (data.personnel) setPersonnelList(data.personnel);
      if (data.lockedMonths) setUnlockedMonths(data.lockedMonths);
  };
  
  const handleReset = () => {
      setSchedule(SCHEDULE_DATA);
      setPersonnelList(INITIAL_STAFF);
      setUnlockedMonths([]);
      localStorage.clear();
      window.location.reload();
  };
  
  // Step 1: Validate
  const handleValidateSwap = () => {
      if (!swapTool.date || !swapTool.targetPerson) {
          setSwapMessage({ type: 'error', text: 'لطفا تاریخ و شخص جایگزین را انتخاب کنید.' });
          return;
      }
      const result = validateSwap(schedule, swapTool.date, swapTool.targetPerson, swapTool.shiftType);
      if (!result.valid) {
          setSwapMessage({ type: 'error', text: result.reason || 'خطا در جابجایی.' });
          setIsSwapReady(false);
          return;
      }

      setSwapMessage({ type: 'info', text: 'قوانین رعایت شده است. برای اعمال تغییرات دکمه تایید نهایی را بزنید.' });
      setIsSwapReady(true);
  };

  // Step 2: Execute
  const handleApplySwap = () => {
      const entry = schedule.find(s => s.date === swapTool.date);
      if (entry) {
          const isDay = swapTool.shiftType === 'Day';
          setSchedule(prev => prev.map(item => {
              if (item.id === entry.id) {
                  const updates: Partial<ShiftEntry> = {};
                  if (isDay) {
                      updates.dayShiftPerson = swapTool.targetPerson;
                      if (!item.originalDayShiftPerson && item.dayShiftPerson !== swapTool.targetPerson) {
                          updates.originalDayShiftPerson = item.dayShiftPerson;
                      }
                  } else {
                      updates.nightShiftPerson = swapTool.targetPerson;
                      if (!item.originalNightShiftPerson && item.nightShiftPerson !== swapTool.targetPerson) {
                          updates.originalNightShiftPerson = item.nightShiftPerson;
                      }
                  }
                  return { ...item, ...updates };
              }
              return item;
          }));
          setSwapMessage({ type: 'success', text: 'جابجایی با موفقیت انجام شد.' });
          setIsSwapReady(false);
          setTimeout(() => setSwapMessage(null), 3000);
      }
  };

  const handleUpdateSupervisor = () => {
      if (!swapTool.date || !swapTool.supervisorTarget) {
          setSwapMessage({ type: 'error', text: 'لطفا تاریخ و سرپرست جدید را انتخاب کنید.' });
          return;
      }
      const entry = schedule.find(s => s.date === swapTool.date);
      if (entry) {
          handleUpdateShift(entry.id, 'onCallPerson', swapTool.supervisorTarget);
          setSwapMessage({ type: 'success', text: 'سرپرست شیفت تغییر کرد.' });
          setTimeout(() => setSwapMessage(null), 3000);
      }
  };

  const handleToggleHolidaySetting = () => {
      if (!swapTool.date) return;
      const entry = schedule.find(s => s.date === swapTool.date);
      if (entry) {
          handleToggleHoliday(entry.id);
      }
  };

  // Filter current month data for view
  const currentMonthData = schedule.filter(s => s.date.startsWith(`${currentYear}/${currentMonth.code}`));
  // Helper to get current selection stats for Swap Tool
  const currentSwapEntry = swapTool.date ? schedule.find(s => s.date === swapTool.date) : null;
  // Get available months for batch edit
  const availableMonths = Array.from(new Set(schedule.map(s => s.date.substring(0, 7)))).sort();

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <nav className="main-navbar bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white px-2 py-1 rounded-lg min-w-[48px] flex items-center justify-center">
                 <span className="font-bold text-xl leading-none" style={{ fontFamily: '"Times New Roman", Times, serif' }}>FMD</span>
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                سامانه شیفت تولید
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                داشبورد
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                تنظیمات
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <Dashboard 
            scheduleData={currentMonthData}
            fullSchedule={schedule}
            shiftWorkers={shiftWorkers}
            supervisors={supervisors}
            monthName={currentMonth.name}
            year={currentYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onUpdateShift={handleUpdateShift}
            onToggleHoliday={handleToggleHoliday}
            onOpenReport={() => setIsReportModalOpen(true)}
            isLocked={isCurrentMonthLocked}
            onToggleLock={handleToggleLock}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <div className="relative min-h-[80vh]">
             {/* 1. Transparent Interceptor Layer (Invisible Shield) */}
             {!isSettingsUnlocked && (
                 <div 
                    className="absolute inset-0 z-40 cursor-pointer"
                    onClick={() => setIsPasswordModalOpen(true)}
                    title="برای ایجاد تغییرات کلیک کنید"
                 ></div>
             )}

             {/* 2. PASSWORD MODAL */}
             {isPasswordModalOpen && !isSettingsUnlocked && (
                 <div 
                    className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={handleClosePasswordModal}
                 >
                     <div 
                         className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 text-center max-w-xs w-full animate-in zoom-in-95 relative" 
                         onClick={e => e.stopPropagation()}
                     >
                         <button 
                             onClick={handleClosePasswordModal}
                             className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 p-1"
                         >
                             <X size={20} />
                         </button>

                         <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                             <Lock size={24} />
                         </div>
                         <h3 className="font-bold text-slate-900 text-lg mb-2">بخش محافظت شده</h3>
                         <p className="text-slate-600 text-sm mb-4 font-medium">لطفا رمز عبور را وارد کنید.</p>
                         
                         <div className="space-y-3">
                             <input 
                                id="settings-pwd-input"
                                type="password" 
                                className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-center rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none dir-ltr tracking-widest font-bold"
                                placeholder="****"
                                value={settingsPassword}
                                onChange={e => setSettingsPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUnlockSettings()}
                                autoFocus
                             />
                             <div className="flex gap-2">
                                 <button 
                                    onClick={handleClosePasswordModal}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition"
                                 >
                                     انصراف
                                 </button>
                                 <button 
                                    onClick={handleUnlockSettings}
                                    className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black transition shadow-md"
                                 >
                                     تایید
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* 3. Settings Content (Visible but covered by shield if locked) */}
             <div className="max-w-4xl mx-auto space-y-8">
                
                {/* 1. Experts Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-amber-500" size={20} />
                            لیست کارشناسان
                        </h2>
                        <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">کارشناس</span>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Add Form */}
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="نام کارشناس جدید..." 
                                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPersonnel('Shift')}
                            />
                            <button 
                                onClick={() => handleAddPersonnel('Shift')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <Plus size={18} />
                                افزودن
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {personnelList.filter(p => p.roles.includes('Shift')).map((person) => (
                                <div key={person.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${person.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className={`font-medium ${person.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                            {person.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => movePersonnel(person.name, 'up', 'Shift')}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="بالا"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button 
                                            onClick={() => movePersonnel(person.name, 'down', 'Shift')}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="پایین"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                        <button 
                                            onClick={() => handleToggleActive(person.name)}
                                            className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                                        >
                                            {person.isActive ? 'غیرفعال' : 'فعال'}
                                        </button>
                                        <button 
                                            onClick={() => handleRemovePersonnel(person.name)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Supervisors Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <UserCog className="text-emerald-500" size={20} />
                            لیست سرپرستان
                        </h2>
                        <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">سرپرست</span>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Add Form */}
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="نام سرپرست جدید..." 
                                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPersonnel('Supervisor')}
                            />
                            <button 
                                onClick={() => handleAddPersonnel('Supervisor')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <Plus size={18} />
                                افزودن
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {personnelList.filter(p => p.roles.includes('Supervisor')).map((person) => (
                                <div key={person.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${person.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className={`font-medium ${person.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                            {person.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => movePersonnel(person.name, 'up', 'Supervisor')}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="بالا"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button 
                                            onClick={() => movePersonnel(person.name, 'down', 'Supervisor')}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="پایین"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                        <button 
                                            onClick={() => handleToggleActive(person.name)}
                                            className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                                        >
                                            {person.isActive ? 'غیرفعال' : 'فعال'}
                                        </button>
                                        <button 
                                            onClick={() => handleRemovePersonnel(person.name)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Shift Management Tool (Combined Swap + Edit) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Edit className="text-blue-500" size={20} />
                            مدیریت و ویرایش شیفت‌ها
                        </h2>
                        <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">ویرایش دستی</span>
                    </div>
                    
                    <div className="p-6 space-y-8">
                        {/* SECTION A: Single Date Edit */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                                <CalendarIcon size={16} />
                                جابجایی شیفت
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">انتخاب تاریخ</label>
                                <div className="flex items-center gap-2">
                                    <select 
                                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={swapTool.date}
                                        onChange={(e) => updateSwapTool({date: e.target.value, targetPerson: '', supervisorTarget: ''})}
                                    >
                                        <option value="">انتخاب کنید...</option>
                                        {currentMonthData.map(s => (
                                            <option key={s.id} value={s.date}>{s.dayName} - {s.date}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {swapTool.date && currentSwapEntry && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* 3.1 Smart Swap (Day/Night) */}
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                <ArrowRightLeft size={16} className="text-amber-500"/>
                                                جابجایی شیفت (هوشمند)
                                            </h3>
                                            
                                            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                                <button 
                                                    onClick={() => updateSwapTool({shiftType: 'Day'})}
                                                    className={`flex-1 py-1.5 text-xs rounded-md transition font-medium ${swapTool.shiftType === 'Day' ? 'bg-amber-100 text-amber-900' : 'text-slate-500'}`}
                                                >
                                                    شیفت روز
                                                </button>
                                                <button 
                                                    onClick={() => updateSwapTool({shiftType: 'Night'})}
                                                    className={`flex-1 py-1.5 text-xs rounded-md transition font-medium ${swapTool.shiftType === 'Night' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500'}`}
                                                >
                                                    شیفت شب
                                                </button>
                                            </div>

                                            <div className="text-xs space-y-2">
                                                <div className="flex justify-between text-slate-600">
                                                    <span>شخص فعلی:</span>
                                                    <span className="font-bold">{swapTool.shiftType === 'Day' ? currentSwapEntry.dayShiftPerson : currentSwapEntry.nightShiftPerson}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="whitespace-nowrap">جایگزین:</span>
                                                    <select 
                                                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        value={swapTool.targetPerson}
                                                        onChange={(e) => updateSwapTool({targetPerson: e.target.value})}
                                                    >
                                                        <option value="">انتخاب...</option>
                                                        {shiftWorkers.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {!isSwapReady ? (
                                                <button 
                                                    onClick={handleValidateSwap}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition"
                                                >
                                                    بررسی قوانین
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setIsSwapReady(false)}
                                                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium py-2 rounded-lg transition"
                                                    >
                                                        انصراف
                                                    </button>
                                                    <button 
                                                        onClick={handleApplySwap}
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition flex items-center justify-center gap-1"
                                                    >
                                                        <Check size={14} />
                                                        تایید نهایی
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3.2 Other Edits (Supervisor & Holiday) */}
                                        <div className="space-y-4">
                                            {/* Supervisor Edit */}
                                            <div className="space-y-3">
                                                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                    <UserCog size={16} className="text-emerald-500"/>
                                                    تغییر سرپرست
                                                </h3>
                                                <div className="text-xs space-y-2">
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>سرپرست فعلی:</span>
                                                        <span className="font-bold">{currentSwapEntry.onCallPerson}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={swapTool.supervisorTarget}
                                                            onChange={(e) => setSwapTool({...swapTool, supervisorTarget: e.target.value})}
                                                        >
                                                            <option value="">انتخاب سرپرست جدید...</option>
                                                            {supervisors.map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleUpdateSupervisor}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition"
                                                >
                                                    تغییر سرپرست
                                                </button>
                                            </div>

                                            {/* Holiday Toggle */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                                <div>
                                                    <h3 className="font-bold text-slate-700 text-sm">وضعیت تعطیلی</h3>
                                                    <p className={`text-xs mt-1 font-medium ${currentSwapEntry.isHoliday ? 'text-red-500' : 'text-slate-500'}`}>
                                                        {currentSwapEntry.isHoliday ? 'تعطیل است' : 'روز کاری عادی'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={handleToggleHolidaySetting}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                                        currentSwapEntry.isHoliday 
                                                        ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                                                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                                    }`}
                                                >
                                                    {currentSwapEntry.isHoliday ? 'حذف تعطیلی' : 'تنظیم به عنوان تعطیل'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {swapMessage && (
                                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${swapMessage.type === 'error' ? 'bg-red-50 text-red-700' : (swapMessage.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700')}`}>
                                            {swapMessage.type === 'error' ? <AlertCircle size={18} /> : (swapMessage.type === 'info' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />)}
                                            {swapMessage.text}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECTION B: Batch Edit (Month Table) */}
                        <div className="space-y-4 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <TableIcon size={16} />
                                ویرایش گروهی (نمای ماهانه)
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">انتخاب ماه جهت نمایش لیست کامل</label>
                                <select 
                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editViewMonth}
                                    onChange={(e) => setEditViewMonth(e.target.value)}
                                >
                                    <option value="">انتخاب ماه...</option>
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {editViewMonth && (
                                <div className="overflow-x-auto max-h-[500px] rounded-lg border border-slate-200">
                                    <table className="w-full text-xs text-center border-collapse">
                                        <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-2 border-b">روز</th>
                                                <th className="p-2 border-b">تاریخ</th>
                                                <th className="p-2 border-b">شیفت روز</th>
                                                <th className="p-2 border-b">شیفت شب</th>
                                                <th className="p-2 border-b">سرپرست</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {schedule.filter(s => s.date.startsWith(editViewMonth)).map(entry => (
                                                <tr key={entry.id} className="hover:bg-slate-50 transition">
                                                    <td className={`p-2 ${entry.dayName === 'جمعه' || entry.isHoliday ? 'text-red-500 font-bold' : ''}`}>
                                                        {entry.dayName}
                                                    </td>
                                                    <td className="p-2 font-mono text-slate-500">{entry.date}</td>
                                                    <td className="p-1">
                                                        <select 
                                                            className="w-full p-1 bg-white text-slate-900 border border-slate-200 rounded focus:border-amber-400 outline-none"
                                                            value={entry.dayShiftPerson}
                                                            onChange={(e) => handleUpdateShift(entry.id, 'dayShiftPerson', e.target.value)}
                                                        >
                                                            {shiftWorkers.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-1">
                                                        <select 
                                                            className="w-full p-1 bg-white text-slate-900 border border-slate-200 rounded focus:border-indigo-400 outline-none"
                                                            value={entry.nightShiftPerson}
                                                            onChange={(e) => handleUpdateShift(entry.id, 'nightShiftPerson', e.target.value)}
                                                        >
                                                            {shiftWorkers.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-1">
                                                        <select 
                                                            className="w-full p-1 bg-white text-slate-900 border border-slate-200 rounded focus:border-emerald-400 outline-none"
                                                            value={entry.onCallPerson}
                                                            onChange={(e) => handleUpdateShift(entry.id, 'onCallPerson', e.target.value)}
                                                        >
                                                            {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DataManagement 
                    currentData={{ schedule, personnel: personnelList, lockedMonths: unlockedMonths }} 
                    onImport={handleImport}
                    onReset={handleReset}
                />
             </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PersonalReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        schedule={currentMonthData}
        fullSchedule={schedule}
        staffList={shiftWorkers}
        monthName={`${currentMonth.name} ${currentYear.toLocaleString('fa-IR', {useGrouping:false})}`}
      />
    </div>
  );
};

export default App;
