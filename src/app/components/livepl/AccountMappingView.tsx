import { useState } from 'react';
import { Plus, AlertCircle, Save, X } from 'lucide-react';
import type { GLAccount, AccountType, OperatingCategory } from './types';

interface AccountMappingViewProps {
  accounts: GLAccount[];
  onAddAccount: (account: Omit<GLAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAccount: (accountId: string, updates: Partial<GLAccount>) => void;
  onDeleteAccount: (accountId: string) => void;
}

export function AccountMappingView({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}: AccountMappingViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Mapping</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure general ledger accounts and their P&L category mappings
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Configuration surface for P&L mapping</p>
          <p className="mt-1 text-blue-700">
            This view maintains the chart of accounts and defines which operating expense category each account maps to for P&L reporting. 
            It does not display balances or perform accounting calculations.
          </p>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AccountForm
          onSubmit={(account) => {
            onAddAccount(account);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">General Ledger Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 w-32">Account #</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Account Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 w-48">Account Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 w-48">Operating Category</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No accounts configured yet. Click "Add Account" to get started.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    isEditing={editingId === account.id}
                    onEdit={() => setEditingId(account.id)}
                    onSave={(updates) => {
                      onUpdateAccount(account.id, updates);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => onDeleteAccount(account.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AccountFormProps {
  account?: GLAccount;
  onSubmit: (account: Omit<GLAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || '');
  const [accountName, setAccountName] = useState(account?.accountName || '');
  const [accountType, setAccountType] = useState<AccountType>(account?.accountType || 'operating-expense');
  const [operatingCategory, setOperatingCategory] = useState<OperatingCategory | ''>(
    account?.operatingCategory || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      accountNumber,
      accountName,
      accountType,
      operatingCategory: accountType === 'operating-expense' && operatingCategory ? operatingCategory : undefined,
    });
  };

  const isValid = accountNumber.trim() && accountName.trim() && 
    (accountType !== 'operating-expense' || operatingCategory);

  const requiresOperatingCategory = accountType === 'operating-expense';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {account ? 'Edit Account' : 'Add New Account'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., 6100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Rent Expense"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value as AccountType);
                // Clear operating category when switching away from operating-expense
                if (e.target.value !== 'operating-expense') {
                  setOperatingCategory('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="cogs">Cost of Goods Sold</option>
              <option value="labor">Labor</option>
              <option value="operating-expense">Operating Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operating Category {requiresOperatingCategory && <span className="text-red-500">*</span>}
            </label>
            {requiresOperatingCategory ? (
              <select
                value={operatingCategory}
                onChange={(e) => setOperatingCategory(e.target.value as OperatingCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              >
                <option value="">Select category...</option>
                <option value="occupancy">Occupancy</option>
                <option value="labor">Labor</option>
                <option value="food-cost">Food Cost</option>
                <option value="beverage-cost">Beverage Cost</option>
                <option value="packaging">Packaging</option>
                <option value="marketing">Marketing</option>
                <option value="technology">Technology</option>
                <option value="operations">Operations</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center">
                Not applicable
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {requiresOperatingCategory 
                ? 'Required for operating expense accounts' 
                : 'Only applicable to operating expense accounts'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {account ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface AccountRowProps {
  account: GLAccount;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<GLAccount>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function AccountRow({ account, isEditing, onEdit, onSave, onCancel, onDelete }: AccountRowProps) {
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [accountName, setAccountName] = useState(account.accountName);
  const [accountType, setAccountType] = useState(account.accountType);
  const [operatingCategory, setOperatingCategory] = useState<OperatingCategory | ''>(
    account.operatingCategory || ''
  );

  const handleSave = () => {
    onSave({
      accountNumber,
      accountName,
      accountType,
      operatingCategory: accountType === 'operating-expense' && operatingCategory ? operatingCategory : undefined,
    });
  };

  const requiresOperatingCategory = accountType === 'operating-expense';

  const formatAccountType = (type: AccountType): string => {
    const labels: Record<AccountType, string> = {
      'asset': 'Asset',
      'liability': 'Liability',
      'equity': 'Equity',
      'revenue': 'Revenue',
      'cogs': 'Cost of Goods Sold',
      'labor': 'Labor',
      'operating-expense': 'Operating Expense',
    };
    return labels[type];
  };

  const formatOperatingCategory = (cat?: OperatingCategory): string => {
    if (!cat) return '—';
    const labels: Record<OperatingCategory, string> = {
      'occupancy': 'Occupancy',
      'labor': 'Labor',
      'food-cost': 'Food Cost',
      'beverage-cost': 'Beverage Cost',
      'packaging': 'Packaging',
      'marketing': 'Marketing',
      'technology': 'Technology',
      'operations': 'Operations',
      'admin': 'Admin',
    };
    return labels[cat];
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-3">
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </td>
        <td className="px-6 py-3">
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </td>
        <td className="px-6 py-3">
          <select
            value={accountType}
            onChange={(e) => {
              setAccountType(e.target.value as AccountType);
              if (e.target.value !== 'operating-expense') {
                setOperatingCategory('');
              }
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="cogs">Cost of Goods Sold</option>
            <option value="labor">Labor</option>
            <option value="operating-expense">Operating Expense</option>
          </select>
        </td>
        <td className="px-6 py-3">
          {requiresOperatingCategory ? (
            <select
              value={operatingCategory}
              onChange={(e) => setOperatingCategory(e.target.value as OperatingCategory)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="occupancy">Occupancy</option>
              <option value="labor">Labor</option>
              <option value="food-cost">Food Cost</option>
              <option value="beverage-cost">Beverage Cost</option>
              <option value="packaging">Packaging</option>
              <option value="marketing">Marketing</option>
              <option value="technology">Technology</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <span className="text-sm text-gray-400">Not applicable</span>
          )}
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-mono text-sm text-gray-900">{account.accountNumber}</td>
      <td className="px-6 py-4 text-gray-900">{account.accountName}</td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {formatAccountType(account.accountType)}
        </span>
      </td>
      <td className="px-6 py-4">
        {account.accountType === 'operating-expense' ? (
          account.operatingCategory ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatOperatingCategory(account.operatingCategory)}
            </span>
          ) : (
            <span className="text-sm text-red-600 font-medium">Not mapped</span>
          )
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}