
import { ShiftDefinition, Employee, BuiltInShifts } from './types';

export const STORES = [
  "東勢店",
  "新社店",
  "卓蘭店",
  "北苗店",
  "巨蛋店",
  "後龍店",
  "沙鹿店",
  "清水店"
];

export const DEPARTMENTS = {
  retail: '門市部',
  dispensing: '調劑部'
};

export const DEFAULT_SHIFT_DEFINITIONS: Record<string, ShiftDefinition> = {
  [BuiltInShifts.A]: {
    code: BuiltInShifts.A,
    label: 'A班',
    time: '09:00 - 17:30',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    weekendColor: 'bg-blue-200 text-blue-900 border-blue-300',
    shortLabel: 'A',
    description: '8小時 (扣0.5休)',
    hours: 8,
    sortOrder: 1
  },
  [BuiltInShifts.P]: {
    code: BuiltInShifts.P,
    label: 'P班',
    time: '13:30 - 22:00',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    weekendColor: 'bg-orange-200 text-orange-900 border-orange-300',
    shortLabel: 'P',
    description: '8小時 (扣0.5休)',
    hours: 8,
    sortOrder: 2
  },
  [BuiltInShifts.A_FULL]: {
    code: BuiltInShifts.A_FULL,
    label: 'A全',
    time: '09:00 - 20:00',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    weekendColor: 'bg-indigo-200 text-indigo-900 border-indigo-300',
    shortLabel: 'A全',
    description: '10小時 (扣1.0休)',
    hours: 10,
    sortOrder: 3
  },
  [BuiltInShifts.P_FULL]: {
    code: BuiltInShifts.P_FULL,
    label: 'P全',
    time: '11:00 - 22:00',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    weekendColor: 'bg-purple-200 text-purple-900 border-purple-300',
    shortLabel: 'P全',
    description: '10小時 (扣1.0休)',
    hours: 10,
    sortOrder: 4
  },
  [BuiltInShifts.FULL_PLUS_2]: {
    code: BuiltInShifts.FULL_PLUS_2,
    label: '全+2',
    time: '09:00 - 22:00',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    weekendColor: 'bg-rose-200 text-rose-900 border-rose-300',
    shortLabel: '全+2',
    description: '10小時 + 2小時加班',
    hours: 10, 
    defaultOvertime: 2,
    sortOrder: 5
  },
  [BuiltInShifts.LESSON]: {
    code: BuiltInShifts.LESSON,
    label: '上課',
    time: '13:00 - 17:00',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    weekendColor: 'bg-teal-200 text-teal-900 border-teal-300',
    shortLabel: '上',
    description: '上課 4小時 (計加班)',
    hours: 0,
    defaultOvertime: 4,
    sortOrder: 6
  },
  [BuiltInShifts.OFF]: {
    code: BuiltInShifts.OFF,
    label: '例假',
    time: '休假',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    weekendColor: 'bg-gray-200 text-gray-700 border-gray-300',
    shortLabel: '休',
    description: '例假日',
    hours: 0,
    sortOrder: 7
  },
  [BuiltInShifts.ANNUAL]: {
    code: BuiltInShifts.ANNUAL,
    label: '特休',
    time: '休假',
    color: 'bg-green-100 text-green-700 border-green-200',
    weekendColor: 'bg-green-200 text-green-800 border-green-300',
    shortLabel: '特',
    description: '特休假',
    hours: 8, 
    sortOrder: 8
  },
};

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: '王藥師', department: 'dispensing' },
  { id: '2', name: '李藥師', department: 'dispensing' },
  { id: '3', name: '張助理', department: 'retail' },
  { id: '4', name: '陳助理', department: 'retail' },
];
