import { useState, useMemo } from 'react';
import { OrderItem } from './OrdersTable';
import { ReceivePOModal } from './ReceivePOModal';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type POStatus = 'Draft' | 'Submitted' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  items: OrderItem[];
  totalCost: number;
  status: POStatus;
  createdAt: Date;
  submittedAt?: Date;
  receivedAt?: Date;
}

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

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  onUpdateStatus: (id: string, status: POStatus) => void;
  onReceivePO: (id: string, receivedItems: any[], additionalCharges: any[]) => void;
  onViewDetails?: (po: PurchaseOrder) => void;
  availableChargeTypes: string[];
  availableItems: OrderItem[];
  onAddItemsToPO: (poId: string, items: OrderItem[]) => void;
  onRemoveItemFromPO?: (poId: string, itemId: string) => void;
}

export function PurchaseOrdersTable({ 
  purchaseOrders, 
  onUpdateStatus,
  onReceivePO,
  availableChargeTypes,
  availableItems,
  onAddItemsToPO,
  onRemoveItemFromPO,
}: PurchaseOrdersTableProps) {
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [receivingPO, setReceivingPO] = useState<string | null>(null);
  const [showUnlistedItems, setShowUnlistedItems] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Receive flow state
  const [receivedItems, setReceivedItems] = useState<Record<string, ReceivedItem[]>>({});
  const [additionalCharges, setAdditionalCharges] = useState<Record<string, AdditionalCharge[]>>({});

  const handleViewDetails = (poId: string) => {
    setExpandedPO(expandedPO === poId ? null : poId);
    if (expandedPO !== poId) {
      setShowUnlistedItems(null);
      setReceivingPO(null);
    }
  };

  const handleReceive = (po: PurchaseOrder) => {
    // Initialize received items for this PO
    const items = po.items.map(item => ({
      id: item.id,
      sku: item.sku,
      itemName: item.itemName,
      orderedQuantity: item.quantityToOrder,
      receivedQuantity: item.quantityToOrder,
      orderingUnitOfPurchase: item.orderingUnitOfPurchase,
      orderedUnitPrice: item.unitPrice,
      actualUnitPrice: item.unitPrice,
      orderingMinorCount: item.orderingMinorCount || 1,
    }));
    
    setReceivedItems({ ...receivedItems, [po.id]: items });
    setAdditionalCharges({ ...additionalCharges, [po.id]: [] });
    setReceivingPO(po.id);
  };

  const handleCancelReceive = () => {
    setReceivingPO(null);
  };

  const handleConfirmReceive = (po: PurchaseOrder) => {
    const items = receivedItems[po.id] || [];
    const charges = additionalCharges[po.id] || [];
    onReceivePO(po.id, items, charges);
    setReceivingPO(null);
  };

  const handleUpdateReceivedQuantity = (poId: string, itemId: string, quantity: number) => {
    setReceivedItems(prev => ({
      ...prev,
      [poId]: prev[poId].map(item =>
        item.id === itemId ? { ...item, receivedQuantity: quantity } : item
      ),
    }));
  };

  const handleUpdateActualPrice = (poId: string, itemId: string, price: number) => {
    setReceivedItems(prev => ({
      ...prev,
      [poId]: prev[poId].map(item =>
        item.id === itemId ? { ...item, actualUnitPrice: price } : item
      ),
    }));
  };

  const handleAddCharge = (poId: string) => {
    const newCharge: AdditionalCharge = {
      id: `charge-${Date.now()}`,
      type: availableChargeTypes[0] || 'FREIGHT',
      amount: 0,
    };
    setAdditionalCharges(prev => ({
      ...prev,
      [poId]: [...(prev[poId] || []), newCharge],
    }));
  };

  const handleUpdateChargeType = (poId: string, chargeId: string, type: string) => {
    setAdditionalCharges(prev => ({
      ...prev,
      [poId]: prev[poId].map(charge =>
        charge.id === chargeId ? { ...charge, type } : charge
      ),
    }));
  };

  const handleUpdateChargeAmount = (poId: string, chargeId: string, amount: number) => {
    setAdditionalCharges(prev => ({
      ...prev,
      [poId]: prev[poId].map(charge =>
        charge.id === chargeId ? { ...charge, amount } : charge
      ),
    }));
  };

  const handleRemoveCharge = (poId: string, chargeId: string) => {
    setAdditionalCharges(prev => ({
      ...prev,
      [poId]: prev[poId].filter(charge => charge.id !== chargeId),
    }));
  };

  const calculateReceiveTotals = (poId: string) => {
    const items = receivedItems[poId] || [];
    const charges = additionalCharges[poId] || [];
    
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + item.receivedQuantity * item.actualUnitPrice,
      0
    );
    const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);
    const grandTotal = itemsSubtotal + chargesTotal;
    
    return { itemsSubtotal, chargesTotal, grandTotal };
  };

  const handlePrintToPDF = (po: PurchaseOrder) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`PO Number: ${po.poNumber}`, 20, 35);
    doc.text(`Vendor: ${po.vendor}`, 20, 42);
    doc.text(`Date: ${po.createdAt.toLocaleDateString()}`, 20, 49);
    doc.text(`Status: ${po.status}`, 20, 56);

    // Items table
    const tableData = po.items.map(item => [
      item.itemName,
      item.sku,
      `${item.quantityToOrder} ${item.orderingUnitOfPurchase}`,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.totalCost.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Item Name', 'SKU', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      foot: [[
        { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `$${po.totalCost.toFixed(2)}`, styles: { fontStyle: 'bold' } }
      ]],
      footStyles: { fillColor: [241, 245, 249] },
    });

    doc.save(`${po.poNumber}_${po.vendor.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSubmit = (po: PurchaseOrder) => {
    onUpdateStatus(po.id, 'Submitted');
  };

  const handleCancel = (po: PurchaseOrder) => {
    if (confirm('Are you sure you want to cancel this purchase order?')) {
      onUpdateStatus(po.id, 'Cancelled');
      setExpandedPO(null);
    }
  };

  const handleAddSingleItem = (po: PurchaseOrder, item: OrderItem) => {
    const quantity = quantities[item.id] || item.minOrder;
    const itemToAdd = {
      ...item,
      quantityToOrder: quantity,
      totalCost: quantity * item.unitPrice,
    };

    onAddItemsToPO(po.id, [itemToAdd]);
    
    // Clear the quantity for this item
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[item.id];
      return newQuantities;
    });
  };

  const handleRemoveItem = (po: PurchaseOrder, itemId: string) => {
    if (onRemoveItemFromPO) {
      onRemoveItemFromPO(po.id, itemId);
    }
  };

  const getUnlistedItems = (po: PurchaseOrder) => {
    const existingSkus = new Set(po.items.map(item => item.sku));
    return availableItems.filter(
      item => item.vendor === po.vendor && !existingSkus.has(item.sku)
    );
  };

  return (
    <>
      <div className="space-y-4">
        {purchaseOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No purchase orders yet. Create one from the Order Generation tab.
          </div>
        ) : (
          purchaseOrders.map((po) => {
            const unlistedItems = getUnlistedItems(po);
            const isExpanded = expandedPO === po.id;

            return (
              <div key={po.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {po.poNumber} - {po.vendor}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {po.items.length} items • ${po.totalCost.toFixed(2)} • {po.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(po.id)}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-white transition-colors"
                    >
                      {isExpanded ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-200">
                    {receivingPO === po.id ? (
                      /* Receive Mode */
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Receive Purchase Order
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {po.poNumber} - {po.vendor}
                          </p>
                        </div>

                        {/* Received Items Table */}
                        <div className="mb-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Received Items</h3>
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
                                {(receivedItems[po.id] || []).map((item) => (
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
                                        onChange={(e) => handleUpdateReceivedQuantity(po.id, item.id, parseInt(e.target.value) || 0)}
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
                                          onChange={(e) => handleUpdateActualPrice(po.id, item.id, parseFloat(e.target.value) || 0)}
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
                                    ${calculateReceiveTotals(po.id).itemsSubtotal.toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Additional Charges */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Additional Charges</h3>
                            <button
                              onClick={() => handleAddCharge(po.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add Charge
                            </button>
                          </div>

                          {(additionalCharges[po.id] || []).length > 0 && (
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
                                  {(additionalCharges[po.id] || []).map((charge) => (
                                    <tr key={charge.id}>
                                      <td className="px-4 py-3">
                                        <select
                                          value={charge.type}
                                          onChange={(e) => handleUpdateChargeType(po.id, charge.id, e.target.value)}
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
                                            onChange={(e) => handleUpdateChargeAmount(po.id, charge.id, parseFloat(e.target.value) || 0)}
                                            className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => handleRemoveCharge(po.id, charge.id)}
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
                        <div className="border-t-2 border-gray-300 pt-4 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">GRAND TOTAL:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              ${calculateReceiveTotals(po.id).grandTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={handleCancelReceive}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmReceive(po)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Confirm Receipt
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal View Mode */
                      <>
                        {/* Items Table */}
                        <div className="mb-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Order Items</h3>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                                  {po.status === 'Draft' && (
                                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase w-20">Actions</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {po.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                      {item.quantityToOrder} {item.orderingUnitOfPurchase}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                      ${item.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                      ${item.totalCost.toFixed(2)}
                                    </td>
                                    {po.status === 'Draft' && (
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => handleRemoveItem(po, item.id)}
                                          className="text-red-600 hover:text-red-800 transition-colors"
                                          title="Remove item"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                  <td colSpan={po.status === 'Draft' ? 4 : 4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                    TOTAL:
                                  </td>
                                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                    ${po.totalCost.toFixed(2)}
                                  </td>
                                  {po.status === 'Draft' && <td></td>}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Show Unlisted Items Section */}
                        {po.status === 'Draft' && unlistedItems.length > 0 && (
                          <div className="mb-6">
                            <button
                              onClick={() => setShowUnlistedItems(showUnlistedItems === po.id ? null : po.id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-3"
                            >
                              {showUnlistedItems === po.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              SHOW UNLISTED ITEMS ({unlistedItems.length})
                            </button>

                            {showUnlistedItems === po.id && (
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {unlistedItems.map((item) => (
                                      <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                                        <td className="px-4 py-3 text-center">
                                          <input
                                            type="number"
                                            min={item.minOrder}
                                            value={quantities[item.id] || item.minOrder}
                                            onChange={(e) => setQuantities({
                                              ...quantities,
                                              [item.id]: parseInt(e.target.value) || item.minOrder
                                            })}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                                          />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                          ${item.unitPrice.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            onClick={() => handleAddSingleItem(po, item)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                          >
                                            ADD TO ORDER
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handlePrintToPDF(po)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                          >
                            PRINT TO PDF
                          </button>
                          
                          {po.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleSubmit(po)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                MARK AS SUBMITTED
                              </button>
                              <button
                                onClick={() => handleCancel(po)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                CANCEL
                              </button>
                            </>
                          )}

                          {po.status === 'Submitted' && (
                            <button
                              onClick={() => handleReceive(po)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              RECEIVE
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}