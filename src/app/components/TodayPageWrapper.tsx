import { useState } from 'react';
import { TodayPage } from './TodayPage';
import type { Employee, ScheduledShift, TimePunch, PunchType } from './labor/types';

// Initialize with same data as LaborModule for consistency
const initialEmployees: Employee[] = [
  { id: 'emp-1', name: 'Sarah Johnson', title: 'Manager', startDate: new Date('2023-01-15'), payType: 'salary', payRate: 52000, status: 'active', pin: '1234', tipEligible: false },
  { id: 'emp-2', name: 'Mike Chen', title: 'Cook', startDate: new Date('2023-03-10'), payType: 'hourly', payRate: 16.00, status: 'active', pin: '2345', tipEligible: true },
  { id: 'emp-3', name: 'Emily Rodriguez', title: 'Cashier', startDate: new Date('2023-06-01'), payType: 'hourly', payRate: 15.00, status: 'active', pin: '3456', tipEligible: true },
  { id: 'emp-4', name: 'James Wilson', title: 'Line Cook', startDate: new Date('2023-02-20'), payType: 'hourly', payRate: 16.50, status: 'active', pin: '4567', tipEligible: true },
  { id: 'emp-5', name: 'Amanda Lee', title: 'Cashier', startDate: new Date('2023-07-15'), payType: 'hourly', payRate: 14.50, status: 'active', pin: '5678', tipEligible: true },
  { id: 'emp-6', name: 'David Martinez', title: 'Assistant Manager', startDate: new Date('2023-04-01'), payType: 'salary', payRate: 45000, status: 'active', pin: '6789', tipEligible: false },
  { id: 'emp-7', name: 'Lisa Thompson', title: 'Prep Cook', startDate: new Date('2023-08-01'), payType: 'hourly', payRate: 14.00, status: 'active', pin: '7890', tipEligible: true },
];

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const generateTodaySchedule = (): ScheduledShift[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const shifts: ScheduledShift[] = [];
  let shiftId = 1;

  // Morning shift - Manager + Cook + Cashier
  const morning1 = new Date(today);
  shifts.push({
    id: `shift-${shiftId++}`,
    employeeId: 'emp-1',
    role: 'Manager',
    store: 'Main Street',
    startTime: new Date(morning1.setHours(6, 0, 0, 0)),
    endTime: new Date(morning1.setHours(14, 0, 0, 0)),
    published: true,
  });

  const morning2 = new Date(today);
  shifts.push({
    id: `shift-${shiftId++}`,
    employeeId: 'emp-2',
    role: 'Cook',
    store: 'Main Street',
    startTime: new Date(morning2.setHours(6, 30, 0, 0)),
    endTime: new Date(morning2.setHours(14, 30, 0, 0)),
    published: true,
  });

  const morning3 = new Date(today);
  shifts.push({
    id: `shift-${shiftId++}`,
    employeeId: 'emp-3',
    role: 'Cashier',
    store: 'Main Street',
    startTime: new Date(morning3.setHours(7, 0, 0, 0)),
    endTime: new Date(morning3.setHours(15, 0, 0, 0)),
    published: true,
  });

  // Evening shift - Line Cook + Cashier
  const evening1 = new Date(today);
  shifts.push({
    id: `shift-${shiftId++}`,
    employeeId: 'emp-4',
    role: 'Line Cook',
    store: 'Main Street',
    startTime: new Date(evening1.setHours(14, 0, 0, 0)),
    endTime: new Date(evening1.setHours(22, 0, 0, 0)),
    published: true,
  });

  const evening2 = new Date(today);
  shifts.push({
    id: `shift-${shiftId++}`,
    employeeId: 'emp-5',
    role: 'Cashier',
    store: 'Main Street',
    startTime: new Date(evening2.setHours(15, 0, 0, 0)),
    endTime: new Date(evening2.setHours(23, 0, 0, 0)),
    published: true,
  });

  return shifts;
};

export function TodayPageWrapper() {
  const [employees] = useState<Employee[]>(initialEmployees);
  const [scheduledShifts] = useState<ScheduledShift[]>(generateTodaySchedule());
  const [timePunches, setTimePunches] = useState<TimePunch[]>([]);

  const handlePunch = (employeeId: string, punchType: PunchType) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const newPunch: TimePunch = {
      id: `punch-${Date.now()}`,
      employeeId,
      role: employee.title,
      store: 'Main Street',
      punchType,
      timestamp: new Date(),
      synced: true,
    };

    setTimePunches(prev => [...prev, newPunch]);
  };

  return (
    <TodayPage
      employees={employees}
      scheduledShifts={scheduledShifts}
      timePunches={timePunches}
      onPunch={handlePunch}
    />
  );
}