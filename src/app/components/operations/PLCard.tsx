import { TrendingUp } from 'lucide-react';

interface PLCardProps {
  sales: number;
  cogs: number;
  labor: number;
  fixedCosts: number;
  projectedSales: number;
  projectedCogs: number;
  projectedLabor: number;
  projectedFixedCosts: number;
}

export function PLCard({ 
  sales, 
  cogs, 
  labor, 
  fixedCosts,
  projectedSales,
  projectedCogs,
  projectedLabor,
  projectedFixedCosts
}: PLCardProps) {
  const currentProfit = sales - cogs - labor - fixedCosts;
  const currentMargin = sales > 0 ? (currentProfit / sales) * 100 : 0;
  
  const projectedProfit = projectedSales - projectedCogs - projectedLabor - projectedFixedCosts;
  const projectedMargin = projectedSales > 0 ? (projectedProfit / projectedSales) * 100 : 0;
  
  const isPositive = currentMargin > 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isPositive ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          {currentMargin >= 0 ? '+' : ''}{currentMargin.toFixed(1)}%
        </span>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">P&L</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          ${currentProfit.toLocaleString()}
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Sales</span>
            <span className="text-gray-900 font-medium">${sales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">COGS</span>
            <span className="text-gray-700">-${cogs.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Labor</span>
            <span className="text-gray-700">-${labor.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fixed</span>
            <span className="text-gray-700">-${fixedCosts.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Projected */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Projected Margin</span>
            <span className="text-gray-900 font-medium">{projectedMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
