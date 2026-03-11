import { X } from 'lucide-react';
import { useState } from 'react';

interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
}

interface Variant {
  name: string;
  price: number;
  recipe: InventoryItem[];
}

interface RecipeModalProps {
  itemName: string;
  variants: Variant[];
  onClose: () => void;
}

export function RecipeModal({ itemName, variants, onClose }: RecipeModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{itemName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Variants
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {variants.map((variant) => (
              <button
                key={variant.name}
                onClick={() => setSelectedVariant(variant)}
                className={`p-4 border-2 rounded-lg transition-colors text-left ${
                  selectedVariant?.name === variant.name
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold text-gray-900">{variant.name}</div>
                <div className="text-sm text-gray-600 mt-1">${variant.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Section */}
        {selectedVariant && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Recipe for {selectedVariant.name}
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      Inventory Item
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">
                      Quantity
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedVariant.recipe.map((ingredient, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="px-6 py-4 text-gray-900">{ingredient.name}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {ingredient.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {ingredient.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedVariant && (
          <div className="text-center text-gray-400 py-12">
            Select a variant to view its recipe
          </div>
        )}
      </div>
    </div>
  );
}
