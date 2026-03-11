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

interface Modification {
  ingredient: string;
  action: 'remove' | 'extra';
}

interface ModifyRecipeModalProps {
  itemName: string;
  variants: Variant[];
  onAdd: (variantName: string, modifications: Modification[]) => void;
  onClose: () => void;
}

export function ModifyRecipeModal({ itemName, variants, onAdd, onClose }: ModifyRecipeModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(variants[0]);
  const [modifications, setModifications] = useState<Map<string, 'remove' | 'extra'>>(new Map());

  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant);
    setModifications(new Map());
  };

  const toggleModification = (ingredientName: string, action: 'remove' | 'extra') => {
    setModifications(prev => {
      const newMods = new Map(prev);
      if (newMods.get(ingredientName) === action) {
        newMods.delete(ingredientName);
      } else {
        newMods.set(ingredientName, action);
      }
      return newMods;
    });
  };

  const handleAddToOrder = () => {
    const modArray: Modification[] = Array.from(modifications.entries()).map(([ingredient, action]) => ({
      ingredient,
      action
    }));
    onAdd(selectedVariant.name, modArray);
  };

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
        {variants.length > 1 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Select Variant
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {variants.map((variant) => (
                <button
                  key={variant.name}
                  onClick={() => handleVariantChange(variant)}
                  className={`p-4 border-2 rounded-lg transition-colors text-left ${
                    selectedVariant.name === variant.name
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
        )}

        {/* Recipe Modification Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Modify Ingredients
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                    Ingredient
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">
                    Modifications
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedVariant.recipe.map((ingredient, index) => {
                  const currentMod = modifications.get(ingredient.name);
                  return (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="px-6 py-4 text-gray-900">{ingredient.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleModification(ingredient.name, 'remove')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentMod === 'remove'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => toggleModification(ingredient.name, 'extra')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentMod === 'extra'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Extra
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleAddToOrder}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          Add to Order
        </button>
      </div>
    </div>
  );
}
