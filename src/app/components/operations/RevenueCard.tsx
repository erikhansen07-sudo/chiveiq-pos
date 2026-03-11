import { DollarSign } from 'lucide-react';

interface RevenueCardProps {
  period: 'DAY' | 'WEEK' | 'MONTH';
  currentRevenue: number;
  predictedEnd: number;
  projectedEnd: number;
}

export function RevenueCard({ period, currentRevenue, predictedEnd, projectedEnd }: RevenueCardProps) {
  const currentPercent = (currentRevenue / projectedEnd) * 100;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
          On Track
        </span>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">Revenue</p>
        <p className="text-2xl font-bold text-gray-900">${currentRevenue.toLocaleString()}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Current</span>
            <span className="text-gray-900 font-medium">${currentRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Predicted</span>
            <span className="text-gray-700">${predictedEnd.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Projected</span>
            <span className="text-gray-700">${projectedEnd.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{currentPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(currentPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
