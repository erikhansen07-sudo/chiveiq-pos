import { useAppData } from '@/app/context/AppDataContext';

interface LaborPercentageChartProps {
  period: 'DAY' | 'WEEK' | 'MONTH';
  currentLaborPercent?: number;
  predictedLaborPercent?: number;
}

export function LaborPercentageChart({ period, currentLaborPercent, predictedLaborPercent }: LaborPercentageChartProps) {
  const { transactions, timePunches, employees } = useAppData();
  
  // Helper to calculate labor cost for a time range
  const calculateLaborForRange = (startTime: Date, endTime: Date): number => {
    const relevantPunches = timePunches
      .filter(p => p.timestamp >= startTime && p.timestamp <= endTime)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const employeePunches = new Map<string, typeof timePunches>();
    relevantPunches.forEach(punch => {
      const existing = employeePunches.get(punch.employeeId) || [];
      employeePunches.set(punch.employeeId, [...existing, punch]);
    });
    
    let totalCost = 0;
    
    employeePunches.forEach((punches, employeeId) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee || !employee.payRate || employee.payType !== 'hourly') return;
      
      let clockInTime: Date | null = null;
      let totalHours = 0;
      
      punches.forEach(punch => {
        if (punch.punchType === 'clock-in') {
          clockInTime = punch.timestamp;
        } else if (punch.punchType === 'clock-out' && clockInTime) {
          const hours = (punch.timestamp.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          clockInTime = null;
        }
      });
      
      // If still clocked in, calculate up to endTime
      if (clockInTime) {
        const hours = (endTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      totalCost += totalHours * employee.payRate;
    });
    
    return totalCost;
  };

  const getDayData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => t.timestamp >= startOfDay);
    
    return hours.map(hour => {
      if (hour < currentHour) {
        // Calculate actual labor % for this hour
        const hourStart = new Date(startOfDay);
        hourStart.setHours(hour);
        const hourEnd = new Date(startOfDay);
        hourEnd.setHours(hour + 1);
        
        const hourRevenue = todayTransactions
          .filter(t => t.timestamp >= hourStart && t.timestamp < hourEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        const hourLabor = calculateLaborForRange(hourStart, hourEnd);
        const laborPercent = hourRevenue > 0 ? (hourLabor / hourRevenue) * 100 : 0;
        
        return { label: `${hour}:00`, actual: laborPercent, predicted: null };
      } else if (hour === currentHour) {
        return { label: `${hour}:00`, actual: currentLaborPercent || 0, predicted: null };
      } else {
        // Predicted based on current average
        return { label: `${hour}:00`, actual: null, predicted: currentLaborPercent || 30 };
      }
    });
  };

  const getWeekData = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayOfWeek = now.getDay();
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekTransactions = transactions.filter(t => t.timestamp >= startOfWeek);
    
    return days.map((day, i) => {
      if (i < currentDayOfWeek) {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        
        const dayRevenue = weekTransactions
          .filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        const dayLabor = calculateLaborForRange(dayStart, dayEnd);
        const laborPercent = dayRevenue > 0 ? (dayLabor / dayRevenue) * 100 : 0;
        
        return { label: day, actual: laborPercent, predicted: null };
      } else if (i === currentDayOfWeek) {
        return { label: day, actual: currentLaborPercent || 0, predicted: null };
      } else {
        return { label: day, actual: null, predicted: currentLaborPercent || 30 };
      }
    });
  };

  const getMonthData = () => {
    const now = new Date();
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const currentWeekOfMonth = Math.floor((now.getDate() - 1) / 7);
    
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthTransactions = transactions.filter(t => t.timestamp >= startOfMonth);
    
    return weeks.map((week, i) => {
      if (i < currentWeekOfMonth) {
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(1 + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekRevenue = monthTransactions
          .filter(t => t.timestamp >= weekStart && t.timestamp < weekEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        const weekLabor = calculateLaborForRange(weekStart, weekEnd);
        const laborPercent = weekRevenue > 0 ? (weekLabor / weekRevenue) * 100 : 0;
        
        return { label: week, actual: laborPercent, predicted: null };
      } else if (i === currentWeekOfMonth) {
        return { label: week, actual: currentLaborPercent || 0, predicted: null };
      } else {
        return { label: week, actual: null, predicted: currentLaborPercent || 30 };
      }
    });
  };

  const data = period === 'DAY' ? getDayData() : period === 'WEEK' ? getWeekData() : getMonthData();
  
  const maxValue = 45; // Fixed scale for labor %
  const targetLine = 30; // Target labor percentage

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Labor %</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Target: {targetLine}% of revenue
        </p>
      </div>
      
      <div className="h-48 relative">
        {/* Target line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-dashed border-green-500 z-10"
          style={{ bottom: `${(targetLine / maxValue) * 100}%` }}
        >
          <span className="absolute -top-2 -right-0 text-xs text-green-600 bg-white px-1">
            Target
          </span>
        </div>
        
        <div className="flex items-end justify-between h-full gap-1">
          {data.map((point, i) => {
            const actualHeight = point.actual ? (point.actual / maxValue) * 100 : 0;
            const predictedHeight = point.predicted ? (point.predicted / maxValue) * 100 : 0;
            const isAboveTarget = (point.actual || point.predicted || 0) > targetLine;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-full">
                  {point.actual !== null && (
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isAboveTarget ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      style={{ height: `${Math.min(actualHeight, 100)}%` }}
                      title={`${point.actual.toFixed(1)}%`}
                    />
                  )}
                  {point.predicted !== null && (
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isAboveTarget ? 'bg-red-200' : 'bg-purple-200'
                      }`}
                      style={{ height: `${Math.min(predictedHeight, 100)}%` }}
                      title={`Predicted: ${point.predicted.toFixed(1)}%`}
                    />
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                  {period === 'DAY' && i % 4 === 0 ? point.label : period !== 'DAY' ? point.label : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-600 rounded" />
          <span className="text-xs text-gray-600">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-200 rounded" />
          <span className="text-xs text-gray-600">Predicted</span>
        </div>
      </div>
    </div>
  );
}