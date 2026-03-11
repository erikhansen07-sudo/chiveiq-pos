import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface DetailInventoryItem {
  id: string;
  category: string;
  estOnHand: number;
  par: number;
}

interface CategoryStatusProps {
  inventory: DetailInventoryItem[];
  onCategoryClick?: (category: string) => void;
}

export function CategoryStatus({ inventory, onCategoryClick }: CategoryStatusProps) {
  const categories = ['Produce', 'Proteins', 'Dairy', 'Dry Goods', 'Beverages', 'Condiments', 'Packaging'];
  
  const getCategoryStatus = (category: string) => {
    const items = inventory.filter(item => item.category === category);
    const safeStock = items.filter(item => item.estOnHand >= item.par).length;
    const belowPar = items.filter(item => item.estOnHand < item.par && item.estOnHand > 0).length;
    const outOfStock = items.filter(item => item.estOnHand === 0).length;
    
    return { safeStock, belowPar, outOfStock, total: items.length };
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(category => {
          const status = getCategoryStatus(category);
          return (
            <button
              key={category}
              onClick={() => onCategoryClick?.(category)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{status.safeStock} Safe</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">{status.belowPar} Below PAR</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">{status.outOfStock} Out</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
