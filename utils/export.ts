
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Employee, StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts } from '../types';
import { calculatePeriodStats } from './statistics';

export const exportToExcel = (
  storeName: string,
  employees: Employee[],
  schedule: StoreSchedule,
  dateRange: Date[],
  shiftDefinitions: Record<string, ShiftDefinition>
) => {
  const retailEmps = employees.filter(e => e.department === 'retail');
  const dispensingEmps = employees.filter(e => e.department === 'dispensing');
  
  const startDateStr = format(dateRange[0], 'yyyy/MM/dd');
  const endDateStr = format(dateRange[dateRange.length - 1], 'yyyy/MM/dd');

  const totalCols = 2 + retailEmps.length + (dispensingEmps.length > 0 ? 1 : 0) + dispensingEmps.length;
  const titleRow = [`${storeName} 排班表 (${startDateStr} - ${endDateStr})`];

  // Header Row
  const headerRow = [
    '日期', '星期', 
    ...retailEmps.map(e => e.name), 
    ...(dispensingEmps.length > 0 ? [''] : []), // Spacer
    ...dispensingEmps.map(e => e.name)
  ];

  const data = [];
  
  // 1. Daily Data Rows
  for (const date of dateRange) {
    const dateKey = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'MM/dd');
    const displayWeekday = format(date, 'EE', { locale: zhTW });

    const row: any[] = [displayDate, displayWeekday];

    retailEmps.forEach(emp => row.push(getCellText(schedule, dateKey, emp.id, shiftDefinitions)));
    if (dispensingEmps.length > 0) row.push(''); 
    dispensingEmps.forEach(emp => row.push(getCellText(schedule, dateKey, emp.id, shiftDefinitions)));

    data.push(row);
  }

  data.push([]); // Empty row before stats

  // Pre-calculate stats for all employees
  const statsMap = new Map();
  employees.forEach(emp => {
    statsMap.set(emp.id, calculatePeriodStats(emp.id, schedule, dateRange, shiftDefinitions));
  });

  // Helper to build a stat row
  const buildStatRow = (label: string, getValue: (stats: any) => string | number) => {
    const row: (string | number)[] = [label, ''];
    retailEmps.forEach(emp => {
      const val = getValue(statsMap.get(emp.id));
      row.push(val === 0 ? '' : val);
    });
    if (dispensingEmps.length > 0) row.push(''); 
    dispensingEmps.forEach(emp => {
      const val = getValue(statsMap.get(emp.id));
      row.push(val === 0 ? '' : val);
    });
    return row;
  };

  // 2. Statistics Rows
  data.push(buildStatRow('統計 (本區間)', () => ''));
  data.push(buildStatRow('A/P', (s) => s.ap));
  data.push(buildStatRow('全', (s) => s.full));
  data.push(buildStatRow('特休(時)', (s) => s.annual));
  data.push(buildStatRow('加班時數', (s) => s.ot));
  data.push(buildStatRow('總工時(不含特休)', (s) => s.total));

  // Create Worksheet
  const worksheetData = [titleRow, [], headerRow, ...data];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Merge Title
  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }); 

  // Column Widths
  const wscols = [{ wch: 12 }, { wch: 8 }]; 
  retailEmps.forEach(() => wscols.push({ wch: 15 }));
  if (dispensingEmps.length > 0) wscols.push({ wch: 2 });
  dispensingEmps.forEach(() => wscols.push({ wch: 15 }));
  ws['!cols'] = wscols;

  // Create Workbook and Write
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${storeName}_排班`.substring(0, 31));
  XLSX.writeFile(wb, `${storeName}_排班表_${startDateStr.replace(/\//g, '-')}.xlsx`);
};

function getCellText(schedule: StoreSchedule, dateKey: string, empId: string, shiftDefinitions: Record<string, ShiftDefinition>): string {
  const { code, ot, isLesson } = parseShiftCode(schedule[dateKey]?.[empId]);
  
  if (code && shiftDefinitions[code]) {
    let text = shiftDefinitions[code].shortLabel || code;
    if (code === BuiltInShifts.ANNUAL) {
       if (ot > 0 && ot !== shiftDefinitions[code].hours) text += `(${ot})`;
    } else {
       if (ot > 0) text += `+${ot}`;
       if (isLesson) text += `/上`;
    }
    return text;
  }
  return '';
}
