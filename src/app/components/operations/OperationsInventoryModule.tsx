import { AlertTriangle } from 'lucide-react';
import { useAppData } from '@/app/context/AppDataContext';

export function OperationsInventoryModule() {
  const { inventoryItems } = useAppData();

  // Filter and categorize items
  const alertItems = inventoryItems
    .map(item => {
      const percentRemaining = item.parLevel > 0 ? (item.currentQuantity / item.parLevel) * 100 : 0;
      let status: 'critical' | 'low' | 'ok' = 'ok';
      
      if (percentRemaining < 25) {
        status = 'critical';
      } else if (percentRemaining < 50) {
        status = 'low';
      }

      return {
        name: item.name,
        current: item.currentQuantity,
        par: item.parLevel,
        unit: item.unit,
        status,
        percentRemaining,
      };
    })
    .filter(item => item.status === 'critical' || item.status === 'low')
    .sort((a, b) => a.percentRemaining - b.percentRemaining); // Show most critical first

  const criticalCount = alertItems.filter(i => i.status === 'critical').length;
  const lowCount = alertItems.filter(i => i.status === 'low').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Inventory Alerts</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {criticalCount} critical • {lowCount} low
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-80 overflow-auto">
        {alertItems.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            <p className="text-sm">No inventory alerts</p>
            <p className="text-xs mt-1">All items are at healthy levels</p>
          </div>
        ) : (
          alertItems.map((item, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.status === 'critical' && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {item.current.toFixed(1)} {item.unit}
                  </p>
                  <p className="text-xs text-gray-500">Par: {item.par.toFixed(1)}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    item.status === 'critical' 
                      ? 'bg-red-500' 
                      : item.status === 'low' 
                      ? 'bg-amber-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(item.percentRemaining, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}