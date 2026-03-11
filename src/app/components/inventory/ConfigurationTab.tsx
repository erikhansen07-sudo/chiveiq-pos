import { useState } from 'react';
import { CSVImportTab } from './CSVImportTab';
import { SourceInventoryItem } from './SourceTable';

export interface CategoryPrefix {
  category: string;
  prefix: string;
}

interface ConfigurationTabProps {
  categoryPrefixes: CategoryPrefix[];
  additionalChargeTypes: string[];
  onUpdatePrefixes: (prefixes: CategoryPrefix[]) => void;
  onUpdateChargeTypes: (chargeTypes: string[]) => void;
  onCSVImport?: (items: SourceInventoryItem[]) => void;
}

export function ConfigurationTab({ 
  categoryPrefixes, 
  additionalChargeTypes,
  onUpdatePrefixes,
  onUpdateChargeTypes,
  onCSVImport
}: ConfigurationTabProps) {
  const [prefixes, setPrefixes] = useState(categoryPrefixes);
  const [chargeTypes, setChargeTypes] = useState(additionalChargeTypes);
  const [newChargeType, setNewChargeType] = useState('');

  const handlePrefixChange = (category: string, newPrefix: string) => {
    const updated = prefixes.map(p =>
      p.category === category ? { ...p, prefix: newPrefix } : p
    );
    setPrefixes(updated);
    onUpdatePrefixes(updated);
  };

  const handleAddChargeType = () => {
    if (newChargeType.trim()) {
      const updated = [...chargeTypes, newChargeType.toUpperCase()];
      setChargeTypes(updated);
      onUpdateChargeTypes(updated);
      setNewChargeType('');
    }
  };

  const handleDeleteChargeType = (chargeType: string) => {
    const updated = chargeTypes.filter(ct => ct !== chargeType);
    setChargeTypes(updated);
    onUpdateChargeTypes(updated);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category SKU Prefixes</h2>
        <div className="space-y-3">
          {prefixes.map((item) => (
            <div key={item.category} className="flex items-center gap-4">
              <div className="flex-1 font-medium text-gray-900">{item.category}</div>
              <input
                type="text"
                value={item.prefix}
                onChange={(e) => handlePrefixChange(item.category, e.target.value)}
                maxLength={2}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center uppercase"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Charge Types</h2>
        <div className="space-y-3 mb-4">
          {chargeTypes.map((chargeType) => (
            <div key={chargeType} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-900">{chargeType}</span>
              <button
                onClick={() => handleDeleteChargeType(chargeType)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newChargeType}
            onChange={(e) => setNewChargeType(e.target.value)}
            placeholder="New charge type"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleAddChargeType()}
          />
          <button
            onClick={handleAddChargeType}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {onCSVImport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Import</h2>
          <CSVImportTab onImport={onCSVImport} />
        </div>
      )}
    </div>
  );
}