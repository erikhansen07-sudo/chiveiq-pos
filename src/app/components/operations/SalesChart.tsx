import { useAppData } from '@/app/context/AppDataContext';

interface SalesChartProps {
  period: 'DAY' | 'WEEK' | 'MONTH';
  currentSales?: number;
  predictedEnd?: number;
}

export function SalesChart({ period, currentSales, predictedEnd }: SalesChartProps) {
  const { transactions } = useAppData();
  
  const getDayData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Calculate actual sales per hour from transactions
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => t.timestamp >= startOfDay);
    
    return hours.map(hour => {
      if (hour < currentHour) {
        // Calculate actual sales for this hour
        const hourStart = new Date(startOfDay);
        hourStart.setHours(hour);
        const hourEnd = new Date(startOfDay);
        hourEnd.setHours(hour + 1);
        
        const hourSales = todayTransactions
          .filter(t => t.timestamp >= hourStart && t.timestamp < hourEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: `${hour}:00`, actual: hourSales, predicted: null };
      } else if (hour === currentHour) {
        // Current hour - show actual so far
        const hourStart = new Date(startOfDay);
        hourStart.setHours(hour);
        
        const hourSales = todayTransactions
          .filter(t => t.timestamp >= hourStart)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: `${hour}:00`, actual: hourSales, predicted: null };
      } else {
        // Future hours - estimate based on average
        const avgPerHour = currentHour > 0 ? (currentSales || 0) / currentHour : 50;
        return { label: `${hour}:00`, actual: null, predicted: avgPerHour };
      }
    });
  };

  const getWeekData = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayOfWeek = now.getDay();
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekTransactions = transactions.filter(t => t.timestamp >= startOfWeek);
    
    return days.map((day, i) => {
      if (i < currentDayOfWeek) {
        // Past days
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        
        const daySales = weekTransactions
          .filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: day, actual: daySales, predicted: null };
      } else if (i === currentDayOfWeek) {
        // Today
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        
        const daySales = weekTransactions
          .filter(t => t.timestamp >= dayStart)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: day, actual: daySales, predicted: null };
      } else {
        // Future days
        const avgPerDay = currentDayOfWeek > 0 ? (currentSales || 0) / currentDayOfWeek : 1000;
        return { label: day, actual: null, predicted: avgPerDay };
      }
    });
  };

  const getMonthData = () => {
    const now = new Date();
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const currentWeekOfMonth = Math.floor((now.getDate() - 1) / 7);
    
    // Get start of month
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthTransactions = transactions.filter(t => t.timestamp >= startOfMonth);
    
    return weeks.map((week, i) => {
      if (i < currentWeekOfMonth) {
        // Past weeks
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(1 + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekSales = monthTransactions
          .filter(t => t.timestamp >= weekStart && t.timestamp < weekEnd)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: week, actual: weekSales, predicted: null };
      } else if (i === currentWeekOfMonth) {
        // Current week
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(1 + (i * 7));
        
        const weekSales = monthTransactions
          .filter(t => t.timestamp >= weekStart)
          .reduce((sum, t) => sum + t.total, 0);
        
        return { label: week, actual: weekSales, predicted: null };
      } else {
        // Future weeks
        const avgPerWeek = currentWeekOfMonth > 0 ? (currentSales || 0) / currentWeekOfMonth : 7000;
        return { label: week, actual: null, predicted: avgPerWeek };
      }
    });
  };

  const data = period === 'DAY' ? getDayData() : period === 'WEEK' ? getWeekData() : getMonthData();
  
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.actual || 0, d.predicted || 0)),
    1 // Ensure at least 1 to avoid division by zero
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Sales Trend</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {period === 'DAY' ? 'Hourly breakdown' : period === 'WEEK' ? 'Daily breakdown' : 'Weekly breakdown'}
        </p>
      </div>
      
      <div className="h-48">
        <div className="flex items-end justify-between h-full gap-1">
          {data.map((point, i) => {
            const actualHeight = point.actual ? (point.actual / maxValue) * 100 : 0;
            const predictedHeight = point.predicted ? (point.predicted / maxValue) * 100 : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-full">
                  {point.actual !== null && (
                    <div 
                      className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                      style={{ height: `${actualHeight}%` }}
                      title={`$${point.actual.toFixed(0)}`}
                    />
                  )}
                  {point.predicted !== null && (
                    <div 
                      className="w-full bg-blue-200 rounded-t transition-all"
                      style={{ height: `${predictedHeight}%` }}
                      title={`Predicted: $${point.predicted.toFixed(0)}`}
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
          <div className="w-3 h-3 bg-blue-600 rounded" />
          <span className="text-xs text-gray-600">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded" />
          <span className="text-xs text-gray-600">Predicted</span>
        </div>
      </div>
    </div>
  );
}