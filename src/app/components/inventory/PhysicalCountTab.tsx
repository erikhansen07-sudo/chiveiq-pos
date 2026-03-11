import { useState } from 'react';
import { Lock, CheckCircle, Plus, Minus, ArrowLeft } from 'lucide-react';
import { SourceInventoryItem } from './SourceTable';
import { DefinitionInventoryItem } from './DefinitionTable';
import { MultiUnitCountRow } from './MultiUnitCountRow';

export interface CountItem {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  currentCount: number;
  newCount: number | null;
  countingMajorUOM: string;
  locked: boolean;
  // New fields for multi-unit counting
  orderUnit?: string;
  orderUnitSize?: number;
  preparedUnit?: string;
  preparedConversion?: number;
  // User inputs for different unit types
  orderUnitCount?: number;
  countUnitCount?: number;
  preparedUnitCount?: number;
}

export interface PhysicalCount {
  id: string;
  timestamp: Date;
  items: CountItem[];
  user: string; // Name of the user who performed the count
  userId: string; // PIN or ID of the user
}

interface PhysicalCountTabProps {
  sourceInventory: SourceInventoryItem[];
  definitionInventory: DefinitionInventoryItem[];
  onLockCount: (items: CountItem[]) => void;
  pastCounts: PhysicalCount[];
}

export function PhysicalCountTab({ sourceInventory, definitionInventory, onLockCount, pastCounts }: PhysicalCountTabProps) {
  const [subTab, setSubTab] = useState<'new' | 'past'>('new');
  const [isCountingActive, setIsCountingActive] = useState(false);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [countUser, setCountUser] = useState<{ name: string; id: string } | null>(null);
  const [expandedCountId, setExpandedCountId] = useState<string | null>(null);

  // Mock users for PIN authentication (in real app, this would come from props or context)
  const users = [
    { id: 'user-1', name: 'Sarah Johnson', pin: '1234' },
    { id: 'user-2', name: 'Mike Chen', pin: '2345' },
    { id: 'user-3', name: 'Emily Rodriguez', pin: '3456' },
    { id: 'user-4', name: 'James Wilson', pin: '4567' },
  ];

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-verify when 4 digits entered
      if (newPin.length === 4) {
        const user = users.find(u => u.pin === newPin);
        if (user) {
          setCountUser({ name: user.name, id: user.id });
          setPinError('');
          setShowPinPrompt(false);
          setPin('');
          // Now start the count
          startCountWithUser();
        } else {
          setPinError('Invalid PIN');
          setTimeout(() => {
            setPin('');
            setPinError('');
          }, 2000);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin('');
    setPinError('');
  };

  const handlePinCancel = () => {
    setShowPinPrompt(false);
    setPin('');
    setPinError('');
    setCountUser(null);
  };

  const startCountWithUser = () => {
    setCountItems(
      sourceInventory.map(item => {
        const defItem = definitionInventory.find(d => d.id === item.id);
        return {
          id: item.id,
          itemName: item.itemName,
          sku: item.sku,
          category: item.category,
          currentCount: item.lastPhysicalCount,
          newCount: 0,
          countingMajorUOM: item.countingMajorUOM,
          locked: false,
          // Initialize multi-unit counting fields from definition
          orderUnit: defItem?.orderingUnitOfPurchase || 'Case',
          orderUnitSize: parseInt(defItem?.orderingMinorCount || '1'),
          preparedUnit: defItem?.preparedUnit || item.countingMajorUOM,
          preparedConversion: defItem?.preparedConversion || 1,
          orderUnitCount: 0,
          countUnitCount: 0,
          preparedUnitCount: 0,
        };
      })
    );
    setIsCountingActive(true);
  };

  const handleStartNewCount = () => {
    setShowPinPrompt(true);
  };

  const handleCountChange = (id: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setCountItems(countItems.map(item =>
      item.id === id && !item.locked ? { ...item, newCount: numValue } : item
    ));
  };

  const handleMultiUnitUpdate = (id: string, totalInCountUnits: number) => {
    setCountItems(countItems.map(item =>
      item.id === id && !item.locked ? { ...item, newCount: totalInCountUnits } : item
    ));
  };

  const handleIncrement = (id: string) => {
    setCountItems(countItems.map(item => {
      if (item.id === id && !item.locked) {
        const currentValue = item.newCount ?? item.currentCount;
        return { ...item, newCount: currentValue + 1 };
      }
      return item;
    }));
  };

  const handleDecrement = (id: string) => {
    setCountItems(countItems.map(item => {
      if (item.id === id && !item.locked) {
        const currentValue = item.newCount ?? item.currentCount;
        return { ...item, newCount: Math.max(0, currentValue - 1) };
      }
      return item;
    }));
  };

  const handleLockRow = (id: string) => {
    setCountItems(countItems.map(item =>
      item.id === id ? { ...item, locked: true } : item
    ));
  };

  const handleLockAll = () => {
    setCountItems(countItems.map(item => ({ ...item, locked: true })));
  };

  const handleConfirm = () => {
    // Only pass items that have been counted (newCount is not null)
    const itemsWithNewCounts = countItems.filter(item => item.newCount !== null);
    
    if (itemsWithNewCounts.length === 0) {
      alert('No items have been counted');
      return;
    }

    if (!confirm(`Confirm physical count for ${itemsWithNewCounts.length} items?`)) {
      return;
    }

    onLockCount(countItems);
    
    // Reset the form
    setIsCountingActive(false);
    setCountItems([]);
    
    // Switch to past counts tab to show the new count
    setSubTab('past');
  };

  const allItemsLocked = countItems.length > 0 && countItems.every(item => item.locked);
  const hasLockedItems = countItems.some(item => item.locked);

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSubTab('new')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'new'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          New Count
        </button>
        <button
          onClick={() => setSubTab('past')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'past'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Past Counts
        </button>
      </div>

      {/* New Count Tab */}
      {subTab === 'new' && (
        <div>
          {!isCountingActive ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-gray-400 mb-4">
                <Lock className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Physical Count
              </h3>
              <p className="text-gray-600 mb-6">
                Start a new physical count to update inventory levels
              </p>
              <button
                onClick={handleStartNewCount}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                New Physical Count
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Count Entry</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Current</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">New Total</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Difference</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {countItems.map((item) => (
                      <MultiUnitCountRow
                        key={item.id}
                        item={{
                          id: item.id,
                          sku: item.sku,
                          itemName: item.itemName,
                          category: item.category,
                          currentCount: item.currentCount,
                          countingMajorUOM: item.countingMajorUOM,
                          orderUnit: item.orderUnit || 'Case',
                          orderUnitSize: item.orderUnitSize || 1,
                          preparedUnit: item.preparedUnit || item.countingMajorUOM,
                          preparedConversion: item.preparedConversion || 1,
                          locked: item.locked,
                        }}
                        onUpdate={handleMultiUnitUpdate}
                        onLock={handleLockRow}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (confirm('Cancel this physical count? All data will be lost.')) {
                      setIsCountingActive(false);
                      setCountItems([]);
                    }
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel Count
                </button>

                <div className="flex gap-3">
                  {!allItemsLocked && (
                    <button
                      onClick={handleLockAll}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Lock All
                    </button>
                  )}
                  
                  {hasLockedItems && (
                    <button
                      onClick={handleConfirm}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirm Count
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Counts Tab */}
      {subTab === 'past' && (
        <div>
          {pastCounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-gray-400 mb-4">
                <Lock className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Past Counts
              </h3>
              <p className="text-gray-600">
                Completed physical counts will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items Counted</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastCounts.map((count) => {
                    const countedItems = count.items.filter(i => i.newCount !== null);
                    const isExpanded = expandedCountId === count.id;
                    const date = new Date(count.timestamp);
                    
                    return (
                      <>
                        {/* Collapsed Row */}
                        <tr key={count.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {date.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-center font-medium">
                            {countedItems.length}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {count.user || 'Unknown User'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => setExpandedCountId(isExpanded ? null : count.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 bg-gray-50">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-white border-b border-gray-200">
                                    <tr>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">SKU</th>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Item</th>
                                      <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase">Previous</th>
                                      <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase">New Count</th>
                                      <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase">Difference</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {countedItems.map((item) => {
                                      const difference = (item.newCount ?? 0) - item.currentCount;
                                      return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-gray-900">{item.sku}</td>
                                          <td className="px-3 py-2 font-medium text-gray-900">{item.itemName}</td>
                                          <td className="px-3 py-2 text-gray-600 text-center">
                                            {item.currentCount.toFixed(1)}
                                          </td>
                                          <td className="px-3 py-2 text-gray-900 text-center font-medium">
                                            {item.newCount?.toFixed(1)}
                                          </td>
                                          <td className={`px-3 py-2 text-center font-medium ${
                                            difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-400'
                                          }`}>
                                            {difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PIN Prompt */}
      {showPinPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Enter PIN</h2>
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-3 gap-4">
                {pin.split('').map((digit, index) => (
                  <div key={index} className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {digit}
                  </div>
                ))}
                {pin.length < 4 && Array(4 - pin.length).fill(null).map((_, index) => (
                  <div key={index} className="w-8 h-8 bg-gray-100 rounded-full"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(digit => (
                <button key={digit} onClick={() => handlePinInput(digit)} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-300 transition-colors">
                  {digit}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={handlePinBackspace} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={handlePinClear} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Clear
              </button>
              <button onClick={handlePinCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Cancel
              </button>
            </div>
            {pinError && (
              <p className="text-red-600 text-sm mt-2 text-center">{pinError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}