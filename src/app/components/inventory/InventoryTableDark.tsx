import { InventoryItem } from './InventoryTable';

interface InventoryTableDarkProps {
  items: InventoryItem[];
}

export function InventoryTableDark({ items }: InventoryTableDarkProps) {
  const getStatusColor = (quantity: number, par: number) => {
    if (quantity === 0) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (quantity < par) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getStatusText = (quantity: number, par: number) => {
    if (quantity === 0) return 'OUT OF STOCK';
    if (quantity < par) return 'BELOW PAR';
    return 'SAFE STOCK';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-900/50 border-b border-gray-700">
          <tr>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Item
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Category
            </th>
            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Stock
            </th>
            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              PAR Level
            </th>
            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Days Remaining
            </th>
            <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-base font-medium text-white">{item.name}</div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-sm text-gray-300">{item.category}</div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-center">
                <div className="text-base font-medium text-white">
                  {item.quantity} {item.unit}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-center">
                <div className="text-sm text-gray-400">
                  {item.par} {item.unit}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-center">
                <div className="text-sm text-gray-300">
                  {item.daysRemaining ? item.daysRemaining.toFixed(1) : '-'}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-center">
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getStatusColor(
                    item.quantity,
                    item.par
                  )}`}
                >
                  {getStatusText(item.quantity, item.par)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
