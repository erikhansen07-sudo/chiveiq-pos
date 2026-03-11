import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DefinitionInventoryItem } from './DefinitionTable';

interface DefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DefinitionInventoryItem) => void;
  item: DefinitionInventoryItem | null;
}

export function DefinitionModal({ isOpen, onClose, onSave, item }: DefinitionModalProps) {
  const [formData, setFormData] = useState<Partial<DefinitionInventoryItem>>({
    itemName: '',
    category: 'Produce',
    orderingUnitOfPurchase: 'Case',
    orderingMinorCount: '1',
    whatToCount: '',
    preparedConversion: 1,
    preparedUnit: '',
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item, isOpen]);

  // Auto-sync conversion with unit size if Count UOM and Prepared UOM are the same
  useEffect(() => {
    if (formData.whatToCount && formData.preparedUnit) {
      const countUOM = formData.whatToCount.toLowerCase().replace(/s$/, '');
      const prepUOM = formData.preparedUnit.toLowerCase().replace(/s$/, '');
      
      if (countUOM === prepUOM) {
        setFormData(prev => ({
          ...prev,
          preparedConversion: 1 // When units are the same, conversion is always 1:1
        }));
      }
    }
  }, [formData.whatToCount, formData.preparedUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      onSave({ ...item, ...formData } as DefinitionInventoryItem);
    }
    onClose();
  };

  // Generate natural language preview
  const getNaturalLanguagePreview = () => {
    const orderUnit = formData.orderingUnitOfPurchase || 'Case';
    const unitSize = formData.orderingMinorCount || '1';
    const countUOM = formData.whatToCount || 'Units';
    const conversion = formData.preparedConversion || 1;
    const preparedUOM = formData.preparedUnit || 'Units';
    
    const countUOMLower = countUOM.toLowerCase().replace(/s$/, '');
    const prepUOMLower = preparedUOM.toLowerCase().replace(/s$/, '');
    const areSame = countUOMLower === prepUOMLower;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">Preview:</p>
        <p className="text-base text-gray-900">
          <span className="font-medium">{orderUnit}</span>
          <span className="italic text-gray-500"> of </span>
          <span className="font-medium">{unitSize}</span>
          <span> {countUOM}</span>
          <span className="italic text-gray-500">, each containing </span>
          <span className="font-medium">{conversion}</span>
          <span> {preparedUOM}</span>
        </p>
        {areSame && (
          <p className="text-xs text-blue-700 mt-2">
            ℹ️ Conversion is locked to 1 because Count UOM and Prepared UOM are the same (1:1 ratio).
          </p>
        )}
      </div>
    );
  };

  const countUOMLower = (formData.whatToCount || '').toLowerCase().replace(/s$/, '');
  const prepUOMLower = (formData.preparedUnit || '').toLowerCase().replace(/s$/, '');
  const isConversionLocked = countUOMLower === prepUOMLower && countUOMLower !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Item Definition</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={formData.itemName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Order Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Unit
              <span className="text-xs text-gray-500 ml-2">(How you receive this from vendor)</span>
            </label>
            <select
              value={formData.orderingUnitOfPurchase}
              onChange={(e) => setFormData({ ...formData, orderingUnitOfPurchase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Case">Case</option>
              <option value="Box">Box</option>
              <option value="Flat">Flat</option>
              <option value="Bag">Bag</option>
              <option value="BIB">BIB (Bag-in-Box)</option>
              <option value="Pallet">Pallet</option>
            </select>
          </div>

          {/* Unit Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Size
              <span className="text-xs text-gray-500 ml-2">(How many counting units per order unit)</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.orderingMinorCount}
              onChange={(e) => setFormData({ ...formData, orderingMinorCount: e.target.value })}
              placeholder="e.g., 24, 40, 50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Count UOM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Count UOM (What to Count)
              <span className="text-xs text-gray-500 ml-2">(What you physically count during inventory)</span>
            </label>
            <input
              type="text"
              value={formData.whatToCount || ''}
              onChange={(e) => setFormData({ ...formData, whatToCount: e.target.value.toUpperCase() })}
              placeholder="e.g., HEADS, PATTIES, BOTTLES, BAGS"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Conversion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conversion
              <span className="text-xs text-gray-500 ml-2">(How many prepared units per counting unit)</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={formData.preparedConversion}
              onChange={(e) => setFormData({ ...formData, preparedConversion: parseFloat(e.target.value) })}
              placeholder="e.g., 6, 20, 100"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isConversionLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              disabled={isConversionLocked}
              required
            />
            {isConversionLocked && (
              <p className="text-xs text-amber-600 mt-1">
                🔒 Locked to 1 because Count UOM and Prepared UOM are the same (1:1 ratio)
              </p>
            )}
          </div>

          {/* Prepared UOM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prepared UOM
              <span className="text-xs text-gray-500 ml-2">(How this is used in recipes and kitchen prep)</span>
            </label>
            <input
              type="text"
              value={formData.preparedUnit || ''}
              onChange={(e) => setFormData({ ...formData, preparedUnit: e.target.value })}
              placeholder="e.g., Slices, Patties, Leaves, Squirts"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Natural Language Preview */}
          {getNaturalLanguagePreview()}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}