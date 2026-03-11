import { ChevronLeft, Receipt, Users } from 'lucide-react';
import type { Employee, TimePunch } from '../labor/types';

interface Transaction {
  id: string;
  timestamp: Date;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  discounts?: number;
  voids?: number;
  tips?: number;
  paymentMethod?: string;
}

interface TransactionDetailViewProps {
  transaction: Transaction;
  onBack: () => void;
  employees?: Employee[];
  timePunches?: TimePunch[];
}

export function TransactionDetailView({ transaction, onBack, employees = [], timePunches = [] }: TransactionDetailViewProps) {
  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Calculate tip split
  const calculateTipSplit = () => {
    if (employees.length === 0 || timePunches.length === 0) {
      console.log(`⚠️ Tip calculation skipped: employees=${employees.length}, timePunches=${timePunches.length}`);
      return null;
    }

    const transactionTime = new Date(transaction.timestamp);
    console.log(`🔍 Calculating tip split for transaction at ${transactionTime.toISOString()}`);
    console.log(`   Available employees: ${employees.length}, Time punches: ${timePunches.length}`);

    // Find all employees who were clocked in at the time of the transaction (including on break)
    const workedEmployeeIds = new Set<string>();

    // Group punches by employee
    const employeePunches = timePunches.reduce((acc, punch) => {
      if (!acc[punch.employeeId]) {
        acc[punch.employeeId] = [];
      }
      acc[punch.employeeId].push(punch);
      return acc;
    }, {} as Record<string, TimePunch[]>);

    // Check each employee to see if they were clocked in (including breaks)
    Object.entries(employeePunches).forEach(([employeeId, punches]) => {
      const sortedPunches = [...punches].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentlyIn = false;
      let lastClockIn: Date | null = null;

      for (const punch of sortedPunches) {
        const punchTime = new Date(punch.timestamp);
        
        if (punch.punchType === 'clock-in') {
          currentlyIn = true;
          lastClockIn = punchTime;
        } else if (punch.punchType === 'clock-out') {
          // Check if transaction happened between clock-in and clock-out
          if (lastClockIn && transactionTime >= lastClockIn && transactionTime <= punchTime) {
            workedEmployeeIds.add(employeeId);
          }
          currentlyIn = false;
          lastClockIn = null;
        }
        // Note: We don't reset on break-start/break-end, so employees on break are still considered "in"
      }

      // If currently clocked in (no clock-out yet), check if transaction is after last clock-in
      if (currentlyIn && lastClockIn && transactionTime >= lastClockIn) {
        workedEmployeeIds.add(employeeId);
      }
    });

    // Get all employees who were working
    const allWorkingEmployees = employees.filter(emp => workedEmployeeIds.has(emp.id));
    
    // Filter for tip-eligible employees only for calculation
    const tipEligibleEmployees = allWorkingEmployees.filter(emp => emp.tipEligible !== false);

    if (allWorkingEmployees.length === 0) {
      return null;
    }

    // Calculate tip per eligible employee
    const tipAmount = transaction.tips || 0;
    const tipPerEmployee = tipEligibleEmployees.length > 0 ? tipAmount / tipEligibleEmployees.length : 0;

    return {
      totalTip: tipAmount,
      allWorkingEmployees,
      tipEligibleEmployees,
      tipPerEmployee,
    };
  };

  const tipSplit = calculateTipSplit();

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Transactions
          </button>
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-gray-900" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                #{transaction.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Ticket */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-md mx-auto">
          {/* Ticket Header */}
          <div className="border-b border-dashed border-gray-300 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chive POS</h3>
            <p className="text-xs text-gray-600 mt-1">Quick Serve Restaurant</p>
            <p className="text-xs text-gray-600">Store #1247</p>
          </div>

          {/* Transaction Info */}
          <div className="border-b border-dashed border-gray-300 p-6">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-gray-900">#{transaction.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">{formatDateTime(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="text-gray-900">{formatTime(transaction.timestamp)}</span>
              </div>
              {transaction.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-gray-900">{transaction.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-gray-300 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Items</h4>
            <div className="space-y-3">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900">${item.price.toFixed(2)}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-gray-600">
                        ${(item.price / item.quantity).toFixed(2)} each
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${transaction.subtotal.toFixed(2)}</span>
            </div>

            {transaction.discounts && transaction.discounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discounts</span>
                <span className="text-gray-900">-${transaction.discounts.toFixed(2)}</span>
              </div>
            )}

            {transaction.voids && transaction.voids > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Voids</span>
                <span className="text-gray-900">-${transaction.voids.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (8%)</span>
              <span className="text-gray-900">${transaction.tax.toFixed(2)}</span>
            </div>

            {transaction.tips && transaction.tips > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tip</span>
                <span className="text-gray-900">${transaction.tips.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-600">Thank you for your order!</p>
            <p className="text-xs text-gray-600 mt-1">
              Transaction processed at {formatTime(transaction.timestamp)}
            </p>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Transaction Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="text-gray-900">
                {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unique Products:</span>
              <span className="text-gray-900">{transaction.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Item Price:</span>
              <span className="text-gray-900">
                ${(transaction.subtotal / transaction.items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Tip Split Details */}
        {tipSplit && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-900" />
              <h4 className="text-sm font-semibold text-gray-900">Tip Breakdown</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm pb-2 border-b border-gray-200">
                <span className="text-gray-600">Total Tip:</span>
                <span className="font-semibold text-gray-900">${tipSplit.totalTip.toFixed(2)}</span>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">
                  {tipSplit.allWorkingEmployees.length} employee{tipSplit.allWorkingEmployees.length !== 1 ? 's' : ''} clocked in at time of transaction:
                </div>
                <div className="space-y-2">
                  {tipSplit.allWorkingEmployees.map((emp) => {
                    const isTipEligible = emp.tipEligible !== false;
                    const tipAmount = isTipEligible ? tipSplit.tipPerEmployee : 0;
                    return (
                      <div key={emp.id} className="flex justify-between items-center text-sm bg-gray-50 rounded px-3 py-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-600">
                            {emp.title}
                            {!isTipEligible && <span className="ml-1 text-gray-500">(not tip-eligible)</span>}
                          </div>
                        </div>
                        <div className={`font-semibold ${isTipEligible ? 'text-green-600' : 'text-gray-400'}`}>
                          ${tipAmount.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Tip or No Employees Message */}
        {!tipSplit && transaction.tips !== undefined && transaction.tips > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center">
            <p className="text-sm text-gray-600">No employees were clocked in at the time of this transaction</p>
          </div>
        )}

        {transaction.tips === 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center">
            <p className="text-sm text-gray-600">No tip was added to this transaction</p>
          </div>
        )}
      </div>
    </div>
  );
}