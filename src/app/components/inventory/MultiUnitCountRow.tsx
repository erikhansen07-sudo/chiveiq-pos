import { useState } from 'react';
import { Lock, CheckCircle, Plus, Minus } from 'lucide-react';

interface MultiUnitCountRowProps {
  item: {
    id: string;
    sku: string;
    itemName: string;
    category: string;
    currentCount: number;
    countingMajorUOM: string;
    orderUnit: string;
    orderUnitSize: number;
    preparedUnit: string;
    preparedConversion: number;
    locked: boolean;
  };
  onUpdate: (id: string, totalInCountUnits: number) => void;
  onLock: (id: string) => void;
}

export function MultiUnitCountRow({ item, onUpdate, onLock }: MultiUnitCountRowProps) {
  const [orderUnitCount, setOrderUnitCount] = useState<number>(0);
  const [countUnitCount, setCountUnitCount] = useState<number>(0);
  const [preparedUnitCount, setPreparedUnitCount] = useState<number>(0);

  // Calculate the total for display
  const calculateTotal = () => {
    const orderUnits = orderUnitCount;
    const countUnits = countUnitCount;
    const preparedUnits = preparedUnitCount;

    const fromOrderUnits = orderUnits * item.orderUnitSize;
    const fromCountUnits = countUnits;
    const fromPreparedUnits = preparedUnits / item.preparedConversion;

    return fromOrderUnits + fromCountUnits + fromPreparedUnits;
  };

  // Update parent and recalculate total
  const updateTotal = (orderUnits: number, countUnits: number, preparedUnits: number) => {
    const total = (orderUnits * item.orderUnitSize) + countUnits + (preparedUnits / item.preparedConversion);
    onUpdate(item.id, total);
  };

  // Increment/Decrement handlers
  const incrementOrderUnit = () => {
    if (item.locked) return;
    const newValue = orderUnitCount + 1;
    setOrderUnitCount(newValue);
    updateTotal(newValue, countUnitCount, preparedUnitCount);
  };

  const decrementOrderUnit = () => {
    if (item.locked || orderUnitCount <= 0) return;
    const newValue = orderUnitCount - 1;
    setOrderUnitCount(newValue);
    updateTotal(newValue, countUnitCount, preparedUnitCount);
  };

  const incrementCountUnit = () => {
    if (item.locked) return;
    const newValue = countUnitCount + 1;
    setCountUnitCount(newValue);
    updateTotal(orderUnitCount, newValue, preparedUnitCount);
  };

  const decrementCountUnit = () => {
    if (item.locked || countUnitCount <= 0) return;
    const newValue = countUnitCount - 1;
    setCountUnitCount(newValue);
    updateTotal(orderUnitCount, newValue, preparedUnitCount);
  };

  const incrementPreparedUnit = () => {
    if (item.locked) return;
    const newValue = preparedUnitCount + 1;
    setPreparedUnitCount(newValue);
    updateTotal(orderUnitCount, countUnitCount, newValue);
  };

  const decrementPreparedUnit = () => {
    if (item.locked || preparedUnitCount <= 0) return;
    const newValue = preparedUnitCount - 1;
    setPreparedUnitCount(newValue);
    updateTotal(orderUnitCount, countUnitCount, newValue);
  };

  // Update parent when inputs change
  const handleOrderUnitChange = (value: string) => {
    const newValue = parseInt(value) || 0;
    setOrderUnitCount(newValue);
    updateTotal(newValue, countUnitCount, preparedUnitCount);
  };

  const handleCountUnitChange = (value: string) => {
    const newValue = parseInt(value) || 0;
    setCountUnitCount(newValue);
    updateTotal(orderUnitCount, newValue, preparedUnitCount);
  };

  const handlePreparedUnitChange = (value: string) => {
    const newValue = parseInt(value) || 0;
    setPreparedUnitCount(newValue);
    updateTotal(orderUnitCount, countUnitCount, newValue);
  };

  const total = calculateTotal();
  const difference = total - item.currentCount;
  const hasCount = orderUnitCount > 0 || countUnitCount > 0 || preparedUnitCount > 0;

  const formatUnitName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Check if count unit and prepared unit are the same (accounting for plurals)
  const normalizeUnit = (unit: string) => {
    const normalized = unit.toLowerCase().trim();
    // Remove trailing 's' or 'es' for plural comparison
    if (normalized.endsWith('es')) {
      return normalized.slice(0, -2);
    }
    if (normalized.endsWith('s')) {
      return normalized.slice(0, -1);
    }
    return normalized;
  };

  const isSameUnit = normalizeUnit(item.countingMajorUOM) === normalizeUnit(item.preparedUnit);

  return (
    <tr className={`hover:bg-gray-50 ${item.locked ? 'bg-green-50' : ''}`}>
      <td className="px-4 py-4 text-sm text-gray-900">{item.sku}</td>
      <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.itemName}</td>
      <td className="px-4 py-4 text-sm text-gray-600">{item.category}</td>
      
      {/* Multi-unit input */}
      <td className="px-4 py-4">
        <div className="space-y-3">
          {/* Order Units */}
          <div className="flex items-center gap-2">
            <button
              onClick={decrementOrderUnit}
              disabled={item.locked || orderUnitCount <= 0}
              className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                item.locked || orderUnitCount <= 0
                  ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
              }`}
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              step="1"
              min="0"
              value={orderUnitCount}
              onChange={(e) => handleOrderUnitChange(e.target.value)}
              disabled={item.locked}
              placeholder="0"
              className={`w-16 h-10 px-2 border-2 border-gray-300 rounded-lg text-center font-medium ${
                item.locked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
            <button
              onClick={incrementOrderUnit}
              disabled={item.locked}
              className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                item.locked
                  ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 ml-2">
              {item.orderUnit}
              <span className="italic text-gray-400 ml-1">of</span>
              <span className="font-medium text-gray-900 ml-1">{item.orderUnitSize}</span>
            </span>
          </div>
          
          {/* Count Units */}
          <div className="flex items-center gap-2">
            <button
              onClick={decrementCountUnit}
              disabled={item.locked || countUnitCount <= 0}
              className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                item.locked || countUnitCount <= 0
                  ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
              }`}
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              step="1"
              min="0"
              value={countUnitCount}
              onChange={(e) => handleCountUnitChange(e.target.value)}
              disabled={item.locked}
              placeholder="0"
              className={`w-16 h-10 px-2 border-2 border-gray-300 rounded-lg text-center font-medium ${
                item.locked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
            <button
              onClick={incrementCountUnit}
              disabled={item.locked}
              className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                item.locked
                  ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 ml-2">{formatUnitName(item.countingMajorUOM)}</span>
          </div>
          
          {/* Prepared Units - Only show if different from count unit */}
          {!isSameUnit && (
            <div className="flex items-center gap-2">
              <button
                onClick={decrementPreparedUnit}
                disabled={item.locked || preparedUnitCount <= 0}
                className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                  item.locked || preparedUnitCount <= 0
                    ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
                }`}
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                step="1"
                min="0"
                value={preparedUnitCount}
                onChange={(e) => handlePreparedUnitChange(e.target.value)}
                disabled={item.locked}
                placeholder="0"
                className={`w-16 h-10 px-2 border-2 border-gray-300 rounded-lg text-center font-medium ${
                  item.locked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              <button
                onClick={incrementPreparedUnit}
                disabled={item.locked}
                className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors ${
                  item.locked
                    ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 ml-2">
                {formatUnitName(item.preparedUnit)}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Current Count */}
      <td className="px-4 py-4 text-sm text-gray-600 text-center">
        {item.currentCount.toFixed(1)}<br/>
        <span className="text-xs">{formatUnitName(item.countingMajorUOM)}</span>
      </td>

      {/* New Total */}
      <td className="px-4 py-4 text-center">
        <div className="text-base font-semibold text-gray-900">
          {total.toFixed(1)}
        </div>
        <div className="text-xs text-gray-500">{formatUnitName(item.countingMajorUOM)}</div>
      </td>

      {/* Difference */}
      <td className={`px-4 py-4 text-sm text-center font-medium ${
        difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-400'
      }`}>
        {hasCount ? (
          difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1)
        ) : '-'}
      </td>

      {/* Action */}
      <td className="px-4 py-4 text-center">
        {item.locked ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Locked
          </span>
        ) : (
          <button
            onClick={() => onLock(item.id)}
            disabled={!hasCount}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium ${
              hasCount
                ? 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Lock className="w-3 h-3" />
            Lock Count
          </button>
        )}
      </td>
    </tr>
  );
}