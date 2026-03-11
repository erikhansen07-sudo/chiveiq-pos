import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Clock, Edit2, XCircle, Info, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Employee, TimePunch, ScheduledShift, TimeApproval, PostApprovalEdit } from './types';

interface ApproveTimeViewProps {
  employees: Employee[];
  timePunches: TimePunch[];
  scheduledShifts: ScheduledShift[];
  timeApprovals: TimeApproval[];
  postApprovalEdits: PostApprovalEdit[];
  onAddPunch: (punch: Omit<TimePunch, 'id' | 'synced'>) => void;
  onEditPunch: (punchId: string, newTimestamp: Date, editNote?: string) => void;
  onApproveTime: (approval: Omit<TimeApproval, 'id' | 'approvedAt' | 'approvedBy'>) => void;
  onRecordPostApprovalEdit: (edit: Omit<PostApprovalEdit, 'id'>) => void;
  burdenRate?: number;
}

interface DaySummary {
  date: Date;
  employeeCount: number;
  totalHours: number;
  totalLaborCost: number;
  totalBurdenCost: number;
  isApproved: boolean;
  hasExceptions: boolean;
}

interface EmployeeDaySummary {
  employee: Employee;
  clockIn?: Date;
  clockOut?: Date;
  totalHours: number;
  laborCost: number;
  burdenCost: number;
  breakMinutes: number;
  scheduledShift?: ScheduledShift;
  punches: TimePunch[];
  exceptions: Exception[];
  isApproved: boolean;
  hasPostApprovalEdits: boolean;
}

interface Exception {
  type: 'missing-out' | 'unscheduled' | 'short-shift' | 'edited' | 'late' | 'early-out';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function ApproveTimeView({
  employees,
  timePunches,
  scheduledShifts,
  timeApprovals,
  postApprovalEdits,
  onAddPunch,
  onEditPunch,
  onApproveTime,
  onRecordPostApprovalEdit,
  burdenRate = 20,
}: ApproveTimeViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingPunch, setEditingPunch] = useState<TimePunch | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [addingPunch, setAddingPunch] = useState<{ type: 'clock-in' | 'clock-out', employeeId: string } | null>(null);
  const [addPunchTime, setAddPunchTime] = useState<string>('');
  const [addPunchNote, setAddPunchNote] = useState<string>('');

  // Check if a date is approved
  const isDateApproved = (date: Date): boolean => {
    const dateKey = date.toISOString().split('T')[0];
    return timeApprovals.some(a => 
      !a.employeeId && 
      a.date.toISOString().split('T')[0] === dateKey
    );
  };

  // Check if a date/employee is approved
  const isApproved = (date: Date, employeeId?: string): boolean => {
    const dateKey = date.toISOString().split('T')[0];
    
    // Check for full-day approval
    const fullDayApproval = timeApprovals.some(a => 
      !a.employeeId && 
      a.date.toISOString().split('T')[0] === dateKey
    );
    
    if (fullDayApproval) return true;
    
    // Check for employee-specific approval
    if (employeeId) {
      return timeApprovals.some(a => 
        a.employeeId === employeeId && 
        a.date.toISOString().split('T')[0] === dateKey
      );
    }
    
    return false;
  };

  // Check if there are post-approval edits
  const hasPostApprovalEdits = (date: Date, employeeId: string): boolean => {
    const dateKey = date.toISOString().split('T')[0];
    return postApprovalEdits.some(e => 
      e.employeeId === employeeId && 
      e.date.toISOString().split('T')[0] === dateKey
    );
  };

  // Generate list of days with punch data (last 50 days)
  const daySummaries = useMemo((): DaySummary[] => {
    const days: DaySummary[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Get punches for this day
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      const dayPunches = timePunches.filter(p => {
        const punchDate = new Date(p.timestamp);
        return punchDate >= dateStart && punchDate <= dateEnd;
      });
      
      if (dayPunches.length === 0) continue;
      
      // Get unique employees
      const employeeIds = [...new Set(dayPunches.map(p => p.employeeId))];
      
      // Calculate total hours and labor cost
      let totalHours = 0;
      let totalLaborCost = 0;
      let hasExceptions = false;
      
      employeeIds.forEach(empId => {
        const employee = employees.find(e => e.id === empId);
        if (!employee) return;
        
        const empPunches = dayPunches.filter(p => p.employeeId === empId).sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        const clockIn = empPunches.find(p => p.punchType === 'clock-in');
        const clockOut = empPunches.find(p => p.punchType === 'clock-out');
        
        // Calculate break time
        let breakMinutes = 0;
        let breakStart: Date | null = null;
        empPunches.forEach(p => {
          if (p.punchType === 'break-start') {
            breakStart = p.timestamp;
          } else if (p.punchType === 'break-end' && breakStart) {
            breakMinutes += (p.timestamp.getTime() - breakStart.getTime()) / (1000 * 60);
            breakStart = null;
          }
        });
        
        if (clockIn && clockOut) {
          const totalMinutes = (clockOut.timestamp.getTime() - clockIn.timestamp.getTime()) / (1000 * 60);
          const hours = (totalMinutes - breakMinutes) / 60;
          totalHours += hours;
          
          if (employee.payRate) {
            // Convert salary to hourly if needed
            const hourlyRate = employee.payType === 'salary' 
              ? employee.payRate / 52 / 40 
              : employee.payRate;
            totalLaborCost += hours * hourlyRate;
          }
        } else if (clockIn && !clockOut) {
          hasExceptions = true;
        }
        
        // Check for other exceptions
        const scheduledShift = scheduledShifts.find(s => {
          if (s.employeeId !== empId) return false;
          const shiftDate = new Date(s.startTime);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate.getTime() === dateStart.getTime();
        });
        
        if (!scheduledShift && clockIn) {
          hasExceptions = true;
        }
      });
      
      const totalBurdenCost = totalLaborCost * (burdenRate / 100);
      
      days.push({
        date,
        employeeCount: employeeIds.length,
        totalHours,
        totalLaborCost,
        totalBurdenCost,
        isApproved: isDateApproved(date),
        hasExceptions,
      });
    }
    
    return days;
  }, [timePunches, employees, scheduledShifts, timeApprovals, burdenRate]);

  // Build employee summaries for the selected date
  const buildEmployeeSummaries = (date: Date): EmployeeDaySummary[] => {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get punches for this day
    const dayPunches = timePunches.filter(p => {
      const punchDate = new Date(p.timestamp);
      return punchDate >= dateStart && punchDate <= dateEnd;
    });

    // Get employees who worked
    const employeeIds = [...new Set(dayPunches.map(p => p.employeeId))];
    
    const summaries: EmployeeDaySummary[] = employeeIds.map(empId => {
      const employee = employees.find(e => e.id === empId)!;
      const empPunches = dayPunches.filter(p => p.employeeId === empId).sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );

      // Find scheduled shift for this employee on this day
      const scheduledShift = scheduledShifts.find(s => {
        if (s.employeeId !== empId) return false;
        const shiftDate = new Date(s.startTime);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === dateStart.getTime();
      });

      // Calculate times
      const clockInPunch = empPunches.find(p => p.punchType === 'clock-in');
      const clockOutPunch = empPunches.find(p => p.punchType === 'clock-out');
      
      // Calculate break time
      let breakMinutes = 0;
      let breakStart: Date | null = null;
      empPunches.forEach(p => {
        if (p.punchType === 'break-start') {
          breakStart = p.timestamp;
        } else if (p.punchType === 'break-end' && breakStart) {
          breakMinutes += (p.timestamp.getTime() - breakStart.getTime()) / (1000 * 60);
          breakStart = null;
        }
      });

      // Calculate total hours
      let totalHours = 0;
      if (clockInPunch && clockOutPunch) {
        const totalMinutes = (clockOutPunch.timestamp.getTime() - clockInPunch.timestamp.getTime()) / (1000 * 60);
        totalHours = (totalMinutes - breakMinutes) / 60;
      }

      // Calculate labor cost (convert salary to hourly if needed)
      const hourlyRate = employee.payType === 'salary' && employee.payRate
        ? employee.payRate / 52 / 40
        : (employee.payRate || 0);
      const laborCost = totalHours * hourlyRate;

      // Calculate burden cost
      const burdenCost = laborCost * (burdenRate / 100);

      // Detect exceptions
      const exceptions: Exception[] = [];

      // Missing clock-out
      if (clockInPunch && !clockOutPunch) {
        exceptions.push({
          type: 'missing-out',
          message: 'Missing clock-out',
          severity: 'error',
        });
      }

      // Unscheduled punch
      if (!scheduledShift && clockInPunch) {
        exceptions.push({
          type: 'unscheduled',
          message: 'Unscheduled shift',
          severity: 'warning',
        });
      }

      // Short shift (less than 2 hours)
      if (totalHours > 0 && totalHours < 2) {
        exceptions.push({
          type: 'short-shift',
          message: `Short shift (${totalHours.toFixed(1)}h)`,
          severity: 'warning',
        });
      }

      // Edited punches
      const editedPunches = empPunches.filter(p => p.editedBy);
      if (editedPunches.length > 0) {
        exceptions.push({
          type: 'edited',
          message: `${editedPunches.length} edited punch${editedPunches.length > 1 ? 'es' : ''}`,
          severity: 'info',
        });
      }

      // Late (more than 15 min after scheduled start)
      if (scheduledShift && clockInPunch) {
        const lateMinutes = (clockInPunch.timestamp.getTime() - scheduledShift.startTime.getTime()) / (1000 * 60);
        if (lateMinutes > 15) {
          exceptions.push({
            type: 'late',
            message: `Late (${Math.round(lateMinutes)} min)`,
            severity: 'warning',
          });
        }
      }

      // Early out (more than 15 min before scheduled end)
      if (scheduledShift && clockOutPunch) {
        const earlyMinutes = (scheduledShift.endTime.getTime() - clockOutPunch.timestamp.getTime()) / (1000 * 60);
        if (earlyMinutes > 15) {
          exceptions.push({
            type: 'early-out',
            message: `Early out (${Math.round(earlyMinutes)} min)`,
            severity: 'warning',
          });
        }
      }

      return {
        employee,
        clockIn: clockInPunch?.timestamp,
        clockOut: clockOutPunch?.timestamp,
        totalHours,
        laborCost,
        burdenCost,
        breakMinutes,
        scheduledShift,
        punches: empPunches,
        exceptions,
        isApproved: isApproved(date, empId),
        hasPostApprovalEdits: hasPostApprovalEdits(date, empId),
      };
    });

    return summaries.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  };

  // Format helpers
  const formatTime = (date?: Date): string => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateLong = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check.getTime() === today.getTime();
  };

  const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check.getTime() === yesterday.getTime();
  };

  // Handlers
  const handleApproveDay = (date: Date) => {
    const summary = daySummaries.find(d => d.date.getTime() === date.getTime());
    if (summary?.hasExceptions) {
      const confirmed = window.confirm(
        `This day has exceptions. Are you sure you want to approve all time for ${formatDate(date)}?`
      );
      if (!confirmed) return;
    }

    onApproveTime({
      date: new Date(date),
    });
  };

  const handleViewDay = (date: Date) => {
    setSelectedDate(date);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDate(null);
  };

  const handleApproveEmployee = (employeeId: string) => {
    if (!selectedDate) return;
    onApproveTime({
      date: new Date(selectedDate),
      employeeId,
    });
  };

  const handleApproveAllForDay = () => {
    if (!selectedDate) return;
    const summaries = buildEmployeeSummaries(selectedDate);
    const hasExceptions = summaries.some(s => s.exceptions.length > 0);
    
    if (hasExceptions) {
      const exceptionsCount = summaries.filter(s => s.exceptions.length > 0).length;
      const confirmed = window.confirm(
        `This day has ${exceptionsCount} employee(s) with exceptions. Are you sure you want to approve all time for ${formatDateLong(selectedDate)}?`
      );
      if (!confirmed) return;
    }

    onApproveTime({
      date: new Date(selectedDate),
    });
  };

  const handleEditPunchSubmit = () => {
    if (!editingPunch || !editTime) return;

    const [hours, minutes] = editTime.split(':').map(Number);
    const newTimestamp = new Date(editingPunch.timestamp);
    newTimestamp.setHours(hours, minutes, 0, 0);

    // Check if this is post-approval edit
    const isPostApproval = selectedDate ? isApproved(selectedDate, editingPunch.employeeId) : false;
    
    onEditPunch(editingPunch.id, newTimestamp, editNote || undefined);

    if (isPostApproval && editNote && selectedDate) {
      onRecordPostApprovalEdit({
        originalPunchId: editingPunch.id,
        employeeId: editingPunch.employeeId,
        date: new Date(selectedDate),
        editedBy: 'Manager',
        editedAt: new Date(),
        editNote: editNote,
      });
    }

    setEditingPunch(null);
    setEditTime('');
    setEditNote('');
  };

  const handleAddPunchSubmit = () => {
    if (!addingPunch || !addPunchTime || !selectedDate) return;

    const [hours, minutes] = addPunchTime.split(':').map(Number);
    const timestamp = new Date(selectedDate);
    timestamp.setHours(hours, minutes, 0, 0);

    const summaries = buildEmployeeSummaries(selectedDate);
    const summary = summaries.find(s => s.employee.id === addingPunch.employeeId);
    if (!summary) return;

    onAddPunch({
      employeeId: addingPunch.employeeId,
      role: summary.employee.title,
      store: 'Main Street',
      punchType: addingPunch.type,
      timestamp,
      scheduledShiftId: summary.scheduledShift?.id,
      editedBy: 'Manager',
      editedAt: new Date(),
      editNote: addPunchNote || 'Added by manager',
    });

    setAddingPunch(null);
    setAddPunchTime('');
    setAddPunchNote('');
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  if (viewMode === 'detail' && selectedDate) {
    const summaries = buildEmployeeSummaries(selectedDate);
    const allApproved = summaries.length > 0 && summaries.every(s => s.isApproved);
    const hasExceptions = summaries.some(s => s.exceptions.length > 0);
    const daySummary = daySummaries.find(d => d.date.getTime() === selectedDate.getTime());

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToList}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
            >
              ← Back to List
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Day Detail</h2>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatDateLong(selectedDate)}
              </div>
              <div className="text-sm text-gray-600">
                {isToday(selectedDate) && 'Today'}
                {isYesterday(selectedDate) && 'Yesterday'}
              </div>
            </div>
            
            <button
              onClick={() => navigateDay('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-gray-600">Employees:</span>{' '}
                  <span className="font-semibold text-gray-900">{daySummary?.employeeCount || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Hours:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {daySummary?.totalHours ? daySummary.totalHours.toFixed(1) : '0.0'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Labor Cost:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    ${daySummary?.totalLaborCost.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Burden Cost:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    ${daySummary?.totalBurdenCost.toFixed(2) || '0.00'}
                  </span>
                </div>
                {hasExceptions && (
                  <div className="text-sm">
                    <span className="text-amber-600 font-medium">
                      {summaries.filter(s => s.exceptions.length > 0).length} with exceptions
                    </span>
                  </div>
                )}
              </div>

              {allApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  All Approved
                </span>
              ) : (
                <button
                  onClick={handleApproveAllForDay}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Employee</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Clock In</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Clock Out</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Hours</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Break</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Labor Cost</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Burden Cost</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Total</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Exceptions</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No time punches for this day</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {summaries.map((summary) => (
                      <tr key={summary.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{summary.employee.name}</div>
                            <div className="text-sm text-gray-600">{summary.employee.title}</div>
                            {summary.hasPostApprovalEdits && (
                              <div className="text-xs text-purple-600 font-medium mt-1">
                                Edited after approval
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{formatTime(summary.clockIn)}</td>
                        <td className="px-6 py-4 text-gray-900">{formatTime(summary.clockOut)}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {summary.totalHours > 0 ? summary.totalHours.toFixed(2) : '--'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {summary.breakMinutes > 0 ? `${Math.round(summary.breakMinutes)} min` : '--'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {summary.laborCost > 0 ? `$${summary.laborCost.toFixed(2)}` : '--'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {summary.burdenCost > 0 ? `$${summary.burdenCost.toFixed(2)}` : '--'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {(summary.laborCost + summary.burdenCost) > 0 ? `$${(summary.laborCost + summary.burdenCost).toFixed(2)}` : '--'}
                        </td>
                        <td className="px-6 py-4">
                          {summary.exceptions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {summary.exceptions.map((exc, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                    exc.severity === 'error'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : exc.severity === 'warning'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {exc.severity === 'error' && <XCircle className="w-3 h-3" />}
                                  {exc.severity === 'warning' && <AlertTriangle className="w-3 h-3" />}
                                  {exc.severity === 'info' && <Info className="w-3 h-3" />}
                                  {exc.message}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {summary.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!summary.isApproved && (
                              <button
                                onClick={() => handleApproveEmployee(summary.employee.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                            )}
                            {!summary.clockOut && (
                              <button
                                onClick={() => setAddingPunch({ type: 'clock-out', employeeId: summary.employee.id })}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                + Add Clock-Out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                      <td className="px-6 py-4 text-gray-900">GRAND TOTAL</td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {summaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${summaries.reduce((sum, s) => sum + s.laborCost, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${summaries.reduce((sum, s) => sum + s.burdenCost, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${summaries.reduce((sum, s) => sum + s.laborCost + s.burdenCost, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Punch Modal */}
        {editingPunch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Punch Time</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Punch Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {editingPunch.punchType.replace('-', ' ').toUpperCase()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Reason for adjustment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {isApproved(selectedDate, editingPunch.employeeId) && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-800">
                        This time has already been approved. Your edit will be recorded as a post-approval change.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingPunch(null);
                    setEditTime('');
                    setEditNote('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPunchSubmit}
                  disabled={!editTime}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Punch Modal */}
        {addingPunch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add Missing Punch</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Punch Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {addingPunch.type.replace('-', ' ').toUpperCase()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={addPunchTime}
                    onChange={(e) => setAddPunchTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={addPunchNote}
                    onChange={(e) => setAddPunchNote(e.target.value)}
                    placeholder="Reason for adding punch"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setAddingPunch(null);
                    setAddPunchTime('');
                    setAddPunchNote('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPunchSubmit}
                  disabled={!addPunchTime}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Punch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Approve Time</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review and approve employee time punches for accurate labor tracking
        </p>
      </div>

      {/* Days List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Day</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Employee Count</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Total Hours</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Total Labor Cost</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Total Burden Cost</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Summary</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {daySummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No time punch data available</p>
                  </td>
                </tr>
              ) : (
                daySummaries.map((day) => (
                  <tr key={day.date.toISOString()} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{formatDate(day.date)}</div>
                        {isToday(day.date) && (
                          <div className="text-xs text-blue-600 font-medium">Today</div>
                        )}
                        {isYesterday(day.date) && (
                          <div className="text-xs text-gray-600">Yesterday</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{day.employeeCount}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {day.totalHours.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      ${day.totalLaborCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      ${day.totalBurdenCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {day.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      ) : day.hasExceptions ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Exceptions
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDay(day.date)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        {!day.isApproved && (
                          <button
                            onClick={() => handleApproveDay(day.date)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors font-medium"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}