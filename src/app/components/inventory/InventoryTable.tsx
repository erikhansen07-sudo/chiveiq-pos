import { Edit2, Trash2 } from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  par: number;
  lastCount: number;
  reorderLevel: number;
  lastPhysicalCount?: string;
  daysRemaining?: number;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  const getStatusColor = (quantity: number, par: number) => {
    if (quantity === 0) return 'bg-destructive/10 text-destructive';
    if (quantity < par) return 'bg-amber-100 text-amber-800';
    return 'bg-secondary text-primary';
  };

  const getStatusText = (quantity: number, par: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < par) return 'Below PAR';
    return 'Safe Stock';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Item
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Category
            </th>
            <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quantity
            </th>
            <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              PAR
            </th>
            <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Days Left
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-accent transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">{item.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-900">
                  {item.quantity} {item.unit}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-600">
                  {item.par} {item.unit}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-600">
                  {item.daysRemaining ? item.daysRemaining.toFixed(1) : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    item.quantity,
                    item.par
                  )}`}
                >
                  {getStatusText(item.quantity, item.par)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
