import { useState } from 'react';
import { CheckCircle, XCircle, Calendar, Copy, Lock } from 'lucide-react';
import type { CostItem, TrueUpEntry, PeriodStatus, HistoricalPeriod } from './types';

interface TrueUpViewProps {
  costItems: CostItem[];
  trueUps: TrueUpEntry[];
  onSaveTrueUp: (trueUp: Omit<TrueUpEntry, 'id' | 'truedUpAt' | 'truedUpBy'>) => void;
  initialPeriodId?: string;
}

export function TrueUpView({ costItems, trueUps, onSaveTrueUp, initialPeriodId }: TrueUpViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(initialPeriodId || null);
  
  const periods = getRecentPeriods();
  const periodsWithStatus = periods.map(p => ({
    ...p,
    status: getPeriodStatus(p.id, costItems, trueUps),
  }));

  const selectedPeriodData = periodsWithStatus.find(p => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">True-Up</h2>
        <p className="text-sm text-gray-600 mt-1">
          Replace assumed costs with actual amounts for closed periods. All active cost items are shown automatically.
        </p>
      </div>

      {/* Period List */}
      {!selectedPeriod ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Select Period to True-Up</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Period</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Date Range</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Progress</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periodsWithStatus.map((period) => {
                  const isComplete = period.status === 'fully-trued-up';
                  const activeCostsCount = costItems.filter(cost => {
                    const effectiveDate = new Date(cost.effectiveDate);
                    return effectiveDate <= period.endDate;
                  }).length;
                  const truedUpCount = trueUps.filter(t => t.period === period.id).length;

                  return (
                    <tr key={period.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {period.label}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateRange(period.startDate, period.endDate)}
                      </td>
                      <td className="px-6 py-4">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            COMPLETE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" />
                            NOT COMPLETE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {truedUpCount} of {activeCostsCount} items
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPeriod(period.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          {isComplete ? 'View' : 'True-Up'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        selectedPeriodData && (
          <TrueUpForm
            period={selectedPeriodData}
            costItems={costItems}
            existingTrueUps={trueUps.filter(t => t.period === selectedPeriod)}
            onSaveTrueUp={onSaveTrueUp}
            onClose={() => setSelectedPeriod(null)}
          />
        )
      )}
    </div>
  );
}

interface TrueUpFormProps {
  period: HistoricalPeriod;
  costItems: CostItem[];
  existingTrueUps: TrueUpEntry[];
  onSaveTrueUp: (trueUp: Omit<TrueUpEntry, 'id' | 'truedUpAt' | 'truedUpBy'>) => void;
  onClose: () => void;
}

function TrueUpForm({ period, costItems, existingTrueUps, onSaveTrueUp, onClose }: TrueUpFormProps) {
  const [actualAmounts, setActualAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Filter costs that were active during this period
  const activeCosts = costItems.filter(cost => {
    const effectiveDate = new Date(cost.effectiveDate);
    return effectiveDate <= period.endDate;
  });

  const isComplete = period.status === 'fully-trued-up';

  const handleCopyAssumed = (costId: string, assumedAmount: number) => {
    setActualAmounts(prev => ({
      ...prev,
      [costId]: assumedAmount.toFixed(2),
    }));
  };

  const handleConfirm = () => {
    // Save all true-ups
    Object.entries(actualAmounts).forEach(([costId, actualStr]) => {
      const actual = parseFloat(actualStr);
      if (!isNaN(actual)) {
        const cost = costItems.find(c => c.id === costId);
        if (!cost) return;

        const assumedAmount = calculateAssumedAmount(cost, period);
        const variance = actual - assumedAmount;

        onSaveTrueUp({
          costItemId: costId,
          period: period.id,
          assumedAmount,
          actualAmount: actual,
          variance,
          notes: notes[costId],
        });
      }
    });

    onClose();
  };

  const hasChanges = Object.keys(actualAmounts).length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              True-Up for {period.label}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {formatDateRange(period.startDate, period.endDate)}
            </p>
          </div>
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
              <CheckCircle className="w-4 h-4" />
              COMPLETE
            </span>
          )}
        </div>
        
        {/* Info banner */}
        {!isComplete && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>All active cost items are shown below.</strong> Empty True-Up Amount fields indicate assumed costs that are awaiting actual values. 
              Enter actual amounts as they become available. Items without True-Up amounts will continue to use their default assumed values in reports.
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Cost Item</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-900">Default</th>
              {!isComplete && (
                <th className="text-center px-6 py-3 font-semibold text-gray-900"></th>
              )}
              <th className="text-right px-6 py-3 font-semibold text-gray-900">True-Up Amount</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-900">Variance</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeCosts.map((cost) => {
              const existingTrueUp = existingTrueUps.find(t => t.costItemId === cost.id);
              const assumedAmount = calculateAssumedAmount(cost, period);
              const actualAmount = actualAmounts[cost.id] 
                ? parseFloat(actualAmounts[cost.id]) 
                : existingTrueUp?.actualAmount;
              const variance = actualAmount !== undefined ? actualAmount - assumedAmount : undefined;

              return (
                <tr key={cost.id} className={`hover:bg-gray-50 ${!existingTrueUp && !actualAmounts[cost.id] ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{cost.name}</span>
                      {!existingTrueUp && !actualAmounts[cost.id] && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          ASSUMED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {cost.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    ${assumedAmount.toFixed(2)}
                  </td>
                  {!isComplete && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleCopyAssumed(cost.id, assumedAmount)}
                        disabled={!!actualAmounts[cost.id] || !!existingTrueUp}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title="Copy default value to True-Up Amount"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      {existingTrueUp && !actualAmounts[cost.id] ? (
                        <span className="text-gray-900 font-medium">
                          ${existingTrueUp.actualAmount.toFixed(2)}
                        </span>
                      ) : (
                        <div className="relative w-32">
                          <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={actualAmounts[cost.id] || ''}
                            onChange={(e) => setActualAmounts(prev => ({
                              ...prev,
                              [cost.id]: e.target.value,
                            }))}
                            disabled={isComplete && !actualAmounts[cost.id]}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Awaiting actual"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {variance !== undefined && (
                      <span className={`font-medium ${
                        Math.abs(variance) < 0.005 ? 'text-gray-900' : 
                        variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {Math.abs(variance) < 0.005 
                          ? '$0.00'
                          : `${variance > 0 ? '+' : ''}$${variance.toFixed(2)}`
                        }
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {existingTrueUp && !actualAmounts[cost.id] ? (
                      <span className="text-sm text-gray-600">{existingTrueUp.notes || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={notes[cost.id] || ''}
                        onChange={(e) => setNotes(prev => ({
                          ...prev,
                          [cost.id]: e.target.value,
                        }))}
                        disabled={isComplete && !actualAmounts[cost.id]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="Optional note"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Back to Periods
          </button>
          
          {/* Summary stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold text-gray-900">{activeCosts.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Trued Up:</span>
              <span className="font-semibold text-green-700">{existingTrueUps.length + Object.keys(actualAmounts).length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Still Assumed:</span>
              <span className="font-semibold text-amber-700">
                {activeCosts.length - (existingTrueUps.length + Object.keys(actualAmounts).length)}
              </span>
            </div>
          </div>
        </div>
        
        {!isComplete && (
          <button
            onClick={handleConfirm}
            disabled={!hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Confirm True-Up
          </button>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getRecentPeriods(): HistoricalPeriod[] {
  const today = new Date('2026-02-06'); // Using current date from context
  const periods: HistoricalPeriod[] = [];

  // Last 6 months (not including current month)
  for (let i = 1; i <= 6; i++) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    
    periods.push({
      id: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      startDate: monthStart,
      endDate: monthEnd,
      status: 'open',
      coverage: 0,
    });
  }

  return periods;
}

function getPeriodStatus(
  periodId: string,
  costItems: CostItem[],
  trueUps: TrueUpEntry[]
): PeriodStatus {
  const periodTrueUps = trueUps.filter(t => t.period === periodId);
  
  if (periodTrueUps.length === 0) return 'open';
  
  // Get the period to filter active costs
  const period = getRecentPeriods().find(p => p.id === periodId);
  if (!period) return 'open';
  
  const activeCosts = costItems.filter(cost => {
    const effectiveDate = new Date(cost.effectiveDate);
    return effectiveDate <= period.endDate;
  });
  
  const activeCostsCount = activeCosts.length;
  const truedUpCount = periodTrueUps.length;
  
  if (truedUpCount >= activeCostsCount) return 'fully-trued-up';
  return 'partially-actual';
}

function calculateAssumedAmount(cost: CostItem, period: HistoricalPeriod): number {
  // Handle lease schedules
  if (cost.leaseSchedule) {
    const leaseStart = new Date(cost.leaseSchedule.startDate);
    const periodStart = period.startDate;
    
    // Calculate which year of the lease the period falls in
    const monthsSinceStart = (periodStart.getFullYear() - leaseStart.getFullYear()) * 12 + 
                             (periodStart.getMonth() - leaseStart.getMonth());
    const leaseYear = Math.floor(monthsSinceStart / 12) + 1;
    
    // Find the yearly amount for this lease year
    const yearData = cost.leaseSchedule.yearlyAmounts.find(ya => ya.year === leaseYear);
    if (yearData) {
      // Return the monthly amount for this period
      return yearData.amount / 12;
    }
    return 0;
  }
  
  // Calculate the number of days in the period
  const days = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  let dailyAmount: number;
  switch (cost.frequency) {
    case 'daily':
      dailyAmount = cost.amount;
      break;
    case 'weekly':
      dailyAmount = cost.amount / 7;
      break;
    case 'monthly':
      dailyAmount = cost.amount / 30;
      break;
    default:
      dailyAmount = cost.amount / 30;
  }
  
  return dailyAmount * days;
}

function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}