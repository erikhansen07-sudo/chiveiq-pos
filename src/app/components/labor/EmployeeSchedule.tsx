import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import type { Employee, ScheduledShift } from './types';

interface EmployeeScheduleProps {
  employeeId: string;
  scheduledShifts: ScheduledShift[];
  employee?: Employee;
}

export function EmployeeSchedule({ employeeId, scheduledShifts, employee }: EmployeeScheduleProps) {
  const weekSchedule = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day;
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }

    return weekDays.map(date => {
      const dayShifts = scheduledShifts.filter(shift => {
        const shiftDate = new Date(shift.startTime);
        shiftDate.setHours(0, 0, 0, 0);
        return shift.employeeId === employeeId && 
               shiftDate.getTime() === date.getTime() &&
               shift.published;
      });

      return {
        date,
        shifts: dayShifts,
      };
    });
  }, [employeeId, scheduledShifts]);

  const totalHours = useMemo(() => {
    let hours = 0;
    weekSchedule.forEach(day => {
      day.shifts.forEach(shift => {
        const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
        hours += duration;
      });
    });
    return hours;
  }, [weekSchedule]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return today.getTime() === checkDate.getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">
              {employee?.name} • Week of {formatDate(weekSchedule[0].date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Total Hours This Week</p>
            <p className="text-2xl font-semibold text-gray-900">{totalHours.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {weekSchedule.map((day, index) => {
            const hasShifts = day.shifts.length > 0;
            const todayClass = isToday(day.date) ? 'bg-blue-50' : '';

            return (
              <div key={index} className={`p-6 ${todayClass}`}>
                <div className="flex items-start gap-6">
                  <div className="w-32 flex-shrink-0">
                    <div className="font-semibold text-gray-900">
                      {dayNames[day.date.getDay()]}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(day.date)}
                    </div>
                    {isToday(day.date) && (
                      <span className="inline-block mt-1 text-xs font-medium text-blue-600">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    {hasShifts ? (
                      <div className="space-y-3">
                        {day.shifts.map(shift => {
                          const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
                          return (
                            <div
                              key={shift.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      ({duration.toFixed(1)} hrs)
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {shift.role}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No shifts scheduled</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This schedule is read-only. Please contact your manager if you need to make any changes to your scheduled shifts.
        </p>
      </div>
    </div>
  );
}