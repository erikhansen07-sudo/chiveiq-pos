import { ChefHat } from 'lucide-react';

interface RecipeCardProps {
  name: string;
  category: string;
  price: number;
  onClick: () => void;
}

export function RecipeCard({ name, category, price, onClick }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-colors text-left group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-900 transition-colors">
          <ChefHat className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">Price</span>
        <span className="font-semibold text-gray-900">${price.toFixed(2)}</span>
      </div>
    </button>
  );
}
