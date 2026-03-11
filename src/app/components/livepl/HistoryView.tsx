import { useState } from 'react';
import type { CostItem, TrueUpEntry } from './types';
import { useAppData } from '@/app/context/AppDataContext';

interface HistoryViewProps {
  trueUps: TrueUpEntry[];
  costItems: CostItem[];
  onNavigateToTrueUp?: (periodId: string) => void;
}

type PeriodFilter = 'current' | '3m' | '6m' | '12m';

export function HistoryView({ trueUps, costItems, onNavigateToTrueUp }: HistoryViewProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('6m');
  const { transactions = [], laborEntries = [], inventoryItems = [] } = useAppData();

  const periods = getMonthPeriods(periodFilter);

  // Calculate data for each period
  const periodsData = periods.map(period => {
    const isCurrentMonth = isCurrentPeriod(period);
    const daysInMonth = getDaysInMonth(period.startDate);
    const currentDay = isCurrentMonth ? new Date('2026-02-06').getDate() : daysInMonth;
    const monthProgress = currentDay / daysInMonth;

    // Calculate revenue from transactions
    const revenue = transactions
      .filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate >= period.startDate && tDate <= period.endDate;
      })
      .reduce((sum, t) => sum + t.total, 0);

    // Calculate COGS from transactions (using item costs from inventory)
    const cogs = transactions
      .filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate >= period.startDate && tDate <= period.endDate;
      })
      .reduce((sum, t) => {
        const transactionCogs = t.items.reduce((itemSum, item) => {
          const inventoryItem = inventoryItems.find(inv => inv.name === item.name);
          const itemCost = inventoryItem?.unitCost || 0;
          return itemSum + (itemCost * item.quantity);
        }, 0);
        return sum + transactionCogs;
      }, 0);

    // Calculate labor from labor entries
    const labor = laborEntries
      .filter(entry => {
        if (!entry.clockOut) return false;
        const entryDate = new Date(entry.clockIn);
        return entryDate >= period.startDate && entryDate <= period.endDate;
      })
      .reduce((sum, entry) => {
        const hours = (new Date(entry.clockOut!).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
        return sum + (hours * (entry.hourlyRate || 15));
      }, 0);

    // Calculate OpEx from cost items - store per cost item
    const opexByItem: Record<string, { amount: number; isTruedUp: boolean }> = {};
    costItems.forEach(cost => {
      const effectiveDate = new Date(cost.effectiveDate);
      if (effectiveDate > period.endDate) return;

      // Check if there's a true-up for this period
      const trueUp = trueUps.find(t => t.costItemId === cost.id && t.period === period.id);
      
      if (trueUp) {
        opexByItem[cost.id] = { amount: trueUp.actualAmount, isTruedUp: true };
      } else {
        // For current month, use assumed amount
        // For past months, show $0.00 (not trued up)
        if (isCurrentMonth) {
          // Calculate assumed amount
          let monthlyAmount = 0;
          
          // Handle lease schedules
          if (cost.leaseSchedule) {
            const leaseStart = new Date(cost.leaseSchedule.startDate);
            const monthsSinceStart = (period.startDate.getFullYear() - leaseStart.getFullYear()) * 12 + 
                                     (period.startDate.getMonth() - leaseStart.getMonth());
            const leaseYear = Math.floor(monthsSinceStart / 12) + 1;
            const yearData = cost.leaseSchedule.yearlyAmounts.find(ya => ya.year === leaseYear);
            if (yearData) {
              monthlyAmount = yearData.amount / 12;
            }
          } else {
            // Regular cost calculations
            switch (cost.frequency) {
              case 'daily':
                monthlyAmount = cost.amount * 30;
                break;
              case 'weekly':
                monthlyAmount = (cost.amount * 52) / 12;
                break;
              case 'monthly':
                monthlyAmount = cost.amount;
                break;
            }
          }

          // Prorate for current month based on day of month
          opexByItem[cost.id] = { amount: monthlyAmount * monthProgress, isTruedUp: false };
        } else {
          // Past month without true-up = $0.00
          opexByItem[cost.id] = { amount: 0, isTruedUp: false };
        }
      }
    });

    const totalOpex = Object.values(opexByItem).reduce((sum, val) => sum + val.amount, 0);
    const primeCost = cogs + labor;
    const grossProfit = revenue - cogs - labor;
    const operatingIncome = grossProfit - totalOpex;

    return {
      ...period,
      revenue,
      cogs,
      labor,
      primeCost,
      grossProfit,
      opexByItem,
      totalOpex,
      operatingIncome,
      isCurrentMonth,
      monthProgress,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">P&L Summary</h2>
          <p className="text-sm text-gray-600 mt-1">
            Month-over-month financial performance
          </p>
        </div>
        
        {/* Period Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriodFilter('current')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodFilter === 'current'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setPeriodFilter('3m')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodFilter === '3m'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 3
          </button>
          <button
            onClick={() => setPeriodFilter('6m')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodFilter === '6m'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 6
          </button>
          <button
            onClick={() => setPeriodFilter('12m')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodFilter === '12m'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 12
          </button>
        </div>
      </div>

      {/* P&L Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                  Line Item
                </th>
                {periodsData.map((period, idx) => (
                  <th key={period.id} className="text-right px-6 py-3 font-semibold text-gray-900 min-w-[140px]">
                    <div className="flex flex-col items-end">
                      <span>{period.label}</span>
                      {period.isCurrentMonth && (
                        <span className="text-xs font-normal text-blue-600 mt-0.5">
                          MTD
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Revenue */}
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                  Revenue
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-3 text-right font-semibold text-gray-900">
                    ${period.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* COGS */}
              <tr>
                <td className="px-6 py-3 text-gray-700 sticky left-0 bg-white z-10 pl-12">
                  COGS
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-3 text-right text-gray-700">
                    ${period.cogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Labor */}
              <tr>
                <td className="px-6 py-3 text-gray-700 sticky left-0 bg-white z-10 pl-12">
                  Labor
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-3 text-right text-gray-700">
                    ${period.labor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Gross Profit */}
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 pl-8">
                  Gross Profit
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-3 text-right font-semibold text-gray-900">
                    ${period.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Individual OpEx line items */}
              {costItems
                .filter(cost => {
                  const effectiveDate = new Date(cost.effectiveDate);
                  // Check if cost is active in at least one period
                  return periods.some(period => effectiveDate <= period.endDate);
                })
                .map(cost => (
                  <tr key={cost.id}>
                    <td className="px-6 py-3 text-gray-700 sticky left-0 bg-white z-10 pl-12">
                      {cost.name}
                    </td>
                    {periodsData.map(period => {
                      const opexData = period.opexByItem[cost.id];
                      const amount = opexData?.amount || 0;
                      const isTruedUp = opexData?.isTruedUp || false;
                      const isPastMonth = !period.isCurrentMonth;
                      const needsTrueUp = isPastMonth && !isTruedUp;
                      
                      return (
                        <td 
                          key={period.id} 
                          className={`px-6 py-3 text-right ${
                            needsTrueUp 
                              ? 'text-red-600 font-medium cursor-pointer hover:bg-red-50' 
                              : 'text-gray-700'
                          }`}
                          onClick={() => {
                            if (needsTrueUp && onNavigateToTrueUp) {
                              onNavigateToTrueUp(period.id);
                            }
                          }}
                          title={needsTrueUp ? 'Click to true-up this item' : ''}
                        >
                          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                  </tr>
                ))}

              {/* Operating Income */}
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td className="px-6 py-3 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 pl-8">
                  Operating Income
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className={`px-6 py-3 text-right font-semibold ${
                    period.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${period.operatingIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Spacer */}
              <tr className="h-4">
                <td colSpan={periodsData.length + 1}></td>
              </tr>

              {/* Percentages Section */}
              <tr className="bg-gray-100">
                <td className="px-6 py-2 font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10 text-xs uppercase tracking-wider">
                  % of Revenue
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-2"></td>
                ))}
              </tr>

              {/* COGS % */}
              <tr>
                <td className="px-6 py-2 text-gray-700 sticky left-0 bg-white z-10 pl-12 text-sm">
                  COGS %
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-2 text-right text-gray-700 text-sm">
                    {period.revenue > 0 ? ((period.cogs / period.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                ))}
              </tr>

              {/* Labor % */}
              <tr>
                <td className="px-6 py-2 text-gray-700 sticky left-0 bg-white z-10 pl-12 text-sm">
                  Labor %
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-2 text-right text-gray-700 text-sm">
                    {period.revenue > 0 ? ((period.labor / period.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                ))}
              </tr>

              {/* Prime % */}
              <tr className="bg-gray-50">
                <td className="px-6 py-2 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 pl-8 text-sm">
                  Prime %
                </td>
                {periodsData.map(period => {
                  const primeCost = period.cogs + period.labor;
                  return (
                    <td key={period.id} className="px-6 py-2 text-right font-semibold text-gray-900 text-sm">
                      {period.revenue > 0 ? ((primeCost / period.revenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                  );
                })}
              </tr>

              {/* OpEx % */}
              <tr>
                <td className="px-6 py-2 text-gray-700 sticky left-0 bg-white z-10 pl-12 text-sm">
                  OpEx %
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className="px-6 py-2 text-right text-gray-700 text-sm">
                    {period.revenue > 0 ? ((period.totalOpex / period.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                ))}
              </tr>

              {/* Operating Margin % */}
              <tr className="bg-gray-50">
                <td className="px-6 py-2 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 pl-8 text-sm">
                  Operating Margin %
                </td>
                {periodsData.map(period => (
                  <td key={period.id} className={`px-6 py-2 text-right font-semibold text-sm ${
                    period.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {period.revenue > 0 ? ((period.operatingIncome / period.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper functions
interface Period {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

function getMonthPeriods(filter: PeriodFilter): Period[] {
  const today = new Date('2026-02-06');
  const periods: Period[] = [];
  
  let monthsToShow = 6;
  let includeCurrentMonth = false;
  
  switch (filter) {
    case 'current':
      monthsToShow = 1;
      includeCurrentMonth = true;
      break;
    case '3m':
      monthsToShow = 3;
      break;
    case '6m':
      monthsToShow = 6;
      break;
    case '12m':
      monthsToShow = 12;
      break;
  }

  // If current month only, show just current
  if (includeCurrentMonth) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    periods.push({
      id: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      startDate: monthStart,
      endDate: monthEnd,
    });
  } else {
    // Start with current month, then go backwards
    for (let i = 0; i < monthsToShow; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      periods.push({
        id: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: monthStart,
        endDate: monthEnd,
      });
    }
  }

  return periods;
}

function isCurrentPeriod(period: Period): boolean {
  const today = new Date('2026-02-06');
  const currentMonthId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return period.id === currentMonthId;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}