export interface Employee {
  id: string;
  name: string;
  title: string;
  startDate: Date;
  payType: 'hourly' | 'salary';
  payRate: number;
  status: 'active' | 'inactive';
  pin?: string;
  availability?: EmployeeAvailability[];
  tipEligible?: boolean; // Whether employee can receive tip splits
}

export interface EmployeeAvailability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  available: boolean;
  startTime?: string; // "09:00"
  endTime?: string; // "17:00"
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date;
}

export interface ShiftSwapRequest {
  id: string;
  shiftId: string;
  requestingEmployeeId: string;
  targetEmployeeId?: string; // If swapping with specific person
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date;
}

export interface PayChangeHistory {
  id: string;
  employeeId: string;
  previousRate: number;
  newRate: number;
  previousPayType: 'hourly' | 'salary';
  newPayType: 'hourly' | 'salary';
  effectiveDate: Date;
  comment: string;
  changedAt: Date;
  changedBy: string;
}

export interface EmployeeChangeHistory {
  id: string;
  employeeId: string;
  field: string;
  previousValue: any;
  newValue: any;
  changedAt: Date;
  changedBy: string;
}

export interface ScheduledShift {
  id: string;
  employeeId?: string; // Optional for open shifts
  role: string;
  store: string;
  startTime: Date;
  endTime: Date;
  published: boolean;
  isOpen?: boolean; // True if unassigned/open shift
  notes?: string;
}

export type PunchType = 'clock-in' | 'clock-out' | 'break-start' | 'break-end';

export interface TimePunch {
  id: string;
  employeeId: string;
  role: string;
  store: string;
  punchType: PunchType;
  timestamp: Date;
  synced: boolean;
  scheduledShiftId?: string; // Link to the scheduled shift if applicable
  unscheduled?: boolean; // True if punched without a scheduled shift
  editedBy?: string; // Manager who edited this punch
  editedAt?: Date; // When the punch was edited
  editNote?: string; // Note explaining the edit
}

// Time approval tracking
export interface TimeApproval {
  id: string;
  date: Date; // The date (day) being approved
  employeeId?: string; // If approving for a specific employee, otherwise undefined for full-day approval
  approvedBy: string;
  approvedAt: Date;
  notes?: string;
}

export interface PostApprovalEdit {
  id: string;
  originalPunchId: string;
  employeeId: string;
  date: Date;
  editedBy: string;
  editedAt: Date;
  editNote: string;
}

// Payroll structures
export type PayFrequency = 'weekly' | 'biweekly' | 'semi-monthly';

export interface PaySchedule {
  id: string;
  name: string;
  frequency: PayFrequency;
  startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // For weekly/biweekly - 0 = Sunday
  firstPayDate?: Date; // For semi-monthly
  secondPayDate?: Date; // For semi-monthly (e.g., 15th and last day)
  applicableEmployeeIds?: string[]; // If undefined, applies to all
  applicableStores?: string[]; // If undefined, applies to all
  active: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface PayrollRunEmployee {
  employeeId: string;
  employeePayrollId?: string; // External payroll system ID
  regularHours: number;
  regularRate: number;
  overtimeHours: number;
  overtimeRate: number;
  doubleTimeHours: number;
  doubleTimeRate: number;
  tips: number;
  totalHours: number;
  hasUnapprovedTime: boolean;
}

export interface PayrollRun {
  id: string;
  payScheduleId: string;
  periodStartDate: Date;
  periodEndDate: Date;
  employees: PayrollRunEmployee[];
  status: 'draft' | 'ready' | 'exported';
  exportedAt?: Date;
  exportedBy?: string;
  exportFormat?: string; // e.g., 'gusto-csv'
  modifiedAfterExport: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface RoleType {
  id: string;
  name: string;
  defaultHourlyRate?: number;
  color: string; // Hex color for visual identification
  active: boolean;
  sortOrder: number;
}

export interface ShiftType {
  id: string;
  name: string;
  defaultStartTime?: string; // "06:00"
  defaultEndTime?: string; // "14:00"
  defaultRoleId?: string;
  breakExpectation?: string; // "30 min", "1 hour", etc.
  active: boolean;
  sortOrder: number;
}

export interface DefaultShift {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  roleId: string;
  shiftTypeId?: string;
  quantity: number; // How many of this shift needed
  notes?: string;
}

export interface TimeClockSettings {
  pinEnabled: boolean;
  pinLength: 4 | 6;
  breakTrackingEnabled: boolean;
  roleSelectionAtClockIn: boolean;
  operatingHoursStart?: string; // Deprecated - kept for backward compatibility
  operatingHoursEnd?: string; // Deprecated - kept for backward compatibility
  operatingHoursByDay?: DayOperatingHours[]; // New day-specific operating hours
  burdenRate: number; // Labor burden rate as a percentage (default 20)
}

export interface DayOperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  enabled: boolean; // If false, the store is closed this day
  opensAt?: string; // "06:00" format
  closesAt?: string; // "23:00" format
}