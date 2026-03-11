export interface DetailInventoryItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  lastPhysicalCount: number;
  countingMinorUOM: string;
  estOnHand: number;
  par: number;
  lastPricePerUnit?: number;
  onOrder?: number;
  unit?: string;
  countingMinorUnit?: number;
  lastVendorPrice?: number;
  conversionFactor?: number;
  preparedUnit?: string;
  preparedConversion?: number;
}

interface DetailTableProps {
  items: DetailInventoryItem[];
  onEditItem: (item: DetailInventoryItem) => void;
}

export function DetailTable({ items, onEditItem }: DetailTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">UOM</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Physical Count</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Est On Hand</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">On Order</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">PAR</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Price</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            // Calculate prepared unit quantities
            const preparedConversion = item.preparedConversion || 1;
            const preparedLastCount = item.lastPhysicalCount * preparedConversion;
            const preparedEstOnHand = item.estOnHand * preparedConversion;
            const preparedPar = item.par * preparedConversion;
            const preparedUOM = item.preparedUnit || item.countingMinorUOM;
            
            return (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{item.sku}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{preparedUOM}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                  {preparedLastCount.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                  {preparedEstOnHand.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">
                  {item.onOrder || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center">{preparedPar.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  ${item.lastPricePerUnit?.toFixed(2) || '0.00'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}