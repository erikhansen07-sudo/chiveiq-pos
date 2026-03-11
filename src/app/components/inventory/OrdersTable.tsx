import { useState, useMemo } from 'react';
import { Edit2, Trash2, Plus, ChevronDown } from 'lucide-react';
import { SourceInventoryItem } from './SourceTable';
import { AddItemsModal } from './AddItemsModal';

export interface OrderItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  vendor: string;
  vendorSKU: string;
  quantityNeeded: number;
  quantityToOrder: number;
  orderingUnitOfPurchase: string;
  countingMajorUnit: string;
  unitPrice: number;
  totalCost: number;
  minOrder: number;
  orderingMinorCount: number;
  parLevel?: number;
  currentStock?: number;
}

interface OrdersTableProps {
  items: OrderItem[];
  onEditItem: (id: string, quantity: number) => void;
  onAddItem: (item: OrderItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onClearVendorOrder: (vendor: string) => void;
  onCreatePO: (vendor: string, items: OrderItem[]) => void;
  onDraftAllPOs?: (vendorOrders: { [vendor: string]: OrderItem[] }) => void;
  availableItems: OrderItem[];
  sourceInventory: any[];
}

export function OrdersTable({ 
  items, 
  onEditItem, 
  onDeleteItem, 
  onClearAll,
  onClearVendorOrder,
  onCreatePO,
  onDraftAllPOs,
  availableItems,
  sourceInventory
}: OrdersTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [addItemsModalVendor, setAddItemsModalVendor] = useState<string | null>(null);

  // Group items by vendor
  const itemsByVendor = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.vendor]) {
        acc[item.vendor] = [];
      }
      acc[item.vendor].push(item);
      return acc;
    }, {} as { [vendor: string]: OrderItem[] });
  }, [items]);

  const handleEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSave = (id: string) => {
    onEditItem(id, editValue);
    setEditingId(null);
  };

  const handleDraftAllPOs = () => {
    if (onDraftAllPOs) {
      onDraftAllPOs(itemsByVendor);
    } else {
      // Fallback to old method
      Object.entries(itemsByVendor).forEach(([vendor, vendorItems]) => {
        onCreatePO(vendor, vendorItems);
      });
    }
  };

  // Calculate grand total across all vendors
  const grandTotal = items.reduce((sum, item) => sum + item.totalCost, 0);

  // Get projected stock for an item
  const getProjectedStock = (item: OrderItem) => {
    const receivedUnits = item.quantityToOrder * item.orderingMinorCount;
    return (item.currentStock || 0) + receivedUnits;
  };

  // Get PAR level and current stock from source inventory
  const enrichItemWithInventoryData = (item: OrderItem) => {
    const sourceItem = sourceInventory.find(s => s.sku === item.sku);
    if (sourceItem) {
      return {
        ...item,
        parLevel: sourceItem.par,
        currentStock: Math.floor(sourceItem.estOnHand),
      };
    }
    return item;
  };

  const handleAddAdditionalItem = (item: OrderItem, quantity: number) => {
    const newOrderItem: OrderItem = {
      ...item,
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantityToOrder: quantity,
      totalCost: quantity * item.unitPrice,
    };
    onAddItem(newOrderItem);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Order Generation</h2>
        <div className="flex gap-2">
          {Object.keys(itemsByVendor).length > 0 && (
            <>
              <button
                onClick={handleDraftAllPOs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                DRAFT ALL POs
              </button>
              <button
                onClick={onClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL
              </button>
            </>
          )}
        </div>
      </div>

      {Object.keys(itemsByVendor).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-3">
            <Plus className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Generated</h3>
          <p className="text-gray-600">
            Go to PAR Levels and click "Generate Order" to create purchase orders
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByVendor).map(([vendor, vendorItems]) => {
            const vendorTotal = vendorItems.reduce((sum, item) => sum + item.totalCost, 0);
            
            return (
              <div key={vendor} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Vendor Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600">{vendor}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {vendorItems.length} {vendorItems.length === 1 ? 'item' : 'items'} • Total: ${vendorTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddItemsModalVendor(vendor)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                      ADD ADDITIONAL ITEMS
                    </button>
                    <button
                      onClick={() => onClearVendorOrder(vendor)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      CLEAR
                    </button>
                    <button
                      onClick={() => onCreatePO(vendor, vendorItems)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      DRAFT PO
                    </button>
                  </div>
                </div>
                
                {/* Vendor Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">SKU</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Item Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Vendor SKU</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Qty to Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Unit of Purchase</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Total Cost</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">PAR Level</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Current Stock</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Projected Stock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorItems.map((item) => {
                        const enrichedItem = enrichItemWithInventoryData(item);
                        const isEditing = editingId === item.id;
                        const projectedStock = getProjectedStock(enrichedItem);
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.sku}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.vendorSKU}</td>
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                  onBlur={() => handleSave(item.id)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSave(item.id)}
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{item.quantityToOrder}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.orderingUnitOfPurchase}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">${item.totalCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => isEditing ? handleSave(item.id) : handleEdit(item.id, item.quantityToOrder)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {enrichedItem.parLevel ? `${enrichedItem.parLevel} ${enrichedItem.countingMajorUnit}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {enrichedItem.currentStock !== undefined ? `${enrichedItem.currentStock} ${enrichedItem.countingMajorUnit}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">
                              {enrichedItem.currentStock !== undefined ? `${projectedStock} ${enrichedItem.countingMajorUnit}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
              <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {addItemsModalVendor && (
        <AddItemsModal
          isOpen={true}
          onClose={() => setAddItemsModalVendor(null)}
          vendor={addItemsModalVendor}
          availableItems={availableItems}
          existingItemSkus={items.filter(i => i.vendor === addItemsModalVendor).map(i => i.sku)}
          onAddItem={handleAddAdditionalItem}
        />
      )}
    </div>
  );
}