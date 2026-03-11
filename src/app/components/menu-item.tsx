import { Plus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface MenuItemProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItem({ item, onAdd }: MenuItemProps) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-colors text-left group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
      </div>
      <p className="text-gray-900 font-medium">${item.price.toFixed(2)}</p>
    </button>
  );
}
