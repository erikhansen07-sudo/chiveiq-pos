import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, CheckCircle2, AlertCircle, XCircle, Coffee, LayoutGrid, BarChart3 } from 'lucide-react';
import type { Employee, ScheduledShift, TimePunch, RoleType, TimeClockSettings } from './types';

interface ScheduleViewProps {
  employees: Employee[];
  scheduledShifts: ScheduledShift[];
  timePunches: TimePunch[];
  roleTypes: RoleType[];
  timeClockSettings: TimeClockSettings;
  onAddShift: (shift: Omit<ScheduledShift, 'id'>) => void;
  onUpdateShift: (shiftId: string, updates: Partial<ScheduledShift>) => void;
  onDeleteShift: (shiftId: string) => void;
}

type ViewMode = 'weekly' | 'intraday';

interface ShiftStatus {
  type: 'scheduled' | 'clocked-in' | 'on-break' | 'late' | 'completed';
  clockedIn?: Date;
  clockedOut?: Date;
  onBreak?: boolean;
}

export function ScheduleView({
  employees,
  scheduledShifts,
  timePunches,
  roleTypes,
  timeClockSettings,
}: ScheduleViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto-select view: Intraday for today, Weekly for other dates
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const selected = new Date(today);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime() ? 'intraday' : 'weekly';
  });
  const [showRoleColors, setShowRoleColors] = useState(true);

  const activeEmployees = employees.filter(e => e.status === 'active');

  // Parse operating hours
  const operatingStart = useMemo(() => {
    if (!timeClockSettings.operatingHoursStart) return 0;
    const [hours, minutes] = timeClockSettings.operatingHoursStart.split(':').map(Number);
    return hours + (minutes / 60);
  }, [timeClockSettings.operatingHoursStart]);

  const operatingEnd = useMemo(() => {
    if (!timeClockSettings.operatingHoursEnd) return 24;
    const [hours, minutes] = timeClockSettings.operatingHoursEnd.split(':').map(Number);
    return hours + (minutes / 60);
  }, [timeClockSettings.operatingHoursEnd]);

  // Week days helper
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  // Get role color
  const getRoleColor = (roleName: string): string => {
    const role = roleTypes.find(r => r.name === roleName);
    return role?.color || '#6B7280';
  };

  // Get shift status based on time punches
  const getShiftStatus = (shift: ScheduledShift): ShiftStatus => {
    if (!shift.employeeId) return { type: 'scheduled' };

    const shiftDate = new Date(shift.startTime);
    shiftDate.setHours(0, 0, 0, 0);

    const dayPunches = timePunches
      .filter(p => {
        const punchDate = new Date(p.timestamp);
        punchDate.setHours(0, 0, 0, 0);
        return p.employeeId === shift.employeeId && 
               punchDate.getTime() === shiftDate.getTime() &&
               p.scheduledShiftId === shift.id;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let clockedIn: Date | undefined;
    let clockedOut: Date | undefined;
    let onBreak = false;

    dayPunches.forEach(punch => {
      if (punch.punchType === 'clock-in') {
        clockedIn = punch.timestamp;
      } else if (punch.punchType === 'clock-out') {
        clockedOut = punch.timestamp;
      } else if (punch.punchType === 'break-start') {
        onBreak = true;
      } else if (punch.punchType === 'break-end') {
        onBreak = false;
      }
    });

    // Determine status
    if (clockedOut) {
      return { type: 'completed', clockedIn, clockedOut };
    }

    if (onBreak && clockedIn) {
      return { type: 'on-break', clockedIn, onBreak: true };
    }

    if (clockedIn) {
      // Check if late
      const isLate = clockedIn.getTime() > shift.startTime.getTime() + (15 * 60 * 1000); // 15 min grace
      return { type: isLate ? 'late' : 'clocked-in', clockedIn };
    }

    return { type: 'scheduled' };
  };

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  // Navigate day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Format helpers
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (date: Date): boolean => {
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check.getTime() === today.getTime();
  };

  // Helper to check if hour is within operating hours
  const isOperatingHour = (hour: number): boolean => {
    return hour >= Math.floor(operatingStart) && hour < Math.ceil(operatingEnd);
  };

  // WEEKLY PLANNING VIEW
  const renderWeeklyView = () => {
    // Group shifts by employee and day
    const employeeShiftMap = new Map<string, Map<number, ScheduledShift[]>>();
    
    activeEmployees.forEach(emp => {
      const dayMap = new Map<number, ScheduledShift[]>();
      weekDays.forEach((_, idx) => dayMap.set(idx, []));
      employeeShiftMap.set(emp.id, dayMap);
    });

    scheduledShifts.forEach(shift => {
      if (!shift.employeeId) return;
      
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      
      const dayIndex = weekDays.findIndex(d => {
        const checkDate = new Date(d);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.getTime() === shiftDate.getTime();
      });

      if (dayIndex >= 0) {
        const empMap = employeeShiftMap.get(shift.employeeId);
        if (empMap) {
          const dayShifts = empMap.get(dayIndex) || [];
          dayShifts.push(shift);
          empMap.set(dayIndex, dayShifts);
        }
      }
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {/* Employee column header */}
            <div className="bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Employee</span>
            </div>
            
            {/* Day headers */}
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`bg-gray-50 px-2 py-3 text-center ${
                  isToday(day) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {formatDayName(day)}
                </div>
                <div className={`text-xs ${isToday(day) ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                  {formatDate(day)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee rows */}
        <div className="divide-y divide-gray-200">
          {activeEmployees.map(employee => {
            const empShifts = employeeShiftMap.get(employee.id);
            
            return (
              <div key={employee.id} className="grid grid-cols-8 gap-px bg-gray-100 hover:bg-gray-50">
                {/* Employee name */}
                <div className="bg-white px-4 py-3 flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-600">{employee.title}</div>
                  </div>
                </div>

                {/* Day cells */}
                {weekDays.map((day, dayIdx) => {
                  const dayShifts = empShifts?.get(dayIdx) || [];
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`bg-white p-2 min-h-[80px] ${
                        isToday(day) ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {dayShifts.map(shift => {
                        const status = getShiftStatus(shift);
                        const roleColor = showRoleColors && roleTypes.length > 0 
                          ? getRoleColor(shift.role) 
                          : '#6B7280';

                        return (
                          <div
                            key={shift.id}
                            className="mb-1 last:mb-0"
                          >
                            <div
                              className="rounded px-2 py-1.5 text-xs border"
                              style={{
                                backgroundColor: `${roleColor}15`,
                                borderColor: `${roleColor}40`,
                                borderLeftWidth: '3px',
                                borderLeftColor: roleColor,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-medium text-gray-900 truncate">
                                  {formatTime(shift.startTime)}
                                </span>
                                {status.type === 'clocked-in' && (
                                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                )}
                                {status.type === 'on-break' && (
                                  <Coffee className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                )}
                                {status.type === 'late' && (
                                  <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                                )}
                                {status.type === 'completed' && (
                                  <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-gray-600 truncate">
                                {formatTime(shift.endTime)}
                              </div>
                              {showRoleColors && roleTypes.length > 0 && (
                                <div className="text-gray-700 font-medium mt-0.5 truncate text-[10px]">
                                  {shift.role}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {activeEmployees.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active employees</p>
          </div>
        )}
      </div>
    );
  };

  // INTRADAY COVERAGE VIEW
  const renderIntradayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23
    const halfHours = Array.from({ length: 48 }, (_, i) => i * 0.5); // 0, 0.5, 1, 1.5, ...
    
    // Get shifts for selected date
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);

    const dayShifts = scheduledShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate.getTime() === dateStart.getTime();
    });

    // Get actual punches for the day
    const dayPunches = timePunches.filter(p => {
      const punchDate = new Date(p.timestamp);
      punchDate.setHours(0, 0, 0, 0);
      return punchDate.getTime() === dateStart.getTime();
    });

    // Build employee timeline data
    interface EmployeeTimeline {
      employee: Employee;
      shifts: Array<{
        shift: ScheduledShift;
        status: ShiftStatus;
      }>;
    }

    const timelines: EmployeeTimeline[] = activeEmployees.map(employee => {
      const empShifts = dayShifts
        .filter(s => s.employeeId === employee.id)
        .map(shift => ({
          shift,
          status: getShiftStatus(shift),
        }));

      return { employee, shifts: empShifts };
    }).filter(t => t.shifts.length > 0); // Only show employees with shifts

    // Calculate coverage per half-hour slot (matching the grid structure)
    const coverageByHalfHour = halfHours.map(halfHour => {
      let count = 0;
      
      dayShifts.forEach(shift => {
        const status = getShiftStatus(shift);
        
        // Use actual punches if available, otherwise use schedule
        const actualStart = status.clockedIn || shift.startTime;
        const actualEnd = status.clockedOut || (status.clockedIn ? new Date() : shift.endTime);
        
        const slotStart = new Date(selectedDate);
        const slotHour = Math.floor(halfHour);
        const slotMinute = (halfHour % 1) * 60;
        slotStart.setHours(slotHour, slotMinute, 0, 0);
        
        const slotEnd = new Date(selectedDate);
        slotEnd.setHours(slotHour, slotMinute + 29, 59, 999);
        
        // Check if shift overlaps this half-hour slot
        if (actualStart <= slotEnd && actualEnd >= slotStart) {
          // Check if on break during this slot
          if (status.type === 'on-break') {
            // Reduce coverage by 0.5 for break (still counts as partial coverage)
            count += 0.5;
          } else {
            count += 1;
          }
        }
      });
      
      return count;
    });

    const maxCoverage = Math.max(...coverageByHalfHour, 1);

    return (
      <div className="space-y-4">
        {/* Coverage Density Bar - Now using exact same grid as timeline below */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage Density</h3>
          
          {/* Container matching the Staff Timeline structure */}
          <div className="flex items-start gap-4">
            {/* Spacer matching employee name column width */}
            <div className="w-32 flex-shrink-0"></div>
            
            {/* Coverage chart - same width as timeline grid */}
            <div className="flex-1">
              <div className="relative h-16 bg-gray-50 rounded-lg overflow-hidden">
                {/* Grid structure - exact same as Staff Timeline */}
                <div className="absolute inset-0 flex">
                  {halfHours.map((halfHour, idx) => {
                    const hour = Math.floor(halfHour);
                    const isFullHour = halfHour % 1 === 0;
                    const isOp = isOperatingHour(hour);
                    const coverage = coverageByHalfHour[idx];
                    const intensity = coverage / maxCoverage;
                    
                    return (
                      <div
                        key={idx}
                        className="flex-1 relative"
                        style={{
                          borderRight: isFullHour 
                            ? '2px solid rgba(0, 0, 0, 0.2)' 
                            : '1px solid rgba(0, 0, 0, 0.06)',
                          backgroundColor: isOp ? 'transparent' : 'rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        {/* Coverage bar */}
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all"
                          style={{
                            height: `${intensity * 100}%`,
                            backgroundColor: coverage === 0 
                              ? '#EF4444' 
                              : coverage < 2 
                                ? '#F59E0B' 
                                : '#10B981',
                            opacity: isOp ? 0.7 : 0.3,
                          }}
                        />
                        
                        {/* Hour label - only on full hours */}
                        {isFullHour && (
                          <div 
                            className="absolute -top-5 left-0 text-[10px] font-medium pointer-events-none"
                            style={{
                              color: isOp ? '#374151' : '#9CA3AF',
                            }}
                          >
                            {hour % 12 || 12}
                            <span className="text-[8px]">{hour < 12 ? 'a' : 'p'}</span>
                          </div>
                        )}
                        
                        {/* Hover tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {hour % 12 || 12}:{String(Math.floor((halfHour % 1) * 60)).padStart(2, '0')}{hour < 12 ? 'am' : 'pm'}: {coverage} staff
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Timelines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Staff Timeline</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {timelines.length} employee{timelines.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          {timelines.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No shifts scheduled for this day</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {timelines.map(({ employee, shifts }) => (
                <div key={employee.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Employee info - exact same width as Coverage Density spacer */}
                    <div className="w-32 flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-600">{employee.title}</div>
                    </div>

                    {/* Timeline - exact same flex structure as Coverage Density */}
                    <div className="flex-1">
                      <div className="relative h-12">
                        {/* Enhanced time grid with operating hours dimming - SHARED STRUCTURE */}
                        <div className="absolute inset-0">
                          {/* Half-hour grid structure - identical to Coverage Density */}
                          <div className="absolute inset-0 flex">
                            {halfHours.map((halfHour, idx) => {
                              const hour = Math.floor(halfHour);
                              const isFullHour = halfHour % 1 === 0;
                              const isOp = isOperatingHour(hour);
                              
                              return (
                                <div
                                  key={idx}
                                  className="flex-1 relative"
                                  style={{
                                    borderRight: isFullHour 
                                      ? '2px solid rgba(0, 0, 0, 0.2)' // Major hour line - dark and prominent
                                      : '1px solid rgba(0, 0, 0, 0.06)', // Minor half-hour line - very light
                                    backgroundColor: isOp ? 'transparent' : 'rgba(0, 0, 0, 0.03)', // Dim non-operating hours
                                  }}
                                >
                                  {/* No labels here - they're in Coverage Density above */}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Shift bars */}
                        <div className="absolute inset-0">
                          {shifts.map(({ shift, status }) => {
                            // Calculate position and width
                            const actualStart = status.clockedIn || shift.startTime;
                            const actualEnd = status.clockedOut || (status.clockedIn ? new Date() : shift.endTime);
                            
                            const dayStart = new Date(selectedDate);
                            dayStart.setHours(0, 0, 0, 0);
                            const dayEnd = new Date(selectedDate);
                            dayEnd.setHours(23, 59, 59, 999);
                            
                            const startMinutes = (actualStart.getTime() - dayStart.getTime()) / (1000 * 60);
                            const endMinutes = (actualEnd.getTime() - dayStart.getTime()) / (1000 * 60);
                            const totalMinutes = 24 * 60;
                            
                            const leftPercent = (startMinutes / totalMinutes) * 100;
                            const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

                            const roleColor = showRoleColors && roleTypes.length > 0
                              ? getRoleColor(shift.role)
                              : '#6B7280';

                            let statusColor = roleColor;
                            let statusLabel = 'Scheduled';
                            
                            if (status.type === 'clocked-in') {
                              statusColor = '#10B981';
                              statusLabel = 'On Clock';
                            } else if (status.type === 'on-break') {
                              statusColor = '#F59E0B';
                              statusLabel = 'On Break';
                            } else if (status.type === 'late') {
                              statusColor = '#EF4444';
                              statusLabel = 'Late';
                            } else if (status.type === 'completed') {
                              statusColor = '#6B7280';
                              statusLabel = 'Complete';
                            }

                            return (
                              <div
                                key={shift.id}
                                className="absolute top-1 bottom-1 rounded border-2 flex items-center px-2 group cursor-pointer"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  backgroundColor: `${statusColor}20`,
                                  borderColor: statusColor,
                                  zIndex: 10,
                                }}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {status.type === 'clocked-in' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: statusColor }} />}
                                  {status.type === 'on-break' && <Coffee className="w-3 h-3 flex-shrink-0" style={{ color: statusColor }} />}
                                  {status.type === 'late' && <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: statusColor }} />}
                                  {status.type === 'completed' && <Clock className="w-3 h-3 flex-shrink-0" style={{ color: statusColor }} />}
                                  
                                  <span className="text-xs font-medium truncate" style={{ color: statusColor }}>
                                    {formatTime(actualStart)} - {status.clockedOut ? formatTime(actualEnd) : formatTime(shift.endTime)}
                                  </span>
                                </div>

                                {/* Hover tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                  <div className="font-medium">{shift.role}</div>
                                  <div className="text-gray-300">{statusLabel}</div>
                                  {status.clockedIn && (
                                    <div className="text-gray-300">
                                      In: {formatTime(status.clockedIn)}
                                      {status.clockedOut && ` • Out: ${formatTime(status.clockedOut)}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="font-medium">Weekly</span>
            </button>
            <button
              onClick={() => setViewMode('intraday')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'intraday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Intraday</span>
            </button>
          </div>

          {/* Date navigation */}
          {viewMode === 'weekly' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center min-w-[180px]">
                <div className="text-sm font-semibold text-gray-900">
                  {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
                </div>
                <div className="text-xs text-gray-600">
                  {weekDays[0].getFullYear()}
                </div>
              </div>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateDay('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center min-w-[180px]">
                <div className="text-sm font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-gray-600">
                  {isToday(selectedDate) ? 'Today' : selectedDate.getFullYear()}
                </div>
              </div>
              <button
                onClick={() => navigateDay('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Role color toggle */}
          {roleTypes.length > 0 && (
            <button
              onClick={() => setShowRoleColors(!showRoleColors)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showRoleColors
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex gap-1">
                {roleTypes.slice(0, 3).map(role => (
                  <div
                    key={role.id}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {showRoleColors ? 'Role Colors' : 'Show Roles'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'weekly' ? renderWeeklyView() : renderIntradayView()}
    </div>
  );
}