import { useState, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { PurchaseOrder } from './PurchaseOrdersTable';

interface ReceivedItem {
  id: string;
  sku: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  orderingUnitOfPurchase: string;
  orderedUnitPrice: number;
  actualUnitPrice: number;
  orderingMinorCount: number;
}

interface AdditionalCharge {
  id: string;
  type: string;
  amount: number;
}

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onReceive: (id: string, receivedItems: ReceivedItem[], additionalCharges: AdditionalCharge[]) => void;
  availableChargeTypes: string[];
}

export function ReceivePOModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReceive,
  availableChargeTypes,
}: ReceivePOModalProps) {
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>(() =>
    purchaseOrder.items.map(item => ({
      id: item.id,
      sku: item.sku,
      itemName: item.itemName,
      orderedQuantity: item.quantityToOrder,
      receivedQuantity: item.quantityToOrder,
      orderingUnitOfPurchase: item.orderingUnitOfPurchase,
      orderedUnitPrice: item.unitPrice,
      actualUnitPrice: item.unitPrice,
      orderingMinorCount: item.orderingMinorCount || 1,
    }))
  );

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);

  if (!isOpen) return null;

  const handleUpdateReceivedQuantity = (id: string, quantity: number) => {
    setReceivedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, receivedQuantity: quantity } : item))
    );
  };

  const handleUpdateActualPrice = (id: string, price: number) => {
    setReceivedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, actualUnitPrice: price } : item))
    );
  };

  const handleAddCharge = () => {
    const newCharge: AdditionalCharge = {
      id: `charge-${Date.now()}`,
      type: availableChargeTypes[0] || 'FREIGHT',
      amount: 0,
    };
    setAdditionalCharges(prev => [...prev, newCharge]);
  };

  const handleUpdateChargeType = (id: string, type: string) => {
    setAdditionalCharges(prev =>
      prev.map(charge => (charge.id === id ? { ...charge, type } : charge))
    );
  };

  const handleUpdateChargeAmount = (id: string, amount: number) => {
    setAdditionalCharges(prev =>
      prev.map(charge => (charge.id === id ? { ...charge, amount } : charge))
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(prev => prev.filter(charge => charge.id !== id));
  };

  const itemsSubtotal = useMemo(() => {
    return receivedItems.reduce(
      (sum, item) => sum + item.receivedQuantity * item.actualUnitPrice,
      0
    );
  }, [receivedItems]);

  const chargesTotal = useMemo(() => {
    return additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  }, [additionalCharges]);

  const grandTotal = itemsSubtotal + chargesTotal;

  const handleConfirmReceive = () => {
    onReceive(purchaseOrder.id, receivedItems, additionalCharges);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Receive Purchase Order
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {purchaseOrder.poNumber} - {purchaseOrder.vendor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Received Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ordered</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ordered Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actual Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receivedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {item.orderedQuantity} {item.orderingUnitOfPurchase}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.receivedQuantity}
                          onChange={(e) => handleUpdateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        ${item.orderedUnitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <span className="mr-1">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.actualUnitPrice}
                            onChange={(e) => handleUpdateActualPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ${(item.receivedQuantity * item.actualUnitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                      Items Subtotal:
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ${itemsSubtotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Charges */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Additional Charges</h3>
              <button
                onClick={handleAddCharge}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Charge
              </button>
            </div>

            {additionalCharges.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {additionalCharges.map((charge) => (
                      <tr key={charge.id}>
                        <td className="px-4 py-3">
                          <select
                            value={charge.type}
                            onChange={(e) => handleUpdateChargeType(charge.id, e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded"
                          >
                            {availableChargeTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={charge.amount}
                              onChange={(e) => handleUpdateChargeAmount(charge.id, parseFloat(e.target.value) || 0)}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveCharge(charge.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">GRAND TOTAL:</span>
              <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReceive}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
