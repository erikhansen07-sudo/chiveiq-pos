import { Edit2, Copy, Trash2, Plus } from 'lucide-react';

export interface DefinitionInventoryItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  vendor?: string;
  vendorSKU?: string;
  whatToCount?: string;
  preparedUnit: string; // Kitchen-level unit used during prep (e.g., Slices, Patties, Cups)
  preparedConversion?: number;
  countingMinorUnit: number;
  countingMinorUOM: string;
  countingMajorUnit: number;
  countingMajorUOM: string;
  orderingCount?: number;
  orderingUOM?: string;
  orderingUnitOfPurchase?: string;
  orderingMinorCount?: string;
  orderingMinorUnitOfPurchase?: string;
  lastVendorPrice?: number | null;
  countingUnitPrice?: number | null;
  conversionFactor?: number | null;
  minOrder?: number;
}

interface DefinitionTableProps {
  items: DefinitionInventoryItem[];
  onEditItem: (item: DefinitionInventoryItem) => void;
  onDeleteItem: (item: DefinitionInventoryItem) => void;
  onCopyItem: (item: DefinitionInventoryItem) => void;
  onAddItem: () => void;
}

export function DefinitionTable({ items, onEditItem, onDeleteItem, onCopyItem, onAddItem }: DefinitionTableProps) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Cost per Ordering Unit</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order Unit</th>
              <th className="text-center px-2 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit Size</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Count UOM</th>
              <th className="text-center px-2 py-3"></th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Conversion</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prepared UOM</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{item.sku}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.vendor || '-'}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {item.lastVendorPrice != null ? `$${item.lastVendorPrice.toFixed(2)}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.orderingUnitOfPurchase || '-'}
                </td>
                <td className="text-center px-2 py-3 text-sm italic text-gray-400">of</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.orderingMinorCount || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.whatToCount 
                    ? item.whatToCount.charAt(0).toUpperCase() + item.whatToCount.slice(1).toLowerCase()
                    : '-'}
                </td>
                <td className="text-center px-2 py-3 text-sm italic text-gray-400">each containing</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.preparedConversion || '-'}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.preparedUnit}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => onEditItem(item)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => onCopyItem(item)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <Copy className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}