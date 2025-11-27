import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Employee, StoreSchedule, ShiftDefinition, parseShiftCode, BuiltInShifts } from '../types';

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

  const headerRow = [
    '日期', '星期', 
    ...retailEmps.map(e => e.name), 
    ...(dispensingEmps.length > 0 ? [''] : []),
    ...dispensingEmps.map(e => e.name)
  ];

  const data = [];
  
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

  data.push([]); 
  
  const buildStatRow = (label: string, getValue: (emp: Employee) => string | number) => {
    const row: (string | number)[] = [label, ''];
    retailEmps.forEach(emp => row.push(getValue(emp)));
    if (dispensingEmps.length > 0) row.push(''); 
    dispensingEmps.forEach(emp => row.push(getValue(emp)));
    return row;
  };

  data.push(buildStatRow('統計 (本區間)', () => ''));
  
  data.push(buildStatRow('A/P', (emp) => {
    let count = 0;
    for (const date of dateRange) {
      const { code } = parseShiftCode(schedule[format(date, 'yyyy-MM-dd')]?.[emp.id]);
      if (code === BuiltInShifts.A || code === BuiltInShifts.P) count++;
    }
    return count > 0 ? count : '';
  }));

  data.push(buildStatRow('全', (emp) => {
    let count = 0;
    for (const date of dateRange) {
      const { code } = parseShiftCode(schedule[format(date, 'yyyy-MM-dd')]?.[emp.id]);
      if (code === BuiltInShifts.A_FULL || code === BuiltInShifts.P_FULL || code === BuiltInShifts.FULL_PLUS_2) count++;
    }
    return count > 0 ? count : '';
  }));

  data.push(buildStatRow('特休(時)', (emp) => {
    let hours = 0;
    for (const date of dateRange) {
      const { code, ot } = parseShiftCode(schedule[format(date, 'yyyy-MM-dd')]?.[emp.id]);
      if (code === BuiltInShifts.ANNUAL) {
         hours += (ot > 0 ? ot : shiftDefinitions[code]?.hours || 8);
      }
    }
    return hours > 0 ? hours : '';
  }));

  const otRow = buildStatRow('加班時數', (emp) => {
    let totalOt = 0;
    for (const date of dateRange) {
      const { code, ot, isLesson } = parseShiftCode(schedule[format(date, 'yyyy-MM-dd')]?.[emp.id]);
      if (code && shiftDefinitions[code] && code !== BuiltInShifts.ANNUAL && code !== BuiltInShifts.OFF) {
        if (!isLesson) {
           totalOt += (shiftDefinitions[code].defaultOvertime || 0) + ot;
        }
      }
    }
    return totalOt > 0 ? totalOt : '';
  });
  data.push(otRow);

  const hoursRow = buildStatRow('總工時(不含特休)', (emp) => {
    let totalHours = 0;
    for (const date of dateRange) {
      const { code, ot, isLesson } = parseShiftCode(schedule[format(date, 'yyyy-MM-dd')]?.[emp.id]);
      if (code && shiftDefinitions[code] && code !== BuiltInShifts.ANNUAL && code !== BuiltInShifts.OFF) {
        if (!isLesson) {
           totalHours += shiftDefinitions[code].hours + (shiftDefinitions[code].defaultOvertime || 0) + ot;
        }
      }
    }
    return totalHours > 0 ? totalHours : '';
  });
  data.push(hoursRow);

  const worksheetData = [titleRow, [], headerRow, ...data];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }); 

  const wscols = [{ wch: 12 }, { wch: 8 }]; 
  retailEmps.forEach(() => wscols.push({ wch: 15 }));
  if (dispensingEmps.length > 0) wscols.push({ wch: 2 });
  dispensingEmps.forEach(() => wscols.push({ wch: 15 }));
  ws['!cols'] = wscols;

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