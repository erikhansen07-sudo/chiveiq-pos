import { useMemo, useState } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import type { DailySummary } from './types';

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
}

interface SummaryTabProps {
  transactions: Transaction[];
  onRowClick: (date: Date) => void;
}

export function SummaryTab({ transactions, onRowClick }: SummaryTabProps) {
  // Filter state
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    // Default to today
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Generate daily summaries from transactions
  const dailySummaries = useMemo((): DailySummary[] => {
    // Group transactions by date
    const transactionsByDate = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, []);
      }
      transactionsByDate.get(dateKey)!.push(transaction);
    });

    // Create summary for each date
    const summaries: DailySummary[] = [];
    
    transactionsByDate.forEach((dayTransactions, dateKey) => {
      const date = new Date(dateKey);
      
      // Calculate metrics
      const grossSales = dayTransactions.reduce((sum, t) => sum + t.total, 0);
      const discounts = dayTransactions.reduce((sum, t) => sum + (t.discounts || 0), 0);
      const voids = dayTransactions.reduce((sum, t) => sum + (t.voids || 0), 0);
      const tipsCollected = dayTransactions.reduce((sum, t) => sum + (t.tips || 0), 0);
      const transactionCount = dayTransactions.length;
      
      // Net Sales = Gross - Discounts - Voids
      const netSales = grossSales - discounts - voids;
      
      // Avg Transaction = Gross Sales / Transaction Count
      const avgTransaction = transactionCount > 0 ? grossSales / transactionCount : 0;
      
      summaries.push({
        date,
        grossSales,
        discounts,
        voids,
        netSales,
        tipsCollected,
        transactionCount,
        avgTransaction,
      });
    });

    // Sort by date descending (most recent first)
    return summaries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Parse natural language search queries
  const parseSearchQuery = (query: string): ((summary: DailySummary) => boolean) | null => {
    if (!query.trim()) return null;
    
    const q = query.toLowerCase().trim();
    
    try {
      // Pattern: "days with [field] [operator] [value]"
      // Examples: 
      // - "days with net sales over 1000"
      // - "days with transaction count under 20"
      // - "days with avg transaction between 10 and 15"
      
      // Between pattern
      const betweenMatch = q.match(/(?:days with |all days (?:in \w+ )?with )?(\w+(?: \w+)*) between ([\d.]+) and ([\d.]+)/);
      if (betweenMatch) {
        const field = betweenMatch[1].trim();
        const min = parseFloat(betweenMatch[2]);
        const max = parseFloat(betweenMatch[3]);
        
        return (summary: DailySummary) => {
          const value = getFieldValue(summary, field);
          return value !== null && value >= min && value <= max;
        };
      }
      
      // Over/above pattern
      const overMatch = q.match(/(?:days with |all days (?:in \w+ )?with )?(\w+(?: \w+)*) (?:over|above|greater than) ([\d.]+)/);
      if (overMatch) {
        const field = overMatch[1].trim();
        const threshold = parseFloat(overMatch[2]);
        
        return (summary: DailySummary) => {
          const value = getFieldValue(summary, field);
          return value !== null && value > threshold;
        };
      }
      
      // Under/below pattern
      const underMatch = q.match(/(?:days with |all days (?:in \w+ )?with )?(\w+(?: \w+)*) (?:under|below|less than) ([\d.]+)/);
      if (underMatch) {
        const field = underMatch[1].trim();
        const threshold = parseFloat(underMatch[2]);
        
        return (summary: DailySummary) => {
          const value = getFieldValue(summary, field);
          return value !== null && value < threshold;
        };
      }
      
      // Month filter pattern (e.g., "all days in Feb", "days in January")
      const monthMatch = q.match(/(?:all days|days) in (\w+)/);
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase();
        const monthMap: { [key: string]: number } = {
          'jan': 0, 'january': 0,
          'feb': 1, 'february': 1,
          'mar': 2, 'march': 2,
          'apr': 3, 'april': 3,
          'may': 4,
          'jun': 5, 'june': 5,
          'jul': 6, 'july': 6,
          'aug': 7, 'august': 7,
          'sep': 8, 'september': 8,
          'oct': 9, 'october': 9,
          'nov': 10, 'november': 10,
          'dec': 11, 'december': 11,
        };
        
        const month = monthMap[monthName];
        if (month !== undefined) {
          return (summary: DailySummary) => summary.date.getMonth() === month;
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };
  
  // Helper to get field value from summary
  const getFieldValue = (summary: DailySummary, fieldName: string): number | null => {
    const normalized = fieldName.toLowerCase().replace(/\s+/g, '');
    
    const fieldMap: { [key: string]: keyof DailySummary } = {
      'grosssales': 'grossSales',
      'gross': 'grossSales',
      'discounts': 'discounts',
      'discount': 'discounts',
      'voids': 'voids',
      'void': 'voids',
      'netsales': 'netSales',
      'net': 'netSales',
      'tipscollected': 'tipsCollected',
      'tips': 'tipsCollected',
      'transactioncount': 'transactionCount',
      'transactions': 'transactionCount',
      'count': 'transactionCount',
      'avgtransaction': 'avgTransaction',
      'avg': 'avgTransaction',
      'average': 'avgTransaction',
    };
    
    const mappedField = fieldMap[normalized];
    if (!mappedField) return null;
    
    const value = summary[mappedField];
    return typeof value === 'number' ? value : null;
  };

  // Apply all filters to summaries
  const filteredSummaries = useMemo(() => {
    let filtered = dailySummaries;
    
    // Apply date range filter only if both dates are valid
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Only filter if dates are valid
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filtered = filtered.filter(summary => {
          const summaryDate = new Date(summary.date);
          return summaryDate >= start && summaryDate <= end;
        });
      }
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const searchFilter = parseSearchQuery(searchQuery);
      
      if (searchFilter) {
        filtered = filtered.filter(searchFilter);
        setSearchError('');
      } else {
        // If query is entered but can't be parsed, show error
        setSearchError('Unable to understand query. Try: "days with net sales over 1000" or "days in Feb"');
      }
    } else {
      setSearchError('');
    }
    
    return filtered;
  }, [dailySummaries, startDate, endDate, searchQuery]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSearchError('');
  };

  const hasActiveFilters = startDate !== '' || endDate !== '' || searchQuery.trim() !== '';

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Register Summary</h2>
          <p className="text-sm text-gray-600 mt-1">Day-level transaction ledger</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm text-gray-700 font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Search Days Filter */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder='Search days (e.g., "days with net sales over 1000", "days in Feb")'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
              {searchError && (
                <p className="text-xs text-gray-600 mt-1.5 ml-1">{searchError}</p>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <>
                <div className="h-8 w-px bg-gray-200"></div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Date</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Gross Sales</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Discounts</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Voids</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Net Sales</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Tips Collected</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Transaction Count</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-900">Avg Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <p>No days match the current filters</p>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((summary) => {
                  const isTodayRow = isToday(summary.date);
                  
                  return (
                    <tr
                      key={summary.date.toISOString()}
                      onClick={() => onRowClick(summary.date)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(summary.date)}</div>
                        {isTodayRow && (
                          <div className="text-xs text-gray-500 mt-0.5">In progress</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.grossSales.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.discounts.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.voids.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.netSales.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.tipsCollected.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {summary.transactionCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${summary.avgTransaction.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}