import { useState, useEffect } from 'react';
import { Clock, Calendar, Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { Employee, ScheduledShift, TimePunch, PunchType } from './labor/types';

interface TodayPageProps {
  employees: Employee[];
  scheduledShifts: ScheduledShift[];
  timePunches: TimePunch[];
  onPunch: (employeeId: string, punchType: PunchType) => void;
}

export function TodayPage({ employees, scheduledShifts, timePunches, onPunch }: TodayPageProps) {
  const [pin, setPin] = useState('');
  const [identifiedEmployee, setIdentifiedEmployee] = useState<Employee | null>(null);
  const [punchConfirmation, setPunchConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear confirmation after 3 seconds
  useEffect(() => {
    if (punchConfirmation) {
      const timer = setTimeout(() => {
        setPunchConfirmation(null);
        setIdentifiedEmployee(null);
        setPin('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [punchConfirmation]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
        setPin('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-verify when 4 digits entered
      if (newPin.length === 4) {
        const employee = employees.find(e => e.pin === newPin && e.status === 'active');
        if (employee) {
          setIdentifiedEmployee(employee);
          setError(null);
        } else {
          setError('Invalid PIN');
          setPin('');
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setIdentifiedEmployee(null);
    setError(null);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  // Get employee's current shift and punch status
  const getEmployeeContext = (employee: Employee) => {
    const todayShifts = scheduledShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate.getTime() === today.getTime() && shift.employeeId === employee.id;
    });

    const todayPunches = timePunches
      .filter(p => p.employeeId === employee.id)
      .filter(p => {
        const punchDate = new Date(p.timestamp);
        punchDate.setHours(0, 0, 0, 0);
        return punchDate.getTime() === today.getTime();
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const lastPunch = todayPunches[todayPunches.length - 1];
    const isClockedIn = lastPunch && lastPunch.punchType === 'clock-in';
    const isOnBreak = lastPunch && lastPunch.punchType === 'break-start';

    return {
      shifts: todayShifts,
      isScheduled: todayShifts.length > 0,
      isClockedIn,
      isOnBreak,
      lastPunch,
    };
  };

  const handlePunch = (punchType: PunchType) => {
    if (!identifiedEmployee) return;

    onPunch(identifiedEmployee.id, punchType);

    const punchLabels: Record<PunchType, string> = {
      'clock-in': 'Clocked In',
      'clock-out': 'Clocked Out',
      'break-start': 'Break Started',
      'break-end': 'Break Ended',
    };

    setPunchConfirmation(`${identifiedEmployee.name} - ${punchLabels[punchType]}`);
  };

  // Today's schedule snapshot
  const todaySchedule = scheduledShifts.filter(shift => {
    const shiftDate = new Date(shift.startTime);
    shiftDate.setHours(0, 0, 0, 0);
    return shiftDate.getTime() === today.getTime();
  }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Mock inventory data (in a real app, this would come from props)
  const todayDeliveries = [
    { vendor: 'Sysco', expectedTime: '8:00 AM', status: 'pending' as const },
    { vendor: 'Local Produce', expectedTime: '10:30 AM', status: 'completed' as const },
  ];

  const lastInventoryCount = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const flaggedItems = [
    { item: 'Burger Buns', reason: 'Low Stock' },
    { item: 'Lettuce', reason: 'Expiring Soon' },
  ];

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Today</h1>
          <p className="text-lg text-muted-foreground">{formatDate(today)}</p>
        </div>

        {/* Time Clock Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl font-semibold text-foreground">Time Clock</h2>
          </div>

          {punchConfirmation ? (
            // Confirmation State
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-2xl font-semibold text-foreground mb-2">{punchConfirmation}</p>
              <p className="text-muted-foreground">Returning to PIN entry...</p>
            </div>
          ) : identifiedEmployee ? (
            // Employee Identified - Show Punch Options
            <div>
              <div className="text-center mb-8">
                <p className="text-2xl font-semibold text-foreground mb-2">Hello, {identifiedEmployee.name.split(' ')[0]}!</p>
                <p className="text-muted-foreground">{identifiedEmployee.title}</p>
              </div>

              {(() => {
                const context = getEmployeeContext(identifiedEmployee);

                if (!context.isScheduled) {
                  // Not scheduled
                  return (
                    <div className="max-w-md mx-auto">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-amber-900">No Scheduled Shift</div>
                            <div className="text-sm text-amber-800 mt-1">
                              You are not scheduled for today. Punching in will notify a manager.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => handlePunch('clock-in')}
                          className="w-full py-6 bg-primary text-white rounded-lg font-semibold text-xl hover:opacity-90 transition-colors"
                        >
                          Punch In Without Schedule
                        </button>
                        <button
                          onClick={handleClear}
                          className="w-full py-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                if (context.isOnBreak) {
                  // On break - show end break
                  return (
                    <div className="max-w-md mx-auto">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                        <div className="font-medium text-blue-900 text-center">Currently On Break</div>
                        <div className="text-sm text-blue-800 mt-1 text-center">
                          Started at {formatTime(context.lastPunch!.timestamp)}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => handlePunch('break-end')}
                          className="w-full py-6 bg-primary text-white rounded-lg font-semibold text-xl hover:opacity-90 transition-colors"
                        >
                          End Break
                        </button>
                        <button
                          onClick={handleClear}
                          className="w-full py-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                if (context.isClockedIn) {
                  // Clocked in - show break and clock out
                  const shift = context.shifts[0];
                  return (
                    <div className="max-w-md mx-auto">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                        <div className="font-medium text-green-900 text-center">Currently Clocked In</div>
                        <div className="text-sm text-primary mt-1 text-center">
                          {shift && `Shift: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => handlePunch('break-start')}
                          className="w-full py-6 bg-amber-600 text-white rounded-lg font-semibold text-xl hover:bg-amber-700 transition-colors"
                        >
                          Start Break
                        </button>
                        <button
                          onClick={() => handlePunch('clock-out')}
                          className="w-full py-6 bg-destructive text-white rounded-lg font-semibold text-xl hover:opacity-90 transition-colors"
                        >
                          Punch Out
                        </button>
                        <button
                          onClick={handleClear}
                          className="w-full py-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                // Not clocked in - show clock in
                const shift = context.shifts[0];
                return (
                  <div className="max-w-md mx-auto">
                    {shift && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                        <div className="font-medium text-blue-900 text-center">Scheduled Shift</div>
                        <div className="text-sm text-blue-800 mt-1 text-center">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)} • {shift.role}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <button
                        onClick={() => handlePunch('clock-in')}
                        className="w-full py-6 bg-primary text-white rounded-lg font-semibold text-xl hover:opacity-90 transition-colors"
                      >
                        Punch In for Scheduled Shift
                      </button>
                      <button
                        onClick={handleClear}
                        className="w-full py-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            // PIN Entry State
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <p className="text-xl text-muted-foreground mb-4">Enter PIN to Punch In or Out</p>
                
                {/* PIN Display */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-lg border-2 border-border flex items-center justify-center text-2xl font-semibold"
                    >
                      {pin[i] ? '•' : ''}
                    </div>
                  ))}
                </div>
                
                {error && (
                  <div className="flex items-center justify-center gap-2 text-destructive mt-4">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={pin.length >= 4}
                    className="h-20 bg-muted hover:bg-gray-200 rounded-lg text-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="h-20 bg-muted hover:bg-gray-200 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  disabled={pin.length >= 4}
                  className="h-20 bg-muted hover:bg-gray-200 rounded-lg text-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-20 bg-muted hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                  ⌫
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Today at a Glance */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Schedule Snapshot */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Schedule Snapshot</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Today's staffing overview</p>

            {todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No shifts scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map((shift) => {
                  const employee = employees.find(e => e.id === shift.employeeId);
                  return (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{employee?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{shift.role}</div>
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inventory Awareness */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Inventory Awareness</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Deliveries and alerts</p>

            <div className="space-y-4">
              {/* Expected Deliveries */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Expected Deliveries</div>
                <div className="space-y-2">
                  {todayDeliveries.map((delivery, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <div className="font-medium text-foreground">{delivery.vendor}</div>
                        <div className="text-sm text-muted-foreground">{delivery.expectedTime}</div>
                      </div>
                      {delivery.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Inventory Count */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Last Count</div>
                <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
                  {lastInventoryCount.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                  {lastInventoryCount.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>

              {/* Flagged Items */}
              {flaggedItems.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Flagged Items</div>
                  <div className="space-y-2">
                    {flaggedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-amber-900 text-sm">{item.item}</div>
                          <div className="text-xs text-amber-700">{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
