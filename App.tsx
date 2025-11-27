import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, eachDayOfInterval, endOfMonth } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';
import zhTW from 'date-fns/locale/zh-TW';
import { 
  Users, 
  Download, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Store,
  XCircle,
  Save as SaveIcon, 
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  Upload,
  FileJson,
  MonitorDown,
  Maximize2,
  Minimize2,
  GraduationCap,
  Cloud
} from 'lucide-react';

import { ShiftCode, Employee, StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts } from './types';
import { DEFAULT_SHIFT_DEFINITIONS, INITIAL_EMPLOYEES, STORES, DEPARTMENTS } from './constants';
import { generateSmartSchedule } from './services/geminiService';
import { exportToExcel } from './utils/export';
import { EmployeeManager } from './components/EmployeeManager';
import { ShiftManager } from './components/ShiftManager';
import { StatPanel } from './components/StatPanel';
import { DateRangePicker } from './components/DateRangePicker';
import { HelpModal } from './components/HelpModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { CloudBackupData } from './services/cloudService';

// Types
type GlobalDataState = Record<string, StoreSchedule>;

interface PopupPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// Helpers
const calculatePosition = (e: React.MouseEvent): PopupPosition => {
  const x = e.clientX;
  const y = e.clientY;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const showAbove = y > windowHeight / 2;
  const showLeft = x > windowWidth / 2;
  const offset = 12;

  return {
    top: showAbove ? undefined : y + offset,
    bottom: showAbove ? windowHeight - y + offset : undefined,
    left: showLeft ? undefined : x + offset,
    right: showLeft ? windowWidth - x + offset : undefined
  };
};

// Optimized Cell Component
const ShiftCell = React.memo(({ 
  empId, 
  dateStr, 
  isWeekend, 
  rawValue, 
  originalValue, 
  shiftDefs, 
  onClick, 
  onDoubleClick 
}: {
  empId: string;
  dateStr: string;
  isWeekend: boolean;
  rawValue: string | undefined;
  originalValue: string | undefined;
  shiftDefs: Record<string, ShiftDefinition>;
  onClick: (e: React.MouseEvent, empId: string, dateStr: string) => void;
  onDoubleClick: (e: React.MouseEvent, empId: string, dateStr: string, rawValue: string) => void;
}) => {
  const isDirty = rawValue !== originalValue;
  const { code, ot, isLesson } = parseShiftCode(rawValue);
  const shiftDef = code ? shiftDefs[code] : null;

  // Use weekend color if defined and applicable, else fallback to standard color
  const colorClass = (isWeekend && shiftDef?.weekendColor) ? shiftDef.weekendColor : (shiftDef?.color || '');

  return (
    <td className={`relative border-b border-r border-gray-100 p-0.5 text-center h-10 ${isWeekend ? 'bg-orange-50/10' : ''}`}>
      <button
        onClick={(e) => onClick(e, empId, dateStr)}
        onDoubleClick={(e) => rawValue && onDoubleClick(e, empId, dateStr, rawValue)}
        className={`w-full h-full rounded flex items-center justify-center transition-all text-xs font-bold shadow-sm select-none relative
          ${shiftDef ? `${colorClass} hover:brightness-95` : 'text-transparent hover:bg-gray-100 hover:text-gray-300'}
          ${isDirty ? 'ring-2 ring-yellow-400 border-transparent' : ''}
        `}
      >
        {shiftDef ? (
          <div className="flex items-center gap-0.5">
             <span>{shiftDef.shortLabel}</span>
             {code === BuiltInShifts.ANNUAL ? (
                (ot > 0 && ot !== shiftDef.hours) && <span className="text-[9px] bg-white/50 px-0.5 rounded text-gray-800">({ot})</span>
             ) : (
               <>
                 {ot > 0 && <span className="text-[9px] bg-white/50 px-0.5 rounded text-gray-800">+{ot}</span>}
                 {isLesson && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-0.5 rounded border border-indigo-200">/上</span>}
               </>
             )}
          </div>
        ) : '+'}
        
        {isDirty && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
        )}
      </button>
    </td>
  );
});

const App: React.FC = () => {
  // State Initialization
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedStore, setSelectedStore] = useState<string>(STORES[0]);
  
  // Data State
  const [employeesMap, setEmployeesMap] = useState<Record<string, Employee[]>>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_employees_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all stores exist
        STORES.forEach(s => { if (!parsed[s]) parsed[s] = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES)); });
        return parsed;
      }
      // Fallback
      const initial: Record<string, Employee[]> = {};
      STORES.forEach(s => initial[s] = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES)));
      return initial;
    } catch {
      const initial: Record<string, Employee[]> = {};
      STORES.forEach(s => initial[s] = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES)));
      return initial;
    }
  });

  const [shiftDefs, setShiftDefs] = useState<Record<string, ShiftDefinition>>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_shift_defs');
      return saved ? JSON.parse(saved) : DEFAULT_SHIFT_DEFINITIONS;
    } catch {
      return DEFAULT_SHIFT_DEFINITIONS;
    }
  });
  
  // Schedule Data
  const [savedData, setSavedData] = useState<GlobalDataState>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [allData, setAllData] = useState<GlobalDataState>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  
  // UI State
  const [isEmpManagerOpen, setIsEmpManagerOpen] = useState(false);
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toast, setToast] = useState<string | null>(null);
  
  // Selection State
  const [selectedCell, setSelectedCell] = useState<{empId: string, dateStr: string, position: PopupPosition} | null>(null);
  const [selectedOvertimeCell, setSelectedOvertimeCell] = useState<{empId: string, dateStr: string, baseCode: string, currentOt: number, isLesson: boolean, position: PopupPosition} | null>(null);
  const [selectedAnnualCell, setSelectedAnnualCell] = useState<{empId: string, dateStr: string, position: PopupPosition} | null>(null);

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const employees = useMemo(() => employeesMap[selectedStore] || [], [employeesMap, selectedStore]);
  const storeSchedule = useMemo(() => allData[selectedStore] || {}, [allData, selectedStore]);
  const baselineSchedule = useMemo(() => savedData[selectedStore] || {}, [savedData, selectedStore]);
  
  const sortedEmployees = useMemo(() => {
    return [
      ...employees.filter(e => e.department === 'retail'),
      ...employees.filter(e => e.department === 'dispensing')
    ];
  }, [employees]);

  const sortedShifts = useMemo(() => {
    return (Object.values(shiftDefs) as ShiftDefinition[]).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [shiftDefs]);

  const retailCount = employees.filter(e => e.department === 'retail').length;

  const dateRange = useMemo(() => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return (start > end) ? [] : eachDayOfInterval({ start, end });
    } catch { return []; }
  }, [startDate, endDate]);

  const displayDays = useMemo(() => {
    return dateRange.map(date => ({
      dateObj: date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayNum: format(date, 'd'),
      weekday: format(date, 'EE', { locale: zhTW }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    }));
  }, [dateRange]);

  const hasUnsavedChanges = useMemo(() => JSON.stringify(savedData) !== JSON.stringify(allData), [savedData, allData]);

  // Effects
  useEffect(() => localStorage.setItem('pharmacy_employees_v2', JSON.stringify(employeesMap)), [employeesMap]);
  useEffect(() => localStorage.setItem('pharmacy_shift_defs', JSON.stringify(shiftDefs)), [shiftDefs]);
  
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // PWA Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Actions
  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') setDeferredPrompt(null);
    });
  };

  const showToast = (msg: string) => setToast(msg);

  const handleManualSave = () => {
    setSaveStatus('saving');
    localStorage.setItem('pharmacy_data_v2', JSON.stringify(allData));
    localStorage.setItem('pharmacy_shift_defs', JSON.stringify(shiftDefs));
    localStorage.setItem('pharmacy_employees_v2', JSON.stringify(employeesMap));
    
    setSavedData(JSON.parse(JSON.stringify(allData)));
    setTimeout(() => {
      setSaveStatus('saved');
      showToast('資料已成功儲存');
    }, 500);
  };

  // Cloud & Backup
  const getCloudData = (): CloudBackupData => ({
    employeesMap,
    shiftDefs,
    data: allData,
    lastUpdated: new Date().toISOString(),
    version: 1
  });

  const handleCloudDataLoaded = (cloudData: CloudBackupData) => {
    setEmployeesMap(cloudData.employeesMap);
    setShiftDefs(cloudData.shiftDefs);
    setSavedData(cloudData.data);
    setAllData(cloudData.data);
    localStorage.setItem('pharmacy_employees_v2', JSON.stringify(cloudData.employeesMap));
    localStorage.setItem('pharmacy_shift_defs', JSON.stringify(cloudData.shiftDefs));
    localStorage.setItem('pharmacy_data_v2', JSON.stringify(cloudData.data));
  };

  const handleBackupData = () => {
    const backup = { version: 1, timestamp: Date.now(), employeesMap, shiftDefs, data: savedData };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('備份檔已下載');
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('確定要還原此備份檔嗎？\n\n警告：此動作將會「覆蓋」目前的所有資料且無法復原。')) {
      e.target.value = ''; 
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.employeesMap && json.shiftDefs && json.data) {
          setEmployeesMap(json.employeesMap);
          setShiftDefs(json.shiftDefs);
          setSavedData(json.data);
          setAllData(json.data);
          // Persist
          localStorage.setItem('pharmacy_employees_v2', JSON.stringify(json.employeesMap));
          localStorage.setItem('pharmacy_shift_defs', JSON.stringify(json.shiftDefs));
          localStorage.setItem('pharmacy_data_v2', JSON.stringify(json.data));
          showToast('資料還原成功！');
        } else {
          alert('無效的備份檔案格式。');
        }
      } catch (err) {
        alert('讀取檔案失敗。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Schedule Manipulation
  const updateSchedule = useCallback((empId: string, dateStr: string, code: ShiftCode) => {
    setAllData(prev => {
      const currentStoreData = prev[selectedStore] || {};
      const dayData = { ...(currentStoreData[dateStr] || {}) };
      dayData[empId] = code;
      return {
        ...prev,
        [selectedStore]: {
          ...currentStoreData,
          [dateStr]: dayData
        }
      };
    });
    setSelectedCell(null);
  }, [selectedStore]);

  const handleUpdateShiftAttributes = useCallback((empId: string, dateStr: string, baseCode: string, otHours: number, isLesson: boolean) => {
    let newCode = baseCode;
    // Format: CODE or CODE:OT or CODE:OT:L
    if (otHours > 0 || isLesson) {
      newCode = `${baseCode}:${otHours}`;
      if (isLesson) newCode += `:L`;
    }
    updateSchedule(empId, dateStr, newCode);
    setSelectedOvertimeCell(prev => prev ? { ...prev, currentOt: otHours, isLesson } : null);
  }, [updateSchedule]);

  const handleRevertCell = useCallback((empId: string, dateStr: string) => {
    const originalValue = savedData[selectedStore]?.[dateStr]?.[empId];
    setAllData(prev => {
      const currentStoreData = prev[selectedStore] || {};
      const dayData = { ...(currentStoreData[dateStr] || {}) };
      if (originalValue) {
        dayData[empId] = originalValue;
      } else {
        delete dayData[empId];
      }
      return {
        ...prev,
        [selectedStore]: {
          ...currentStoreData,
          [dateStr]: dayData
        }
      };
    });
    setSelectedCell(null);
  }, [savedData, selectedStore]);

  const onCellClick = useCallback((e: React.MouseEvent, empId: string, dateStr: string) => {
    e.preventDefault();
    const position = calculatePosition(e);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      setSelectedCell({ empId, dateStr, position });
      clickTimeoutRef.current = null;
    }, 250); 
  }, []);

  const onCellDoubleClick = useCallback((e: React.MouseEvent, empId: string, dateStr: string, rawCode: string) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (!rawCode) return;
    const { code, ot, isLesson } = parseShiftCode(rawCode);
    if (!code) return;

    const position = calculatePosition(e);
    if (code === BuiltInShifts.ANNUAL) {
       setSelectedAnnualCell({ empId, dateStr, position });
    } else {
       const def = shiftDefs[code];
       if (def && def.hours > 0 && code !== BuiltInShifts.OFF) {
          setSelectedOvertimeCell({ empId, dateStr, baseCode: code, currentOt: ot, isLesson, position });
       }
    }
  }, [shiftDefs]);

  const handleClearRangeRequest = () => {
    if (displayDays.length === 0) return showToast('請先選擇有效的日期區間');
    setIsClearConfirmOpen(true);
  };

  const performRevertRange = () => {
    setAllData(prev => {
      const currentStoreData = { ...(prev[selectedStore] || {}) };
      displayDays.forEach(day => {
        const savedDayData = savedData[selectedStore]?.[day.dateStr];
        if (savedDayData) {
          currentStoreData[day.dateStr] = { ...savedDayData };
        } else {
          delete currentStoreData[day.dateStr];
        }
      });
      return {
        ...prev,
        [selectedStore]: currentStoreData
      };
    });
    setIsClearConfirmOpen(false);
    showToast('已回復區間內的預設班別');
  };

  const handleAISchedule = async () => {
    if (displayDays.length === 0) return;
    setIsGenerating(true);
    try {
      const newSchedule = await generateSmartSchedule({
        employees: sortedEmployees,
        dateRange,
        existingSchedule: storeSchedule,
        shiftDefinitions: shiftDefs
      });
      setAllData(prev => {
        const currentStoreData = { ...(prev[selectedStore] || {}) };
        Object.entries(newSchedule).forEach(([dateStr, assignments]) => {
          if (!currentStoreData[dateStr]) currentStoreData[dateStr] = {};
          Object.entries(assignments).forEach(([empId, code]) => {
            currentStoreData[dateStr][empId] = code;
          });
        });
        return { ...prev, [selectedStore]: currentStoreData };
      });
      showToast('AI 智能排班完成');
    } catch (error) {
      alert('AI 排班失敗，請稍後再試。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-slate-900">
      <input type="file" ref={fileInputRef} onChange={handleRestoreData} className="hidden" accept=".json" />
      
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl z-[150] animate-fade-in-up flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      {!isMaximized && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand">
                  <CalendarIcon size={18} />
                </div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden md:block">
                  Pharmacy<span className="text-brand-600">Shift</span>Pro
                </h1>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 hover:border-brand-400 transition-colors">
                <Store size={14} className="text-gray-500" />
                <select 
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none min-w-[80px]"
                >
                  {STORES.map(store => <option key={store} value={store}>{store}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               {deferredPrompt && (
                 <button onClick={handleInstallClick} className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors animate-pulse">
                  <MonitorDown size={14} /><span>安裝</span>
                </button>
               )}
               
               <button onClick={() => setIsShiftManagerOpen(true)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Clock size={14} /><span className="hidden sm:inline">班別</span>
              </button>
               <button onClick={() => setIsEmpManagerOpen(true)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-brand-600 transition-colors">
                <Users size={14} /><span className="hidden sm:inline">員工</span>
              </button>
              
              <button onClick={handleManualSave} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shadow-sm ${saveStatus === 'saved' ? 'bg-green-100 text-green-700 border border-green-200' : hasUnsavedChanges ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 ring-2 ring-yellow-200 animate-pulse-slow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                {saveStatus === 'saved' ? <CheckCircle size={14} /> : <SaveIcon size={14} />}
                <span className="hidden sm:inline">{saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '已儲存' : '儲存'}</span>
              </button>

              <button onClick={handleAISchedule} disabled={isGenerating || displayDays.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-wait transition-all shadow-sm">
                <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{isGenerating ? 'Thinking' : 'AI'}</span>
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

               <button onClick={() => displayDays.length > 0 && exportToExcel(selectedStore, sortedEmployees, storeSchedule, dateRange, shiftDefs)} disabled={displayDays.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50" title="匯出 Excel">
                <Download size={14} /><span className="hidden lg:inline">匯出</span>
              </button>

               <button onClick={() => setIsCloudSyncOpen(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="雲端同步"><Cloud size={18} /></button>
               <button onClick={handleBackupData} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="備份 (JSON)"><FileJson size={18} /></button>
               <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="還原 (JSON)"><Upload size={18} /></button>
               <button onClick={() => setIsMaximized(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="放大"><Maximize2 size={18} /></button>
               <button onClick={() => setIsHelpOpen(true)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors ml-1"><HelpCircle size={20} /></button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto flex flex-col ${isMaximized ? '' : 'max-w-[1920px] px-2 sm:px-6 py-4'}`}>
        {!isMaximized && (
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
               <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
               {displayDays.length > 0 && <span className="text-xs text-gray-400 font-medium px-2 border-l border-gray-200 hidden sm:inline">共 {displayDays.length} 天</span>}
              
              <div className="flex flex-wrap items-center gap-2">
                 {sortedShifts.map(def => (
                   <div key={def.code} className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-200 rounded-full shadow-sm cursor-help" title={`${def.label}: ${def.time} (${def.hours}h)`}>
                     <div className={`w-2.5 h-2.5 rounded-full ${def.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                     <span className="text-[10px] font-medium text-gray-600">{def.label}</span>
                   </div>
                 ))}
                 <button onClick={handleClearRangeRequest} className="px-2 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full border border-red-200 text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm ml-1">
                   <RotateCcw size={12} /> 回復預設
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid Container */}
        <div className={`bg-white border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isMaximized ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none border-0' : 'rounded-xl shadow-lg border h-[calc(100vh-220px)] relative'}`}>
          {isMaximized && (
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0 shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm"><CalendarIcon size={18} /></div>
                 <div className="flex flex-col"><span className="font-bold text-gray-800 text-sm">{selectedStore} 排班表</span><span className="text-xs text-gray-500 font-medium">{startDate} ~ {endDate}</span></div>
               </div>
               <button onClick={() => setIsMaximized(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                 <Minimize2 size={14} /> 縮小
               </button>
            </div>
          )}

          {displayDays.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 font-medium">請選擇有效的日期區間</div>
          ) : (
            <div className="overflow-auto flex-1 relative custom-scrollbar">
              <table className="border-collapse w-full">
                <thead className="sticky top-0 z-30 bg-gray-50 text-gray-700 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-40 bg-gray-50 border-b border-r border-gray-200 min-w-[80px] p-1 text-center font-bold text-xs text-gray-500">日期</th>
                    {retailCount > 0 && <th colSpan={retailCount} className="border-b border-r border-gray-200 bg-green-50 text-green-700 py-1 text-[10px] font-bold tracking-wider uppercase text-center">{DEPARTMENTS.retail}</th>}
                    {sortedEmployees.length - retailCount > 0 && <th colSpan={sortedEmployees.length - retailCount} className="border-b border-r border-gray-200 bg-blue-50 text-blue-700 py-1 text-[10px] font-bold tracking-wider uppercase text-center">{DEPARTMENTS.dispensing}</th>}
                  </tr>
                  <tr>
                    <th className="sticky left-0 z-40 bg-gray-50 border-b border-r border-gray-200 h-8 w-20"></th>
                     {sortedEmployees.map(emp => (
                      <th key={emp.id} className="min-w-[80px] border-b border-r border-gray-100 px-1 py-1 text-center bg-gray-50 font-bold text-gray-700 text-xs whitespace-nowrap">{emp.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {displayDays.map((dayInfo) => (
                    <tr key={dayInfo.dateStr} className="hover:bg-gray-50 transition-colors">
                      <td className={`sticky left-0 z-20 border-r border-b border-gray-100 p-1 text-center font-medium text-xs ${dayInfo.isWeekend ? 'bg-orange-50 text-orange-800' : 'bg-white text-gray-500'}`}>
                        <div className="flex flex-row items-center justify-between px-2">
                          <span className="text-base font-bold leading-none">{dayInfo.dayNum}</span>
                          <span className="text-[10px] font-bold uppercase">{dayInfo.weekday}</span>
                        </div>
                      </td>
                      {sortedEmployees.map((emp) => (
                        <ShiftCell
                          key={emp.id}
                          empId={emp.id}
                          dateStr={dayInfo.dateStr}
                          isWeekend={dayInfo.isWeekend}
                          rawValue={storeSchedule[dayInfo.dateStr]?.[emp.id]}
                          originalValue={baselineSchedule[dayInfo.dateStr]?.[emp.id]}
                          shiftDefs={shiftDefs}
                          onClick={onCellClick}
                          onDoubleClick={onCellDoubleClick}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Popups */}
        {selectedCell && (
          <>
            <div className="fixed inset-0 z-[110] cursor-default bg-transparent" onClick={() => setSelectedCell(null)} />
            <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 min-w-[320px] z-[120] animate-fade-in-up" style={{ top: selectedCell.position.top, bottom: selectedCell.position.bottom, left: selectedCell.position.left, right: selectedCell.position.right }}>
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-700">選擇班別</span>
                <button onClick={() => setSelectedCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {sortedShifts.map(def => (
                  <button key={def.code} onClick={() => { if (selectedCell) updateSchedule(selectedCell.empId, selectedCell.dateStr, def.code); }} className={`text-sm px-2 py-3 rounded-lg ${def.color} hover:brightness-95 hover:shadow-md transition-all truncate border font-bold flex flex-col items-center justify-center gap-1`}>
                    <span>{def.shortLabel}</span><span className="text-[10px] opacity-70 scale-90">{def.hours}h</span>
                  </button>
                ))}
                <button onClick={() => { if (selectedCell) handleRevertCell(selectedCell.empId, selectedCell.dateStr); }} className="text-sm px-2 py-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all font-bold flex items-center justify-center gap-1 col-span-1" title="回復為預設值">
                  <RotateCcw size={16} /> <span className="text-xs">回復預設</span>
                </button>
              </div>
            </div>
          </>
        )}

        {selectedOvertimeCell && (
          <>
             <div className="fixed inset-0 z-[130] cursor-default bg-transparent" onClick={() => setSelectedOvertimeCell(null)} />
            <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 w-[280px] z-[140] animate-fade-in-up" style={{ top: selectedOvertimeCell.position.top, bottom: selectedOvertimeCell.position.bottom, left: selectedOvertimeCell.position.left, right: selectedOvertimeCell.position.right }}>
               <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2"><Clock size={18} className="text-brand-600" /><span className="text-sm font-bold text-gray-700">設定加班 / 上課</span></div>
                <button onClick={() => setSelectedOvertimeCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                 {[1, 2, 3, 4].map(hour => (
                    <button key={hour} onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, hour, selectedOvertimeCell.isLesson); setSelectedOvertimeCell(null); } }} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all font-bold ${selectedOvertimeCell.currentOt === hour ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-200' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 hover:shadow-sm'}`}>
                       <span className="text-lg">+{hour}</span><span className="text-[10px] opacity-70">小時</span>
                    </button>
                 ))}
              </div>
              <button onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, selectedOvertimeCell.currentOt, !selectedOvertimeCell.isLesson); } }} className={`w-full py-3 mb-3 rounded-lg border flex items-center justify-center gap-2 font-bold transition-all ${selectedOvertimeCell.isLesson ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}>
                  <GraduationCap size={20} /><span>{selectedOvertimeCell.isLesson ? '已安排上課' : '上課 (1300-1700)'}</span>
              </button>
              <button onClick={() => { if (selectedOvertimeCell) { handleUpdateShiftAttributes(selectedOvertimeCell.empId, selectedOvertimeCell.dateStr, selectedOvertimeCell.baseCode, 0, false); setSelectedOvertimeCell(null); } }} className="w-full py-2 text-xs text-gray-500 hover:bg-gray-50 rounded border border-gray-200">清除加班與上課</button>
            </div>
          </>
        )}

        {selectedAnnualCell && (
           <>
             <div className="fixed inset-0 z-[130] cursor-default bg-transparent" onClick={() => setSelectedAnnualCell(null)} />
             <div className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 p-4 w-[300px] z-[140] animate-fade-in-up" style={{ top: selectedAnnualCell.position.top, bottom: selectedAnnualCell.position.bottom, left: selectedAnnualCell.position.left, right: selectedAnnualCell.position.right }}>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                 <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-100 text-green-700 rounded flex items-center justify-center"><Clock size={14} /></div><span className="text-sm font-bold text-gray-700">設定特休時數</span></div>
                 <button onClick={() => setSelectedAnnualCell(null)}><XCircle size={18} className="text-gray-400 hover:text-gray-600"/></button>
               </div>
               <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(hour => (
                     <button key={hour} onClick={() => { updateSchedule(selectedAnnualCell.empId, selectedAnnualCell.dateStr, `${BuiltInShifts.ANNUAL}:${hour}`); setSelectedAnnualCell(null); }} className="flex flex-col items-center justify-center py-2 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 hover:shadow-sm transition-all font-bold">
                        <span className="text-sm">{hour}</span>
                     </button>
                  ))}
               </div>
             </div>
           </>
        )}

        {displayDays.length > 0 && !isMaximized && <StatPanel employees={sortedEmployees} schedule={storeSchedule} dateRange={dateRange} shiftDefinitions={shiftDefs} />}
      </main>
      
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold flex items-center gap-3 mb-4 text-red-600"><AlertTriangle size={24} />確認回復預設排班？</h3>
            <p className="text-gray-600 mb-2">您確定要將 <strong>{selectedStore}</strong> 在此區間的排班回復到上次儲存的狀態嗎？</p>
            <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 mb-6 font-mono">{startDate} ~ {endDate}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsClearConfirmOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">取消</button>
              <button onClick={performRevertRange} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-md">確認回復</button>
            </div>
          </div>
        </div>
      )}

      <CloudSyncModal isOpen={isCloudSyncOpen} onClose={() => setIsCloudSyncOpen(false)} getDataToSave={getCloudData} onDataLoaded={handleCloudDataLoaded} />
      <EmployeeManager employees={employees} setEmployees={(newEmps) => setEmployeesMap(p => ({ ...p, [selectedStore]: newEmps }))} isOpen={isEmpManagerOpen} onClose={() => setIsEmpManagerOpen(false)} storeName={selectedStore} />
      <ShiftManager shiftDefs={shiftDefs} setShiftDefs={setShiftDefs} isOpen={isShiftManagerOpen} onClose={() => setIsShiftManagerOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;