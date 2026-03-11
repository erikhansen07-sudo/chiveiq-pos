import { useState, useMemo } from 'react';
import { Edit, ShoppingCart, ChevronUp } from 'lucide-react';

export interface ParItem {
  id: string;
  itemName: string;
  category?: string;
  par: number;
  countingMinorUnit: number;
  countingMinorUOM: string;
  countingMajorUOM: string;
  currentStock?: number;
  vendor?: string;
}

interface ParTableProps {
  items: ParItem[];
  onUpdatePar: (id: string, newPar: number) => void;
  onGenerateOrder: (filteredItems?: ParItem[]) => void;
  parCategoryFilter: string;
}

export function ParTable({ items, onUpdatePar, onGenerateOrder, parCategoryFilter }: ParTableProps) {
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingValues, setEditingValues] = useState<{ [key: string]: number }>({});

  // Get unique categories and vendors
  const categories = useMemo(() => {
    const cats = ['All Categories', ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];
    return cats as string[];
  }, [items]);

  const vendors = useMemo(() => {
    const vends = ['All Vendors', ...Array.from(new Set(items.map(item => item.vendor).filter(Boolean)))];
    return vends as string[];
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
      const matchesVendor = vendorFilter === 'All Vendors' || item.vendor === vendorFilter;
      const matchesParFilter = parCategoryFilter === 'All' || item.category === parCategoryFilter;
      return matchesCategory && matchesVendor && matchesParFilter;
    });
  }, [items, categoryFilter, vendorFilter, parCategoryFilter]);

  const handleEditClick = () => {
    if (isEditMode) {
      // Save all changes
      Object.entries(editingValues).forEach(([id, value]) => {
        onUpdatePar(id, value);
      });
      setEditingValues({});
    }
    setIsEditMode(!isEditMode);
  };

  const handleParChange = (id: string, value: number) => {
    setEditingValues({
      ...editingValues,
      [id]: value
    });
  };

  const formatYouShouldHave = (item: ParItem) => {
    const totalMinorUnits = item.par * item.countingMinorUnit;
    const majorUnitPlural = item.countingMajorUOM.toLowerCase().endsWith('s') 
      ? item.countingMajorUOM.toLowerCase() 
      : item.countingMajorUOM.toLowerCase() + 's';
    
    return `${item.par}, ${item.countingMinorUnit}-${item.countingMinorUOM} ${item.countingMajorUOM}${item.par !== 1 ? 's' : ''} (or ${totalMinorUnits} ${item.countingMinorUOM}${totalMinorUnits !== 1 ? 's' : ''})`;
  };

  const formatDifference = (item: ParItem) => {
    const currentStock = item.currentStock ?? 0;
    const difference = currentStock - item.par;
    
    if (difference === 0) return { text: 'At PAR', color: 'text-gray-600' };
    
    const absDiff = Math.abs(difference);
    const unit = item.countingMajorUOM.toLowerCase();
    const pluralUnit = absDiff === 1 ? unit : (unit.endsWith('s') ? unit : unit + 's');
    
    if (difference > 0) {
      return {
        text: `+${absDiff} ${pluralUnit} surplus`,
        color: 'text-green-600'
      };
    } else {
      return {
        text: `${absDiff} ${pluralUnit} short`,
        color: 'text-red-600'
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Vendor:</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {vendors.map(vend => (
                <option key={vend} value={vend}>{vend}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEditClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Edit className="w-4 h-4" />
            {isEditMode ? 'SAVE' : 'EDIT'}
          </button>
          <button
            onClick={() => onGenerateOrder(filteredItems)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            GENERATE ORDER
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  <div className="flex items-center gap-1">
                    ITEM NAME
                    <ChevronUp className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  CATEGORY
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  VENDOR
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  PAR
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  YOU SHOULD ALWAYS HAVE
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  CURRENT STOCK
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                  DIFFERENCE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No items match the current filters
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const diff = formatDifference(item);
                  const displayPar = isEditMode && editingValues[item.id] !== undefined 
                    ? editingValues[item.id] 
                    : item.par;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.vendor}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={displayPar}
                            onChange={(e) => handleParChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{displayPar}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatYouShouldHave({ ...item, par: displayPar })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">
                        {item.currentStock ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <span className={diff.color}>{diff.text}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
}
