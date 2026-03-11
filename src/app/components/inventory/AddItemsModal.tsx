import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { OrderItem } from './OrdersTable';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: string;
  availableItems: OrderItem[];
  existingItemSkus: string[];
  onAddItem: (item: OrderItem, quantity: number) => void;
}

export function AddItemsModal({ 
  isOpen, 
  onClose, 
  vendor, 
  availableItems, 
  existingItemSkus,
  onAddItem 
}: AddItemsModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (!isOpen) return null;

  // Filter items by vendor and exclude items already in the order (compare by SKU)
  const vendorItems = availableItems.filter(
    item => item.vendor === vendor && !existingItemSkus.includes(item.sku)
  );

  const selectedItem = vendorItems.find(item => item.id === selectedItemId);

  const handleAdd = () => {
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    if (quantity < selectedItem.minOrder) {
      alert(`Minimum order quantity is ${selectedItem.minOrder} ${selectedItem.orderingUnitOfPurchase}`);
      return;
    }

    onAddItem(selectedItem, quantity);
    
    // Reset form
    setSelectedItemId('');
    setQuantity(1);
    onClose();
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = vendorItems.find(i => i.id === itemId);
    if (item) {
      setQuantity(item.minOrder);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Items - {vendor}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {vendorItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No additional items available for this vendor
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Item
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select an item --</option>
                {vendorItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} ({item.sku}) - ${item.unitPrice.toFixed(2)} per {item.orderingUnitOfPurchase}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium text-gray-900">{selectedItem.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor SKU:</span>
                    <span className="font-medium text-gray-900">{selectedItem.vendorSKU}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="font-medium text-gray-900">${selectedItem.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit of Purchase:</span>
                    <span className="font-medium text-gray-900">{selectedItem.orderingUnitOfPurchase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Order:</span>
                    <span className="font-medium text-red-600">{selectedItem.minOrder} {selectedItem.orderingUnitOfPurchase}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to Order
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={selectedItem.minOrder}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || selectedItem.minOrder)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{selectedItem.orderingUnitOfPurchase}</span>
                  </div>
                  {quantity < selectedItem.minOrder && (
                    <p className="text-xs text-red-600 mt-1">
                      Quantity must be at least {selectedItem.minOrder}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${(quantity * selectedItem.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedItem || quantity < (selectedItem?.minOrder || 0)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add to Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
