
import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, Trash2, FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { AppData, Personnel, ShiftEntry } from '../types';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for pdfjs-dist import in browser environments (handling default export)
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF Worker safely
if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface DataManagementProps {
  currentData: AppData;
  onImport: (data: AppData) => void;
  onReset?: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ currentData, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Export JSON ---
  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `shiftflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Import JSON ---
  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- Helper: Merge Imported Shifts ---
  const mergeShifts = (newShifts: ShiftEntry[]) => {
      if (newShifts.length === 0) {
          alert('هیچ شیفت معتبری در فایل یافت نشد.');
          return;
      }

      const existingSchedule = [...currentData.schedule];
      let addedCount = 0;
      let updatedCount = 0;

      newShifts.forEach(newS => {
          const idx = existingSchedule.findIndex(ex => ex.date === newS.date);
          if (idx !== -1) {
              // Update existing
              existingSchedule[idx] = { ...existingSchedule[idx], ...newS };
              updatedCount++;
          } else {
              // Add new
              existingSchedule.push(newS);
              addedCount++;
          }
      });

      // Sort by date
      existingSchedule.sort((a, b) => a.date.localeCompare(b.date));

      // Update App Data
      onImport({
          ...currentData,
          schedule: existingSchedule
      });

      alert(`عملیات موفق:\n${addedCount} شیفت جدید اضافه شد.\n${updatedCount} شیفت موجود بروزرسانی شد.`);
  };

  // --- Import Excel ---
  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Convert to JSON array of arrays (header: 1)
          const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          
          if (rawData.length < 2) throw new Error('فایل خالی یا نامعتبر است.');

          const parsedShifts: ShiftEntry[] = [];
          
          // Basic heuristic to find columns
          // We assume row 0 is header, but we iterate rows to find data looking like dates
          const dateRegex = /^14\d{2}\/\d{2}\/\d{2}$/;

          // Find column indices based on header keywords or assume positions
          let headerRowIdx = 0;
          let dateCol = 0, dayCol = 1, dayShiftCol = 2, nightShiftCol = 3, supCol = 4;
          
          // Try to locate header row
          rawData.some((row, idx) => {
             const rowStr = row.join(' ').toLowerCase();
             if (rowStr.includes('تاریخ') || rowStr.includes('date')) {
                 headerRowIdx = idx;
                 // Map columns dynamically
                 row.forEach((cell: any, cIdx: number) => {
                     const val = String(cell).trim();
                     if (val.includes('تاریخ')) dateCol = cIdx;
                     else if (val.includes('روز') && !val.includes('شیفت')) dayCol = cIdx;
                     else if (val.includes('شیفت روز') || val.includes('روز')) dayShiftCol = cIdx;
                     else if (val.includes('شیفت شب') || val.includes('شب')) nightShiftCol = cIdx;
                     else if (val.includes('سرپرست') || val.includes('oncall')) supCol = cIdx;
                 });
                 return true;
             }
             return false;
          });

          // Iterate data rows
          for (let i = headerRowIdx + 1; i < rawData.length; i++) {
              const row = rawData[i];
              if (!row || row.length === 0) continue;

              let dateStr = row[dateCol] ? String(row[dateCol]).trim() : '';
              
              // Handle Excel Serial Dates if necessary (unlikely for Persian dates stored as string, but possible)
              // Just assuming string format '1404/09/01' for simplicity as this is standard in Iran systems
              
              if (!dateRegex.test(dateStr)) continue;

              const dayName = row[dayCol] ? String(row[dayCol]).trim() : 'نامشخص';
              const dayP = row[dayShiftCol] ? String(row[dayShiftCol]).trim() : '';
              const nightP = row[nightShiftCol] ? String(row[nightShiftCol]).trim() : '';
              const supP = row[supCol] ? String(row[supCol]).trim() : '';

              parsedShifts.push({
                  id: Math.random(),
                  date: dateStr,
                  dayName: dayName,
                  dayShiftPerson: dayP || 'نامشخص',
                  nightShiftPerson: nightP || 'نامشخص',
                  onCallPerson: supP || 'نامشخص',
                  isHoliday: dayName === 'جمعه' // Simple default
              });
          }

          mergeShifts(parsedShifts);

      } catch (err) {
          console.error(err);
          alert('خطا در پردازش فایل اکسل. لطفا مطمئن شوید فایل حاوی ستون‌های تاریخ و نام پرسنل است.');
      } finally {
          setIsProcessing(false);
          if (excelInputRef.current) excelInputRef.current.value = '';
      }
  };

  // --- Import PDF ---
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);

      try {
          const arrayBuffer = await file.arrayBuffer();
          // Use the robust pdfjs import
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              // Extract text items and join with spaces
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
          }

          // Parsing Logic for PDF Text
          // We look for lines containing Date (YYYY/MM/DD) and try to grab names around it.
          // This is "Best Effort"
          const parsedShifts: ShiftEntry[] = [];
          
          // Regex to find date: 14xx/xx/xx
          // We split by date to find chunks
          const dateRegexGlobal = /14\d{2}\/\d{2}\/\d{2}/g;
          const dates = fullText.match(dateRegexGlobal);
          
          if (!dates || dates.length === 0) throw new Error('هیچ تاریخی در فایل PDF یافت نشد.');

          // Split text roughly by dates to associate names
          const words = fullText.split(/\s+/);
          
          for (let i = 0; i < words.length; i++) {
              const word = words[i];
              if (dateRegexGlobal.test(word)) {
                  // Found a date.
                  // We will just create an entry. If names are missing, user edits manually.
                  parsedShifts.push({
                      id: Math.random(),
                      date: word,
                      dayName: 'نامشخص', // Hard to parse from unstructured text reliably
                      dayShiftPerson: 'نامشخص',
                      nightShiftPerson: 'نامشخص',
                      onCallPerson: 'نامشخص',
                      isHoliday: false
                  });
              }
          }
          
          if (parsedShifts.length > 0) {
              alert(`توجه: ${parsedShifts.length} تاریخ پیدا شد. استخراج نام‌ها از PDF ممکن است دقیق نباشد. لطفا پس از ایمپورت، برنامه را بررسی کنید. پیشنهاد می‌شود از اکسل استفاده کنید.`);
              mergeShifts(parsedShifts);
          } else {
              throw new Error('ساختار فایل PDF قابل شناسایی نبود.');
          }

      } catch (err) {
          console.error(err);
          alert('خطا در پردازش PDF. لطفا از فایل اکسل استفاده کنید که دقیق‌تر است.');
      } finally {
          setIsProcessing(false);
          if (pdfInputRef.current) pdfInputRef.current.value = '';
      }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Upload size={20} className="text-slate-400" />
        مدیریت داده‌ها (ورودی / خروجی)
      </h3>
      
      {isProcessing && (
          <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center gap-2 text-sm font-bold animate-pulse">
              <Loader2 size={18} className="animate-spin" />
              در حال پردازش فایل... لطفا صبر کنید.
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Backup JSON */}
        <button 
          onClick={handleExport}
          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition group"
        >
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-2 group-hover:scale-110 transition">
            <Download size={20} />
          </div>
          <span className="font-bold text-slate-700 text-sm">دانلود پشتیبان</span>
          <span className="text-[10px] text-slate-400 mt-1">فرمت استاندارد (JSON)</span>
        </button>

        {/* 2. Import Excel */}
        <button 
          onClick={() => excelInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-green-600 hover:bg-green-50 transition group"
        >
          <div className="p-3 bg-green-100 text-green-700 rounded-full mb-2 group-hover:scale-110 transition">
            <FileSpreadsheet size={20} />
          </div>
          <span className="font-bold text-slate-700 text-sm">ورود از اکسل</span>
          <span className="text-[10px] text-slate-400 mt-1">فایل .xlsx</span>
        </button>

        {/* 3. Import PDF */}
        <button 
          onClick={() => pdfInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition group"
        >
          <div className="p-3 bg-red-100 text-red-600 rounded-full mb-2 group-hover:scale-110 transition">
            <FileType size={20} />
          </div>
          <span className="font-bold text-slate-700 text-sm">ورود از PDF</span>
          <span className="text-[10px] text-slate-400 mt-1">متن قابل انتخاب</span>
        </button>

        {/* 4. Restore JSON */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
        >
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2 group-hover:scale-110 transition">
            <Upload size={20} />
          </div>
          <span className="font-bold text-slate-700 text-sm">بازگردانی پشتیبان</span>
          <span className="text-[10px] text-slate-400 mt-1">فایل .json</span>
        </button>
      </div>

      {onReset && (
        <div className="mt-4 flex justify-end">
             <button 
             onClick={() => {
                 if(confirm('هشدار: تمام اطلاعات شما (پرسنل جدید، شیفت‌ها و تغییرات) پاک شده و به حالت اولیه برنامه باز می‌گردد. آیا مطمئن هستید؟')) {
                     onReset();
                 }
             }}
             className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition"
           >
             <Trash2 size={16} />
             بازگشت به تنظیمات کارخانه
           </button>
        </div>
      )}
      
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleJsonFileChange} accept=".json" className="hidden" />
      <input type="file" ref={excelInputRef} onChange={handleExcelChange} accept=".xlsx, .xls" className="hidden" />
      <input type="file" ref={pdfInputRef} onChange={handlePdfChange} accept=".pdf" className="hidden" />
      
      <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-500 bg-amber-50 p-3 rounded-lg text-amber-800">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        نکته: برای ورودی اکسل، فایل باید دارای ستون‌های "تاریخ"، "نام روز"، "شیفت روز" و "شیفت شب" باشد. برای PDF، متن باید قابل انتخاب (Selectable) باشد.
      </div>
    </div>
  );
};
