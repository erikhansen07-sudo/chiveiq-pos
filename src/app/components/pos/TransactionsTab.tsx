import { useMemo, useState } from 'react';
import { ChevronLeft, X, Search } from 'lucide-react';
import { TransactionDetailView } from './TransactionDetailView';
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

interface TransactionsTabProps {
  transactions: Transaction[];
  selectedDate?: Date | null;
  onBackToSummary?: () => void;
  employees?: Employee[];
  timePunches?: TimePunch[];
}

export function TransactionsTab({ transactions, selectedDate, onBackToSummary, employees, timePunches }: TransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter transactions by selected date if provided
  const filteredTransactions = useMemo(() => {
    if (!selectedDate) {
      return transactions;
    }

    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= dateStart && transactionDate <= dateEnd;
    });
  }, [transactions, selectedDate]);

  // Apply search filter
  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredTransactions;
    }

    const query = searchQuery.toLowerCase();
    return filteredTransactions.filter(t => {
      // Search by transaction ID
      if (t.id.toLowerCase().includes(query)) return true;
      
      // Search by item names
      if (t.items.some(item => item.name.toLowerCase().includes(query))) return true;
      
      // Search by payment method
      if (t.paymentMethod?.toLowerCase().includes(query)) return true;
      
      // Search by total amount
      if (t.total.toFixed(2).includes(query)) return true;
      
      return false;
    });
  }, [filteredTransactions, searchQuery]);

  // Sort by timestamp descending (most recent first)
  const sortedTransactions = useMemo(() => {
    return [...searchedTransactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [searchedTransactions]);

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateLong = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateShort = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClearFilter = () => {
    if (onBackToSummary) {
      onBackToSummary();
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleBackToList = () => {
    setSelectedTransaction(null);
  };

  // If a transaction is selected, show detail view
  if (selectedTransaction) {
    return (
      <TransactionDetailView
        transaction={selectedTransaction}
        onBack={handleBackToList}
        employees={employees}
        timePunches={timePunches}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Reverse-chronological transaction list
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction ID, items, payment method, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Display */}
        {selectedDate && (
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm">
              <span className="text-gray-600">Filtered by date:</span>
              <span className="font-medium text-gray-900">{formatDateShort(selectedDate)}</span>
              <button
                onClick={handleClearFilter}
                className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                title="Clear filter"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button
              onClick={handleClearFilter}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              View all transactions
            </button>
          </div>
        )}

        {/* Transaction Count */}
        <div className="mb-4 text-sm text-gray-600">
          {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
          {selectedDate ? ` on ${formatDateLong(selectedDate)}` : ' (all time)'}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">
                  {selectedDate ? 'Time' : 'Date & Time'}
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Transaction ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Items</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Subtotal</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Tax</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Tips</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Total</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p>
                      {selectedDate 
                        ? 'No transactions for this date' 
                        : 'No transaction data available'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors" 
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {selectedDate ? formatTime(transaction.timestamp) : formatDateTime(transaction.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      #{transaction.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {transaction.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${transaction.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${transaction.tax.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${(transaction.tips || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${transaction.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.paymentMethod || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}