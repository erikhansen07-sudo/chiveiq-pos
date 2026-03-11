import { Minus, Plus, X } from 'lucide-react';

interface Modification {
  ingredient: string;
  action: 'remove' | 'extra';
}

interface OrderItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifications?: Modification[];
}

interface OrderItemProps {
  item: OrderItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function OrderItem({ item, onUpdateQuantity, onRemove }: OrderItemProps) {
  return (
    <div className="py-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Display Modifications */}
      {item.modifications && item.modifications.length > 0 && (
        <div className="mt-2 ml-4 space-y-1">
          {item.modifications.map((mod, index) => (
            <div key={index} className="text-xs text-gray-600">
              {mod.action === 'remove' ? '- NO' : '- EXTRA'} {mod.ingredient}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
