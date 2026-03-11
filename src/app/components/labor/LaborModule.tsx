import { useState, useMemo } from 'react';
import { Clock, Users, Calendar, Settings, CheckCircle, DollarSign } from 'lucide-react';
import { LaborOverview } from './LaborOverview';
import { TimeClock } from './TimeClock';
import { EmployeeSchedule } from './EmployeeSchedule';
import { ScheduleView } from './ScheduleView';
import { EmployeeManagement } from './EmployeeManagement';
import { ConfigView } from './ConfigView';
import { ApproveTimeView } from './ApproveTimeView';
import { PayrollView } from './PayrollView';
import type { 
  Employee, 
  ScheduledShift, 
  PunchType, 
  TimePunch, 
  PayChangeHistory, 
  EmployeeChangeHistory, 
  TimeOffRequest, 
  ShiftSwapRequest,
  RoleType,
  ShiftType,
  DefaultShift,
  TimeClockSettings,
  TimeApproval,
  PostApprovalEdit,
  PaySchedule,
  PayrollRun,
  PayrollRunEmployee
} from './types';

interface LaborModuleProps {
  userRole: 'employee' | 'manager';
  currentEmployeeId?: string;
  transactions?: Array<{
    id: string;
    timestamp: Date;
    tips?: number;
  }>;
}

// Initial mock data
const initialEmployees: Employee[] = [
  { id: 'emp-1', name: 'Sarah Johnson', title: 'Manager', startDate: new Date('2023-01-15'), payType: 'salary', payRate: 52000, status: 'active', pin: '1234', tipEligible: false },
  { id: 'emp-2', name: 'Mike Chen', title: 'Cook', startDate: new Date('2023-03-10'), payType: 'hourly', payRate: 16.00, status: 'active', pin: '2345', tipEligible: true },
  { id: 'emp-3', name: 'Emily Rodriguez', title: 'Cashier', startDate: new Date('2023-06-01'), payType: 'hourly', payRate: 15.00, status: 'active', pin: '3456', tipEligible: true },
  { id: 'emp-4', name: 'James Wilson', title: 'Line Cook', startDate: new Date('2023-02-20'), payType: 'hourly', payRate: 16.50, status: 'active', pin: '4567', tipEligible: true },
  { id: 'emp-5', name: 'Amanda Lee', title: 'Cashier', startDate: new Date('2023-07-15'), payType: 'hourly', payRate: 14.50, status: 'active', pin: '5678', tipEligible: true },
  { id: 'emp-6', name: 'David Martinez', title: 'Assistant Manager', startDate: new Date('2023-04-01'), payType: 'salary', payRate: 45000, status: 'active', pin: '6789', tipEligible: false },
  { id: 'emp-7', name: 'Lisa Thompson', title: 'Prep Cook', startDate: new Date('2023-08-01'), payType: 'hourly', payRate: 14.00, status: 'active', pin: '7890', tipEligible: true },
  { id: 'emp-8', name: 'Chris Anderson', title: 'Cashier', startDate: new Date('2022-12-01'), payType: 'hourly', payRate: 14.50, status: 'inactive', pin: '8901', tipEligible: true },
];

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const generateInitialSchedule = (): ScheduledShift[] => {
  const weekStart = getWeekStart(new Date());
  const shifts: ScheduledShift[] = [];
  let shiftId = 1;

  // Generate shifts for the week
  for (let day = 0; day < 7; day++) {
    const shiftDate = new Date(weekStart);
    shiftDate.setDate(weekStart.getDate() + day);

    // Morning shift - Manager + Cook + Cashier
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-1',
      role: 'Manager',
      store: 'Main Street',
      startTime: new Date(shiftDate.setHours(6, 0, 0, 0)),
      endTime: new Date(shiftDate.setHours(14, 0, 0, 0)),
      published: true,
    });

    const morningCook = new Date(weekStart);
    morningCook.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-2',
      role: 'Cook',
      store: 'Main Street',
      startTime: new Date(morningCook.setHours(6, 30, 0, 0)),
      endTime: new Date(morningCook.setHours(14, 30, 0, 0)),
      published: true,
    });

    const morningCashier = new Date(weekStart);
    morningCashier.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-3',
      role: 'Cashier',
      store: 'Main Street',
      startTime: new Date(morningCashier.setHours(7, 0, 0, 0)),
      endTime: new Date(morningCashier.setHours(15, 0, 0, 0)),
      published: true,
    });

    // Evening shift - Manager + Cook + Cashiers
    const eveningManager = new Date(weekStart);
    eveningManager.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-6',
      role: 'Manager',
      store: 'Main Street',
      startTime: new Date(eveningManager.setHours(14, 0, 0, 0)),
      endTime: new Date(eveningManager.setHours(22, 0, 0, 0)),
      published: true,
    });

    const eveningCook = new Date(weekStart);
    eveningCook.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-4',
      role: 'Cook',
      store: 'Main Street',
      startTime: new Date(eveningCook.setHours(14, 30, 0, 0)),
      endTime: new Date(eveningCook.setHours(22, 30, 0, 0)),
      published: true,
    });

    const eveningCashier = new Date(weekStart);
    eveningCashier.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-5',
      role: 'Cashier',
      store: 'Main Street',
      startTime: new Date(eveningCashier.setHours(15, 0, 0, 0)),
      endTime: new Date(eveningCashier.setHours(23, 0, 0, 0)),
      published: true,
    });

    // Prep shift
    const prepShift = new Date(weekStart);
    prepShift.setDate(weekStart.getDate() + day);
    shifts.push({
      id: `shift-${shiftId++}`,
      employeeId: 'emp-7',
      role: 'Prep',
      store: 'Main Street',
      startTime: new Date(prepShift.setHours(5, 0, 0, 0)),
      endTime: new Date(prepShift.setHours(13, 0, 0, 0)),
      published: true,
    });
  }

  return shifts;
};

const generateSamplePunches = (): TimePunch[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const punches: TimePunch[] = [];
  let punchId = 1;

  // Helper to create a date at specific day offset and time
  const createDate = (daysAgo: number, hours: number, minutes: number = 0): Date => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Generate 14 days of historical punches (2 weeks)
  // Week 1 (7-13 days ago) - Complete and approved
  for (let daysAgo = 13; daysAgo >= 7; daysAgo--) {
    // Manager - Sarah (emp-1): 6am-2pm
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-1',
      role: 'Manager',
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: createDate(daysAgo, 6, 5),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-1',
      role: 'Manager',
      store: 'Main Street',
      punchType: 'clock-out',
      timestamp: createDate(daysAgo, 14, 3),
      synced: true,
    });

    // Cook - Mike (emp-2): 6:30am-2:30pm with break
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-2',
      role: 'Cook',
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: createDate(daysAgo, 6, 32),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-2',
      role: 'Cook',
      store: 'Main Street',
      punchType: 'break-start',
      timestamp: createDate(daysAgo, 11, 0),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-2',
      role: 'Cook',
      store: 'Main Street',
      punchType: 'break-end',
      timestamp: createDate(daysAgo, 11, 30),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-2',
      role: 'Cook',
      store: 'Main Street',
      punchType: 'clock-out',
      timestamp: createDate(daysAgo, 14, 35),
      synced: true,
    });

    // Cashier - Emily (emp-3): 7am-3pm
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-3',
      role: 'Cashier',
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: createDate(daysAgo, 7, 2),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-3',
      role: 'Cashier',
      store: 'Main Street',
      punchType: 'clock-out',
      timestamp: createDate(daysAgo, 15, 5),
      synced: true,
    });

    // Line Cook - James (emp-4): 2pm-10pm evening shift
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-4',
      role: 'Line Cook',
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: createDate(daysAgo, 14, 3),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-4',
      role: 'Line Cook',
      store: 'Main Street',
      punchType: 'clock-out',
      timestamp: createDate(daysAgo, 22, 8),
      synced: true,
    });

    // Cashier - Amanda (emp-5): 3pm-11pm evening shift
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-5',
      role: 'Cashier',
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: createDate(daysAgo, 15, 0),
      synced: true,
    });
    punches.push({
      id: `punch-${punchId++}`,
      employeeId: 'emp-5',
      role: 'Cashier',
      store: 'Main Street',
      punchType: 'clock-out',
      timestamp: createDate(daysAgo, 23, 5),
      synced: true,
    });
  }

  // Week 2 (0-6 days ago) - Mixed scenarios, needs approval
  
  // 6 days ago - Normal day
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(6, 6, 8),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(6, 14, 5),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(6, 6, 35),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(6, 14, 40),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(6, 7, 5),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(6, 15, 2),
    synced: true,
  });

  // 5 days ago - Missing clock-out for emp-4 (exception!)
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(5, 6, 3),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(5, 14, 0),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(5, 6, 30),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(5, 14, 32),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(5, 14, 5),
    synced: true,
  });
  // Missing clock-out for emp-4!

  // 4 days ago - Unscheduled punch for emp-7 (exception!)
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(4, 6, 28),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(4, 14, 30),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(4, 7, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(4, 15, 3),
    synced: true,
  });

  // Unscheduled - emp-7 came in without being scheduled
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-7',
    role: 'Prep Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(4, 8, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-7',
    role: 'Prep Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(4, 12, 0),
    synced: true,
  });

  // 3 days ago - Short shift for emp-5 (only 3 hours instead of 8)
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(3, 6, 10),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(3, 14, 8),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(3, 14, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(3, 22, 5),
    synced: true,
  });

  // Short shift - emp-5 left early (sick?)
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-5',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(3, 15, 2),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-5',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(3, 18, 10), // Only 3 hours instead of 8
    synced: true,
  });

  // 2 days ago - Normal day with breaks
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(2, 6, 5),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(2, 14, 2),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(2, 6, 30),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'break-start',
    timestamp: createDate(2, 11, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'break-end',
    timestamp: createDate(2, 11, 30),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(2, 14, 33),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(2, 7, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(2, 15, 0),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(2, 14, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(2, 22, 3),
    synced: true,
  });

  // 1 day ago - Normal operations
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(1, 6, 7),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(1, 14, 5),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(1, 6, 33),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(1, 14, 38),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(1, 7, 3),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(1, 15, 7),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(1, 14, 2),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(1, 22, 10),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-5',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(1, 15, 0),
    synced: true,
  });
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-5',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-out',
    timestamp: createDate(1, 23, 8),
    synced: true,
  });

  // Today - Current shifts in progress
  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(0, 6, 5),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(0, 6, 32),
    synced: true,
  });

  punches.push({
    id: `punch-${punchId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    punchType: 'clock-in',
    timestamp: createDate(0, 7, 2),
    synced: true,
  });

  return punches;
};

export function LaborModule({ userRole, currentEmployeeId = 'emp-1', transactions = [] }: LaborModuleProps) {
  const [activeTab, setActiveTab] = useState(userRole === 'manager' ? 'overview' : 'timeclock');
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>(generateInitialSchedule());
  const [timePunches, setTimePunches] = useState<TimePunch[]>(generateSamplePunches());
  const [payChangeHistory, setPayChangeHistory] = useState<PayChangeHistory[]>([]);
  const [employeeChangeHistory, setEmployeeChangeHistory] = useState<EmployeeChangeHistory[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [shiftSwapRequests, setShiftSwapRequests] = useState<ShiftSwapRequest[]>([]);

  // Config state
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([
    { id: 'role-1', name: 'Manager', defaultHourlyRate: 20, color: '#3B82F6', active: true, sortOrder: 0 },
    { id: 'role-2', name: 'Cook', defaultHourlyRate: 16, color: '#10B981', active: true, sortOrder: 1 },
    { id: 'role-3', name: 'Cashier', defaultHourlyRate: 15, color: '#F59E0B', active: true, sortOrder: 2 },
    { id: 'role-4', name: 'Prep', defaultHourlyRate: 14, color: '#EF4444', active: true, sortOrder: 3 },
  ]);

  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([
    { id: 'shift-type-1', name: 'Opening', defaultStartTime: '06:00', defaultEndTime: '14:00', breakExpectation: '30 min', active: true, sortOrder: 0 },
    { id: 'shift-type-2', name: 'Mid', defaultStartTime: '10:00', defaultEndTime: '18:00', breakExpectation: '30 min', active: true, sortOrder: 1 },
    { id: 'shift-type-3', name: 'Closing', defaultStartTime: '14:00', defaultEndTime: '22:00', breakExpectation: '30 min', active: true, sortOrder: 2 },
  ]);

  const [defaultShifts, setDefaultShifts] = useState<DefaultShift[]>([
    { id: 'default-1', dayOfWeek: 1, roleId: 'role-1', shiftTypeId: 'shift-type-1', quantity: 1 },
    { id: 'default-2', dayOfWeek: 1, roleId: 'role-2', shiftTypeId: 'shift-type-1', quantity: 2 },
    { id: 'default-3', dayOfWeek: 1, roleId: 'role-3', shiftTypeId: 'shift-type-1', quantity: 2 },
  ]);

  const [timeClockSettings, setTimeClockSettings] = useState<TimeClockSettings>({
    pinEnabled: true,
    pinLength: 4,
    breakTrackingEnabled: true,
    roleSelectionAtClockIn: false,
    operatingHoursStart: '06:00',
    operatingHoursEnd: '22:00',
    burdenRate: 20,
    operatingHoursByDay: [
      { day: 'Monday', start: '06:00', end: '22:00' },
      { day: 'Tuesday', start: '06:00', end: '22:00' },
      { day: 'Wednesday', start: '06:00', end: '22:00' },
      { day: 'Thursday', start: '06:00', end: '22:00' },
      { day: 'Friday', start: '06:00', end: '22:00' },
      { day: 'Saturday', start: '06:00', end: '22:00' },
      { day: 'Sunday', start: '06:00', end: '22:00' },
    ],
  });

  // Pre-populate some approved time for the first week (7-13 days ago)
  const generateInitialApprovals = (): TimeApproval[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvals: TimeApproval[] = [];
    
    // Approve all days from 7-13 days ago (week 1)
    for (let daysAgo = 13; daysAgo >= 7; daysAgo--) {
      const approvalDate = new Date(today);
      approvalDate.setDate(today.getDate() - daysAgo);
      
      approvals.push({
        id: `approval-initial-${daysAgo}`,
        date: approvalDate,
        approvedBy: 'Manager',
        approvedAt: new Date(approvalDate.getTime() + 24 * 60 * 60 * 1000), // Approved next day
      });
    }
    
    return approvals;
  };

  const [timeApprovals, setTimeApprovals] = useState<TimeApproval[]>(generateInitialApprovals());
  const [postApprovalEdits, setPostApprovalEdits] = useState<PostApprovalEdit[]>([]);
  const [paySchedules, setPaySchedules] = useState<PaySchedule[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);

  const currentEmployee = employees.find(e => e.id === currentEmployeeId);

  const tabs = useMemo(() => {
    if (userRole === 'manager') {
      return [
        { id: 'overview', label: 'Labor Overview', icon: Clock },
        { id: 'timeclock', label: 'Time Clock', icon: Clock },
        { id: 'schedule-mgmt', label: 'Schedule Management', icon: Calendar },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'config', label: 'Config', icon: Settings },
        { id: 'approve-time', label: 'Approve Time', icon: CheckCircle },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
      ];
    } else {
      return [
        { id: 'timeclock', label: 'Time Clock', icon: Clock },
        { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
      ];
    }
  }, [userRole]);

  const handleAddPunch = (punch: Omit<TimePunch, 'id' | 'synced'>) => {
    const newPunch: TimePunch = {
      ...punch,
      id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false, // Will sync later in real implementation
    };
    setTimePunches(prev => [...prev, newPunch]);
  };

  const handleEditPunch = (punchId: string, newTimestamp: Date, editNote?: string) => {
    setTimePunches(prev => prev.map(p => 
      p.id === punchId ? { 
        ...p, 
        timestamp: newTimestamp,
        editedBy: editNote ? 'Manager' : p.editedBy,
        editedAt: editNote ? new Date() : p.editedAt,
        editNote: editNote || p.editNote,
      } : p
    ));
  };

  const handleDeletePunch = (punchId: string) => {
    setTimePunches(prev => prev.filter(p => p.id !== punchId));
  };

  const handleUpdateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => 
      e.id === employeeId ? { ...e, ...updates } : e
    ));
  };

  const handleAddEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleAddShift = (shift: Omit<ScheduledShift, 'id'>) => {
    const newShift: ScheduledShift = {
      ...shift,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setScheduledShifts(prev => [...prev, newShift]);
  };

  const handleUpdateShift = (shiftId: string, updates: Partial<ScheduledShift>) => {
    setScheduledShifts(prev => prev.map(s => 
      s.id === shiftId ? { ...s, ...updates } : s
    ));
  };

  const handleDeleteShift = (shiftId: string) => {
    setScheduledShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  const handlePublishSchedule = () => {
    setScheduledShifts(prev => prev.map(s => ({ ...s, published: true })));
  };

  const handlePublishWeekSchedule = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    setScheduledShifts(prev => prev.map(s => {
      const shiftDate = new Date(s.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      if (shiftDate >= weekStart && shiftDate <= weekEnd) {
        return { ...s, published: true };
      }
      return s;
    }));
  };

  const handleCopyPreviousWeek = (currentWeekStart: Date) => {
    // Get previous week start
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);

    // Get shifts from previous week
    const previousWeekShifts = scheduledShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate >= previousWeekStart && shiftDate <= previousWeekEnd;
    });

    // Create new shifts for current week
    const newShifts: ScheduledShift[] = previousWeekShifts.map(shift => {
      const dayOffset = Math.floor((shift.startTime.getTime() - previousWeekStart.getTime()) / (1000 * 60 * 60 * 24));
      
      const newStartTime = new Date(currentWeekStart);
      newStartTime.setDate(currentWeekStart.getDate() + dayOffset);
      newStartTime.setHours(shift.startTime.getHours(), shift.startTime.getMinutes(), 0, 0);

      const newEndTime = new Date(currentWeekStart);
      newEndTime.setDate(currentWeekStart.getDate() + dayOffset);
      newEndTime.setHours(shift.endTime.getHours(), shift.endTime.getMinutes(), 0, 0);

      return {
        ...shift,
        id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: newStartTime,
        endTime: newEndTime,
        published: false,
      };
    });

    setScheduledShifts(prev => [...prev, ...newShifts]);
  };

  const handleAddPayChange = (change: Omit<PayChangeHistory, 'id' | 'changedAt'>) => {
    const newChange: PayChangeHistory = {
      ...change,
      id: `pay-change-${Date.now()}`,
      changedAt: new Date(),
    };
    setPayChangeHistory(prev => [...prev, newChange]);
  };

  const handleAddEmployeeChange = (change: Omit<EmployeeChangeHistory, 'id' | 'changedAt'>) => {
    const newChange: EmployeeChangeHistory = {
      ...change,
      id: `emp-change-${Date.now()}`,
      changedAt: new Date(),
    };
    setEmployeeChangeHistory(prev => [...prev, newChange]);
  };

  const handleApproveTime = (approval: Omit<TimeApproval, 'id' | 'approvedAt' | 'approvedBy'>) => {
    const newApproval: TimeApproval = {
      ...approval,
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      approvedBy: 'Manager',
      approvedAt: new Date(),
    };
    setTimeApprovals(prev => [...prev, newApproval]);
  };

  const handleRecordPostApprovalEdit = (edit: Omit<PostApprovalEdit, 'id'>) => {
    const newEdit: PostApprovalEdit = {
      ...edit,
      id: `post-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPostApprovalEdits(prev => [...prev, newEdit]);
  };

  // Payroll handlers
  const handleAddPaySchedule = (schedule: Omit<PaySchedule, 'id' | 'createdAt' | 'createdBy'>) => {
    const newSchedule: PaySchedule = {
      ...schedule,
      id: `payschedule-${Date.now()}`,
      createdAt: new Date(),
      createdBy: 'Manager',
    };
    setPaySchedules(prev => [...prev, newSchedule]);
  };

  const handleUpdatePaySchedule = (scheduleId: string, updates: Partial<PaySchedule>) => {
    setPaySchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, ...updates } : s
    ));
  };

  const handleGeneratePayrollRun = (payScheduleId: string, periodStart: Date, periodEnd: Date) => {
    // Calculate tips per employee from transactions during the payroll period
    const calculateEmployeeTips = (employeeId: string): number => {
      let totalTips = 0;
      
      // Get all transactions in the payroll period
      const periodTransactions = transactions.filter(t => {
        const txDate = new Date(t.timestamp);
        return txDate >= periodStart && txDate <= periodEnd;
      });
      
      // For each transaction with tips
      periodTransactions.forEach(transaction => {
        if (!transaction.tips || transaction.tips === 0) return;
        
        // Find employees who were working at the time of this transaction
        const transactionTime = new Date(transaction.timestamp);
        
        const workingEmployees = employees.filter(emp => {
          // Check if this employee was clocked in at transaction time
          const empPunches = timePunches.filter(p => p.employeeId === emp.id);
          const sortedPunches = [...empPunches].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          let isClockedIn = false;
          for (const punch of sortedPunches) {
            if (punch.timestamp > transactionTime) break;
            
            if (punch.punchType === 'clock-in') {
              isClockedIn = true;
            } else if (punch.punchType === 'clock-out') {
              isClockedIn = false;
            }
          }
          
          return isClockedIn;
        });
        
        // Filter for tip-eligible employees
        const tipEligibleEmployees = workingEmployees.filter(emp => emp.tipEligible !== false);
        
        // Split tip evenly among eligible employees
        if (tipEligibleEmployees.length > 0 && tipEligibleEmployees.some(emp => emp.id === employeeId)) {
          totalTips += transaction.tips / tipEligibleEmployees.length;
        }
      });
      
      return totalTips;
    };

    // Calculate payroll for each employee
    const employeePayrolls: PayrollRunEmployee[] = [];

    employees.filter(e => e.status === 'active' && e.payType === 'hourly').forEach(employee => {
      // Get approved punches for this period
      const periodPunches = timePunches.filter(p => {
        const punchDate = new Date(p.timestamp);
        return p.employeeId === employee.id && 
               punchDate >= periodStart && 
               punchDate <= periodEnd;
      });

      // Check if all time is approved
      let hasUnapprovedTime = false;
      const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < daysInPeriod; i++) {
        const checkDate = new Date(periodStart);
        checkDate.setDate(periodStart.getDate() + i);
        
        const dayPunches = periodPunches.filter(p => {
          const punchDate = new Date(p.timestamp);
          punchDate.setHours(0, 0, 0, 0);
          checkDate.setHours(0, 0, 0, 0);
          return punchDate.getTime() === checkDate.getTime();
        });

        if (dayPunches.length > 0) {
          const isApproved = timeApprovals.some(a => {
            const approvalDate = new Date(a.date);
            approvalDate.setHours(0, 0, 0, 0);
            checkDate.setHours(0, 0, 0, 0);
            return approvalDate.getTime() === checkDate.getTime() && 
                   (!a.employeeId || a.employeeId === employee.id);
          });

          if (!isApproved) {
            hasUnapprovedTime = true;
            break;
          }
        }
      }

      // Calculate hours from punches
      const clockIns = periodPunches.filter(p => p.punchType === 'clock-in').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const clockOuts = periodPunches.filter(p => p.punchType === 'clock-out').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      let totalMinutes = 0;
      const minPairs = Math.min(clockIns.length, clockOuts.length);
      
      for (let i = 0; i < minPairs; i++) {
        totalMinutes += (clockOuts[i].timestamp.getTime() - clockIns[i].timestamp.getTime()) / (1000 * 60);
      }

      // Calculate break time
      const breakStarts = periodPunches.filter(p => p.punchType === 'break-start').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const breakEnds = periodPunches.filter(p => p.punchType === 'break-end').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      let breakMinutes = 0;
      const minBreakPairs = Math.min(breakStarts.length, breakEnds.length);
      
      for (let i = 0; i < minBreakPairs; i++) {
        breakMinutes += (breakEnds[i].timestamp.getTime() - breakStarts[i].timestamp.getTime()) / (1000 * 60);
      }

      const totalHours = (totalMinutes - breakMinutes) / 60;

      // Calculate OT and DT (CA rules: OT after 8 hrs/day or 40 hrs/week, DT after 12 hrs/day)
      // Simplified: OT after 40 hrs/week, DT after 60 hrs/week
      let regularHours = Math.min(totalHours, 40);
      let overtimeHours = 0;
      let doubleTimeHours = 0;

      if (totalHours > 60) {
        doubleTimeHours = totalHours - 60;
        overtimeHours = 20;
        regularHours = 40;
      } else if (totalHours > 40) {
        overtimeHours = totalHours - 40;
        regularHours = 40;
      }

      const regularRate = employee.payRate;
      const overtimeRate = regularRate * 1.5;
      const doubleTimeRate = regularRate * 2.0;

      if (totalHours > 0) {
        employeePayrolls.push({
          employeeId: employee.id,
          regularHours,
          regularRate,
          overtimeHours,
          overtimeRate,
          doubleTimeHours,
          doubleTimeRate,
          tips: calculateEmployeeTips(employee.id), // Add tips calculation
          totalHours,
          hasUnapprovedTime,
        });
      }
    });

    const newPayrollRun: PayrollRun = {
      id: `payroll-${Date.now()}`,
      payScheduleId,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      employees: employeePayrolls,
      status: employeePayrolls.some(e => e.hasUnapprovedTime) ? 'draft' : 'ready',
      modifiedAfterExport: false,
      createdAt: new Date(),
      createdBy: 'Manager',
    };

    setPayrollRuns(prev => [...prev, newPayrollRun]);
  };

  const handleExportPayrollRun = (payrollRunId: string) => {
    // Mark as exported
    setPayrollRuns(prev => prev.map(r => 
      r.id === payrollRunId ? {
        ...r,
        status: 'exported' as const,
        exportedAt: new Date(),
        exportedBy: 'Manager',
        exportFormat: 'gusto-csv',
      } : r
    ));

    // In real implementation, would generate and download CSV file
    console.log('Exporting payroll run:', payrollRunId);
    alert('Payroll data exported successfully! In a real system, this would download a CSV file formatted for your payroll provider.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Labor Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === 'manager' ? 'Manager View' : `Welcome, ${currentEmployee?.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-gray-900 text-gray-900 -mb-px'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'overview' && userRole === 'manager' && (
          <LaborOverview 
            employees={employees}
            timePunches={timePunches}
            scheduledShifts={scheduledShifts}
            burdenRate={timeClockSettings.burdenRate}
          />
        )}

        {activeTab === 'timeclock' && (
          <TimeClock
            employees={employees}
            timePunches={timePunches}
            scheduledShifts={scheduledShifts}
            onAddPunch={handleAddPunch}
            userRole={userRole}
            currentEmployeeId={currentEmployeeId}
          />
        )}

        {activeTab === 'my-schedule' && userRole === 'employee' && (
          <EmployeeSchedule
            employeeId={currentEmployeeId}
            scheduledShifts={scheduledShifts}
            employee={currentEmployee}
          />
        )}

        {activeTab === 'schedule-mgmt' && userRole === 'manager' && (
          <ScheduleView
            employees={employees}
            scheduledShifts={scheduledShifts}
            timePunches={timePunches}
            roleTypes={roleTypes}
            timeClockSettings={timeClockSettings}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
          />
        )}

        {activeTab === 'employees' && userRole === 'manager' && (
          <EmployeeManagement
            employees={employees}
            timePunches={timePunches}
            payChangeHistory={payChangeHistory}
            employeeChangeHistory={employeeChangeHistory}
            onUpdateEmployee={handleUpdateEmployee}
            onAddEmployee={handleAddEmployee}
            onAddPayChange={handleAddPayChange}
            onAddEmployeeChange={handleAddEmployeeChange}
            onEditPunch={handleEditPunch}
            onDeletePunch={handleDeletePunch}
          />
        )}

        {activeTab === 'config' && userRole === 'manager' && (
          <ConfigView
            roleTypes={roleTypes}
            shiftTypes={shiftTypes}
            defaultShifts={defaultShifts}
            timeClockSettings={timeClockSettings}
            onUpdateRoleTypes={setRoleTypes}
            onUpdateShiftTypes={setShiftTypes}
            onUpdateDefaultShifts={setDefaultShifts}
            onUpdateTimeClockSettings={setTimeClockSettings}
          />
        )}

        {activeTab === 'approve-time' && userRole === 'manager' && (
          <ApproveTimeView
            employees={employees}
            timePunches={timePunches}
            scheduledShifts={scheduledShifts}
            timeApprovals={timeApprovals}
            postApprovalEdits={postApprovalEdits}
            onAddPunch={handleAddPunch}
            onEditPunch={handleEditPunch}
            onApproveTime={handleApproveTime}
            onRecordPostApprovalEdit={handleRecordPostApprovalEdit}
            burdenRate={timeClockSettings.burdenRate}
          />
        )}

        {activeTab === 'payroll' && userRole === 'manager' && (
          <PayrollView
            employees={employees}
            timePunches={timePunches}
            timeApprovals={timeApprovals}
            paySchedules={paySchedules}
            payrollRuns={payrollRuns}
            onAddPaySchedule={handleAddPaySchedule}
            onUpdatePaySchedule={handleUpdatePaySchedule}
            onGeneratePayrollRun={handleGeneratePayrollRun}
            onExportPayrollRun={handleExportPayrollRun}
          />
        )}
      </main>
    </div>
  );
}