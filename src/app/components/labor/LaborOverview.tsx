import { useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import type { Employee, TimePunch, ScheduledShift } from './types';

interface LaborOverviewProps {
  employees: Employee[];
  timePunches: TimePunch[];
  scheduledShifts: ScheduledShift[];
  burdenRate?: number; // Percentage burden rate (default 20)
}

export function LaborOverview({ employees, timePunches, scheduledShifts, burdenRate = 20 }: LaborOverviewProps) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's punches
    const todayPunches = timePunches.filter(p => {
      const punchDate = new Date(p.timestamp);
      punchDate.setHours(0, 0, 0, 0);
      return punchDate.getTime() === today.getTime();
    });

    // Find unscheduled punches
    const unscheduledPunches = todayPunches.filter(p => p.unscheduled && p.punchType === 'clock-in');

    // Calculate who's currently clocked in
    const clockedInEmployees: { [key: string]: { role: string; clockInTime: Date; breakStart?: Date } } = {};
    
    todayPunches.forEach(punch => {
      const key = punch.employeeId;
      
      if (punch.punchType === 'clock-in') {
        clockedInEmployees[key] = {
          role: punch.role,
          clockInTime: punch.timestamp,
        };
      } else if (punch.punchType === 'clock-out') {
        delete clockedInEmployees[key];
      } else if (punch.punchType === 'break-start' && clockedInEmployees[key]) {
        clockedInEmployees[key].breakStart = punch.timestamp;
      } else if (punch.punchType === 'break-end' && clockedInEmployees[key]) {
        delete clockedInEmployees[key].breakStart;
      }
    });

    // Calculate total labor hours today
    let totalHours = 0;
    const employeePunches: { [key: string]: TimePunch[] } = {};
    
    todayPunches.forEach(punch => {
      if (!employeePunches[punch.employeeId]) {
        employeePunches[punch.employeeId] = [];
      }
      employeePunches[punch.employeeId].push(punch);
    });

    Object.values(employeePunches).forEach(punches => {
      const sorted = punches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let clockIn: Date | null = null;
      let totalBreakTime = 0;
      let breakStart: Date | null = null;

      sorted.forEach(punch => {
        if (punch.punchType === 'clock-in') {
          clockIn = punch.timestamp;
        } else if (punch.punchType === 'clock-out' && clockIn) {
          const worked = (punch.timestamp.getTime() - clockIn.getTime() - totalBreakTime) / (1000 * 60 * 60);
          totalHours += worked;
          clockIn = null;
          totalBreakTime = 0;
        } else if (punch.punchType === 'break-start') {
          breakStart = punch.timestamp;
        } else if (punch.punchType === 'break-end' && breakStart) {
          totalBreakTime += breakStart.getTime() - breakStart.getTime();
          breakStart = null;
        }
      });

      // Add current shift if still clocked in
      if (clockIn) {
        const now = new Date();
        const currentBreakTime = breakStart ? now.getTime() - breakStart.getTime() : 0;
        const worked = (now.getTime() - clockIn.getTime() - totalBreakTime - currentBreakTime) / (1000 * 60 * 60);
        totalHours += worked;
      }
    });

    // Calculate scheduled hours for today
    const todayScheduled = scheduledShifts.filter(s => {
      const shiftDate = new Date(s.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate.getTime() === today.getTime();
    });

    let scheduledHours = 0;
    todayScheduled.forEach(shift => {
      const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      scheduledHours += hours;
    });

    // Calculate estimated labor cost
    let estimatedCost = 0;
    Object.entries(employeePunches).forEach(([empId, punches]) => {
      const employee = employees.find(e => e.id === empId);
      if (!employee || !employee.payRate) return;

      const sorted = punches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let clockIn: Date | null = null;
      let breakStart: Date | null = null;
      let totalBreakTime = 0;

      sorted.forEach(punch => {
        if (punch.punchType === 'clock-in') {
          clockIn = punch.timestamp;
          totalBreakTime = 0;
        } else if (punch.punchType === 'clock-out' && clockIn) {
          const worked = (punch.timestamp.getTime() - clockIn.getTime() - totalBreakTime) / (1000 * 60 * 60);
          // Only calculate cost for hourly employees
          if (employee.payType === 'hourly') {
            estimatedCost += worked * employee.payRate;
          }
          clockIn = null;
          totalBreakTime = 0;
        } else if (punch.punchType === 'break-start') {
          breakStart = punch.timestamp;
        } else if (punch.punchType === 'break-end' && breakStart) {
          totalBreakTime += punch.timestamp.getTime() - breakStart.getTime();
          breakStart = null;
        }
      });

      if (clockIn) {
        const now = new Date();
        const currentBreakTime = breakStart ? now.getTime() - breakStart.getTime() : 0;
        const worked = (now.getTime() - clockIn.getTime() - totalBreakTime - currentBreakTime) / (1000 * 60 * 60);
        // Only calculate cost for hourly employees
        if (employee.payType === 'hourly') {
          estimatedCost += worked * employee.payRate;
        }
      }
    });

    // Apply burden rate to estimated cost
    estimatedCost += estimatedCost * (burdenRate / 100);

    return {
      clockedInCount: Object.keys(clockedInEmployees).length,
      clockedInEmployees,
      totalHours,
      scheduledHours,
      estimatedCost,
      unscheduledPunches,
    };
  }, [employees, timePunches, scheduledShifts, burdenRate]);

  const formatElapsedTime = (clockInTime: Date): string => {
    const now = new Date();
    const elapsed = now.getTime() - clockInTime.getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currently Clocked In</p>
              <p className="text-3xl font-semibold text-foreground mt-2">{stats.clockedInCount}</p>
            </div>
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Hours Today</p>
              <p className="text-3xl font-semibold text-foreground mt-2">{stats.totalHours.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled vs Actual</p>
              <p className="text-3xl font-semibold text-foreground mt-2">
                {stats.scheduledHours.toFixed(1)} / {stats.totalHours.toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Est. Labor Cost (Burdened)</p>
              <p className="text-3xl font-semibold text-foreground mt-2">
                ${stats.estimatedCost.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Unscheduled Punches Alert */}
      {stats.unscheduledPunches.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Unscheduled Punches Requiring Review
              </h3>
              <p className="text-sm text-orange-800 mb-4">
                {stats.unscheduledPunches.length} employee{stats.unscheduledPunches.length !== 1 ? 's' : ''} clocked in without a scheduled shift today.
              </p>
              <div className="space-y-2">
                {stats.unscheduledPunches.map(punch => {
                  const employee = employees.find(e => e.id === punch.employeeId);
                  if (!employee) return null;
                  
                  return (
                    <div key={punch.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {punch.role} • Clocked in at {new Date(punch.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        UNSCHEDULED
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currently Clocked In Employees */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Currently Clocked In</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.clockedInCount} employee{stats.clockedInCount !== 1 ? 's' : ''} on shift
          </p>
        </div>

        {stats.clockedInCount === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No employees currently clocked in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-foreground">Employee</th>
                  <th className="text-left px-6 py-3 font-semibold text-foreground">Role</th>
                  <th className="text-left px-6 py-3 font-semibold text-foreground">Clock In Time</th>
                  <th className="text-left px-6 py-3 font-semibold text-foreground">Elapsed Time</th>
                  <th className="text-left px-6 py-3 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.clockedInEmployees).map(([empId, data]) => {
                  const employee = employees.find(e => e.id === empId);
                  if (!employee) return null;

                  return (
                    <tr key={empId} className="hover:bg-muted">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{employee.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-primary">
                          {data.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(data.clockInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">
                        {formatElapsedTime(data.clockInTime)}
                      </td>
                      <td className="px-6 py-4">
                        {data.breakStart ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            On Break
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-primary">
                            Working
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}