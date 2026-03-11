import { useState } from 'react';
import { useAppData } from '@/app/context/AppDataContext';
import { RefreshCw } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { RevenueCard } from './RevenueCard';
import { LaborCostCard } from './LaborCostCard';
import { FoodCostCard } from './FoodCostCard';
import { PLCard } from './PLCard';
import { SalesChart } from './SalesChart';
import { LaborPercentageChart } from './LaborPercentageChart';
import { OperationsLaborModule } from './OperationsLaborModule';
import { OperationsInventoryModule } from './OperationsInventoryModule';
import { FixedCostsTable } from './FixedCostsTable';

export function OperationsModule() {
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const {
    getTodayRevenue,
    getWeekRevenue,
    getMonthRevenue,
    getTodayFoodCost,
    getWeekFoodCost,
    getMonthFoodCost,
    getTodayLaborCost,
    getWeekLaborCost,
    getMonthLaborCost,
    getFixedCosts,
    transactions,
    loadSampleData,
  } = useAppData();

  // Get actual revenue based on period
  const getCurrentRevenue = () => {
    switch (period) {
      case 'DAY': return getTodayRevenue();
      case 'WEEK': return getWeekRevenue();
      case 'MONTH': return getMonthRevenue();
    }
  };

  // Get actual food cost based on period
  const getCurrentFoodCost = () => {
    switch (period) {
      case 'DAY': return getTodayFoodCost();
      case 'WEEK': return getWeekFoodCost();
      case 'MONTH': return getMonthFoodCost();
    }
  };

  // Get actual labor cost based on period
  const getCurrentLaborCost = () => {
    switch (period) {
      case 'DAY': return getTodayLaborCost();
      case 'WEEK': return getWeekLaborCost();
      case 'MONTH': return getMonthLaborCost();
    }
  };

  // Get fixed costs for period
  const fixedCostsForPeriod = getFixedCosts(period);
  const totalFixedCosts = fixedCostsForPeriod.reduce((sum, item) => sum + item.amount, 0);

  // Current actual values
  const currentRevenue = getCurrentRevenue();
  const currentFoodCost = getCurrentFoodCost();
  const currentLaborCost = getCurrentLaborCost();

  // Calculate predictions based on historical patterns
  // For now, we'll use simple projections - you can make these more sophisticated
  const getPredictedEnd = () => {
    if (transactions.length === 0) return currentRevenue * 1.5; // Default multiplier if no data
    
    // Simple time-based projection
    const now = new Date();
    const currentHour = now.getHours();
    
    switch (period) {
      case 'DAY':
        // Project to end of day (assume revenue continues at current rate)
        const hoursElapsed = currentHour + now.getMinutes() / 60;
        const hoursInDay = 14; // Assume 14 operating hours
        return hoursElapsed > 0 ? (currentRevenue / hoursElapsed) * hoursInDay : currentRevenue * 1.5;
      case 'WEEK':
        // Project based on day of week
        const dayOfWeek = now.getDay();
        return dayOfWeek > 0 ? (currentRevenue / dayOfWeek) * 7 : currentRevenue * 1.5;
      case 'MONTH':
        // Project based on day of month
        const dayOfMonth = now.getDate();
        const daysInMonth = 30;
        return dayOfMonth > 0 ? (currentRevenue / dayOfMonth) * daysInMonth : currentRevenue * 1.5;
    }
  };

  const predictedRevenueEnd = getPredictedEnd();
  const projectedRevenueEnd = predictedRevenueEnd * 1.05; // Add 5% optimistic projection

  // Project labor and food costs proportionally
  const predictedLaborEnd = currentRevenue > 0 ? (currentLaborCost / currentRevenue) * predictedRevenueEnd : currentLaborCost * 1.5;
  const projectedLaborEnd = currentRevenue > 0 ? (currentLaborCost / currentRevenue) * projectedRevenueEnd : currentLaborCost * 1.5;
  
  const predictedFoodCostEnd = currentRevenue > 0 ? (currentFoodCost / currentRevenue) * predictedRevenueEnd : currentFoodCost * 1.5;
  const projectedFoodCostEnd = currentRevenue > 0 ? (currentFoodCost / currentRevenue) * projectedRevenueEnd : currentFoodCost * 1.5;

  // Calculate metrics for Quick Stats
  const getOrderCount = () => {
    const startOfPeriod = new Date();
    switch (period) {
      case 'DAY':
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
      case 'WEEK':
        const day = startOfPeriod.getDay();
        startOfPeriod.setDate(startOfPeriod.getDate() - day);
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
      case 'MONTH':
        startOfPeriod.setDate(1);
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
    }
    return transactions.filter(t => t.timestamp >= startOfPeriod).length;
  };

  const orders = getOrderCount();
  const avgTicket = orders > 0 ? currentRevenue / orders : 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Period Selector */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Operations Dashboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">Tuesday, January 6, 2026 • Store #1247 • {transactions.length} transactions</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleData}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              title="Load sample sales data"
            >
              <RefreshCw className="w-4 h-4" />
              Load Sample Data
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={() => setPeriod('DAY')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'DAY' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              DAY
            </button>
            <button
              onClick={() => setPeriod('WEEK')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'WEEK' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              WEEK
            </button>
            <button
              onClick={() => setPeriod('MONTH')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'MONTH' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              MONTH
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="col-span-9 flex flex-col gap-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <RevenueCard 
                period={period}
                currentRevenue={currentRevenue}
                predictedEnd={predictedRevenueEnd}
                projectedEnd={projectedRevenueEnd}
              />
              <LaborCostCard
                period={period}
                currentCost={currentLaborCost}
                scheduledEnd={predictedLaborEnd}
                projectedEnd={projectedLaborEnd}
                revenue={currentRevenue}
              />
              <FoodCostCard
                period={period}
                currentCost={currentFoodCost}
                predictedEnd={predictedFoodCostEnd}
                projectedEnd={projectedFoodCostEnd}
                revenue={currentRevenue}
              />
              <PLCard
                sales={currentRevenue}
                cogs={currentFoodCost}
                labor={currentLaborCost}
                fixedCosts={totalFixedCosts}
                projectedSales={projectedRevenueEnd}
                projectedCogs={projectedFoodCostEnd}
                projectedLabor={projectedLaborEnd}
                projectedFixedCosts={totalFixedCosts}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              <SalesChart 
                period={period} 
                currentSales={period === 'DAY' ? currentRevenue : undefined}
                predictedEnd={period === 'DAY' ? predictedRevenueEnd : undefined}
              />
              <LaborPercentageChart 
                period={period}
                currentLaborPercent={period === 'DAY' ? (currentLaborCost / currentRevenue) * 100 : undefined}
                predictedLaborPercent={period === 'DAY' ? (projectedLaborEnd / projectedRevenueEnd) * 100 : undefined}
              />
            </div>

            {/* Labor and Inventory Modules */}
            <div className="grid grid-cols-2 gap-4">
              <OperationsLaborModule />
              <OperationsInventoryModule />
            </div>
          </div>

          {/* Right Column - Fixed Costs and Summary */}
          <div className="col-span-3 flex flex-col gap-4">
            <FixedCostsTable period={period} />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold mb-4 text-gray-900">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Peak {period === 'DAY' ? 'Hour' : period === 'WEEK' ? 'Day' : 'Week'}</span>
                  <span className="text-gray-900 font-medium">
                    {period === 'DAY' ? '12:00 PM' : period === 'WEEK' ? 'Saturday' : 'Week 3'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Average Ticket</span>
                  <span className="text-gray-900 font-medium">${avgTicket.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Orders {period === 'DAY' ? 'Today' : period === 'WEEK' ? 'This Week' : 'This Month'}</span>
                  <span className="text-gray-900 font-medium">{orders.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Staff on Duty</span>
                  <span className="text-gray-900 font-medium">5 / 6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Avg Wait Time</span>
                  <span className="text-gray-900 font-medium">4.2 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Customer Sat.</span>
                  <span className="text-green-600 font-medium">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}