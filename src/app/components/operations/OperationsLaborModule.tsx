import { useAppData } from '@/app/context/AppDataContext';

export function OperationsLaborModule() {
  const { employees, timePunches } = useAppData();
  const now = new Date();

  // Calculate hours and costs for each employee
  const employeeData = employees.map(employee => {
    // Find all punches for this employee today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayPunches = timePunches
      .filter(p => p.employeeId === employee.id && p.timestamp >= startOfDay)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let totalHours = 0;
    let clockInTime: Date | null = null;
    let isCurrentlyClockedIn = false;

    todayPunches.forEach(punch => {
      if (punch.punchType === 'clock-in') {
        clockInTime = punch.timestamp;
      } else if (punch.punchType === 'clock-out' && clockInTime) {
        const hours = (punch.timestamp.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
        clockInTime = null;
      }
    });

    // If still clocked in, calculate up to now
    if (clockInTime) {
      const hours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
      isCurrentlyClockedIn = true;
    }

    const cost = employee.payType === 'hourly' ? totalHours * employee.payRate : 0;
    const role = employee.title || 'Staff';

    return {
      name: employee.name,
      role,
      status: isCurrentlyClockedIn ? 'clocked-in' : 'scheduled',
      hours: totalHours,
      wage: employee.payRate || 0,
      cost,
    };
  });

  const totalCost = employeeData.reduce((sum, emp) => sum + emp.cost, 0);
  const activeCount = employeeData.filter(e => e.status === 'clocked-in').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Labor Overview</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeCount} active • ${totalCost.toFixed(0)} cost
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-80 overflow-auto">
        {employeeData.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            <p className="text-sm">No employees found</p>
            <p className="text-xs mt-1">Add employees in the Labor module</p>
          </div>
        ) : (
          employeeData.map((emp, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      emp.status === 'clocked-in' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {emp.status === 'clocked-in' ? 'Active' : 'Off Duty'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{emp.role} • ${emp.wage}/hr</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{emp.hours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500">${emp.cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}