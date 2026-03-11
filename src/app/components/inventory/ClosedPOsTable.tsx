import { PurchaseOrder } from './PurchaseOrdersTable';

interface ClosedPOsTableProps {
  purchaseOrders: PurchaseOrder[];
  onViewPO: (po: PurchaseOrder) => void;
}

export function ClosedPOsTable({ purchaseOrders }: ClosedPOsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">PO Number</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Received Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {purchaseOrders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No closed purchase orders
              </td>
            </tr>
          ) : (
            purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{po.poNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{po.vendor}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{po.items.length}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">${po.totalCost.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    po.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">
                  {po.receivedAt ? new Date(po.receivedAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
