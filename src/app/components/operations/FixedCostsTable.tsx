import { useAppData } from '@/app/context/AppDataContext';

interface FixedCostsTableProps {
  period: 'DAY' | 'WEEK' | 'MONTH';
}

export function FixedCostsTable({ period }: FixedCostsTableProps) {
  const { getFixedCosts } = useAppData();
  const costs = getFixedCosts(period);
  const total = costs.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Fixed Costs</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {period === 'DAY' ? 'Daily allocation' : period === 'WEEK' ? 'Weekly allocation' : 'Monthly total'}
        </p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {costs.map((cost, i) => {
          return (
            <div key={cost.id} className="px-5 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-700">{cost.name}</span>
              <span className="text-sm font-medium text-gray-900">${cost.amount.toFixed(2)}</span>
            </div>
          );
        })}
        
        <div className="px-5 py-3 bg-gray-50 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900">Total</span>
          <span className="text-sm font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}