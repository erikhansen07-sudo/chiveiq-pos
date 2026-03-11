import { Users } from 'lucide-react';

interface LaborCostCardProps {
  period: 'DAY' | 'WEEK' | 'MONTH';
  currentCost: number;
  scheduledEnd: number;
  projectedEnd: number;
  revenue: number;
}

export function LaborCostCard({ period, currentCost, scheduledEnd, projectedEnd, revenue }: LaborCostCardProps) {
  const currentPercent = revenue > 0 ? (currentCost / revenue) * 100 : 0;
  const projectedPercent = revenue > 0 ? (projectedEnd / revenue) * 100 : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          currentPercent <= 30 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'
        }`}>
          {currentPercent.toFixed(1)}%
        </span>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">Labor Cost</p>
        <p className="text-2xl font-bold text-gray-900">${currentCost.toLocaleString()}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Current</span>
            <span className="text-gray-900 font-medium">${currentCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Scheduled</span>
            <span className="text-gray-700">${scheduledEnd.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Projected</span>
            <span className="text-gray-700">${projectedEnd.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Percentage of Revenue */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">% of Revenue</span>
            <span className="text-gray-900 font-medium">{currentPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
