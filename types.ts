
export type PersonName = string;
export type OnCallName = string;
export type Role = 'Shift' | 'Supervisor';

export interface Personnel {
  name: string;
  roles: Role[];
  isActive: boolean;
}

export interface ShiftEntry {
  id: number;
  dayName: string;
  date: string; // Persian date string YYYY/MM/DD
  dayShiftPerson: PersonName;
  nightShiftPerson: PersonName;
  onCallPerson: OnCallName;
  isHoliday: boolean;
  // New fields to track history of swaps
  originalDayShiftPerson?: PersonName;
  originalNightShiftPerson?: PersonName;
}

export interface StatEntry {
  name: PersonName;
  dayShifts: number;
  nightShifts: number;
  totalHours: number;
  weightedScore: number;
  offHours: number;
  workedHours: number;
}

export const SHIFT_WEIGHTS = {
  dayHours: 11,
  nightHours: 13,
  nightMultiplier: 1.5
};

export interface DashboardProps {
  scheduleData: ShiftEntry[];
  fullSchedule: ShiftEntry[]; // Added for Live Status
  shiftWorkers: string[];
  supervisors: string[];
  monthName: string;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  // Removed isEditable and onToggleEdit
  onUpdateShift: (id: number, type: 'dayShiftPerson' | 'nightShiftPerson' | 'onCallPerson', newPerson: string) => void;
  onToggleHoliday: (id: number) => void;
  onOpenReport: () => void;
  // Locking props
  isLocked: boolean;
  onToggleLock: () => void;
  onRegenerate: () => void; // Added for Auto Arrange
}

export interface AppData {
  schedule: ShiftEntry[];
  personnel: Personnel[];
  lockedMonths: string[]; 
}
