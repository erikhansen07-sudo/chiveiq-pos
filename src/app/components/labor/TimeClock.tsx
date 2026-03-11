import { useState, useMemo, useEffect } from 'react';
import { Clock, LogIn, LogOut, Coffee, CheckCircle, WifiOff, Users, AlertTriangle, Calendar } from 'lucide-react';
import type { Employee, TimePunch, PunchType, ScheduledShift } from './types';

interface TimeClockProps {
  employees: Employee[];
  timePunches: TimePunch[];
  scheduledShifts: ScheduledShift[];
  onAddPunch: (punch: Omit<TimePunch, 'id' | 'synced'>) => void;
  userRole: 'employee' | 'manager';
  currentEmployeeId: string;
}

type ClockStatus = 'clocked-out' | 'on-shift' | 'on-break';

interface PunchQueueItem {
  punch: Omit<TimePunch, 'id' | 'synced'>;
  queuedAt: Date;
}

export function TimeClock({ employees, timePunches, scheduledShifts, onAddPunch, userRole }: TimeClockProps) {
  const [pinEntry, setPinEntry] = useState('');
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);
  const [punchQueue, setPunchQueue] = useState<PunchQueueItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showUnscheduledConfirm, setShowUnscheduledConfirm] = useState(false);
  const [unscheduledPinEntry, setUnscheduledPinEntry] = useState('');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Process queue when coming back online
      if (punchQueue.length > 0) {
        punchQueue.forEach(item => {
          onAddPunch(item.punch);
        });
        setPunchQueue([]);
      }
    };
    
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [punchQueue, onAddPunch]);

  const activeEmployees = employees.filter(e => e.status === 'active');

  // Find eligible scheduled shift for authenticated employee
  const eligibleScheduledShift = useMemo<ScheduledShift | null>(() => {
    if (!authenticatedEmployee) return null;

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find shifts for this employee today
    const todayShifts = scheduledShifts.filter(shift => {
      if (shift.employeeId !== authenticatedEmployee.id) return false;
      
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0, 0, 0, 0);
      
      return shiftDate.getTime() === today.getTime();
    });

    // Find a shift that starts within 2 hours from now (before or after)
    const eligibleShift = todayShifts.find(shift => {
      const shiftStart = new Date(shift.startTime);
      const timeDiff = Math.abs(now.getTime() - shiftStart.getTime());
      const twoHours = 2 * 60 * 60 * 1000;
      return timeDiff <= twoHours;
    });

    return eligibleShift || null;
  }, [authenticatedEmployee, scheduledShifts]);

  // Calculate current status for authenticated employee
  const currentStatus = useMemo<{ status: ClockStatus; role?: string; clockInTime?: Date }>(() => {
    if (!authenticatedEmployee) return { status: 'clocked-out' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPunches = timePunches
      .filter(p => {
        const punchDate = new Date(p.timestamp);
        punchDate.setHours(0, 0, 0, 0);
        return p.employeeId === authenticatedEmployee.id && punchDate.getTime() === today.getTime();
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let status: ClockStatus = 'clocked-out';
    let role: string | undefined;
    let clockInTime: Date | undefined;

    todayPunches.forEach(punch => {
      if (punch.punchType === 'clock-in') {
        status = 'on-shift';
        role = punch.role;
        clockInTime = punch.timestamp;
      } else if (punch.punchType === 'clock-out') {
        status = 'clocked-out';
        role = undefined;
        clockInTime = undefined;
      } else if (punch.punchType === 'break-start') {
        status = 'on-break';
      } else if (punch.punchType === 'break-end') {
        status = 'on-shift';
      }
    });

    return { status, role, clockInTime };
  }, [authenticatedEmployee, timePunches]);

  const handlePinPadClick = (value: string) => {
    if (value === 'C') {
      setPinEntry('');
      setError('');
    } else if (value === '⌫') {
      setPinEntry(prev => prev.slice(0, -1));
      setError('');
    } else {
      if (pinEntry.length < 6) {
        const newPin = pinEntry + value;
        setPinEntry(newPin);
        setError('');
        
        // Auto-authenticate when 4 digits entered
        if (newPin.length === 4) {
          setTimeout(() => {
            const employee = activeEmployees.find(e => e.pin === newPin);
            if (employee) {
              setAuthenticatedEmployee(employee);
              setPinEntry('');
              setError('');
            } else {
              setError('Invalid PIN. Please try again.');
              setPinEntry('');
            }
          }, 100);
        }
      }
    }
  };

  const handleScheduledPunch = (punchType: PunchType) => {
    if (!authenticatedEmployee) {
      setError('Authentication required');
      return;
    }

    const roleToUse = punchType === 'clock-in' && eligibleScheduledShift
      ? eligibleScheduledShift.role
      : (currentStatus.role || authenticatedEmployee.title);

    const punch: Omit<TimePunch, 'id' | 'synced'> = {
      employeeId: authenticatedEmployee.id,
      role: roleToUse,
      store: 'Main Street',
      punchType,
      timestamp: new Date(),
      scheduledShiftId: punchType === 'clock-in' && eligibleScheduledShift ? eligibleScheduledShift.id : undefined,
      unscheduled: false,
    };

    processPunch(punch, getPunchActionLabel(punchType));
  };

  const handleUnscheduledPunchRequest = () => {
    setShowUnscheduledConfirm(true);
    setUnscheduledPinEntry('');
  };

  const handleUnscheduledPunchConfirm = () => {
    if (!authenticatedEmployee) {
      setError('Authentication required');
      return;
    }

    // Verify PIN again for unscheduled punch
    if (unscheduledPinEntry !== authenticatedEmployee.pin) {
      setError('Invalid PIN for unscheduled punch');
      return;
    }

    const punch: Omit<TimePunch, 'id' | 'synced'> = {
      employeeId: authenticatedEmployee.id,
      role: authenticatedEmployee.title,
      store: 'Main Street',
      punchType: 'clock-in',
      timestamp: new Date(),
      unscheduled: true,
    };

    processPunch(punch, 'Unscheduled Clock In');
    setShowUnscheduledConfirm(false);
    setUnscheduledPinEntry('');
  };

  const handlePunch = (punchType: PunchType) => {
    if (!authenticatedEmployee) {
      setError('Authentication required');
      return;
    }

    const roleToUse = currentStatus.role || authenticatedEmployee.title;

    const punch: Omit<TimePunch, 'id' | 'synced'> = {
      employeeId: authenticatedEmployee.id,
      role: roleToUse,
      store: 'Main Street',
      punchType,
      timestamp: new Date(),
    };

    processPunch(punch, getPunchActionLabel(punchType));
  };

  const processPunch = (punch: Omit<TimePunch, 'id' | 'synced'>, message: string) => {
    // Add to queue if offline, otherwise process immediately
    if (isOffline) {
      setPunchQueue(prev => [...prev, { punch, queuedAt: new Date() }]);
      showSuccessNotification(`${message} recorded (offline)`);
    } else {
      onAddPunch(punch);
      showSuccessNotification(message);
    }

    setError('');

    // Auto-logout after 2 seconds
    setTimeout(() => {
      setAuthenticatedEmployee(null);
      setPinEntry('');
    }, 2000);
  };

  const getPunchActionLabel = (punchType: PunchType): string => {
    switch (punchType) {
      case 'clock-in': return 'Clocked In';
      case 'clock-out': return 'Clocked Out';
      case 'break-start': return 'Break Started';
      case 'break-end': return 'Break Ended';
    }
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const formatElapsedTime = (clockInTime: Date): string => {
    const now = new Date();
    const elapsed = now.getTime() - clockInTime.getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const pinPadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  // Get active shifts count (for manager view)
  const activeShiftsCount = useMemo(() => {
    if (userRole !== 'manager') return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employeesOnShift = new Set<string>();

    activeEmployees.forEach(employee => {
      const todayPunches = timePunches
        .filter(p => {
          const punchDate = new Date(p.timestamp);
          punchDate.setHours(0, 0, 0, 0);
          return p.employeeId === employee.id && punchDate.getTime() === today.getTime();
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      let isOnShift = false;
      todayPunches.forEach(punch => {
        if (punch.punchType === 'clock-in') {
          isOnShift = true;
        } else if (punch.punchType === 'clock-out') {
          isOnShift = false;
        }
      });

      if (isOnShift) {
        employeesOnShift.add(employee.id);
      }
    });

    return employeesOnShift.size;
  }, [userRole, activeEmployees, timePunches]);

  // PIN Entry Screen (Default)
  if (!authenticatedEmployee) {
    return (
      <div className="max-w-xl mx-auto">
        {/* Header with status indicators */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="font-semibold text-gray-900">Time Clock</h2>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {userRole === 'manager' && activeShiftsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {activeShiftsCount} on shift
                </span>
              </div>
            )}
          </div>

          {isOffline && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                Offline mode - Punches will sync when connected
                {punchQueue.length > 0 && ` (${punchQueue.length} queued)`}
              </span>
            </div>
          )}
        </div>

        {/* PIN Entry Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your PIN</h3>
            <p className="text-sm text-gray-600">Use the keypad to clock in or out</p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    pinEntry.length > i
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {pinPadNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handlePinPadClick(num)}
                className={`h-16 rounded-lg font-semibold text-xl transition-all ${
                  num === 'C' || num === '⌫'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Authenticated Screen - Clock In/Out Actions
  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{authenticatedEmployee.name}</h2>
            <p className="text-sm text-gray-600 mt-0.5">{authenticatedEmployee.title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {currentStatus.status !== 'clocked-out' && currentStatus.clockInTime && (
              <p className="text-sm text-gray-600 mt-1">
                {formatElapsedTime(currentStatus.clockInTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {currentStatus.status === 'clocked-out' ? (
        <>
          {/* Scheduled Shift Card */}
          {eligibleScheduledShift ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Your Scheduled Shift</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Role:</span> {eligibleScheduledShift.role}</p>
                    <p><span className="font-medium">Time:</span> {formatTime(eligibleScheduledShift.startTime)} - {formatTime(eligibleScheduledShift.endTime)}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleScheduledPunch('clock-in')}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <LogIn className="w-5 h-5" />
                Punch In for Scheduled Shift
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Not Currently Scheduled</h3>
                  <p className="text-sm text-gray-600">
                    You don't have a scheduled shift at this time. You can still punch in, but this will be marked as an unscheduled shift and the manager will be notified.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleUnscheduledPunchRequest}
                className="w-full py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <LogIn className="w-5 h-5" />
                Punch In Without Schedule
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Current Status */}
          <div className={`rounded-lg p-6 border-2 ${
            currentStatus.status === 'on-shift'
              ? 'bg-green-50 border-green-300'
              : 'bg-orange-50 border-orange-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">
                {currentStatus.status === 'on-shift' ? 'On Shift' : 'On Break'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentStatus.status === 'on-shift'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {currentStatus.role}
              </span>
            </div>
            {currentStatus.clockInTime && (
              <p className="text-sm text-gray-600">
                Since {formatTime(currentStatus.clockInTime)} ({formatElapsedTime(currentStatus.clockInTime)})
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
            {currentStatus.status === 'on-shift' && (
              <>
                <button
                  onClick={() => handlePunch('break-start')}
                  className="w-full py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <Coffee className="w-5 h-5" />
                  Start Break
                </button>
                <button
                  onClick={() => handlePunch('clock-out')}
                  className="w-full py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <LogOut className="w-5 h-5" />
                  Clock Out
                </button>
              </>
            )}

            {currentStatus.status === 'on-break' && (
              <>
                <button
                  onClick={() => handlePunch('break-end')}
                  className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <CheckCircle className="w-5 h-5" />
                  End Break
                </button>
                <button
                  onClick={() => handlePunch('clock-out')}
                  className="w-full py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <LogOut className="w-5 h-5" />
                  Clock Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Unscheduled Punch Confirmation Modal */}
      {showUnscheduledConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Unscheduled Punch</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This punch will be recorded as unscheduled and the manager will be notified.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Re-enter your PIN to confirm
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={unscheduledPinEntry}
                  onChange={(e) => setUnscheduledPinEntry(e.target.value)}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUnscheduledConfirm(false);
                    setUnscheduledPinEntry('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnscheduledPunchConfirm}
                  disabled={unscheduledPinEntry.length !== 4}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Punch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
