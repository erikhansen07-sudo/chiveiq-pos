export interface SourceInventoryItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  whatToCount: string;
  countingMinorUnit: number;
  countingMinorUOM: string;
  countingMajorUnit: number;
  countingMajorUOM: string;
  orderingMinorCount: number;
  orderingCount: number;
  orderingUnitOfPurchase: string;
  minOrder: number;
  lastVendorPrice: number;
  par: number;
  lastPhysicalCount: number;
  estOnHand: number;
  avgDailyUsage: number;
}

interface SourceTableProps {
  items: SourceInventoryItem[];
  onEditItem: (item: SourceInventoryItem) => void;
}

export function SourceTable({ items, onEditItem }: SourceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase">SKU</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase">Item</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase">Category</th>
            <th className="text-center px-3 py-2 font-medium text-gray-500 uppercase">Physical Count</th>
            <th className="text-center px-3 py-2 font-medium text-gray-500 uppercase">Est On Hand</th>
            <th className="text-center px-3 py-2 font-medium text-gray-500 uppercase">PAR</th>
            <th className="text-center px-3 py-2 font-medium text-gray-500 uppercase">Avg Daily Usage</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500 uppercase">Vendor Price</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 text-gray-900">{item.sku}</td>
              <td className="px-3 py-2 font-medium text-gray-900">{item.itemName}</td>
              <td className="px-3 py-2 text-gray-600">{item.category}</td>
              <td className="px-3 py-2 text-center text-gray-900">{item.lastPhysicalCount.toFixed(1)}</td>
              <td className="px-3 py-2 text-center text-gray-900">{item.estOnHand.toFixed(1)}</td>
              <td className="px-3 py-2 text-center text-gray-900">{item.par}</td>
              <td className="px-3 py-2 text-center text-gray-600">{item.avgDailyUsage.toFixed(1)}</td>
              <td className="px-3 py-2 text-right text-gray-900">${item.lastVendorPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
