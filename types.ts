
export type ShiftCode = string;

export const BuiltInShifts = {
  A: 'A',
  P: 'P',
  A_FULL: 'A_FULL',
  P_FULL: 'P_FULL',
  FULL_PLUS_2: 'FULL_PLUS_2',
  OFF: 'OFF',
  ANNUAL: 'ANNUAL',
  LESSON: 'LESSON'
} as const;

export interface ShiftDefinition {
  code: string;
  label: string;
  time: string;
  color: string;
  weekendColor?: string; // Added property for weekend specific styling
  shortLabel: string;
  description?: string;
  hours: number; 
  defaultOvertime?: number;
  sortOrder?: number;
}

export type Department = 'retail' | 'dispensing';

export interface Employee {
  id: string;
  name: string;
  department: Department;
}

// Map: DateString (YYYY-MM-DD) -> EmployeeID -> ShiftCode
export type DailySchedule = Record<string, ShiftCode>;
export type StoreSchedule = Record<string, DailySchedule>;

export interface ShiftStats {
  [key: string]: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ParsedShift {
  code: string | null;
  ot: number;
  isLesson: boolean;
}

export const parseShiftCode = (value: string | undefined): ParsedShift => {
  if (!value || typeof value !== 'string') {
    return { code: null, ot: 0, isLesson: false };
  }
  
  const parts = value.split(':');
  const code = parts[0];
  
  let ot = 0;
  if (parts.length > 1) {
    const parsed = parseInt(parts[1], 10);
    if (!isNaN(parsed)) {
      ot = parsed;
    }
  }

  const isLesson = parts.length > 2 && parts[2] === 'L';

  return { 
    code, 
    ot,
    isLesson
  };
};
