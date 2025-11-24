
import React, { useRef } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { AppData, Personnel, ShiftEntry } from '../types';

interface DataManagementProps {
  currentData: AppData;
  onImport: (data: AppData) => void;
  onReset?: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ currentData, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none'; // Prevent visibility issues
    a.href = url;
    a.download = `shiftflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (json.schedule && json.personnel) {
          if (confirm('آیا از بازگردانی این نسخه پشتیبان اطمینان دارید؟ تمام اطلاعات فعلی جایگزین خواهد شد.')) {
            onImport(json);
            alert('اطلاعات با موفقیت بازیابی شد.');
          }
        } else {
          alert('فرمت فایل نامعتبر است.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل.');
        console.error(err);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Upload size={20} className="text-slate-400" />
        مدیریت داده‌ها (حافظه و پشتیبان)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={handleExport}
          className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition group"
        >
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3 group-hover:scale-110 transition">
            <Download size={24} />
          </div>
          <span className="font-bold text-slate-700">دانلود فایل پشتیبان</span>
          <span className="text-xs text-slate-400 mt-1">خروجی کل اطلاعات (JSON)</span>
        </button>

        <button 
          onClick={handleImportClick}
          className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
        >
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition">
            <Upload size={24} />
          </div>
          <span className="font-bold text-slate-700">بازگردانی اطلاعات</span>
          <span className="text-xs text-slate-400 mt-1">انتخاب فایل backup.json</span>
        </button>

        {onReset && (
             <button 
             onClick={() => {
                 if(confirm('هشدار: تمام اطلاعات شما (پرسنل جدید، شیفت‌ها و تغییرات) پاک شده و به حالت اولیه برنامه باز می‌گردد. آیا مطمئن هستید؟')) {
                     onReset();
                 }
             }}
             className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition group"
           >
             <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3 group-hover:scale-110 transition">
               <Trash2 size={24} />
             </div>
             <span className="font-bold text-slate-700">بازگشت به کارخانه</span>
             <span className="text-xs text-slate-400 mt-1">پاک کردن حافظه مرورگر</span>
           </button>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
      
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-amber-50 p-3 rounded-lg text-amber-800">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        توجه: تمام تغییرات شما (افزودن نفرات، تغییر شیفت‌ها و ...) به صورت خودکار در حافظه این مرورگر ذخیره می‌شود و با بستن صفحه پاک نخواهد شد.
      </div>
    </div>
  );
};
