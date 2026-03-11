import { useState } from 'react';
import { TrendingUp, DollarSign, CheckCircle, FileText, MapPin } from 'lucide-react';
import { LiveView } from './LiveView';
import { CostInputsView } from './CostInputsView';
import { TrueUpView } from './TrueUpView';
import { HistoryView } from './HistoryView';
import { AccountMappingView } from './AccountMappingView';
import type { CostItem, TrueUpEntry, CostChangeHistory, GLAccount } from './types';

export function LivePLModule() {
  const [activeTab, setActiveTab] = useState<'pl' | 'costs' | 'trueup' | 'history' | 'mapping'>('pl');
  const [costItems, setCostItems] = useState<CostItem[]>(initialCostItems);
  const [costChangeHistory, setCostChangeHistory] = useState<CostChangeHistory[]>([]);
  const [trueUps, setTrueUps] = useState<TrueUpEntry[]>([]);
  const [selectedTrueUpPeriod, setSelectedTrueUpPeriod] = useState<string | undefined>(undefined);
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>(initialGLAccounts);

  const handleAddCost = (cost: Omit<CostItem, 'id' | 'createdAt' | 'createdBy'>) => {
    const newCost: CostItem = {
      ...cost,
      id: `cost-${Date.now()}`,
      createdAt: new Date(),
      createdBy: 'Manager', // In real app, would be current user
    };
    setCostItems(prev => [...prev, newCost]);
  };

  const handleUpdateCost = (costId: string, updates: Partial<CostItem>, changeNote?: string) => {
    const existingCost = costItems.find(c => c.id === costId);
    if (!existingCost) return;

    // Track changes if note is provided
    if (changeNote) {
      const changes: Array<Omit<CostChangeHistory, 'id' | 'changedAt'>> = [];

      // Track each changed field
      Object.entries(updates).forEach(([field, newValue]) => {
        const oldValue = existingCost[field as keyof CostItem];
        if (oldValue !== newValue && field !== 'effectiveDate') {
          changes.push({
            costItemId: costId,
            field,
            previousValue: String(oldValue),
            newValue: String(newValue),
            effectiveDate: updates.effectiveDate || new Date(),
            changedBy: 'Manager',
            notes: changeNote,
          });
        }
      });

      // Add change history entries
      changes.forEach(change => {
        const historyEntry: CostChangeHistory = {
          ...change,
          id: `change-${Date.now()}-${Math.random()}`,
          changedAt: new Date(),
        };
        setCostChangeHistory(prev => [...prev, historyEntry]);
      });
    }

    // Update the cost
    setCostItems(prev => prev.map(c => c.id === costId ? { ...c, ...updates } : c));
  };

  const handleDeleteCost = (costId: string) => {
    setCostItems(prev => prev.filter(c => c.id !== costId));
  };

  const handleAddCostChange = (change: Omit<CostChangeHistory, 'id' | 'changedAt'>) => {
    const newChange: CostChangeHistory = {
      ...change,
      id: `change-${Date.now()}`,
      changedAt: new Date(),
    };
    setCostChangeHistory(prev => [...prev, newChange]);
  };

  const handleSaveTrueUp = (trueUp: Omit<TrueUpEntry, 'id' | 'truedUpAt' | 'truedUpBy'>) => {
    const newTrueUp: TrueUpEntry = {
      ...trueUp,
      id: `trueup-${Date.now()}-${Math.random()}`,
      truedUpAt: new Date(),
      truedUpBy: 'Manager', // In real app, would be current user
      locked: true, // Lock true-ups once confirmed
    };
    setTrueUps(prev => {
      // Check if this true-up already exists
      const existing = prev.find(t => 
        t.costItemId === trueUp.costItemId && 
        t.period === trueUp.period
      );
      
      if (existing) {
        // Update existing true-up
        return prev.map(t => 
          t.costItemId === trueUp.costItemId && t.period === trueUp.period
            ? newTrueUp
            : t
        );
      } else {
        // Add new true-up
        return [...prev, newTrueUp];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">P&L</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time operational view for intraday decisions
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex gap-8 px-8">
            <button
              onClick={() => setActiveTab('pl')}
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'pl'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              P&L
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'costs'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Costs
            </button>
            <button
              onClick={() => setActiveTab('trueup')}
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'trueup'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              True-Up
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'mapping'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Account Mapping
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'pl' && (
          <LiveView costItems={costItems} trueUps={trueUps} />
        )}

        {activeTab === 'costs' && (
          <CostInputsView
            costItems={costItems}
            costChangeHistory={costChangeHistory}
            glAccounts={glAccounts}
            onAddCost={handleAddCost}
            onUpdateCost={handleUpdateCost}
            onDeleteCost={handleDeleteCost}
            onAddCostChange={handleAddCostChange}
          />
        )}

        {activeTab === 'trueup' && (
          <TrueUpView
            costItems={costItems}
            trueUps={trueUps}
            onSaveTrueUp={handleSaveTrueUp}
            initialPeriodId={selectedTrueUpPeriod}
          />
        )}

        {activeTab === 'mapping' && (
          <AccountMappingView
            accounts={glAccounts}
            onAddAccount={(account: Omit<GLAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
              const newAccount: GLAccount = {
                ...account,
                id: `account-${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setGLAccounts(prev => [...prev, newAccount]);
            }}
            onUpdateAccount={(accountId: string, updates: Partial<GLAccount>) => {
              setGLAccounts(prev => prev.map(a => a.id === accountId ? { ...a, ...updates, updatedAt: new Date() } : a));
            }}
            onDeleteAccount={(accountId: string) => {
              setGLAccounts(prev => prev.filter(a => a.id !== accountId));
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView 
            trueUps={trueUps} 
            costItems={costItems} 
            onNavigateToTrueUp={(periodId) => {
              // Switch to True-Up tab
              setActiveTab('trueup');
              // The TrueUpView will handle filtering to the specific period
              setSelectedTrueUpPeriod(periodId);
            }}
          />
        )}
      </main>
    </div>
  );
}

// Initial mock cost items
const initialCostItems: CostItem[] = [
  {
    id: 'cost-1',
    name: 'Rent',
    category: 'rent',
    amount: 4500,
    frequency: 'monthly',
    glAccountId: 'account-7000', // Maps to 7000 - Rent
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-2',
    name: 'Insurance',
    category: 'insurance',
    amount: 800,
    frequency: 'monthly',
    glAccountId: 'account-7400', // Maps to 7400 - Insurance
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-3',
    name: 'POS Software',
    category: 'saas',
    amount: 199,
    frequency: 'monthly',
    glAccountId: 'account-7200', // Maps to 7200 - POS and Software Fees
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-4',
    name: 'Utilities',
    category: 'utilities',
    amount: 1200,
    frequency: 'monthly',
    glAccountId: 'account-7020', // Maps to 7020 - Utilities
    effectiveDate: new Date('2026-01-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'cost-5',
    name: 'Cleaning Supplies',
    category: 'supplies',
    amount: 150,
    frequency: 'weekly',
    glAccountId: 'account-7310', // Maps to 7310 - Cleaning and Janitorial
    effectiveDate: new Date('2026-02-01'),
    createdBy: 'Manager',
    createdAt: new Date('2026-02-01'),
  },
];

// Initial mock GL accounts
const initialGLAccounts: GLAccount[] = [
  // Assets
  { id: 'account-1000', accountNumber: '1000', accountName: 'Cash on Hand', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1010', accountNumber: '1010', accountName: 'Cash in Bank', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1020', accountNumber: '1020', accountName: 'Undeposited Funds', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1100', accountNumber: '1100', accountName: 'Credit Card Receivable', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1110', accountNumber: '1110', accountName: 'Gift Card Receivable', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1200', accountNumber: '1200', accountName: 'Food Inventory', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1210', accountNumber: '1210', accountName: 'Beverage Inventory', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1220', accountNumber: '1220', accountName: 'Paper & Packaging Inventory', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1300', accountNumber: '1300', accountName: 'Prepaid Expenses', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1400', accountNumber: '1400', accountName: 'Equipment', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-1410', accountNumber: '1410', accountName: 'Accumulated Depreciation', accountType: 'asset', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Liabilities
  { id: 'account-2000', accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2010', accountNumber: '2010', accountName: 'Accrued Expenses', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2100', accountNumber: '2100', accountName: 'Payroll Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2110', accountNumber: '2110', accountName: 'Payroll Taxes Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2120', accountNumber: '2120', accountName: 'Tips Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2200', accountNumber: '2200', accountName: 'Sales Tax Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2210', accountNumber: '2210', accountName: 'Gift Card Liability', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-2300', accountNumber: '2300', accountName: 'Notes Payable', accountType: 'liability', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Equity
  { id: 'account-3000', accountNumber: '3000', accountName: "Owner's Equity", accountType: 'equity', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-3100', accountNumber: '3100', accountName: 'Owner Contributions', accountType: 'equity', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-3200', accountNumber: '3200', accountName: 'Owner Distributions', accountType: 'equity', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-3300', accountNumber: '3300', accountName: 'Retained Earnings', accountType: 'equity', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Revenue
  { id: 'account-4000', accountNumber: '4000', accountName: 'Food Sales', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4010', accountNumber: '4010', accountName: 'Beverage Sales', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4020', accountNumber: '4020', accountName: 'Catering Sales', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4100', accountNumber: '4100', accountName: 'Discounts', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4110', accountNumber: '4110', accountName: 'Voids and Refunds', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4200', accountNumber: '4200', accountName: 'Delivery Fee Income', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-4210', accountNumber: '4210', accountName: 'Miscellaneous Income', accountType: 'revenue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Cost of Goods Sold
  { id: 'account-5000', accountNumber: '5000', accountName: 'Food Cost', accountType: 'cogs', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-5010', accountNumber: '5010', accountName: 'Beverage Cost', accountType: 'cogs', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-5020', accountNumber: '5020', accountName: 'Paper and Packaging Cost', accountType: 'cogs', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-5100', accountNumber: '5100', accountName: 'Inventory Shrink and Waste', accountType: 'cogs', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-5110', accountNumber: '5110', accountName: 'Inventory Adjustments', accountType: 'cogs', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Labor
  { id: 'account-6000', accountNumber: '6000', accountName: 'Hourly Wages', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6010', accountNumber: '6010', accountName: 'Salaried Wages', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6020', accountNumber: '6020', accountName: 'Overtime Wages', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6100', accountNumber: '6100', accountName: 'Employer Payroll Taxes', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6110', accountNumber: '6110', accountName: 'Benefits', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6200', accountNumber: '6200', accountName: 'Training Labor', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-6210', accountNumber: '6210', accountName: 'Contract Labor', accountType: 'labor', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Operating Expenses
  { id: 'account-7000', accountNumber: '7000', accountName: 'Rent', accountType: 'operating-expense', operatingCategory: 'occupancy', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7010', accountNumber: '7010', accountName: 'CAM and NNN', accountType: 'operating-expense', operatingCategory: 'occupancy', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7020', accountNumber: '7020', accountName: 'Utilities', accountType: 'operating-expense', operatingCategory: 'occupancy', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7100', accountNumber: '7100', accountName: 'Marketing and Advertising', accountType: 'operating-expense', operatingCategory: 'marketing', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7110', accountNumber: '7110', accountName: 'Promotions', accountType: 'operating-expense', operatingCategory: 'marketing', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7200', accountNumber: '7200', accountName: 'POS and Software Fees', accountType: 'operating-expense', operatingCategory: 'technology', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7210', accountNumber: '7210', accountName: 'Payment Processing Fees', accountType: 'operating-expense', operatingCategory: 'technology', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7300', accountNumber: '7300', accountName: 'Repairs and Maintenance', accountType: 'operating-expense', operatingCategory: 'operations', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7310', accountNumber: '7310', accountName: 'Cleaning and Janitorial', accountType: 'operating-expense', operatingCategory: 'operations', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7320', accountNumber: '7320', accountName: 'Smallwares', accountType: 'operating-expense', operatingCategory: 'operations', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7400', accountNumber: '7400', accountName: 'Insurance', accountType: 'operating-expense', operatingCategory: 'occupancy', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7410', accountNumber: '7410', accountName: 'Accounting and Legal', accountType: 'operating-expense', operatingCategory: 'admin', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-7420', accountNumber: '7420', accountName: 'Office Supplies', accountType: 'operating-expense', operatingCategory: 'admin', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },

  // Other Expenses
  { id: 'account-8000', accountNumber: '8000', accountName: 'Interest Expense', accountType: 'operating-expense', operatingCategory: 'admin', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-8100', accountNumber: '8100', accountName: 'Depreciation Expense', accountType: 'operating-expense', operatingCategory: 'admin', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'account-8200', accountNumber: '8200', accountName: 'Miscellaneous Expense', accountType: 'operating-expense', operatingCategory: 'admin', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
];