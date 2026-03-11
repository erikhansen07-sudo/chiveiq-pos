import { useState } from 'react';
import { Plus, AlertCircle, Trash2, Calendar, Pencil, X } from 'lucide-react';
import type { CostItem, CostCategory, OperatingCategory, Frequency, LeaseSchedule, LeasePeriod, GLAccount } from './types';

interface CostInputsViewProps {
  costItems: CostItem[];
  costChangeHistory: any[];
  glAccounts: GLAccount[];
  onAddCost: (cost: Omit<CostItem, 'id' | 'createdAt' | 'createdBy'>) => void;
  onUpdateCost: (costId: string, updates: Partial<CostItem>, changeNote?: string) => void;
  onDeleteCost: (costId: string) => void;
  onAddCostChange: (change: any) => void;
}

export function CostInputsView({
  costItems,
  glAccounts,
  onAddCost,
  onDeleteCost,
  onUpdateCost,
}: CostInputsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCost, setEditingCost] = useState<CostItem | null>(null);

  // Helper to get GL account display for a cost item
  const getGLAccountDisplay = (glAccountId: string): string => {
    const account = glAccounts.find(acc => acc.id === glAccountId);
    return account ? `${account.accountNumber} - ${account.accountName}` : 'Not Mapped';
  };

  // Helper to calculate monthly amount
  const getMonthlyAmount = (cost: CostItem): number => {
    switch (cost.frequency) {
      case 'monthly':
        return cost.amount;
      case 'annually':
        return cost.amount / 12; // Divide annual by 12 to get monthly
      case 'schedule':
        return cost.amount; // Schedule already stores monthly amount
      default:
        return cost.amount;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cost Inputs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage recurring costs and assumptions that flow into the P&L
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cost
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Costs are assumptions until trued up</p>
          <p className="mt-1 text-blue-700">
            Entered costs apply forward from their effective date. Changes to costs only affect future P&Ls.
          </p>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <CostForm
          onSubmit={(cost) => {
            onAddCost(cost);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
          glAccounts={glAccounts}
        />
      )}

      {/* Cost Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Costs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">GL Account</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Monthly Amount</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No costs added yet. Click "Add Cost" to get started.
                  </td>
                </tr>
              ) : (
                costItems.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cost.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {cost.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getGLAccountDisplay(cost.glAccountId)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ${getMonthlyAmount(cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCost(cost)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCost(cost.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slide-in Panel */}
      {editingCost && (
        <EditCostPanel
          cost={editingCost}
          glAccounts={glAccounts}
          onSave={(updates) => {
            onUpdateCost(editingCost.id, updates);
            setEditingCost(null);
          }}
          onCancel={() => setEditingCost(null)}
        />
      )}
    </div>
  );
}

interface CostFormProps {
  onSubmit: (cost: Omit<CostItem, 'id' | 'createdAt' | 'createdBy'>) => void;
  onCancel: () => void;
  glAccounts: GLAccount[];
}

function CostForm({ onSubmit, onCancel, glAccounts }: CostFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CostCategory>('rent');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  
  // Get operating expense accounts for mapping dropdown
  const operatingExpenseAccounts = glAccounts.filter(acc => acc.accountType === 'operating-expense');
  
  // Set default GL account ID to first available account
  const defaultGLAccountId = operatingExpenseAccounts.length > 0 
    ? operatingExpenseAccounts[0].id
    : '';
  
  const [glAccountId, setGLAccountId] = useState<string>(defaultGLAccountId);

  // Lease schedule fields
  const [leaseTermYears, setLeaseTermYears] = useState('10');
  const [leaseStartAmount, setLeaseStartAmount] = useState('');
  const [escalationPercent, setEscalationPercent] = useState('3');
  const [escalationFrequencyYears, setEscalationFrequencyYears] = useState('1');

  // Generate lease periods based on inputs
  const generateLeasePeriods = (): LeasePeriod[] => {
    const periods: LeasePeriod[] = [];
    const term = parseInt(leaseTermYears);
    const startAmount = parseFloat(leaseStartAmount);
    const escalation = parseFloat(escalationPercent) / 100;
    const escalationFreq = parseInt(escalationFrequencyYears);
    const startDate = new Date();

    let currentAmount = startAmount;
    for (let year = 0; year < term; year++) {
      const periodStartDate = new Date(startDate);
      periodStartDate.setFullYear(startDate.getFullYear() + year);
      
      const periodEndDate = new Date(periodStartDate);
      periodEndDate.setFullYear(periodStartDate.getFullYear() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);

      periods.push({
        startDate: periodStartDate,
        endDate: periodEndDate,
        amount: currentAmount,
      });

      // Apply escalation at the specified frequency
      if ((year + 1) % escalationFreq === 0) {
        currentAmount = currentAmount * (1 + escalation);
      }
    }

    return periods;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const costData: Omit<CostItem, 'id' | 'createdAt' | 'createdBy'> = {
      name,
      category,
      amount: frequency === 'schedule' ? parseFloat(leaseStartAmount) : parseFloat(amount),
      frequency,
      glAccountId,
      effectiveDate: new Date(),
    };

    // Add lease schedule if frequency is schedule
    if (frequency === 'schedule') {
      costData.leaseSchedule = { periods: generateLeasePeriods() };
    }

    onSubmit(costData);
  };

  const isValid = name.trim() && 
    glAccountId && 
    (frequency === 'schedule' 
      ? leaseStartAmount && parseFloat(leaseStartAmount) > 0 && leaseTermYears && parseInt(leaseTermYears) > 0
      : amount && parseFloat(amount) > 0
    );

  const leasePeriods = frequency === 'schedule' && leaseStartAmount && leaseTermYears && escalationPercent && escalationFrequencyYears
    ? generateLeasePeriods()
    : [];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CostCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="rent">Rent</option>
            <option value="cams">CAMs / NNN</option>
            <option value="utilities">Utilities</option>
            <option value="insurance">Insurance</option>
            <option value="saas">Software / SaaS</option>
            <option value="repairs">Repairs & Maintenance</option>
            <option value="supplies">Supplies</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="e.g., Monthly Rent, POS Software"
            required
          />
        </div>

        {/* P&L Mapping Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            P&L Mapping Category <span className="text-red-500">*</span>
          </label>
          <select
            value={glAccountId}
            onChange={(e) => setGLAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          >
            {operatingExpenseAccounts.length === 0 ? (
              <option value="">No operating expense accounts available</option>
            ) : (
              <>
                <option value="">Select a category...</option>
                {operatingExpenseAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {`${account.accountNumber} - ${account.accountName}`}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Links this cost to P&L structure and exports
          </p>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          >
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="schedule">Schedule</option>
          </select>
        </div>

        {/* Amount - Only show for monthly */}
        {frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>
        )}

        {/* Amount - Annually */}
        {frequency === 'annually' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will be divided by 12 when displayed as monthly
            </p>
          </div>
        )}

        {/* Schedule */}
        {frequency === 'schedule' && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Configuration</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Term (Years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leaseTermYears}
                    onChange={(e) => setLeaseTermYears(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Starting Monthly Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={leaseStartAmount}
                      onChange={(e) => setLeaseStartAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Escalation %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={escalationPercent}
                      onChange={(e) => setEscalationPercent(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Escalation Every (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={escalationFrequencyYears}
                    onChange={(e) => setEscalationFrequencyYears(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Generated Schedule Preview */}
            {leasePeriods.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Generated Schedule</h4>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Year</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Start Date</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">End Date</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-700">Monthly Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leasePeriods.map((period, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">Year {index + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{period.startDate.toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{period.endDate.toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">${period.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

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
            Add Cost
          </button>
        </div>
      </div>
    </form>
  );
}

interface EditCostPanelProps {
  cost: CostItem;
  glAccounts: GLAccount[];
  onSave: (updates: Partial<CostItem>) => void;
  onCancel: () => void;
}

function EditCostPanel({ cost, glAccounts, onSave, onCancel }: EditCostPanelProps) {
  const [name, setName] = useState(cost.name);
  const [category, setCategory] = useState<CostCategory>(cost.category);
  const [amount, setAmount] = useState(cost.amount.toString());
  const [frequency, setFrequency] = useState<Frequency>(cost.frequency);
  
  // Get operating expense accounts for mapping dropdown
  const operatingExpenseAccounts = glAccounts.filter(acc => acc.accountType === 'operating-expense');
  
  // Set default GL account ID to first available account
  const defaultGLAccountId = operatingExpenseAccounts.length > 0 
    ? operatingExpenseAccounts[0].id
    : '';
  
  const [glAccountId, setGLAccountId] = useState<string>(cost.glAccountId || defaultGLAccountId);

  // Lease schedule fields
  const [leaseTermYears, setLeaseTermYears] = useState(cost.leaseSchedule?.periods.length.toString() || '10');
  const [leaseStartAmount, setLeaseStartAmount] = useState(cost.leaseSchedule?.periods[0]?.amount.toString() || '');
  const [escalationPercent, setEscalationPercent] = useState('3');
  const [escalationFrequencyYears, setEscalationFrequencyYears] = useState('1');

  // Generate lease periods based on inputs
  const generateLeasePeriods = (): LeasePeriod[] => {
    const periods: LeasePeriod[] = [];
    const term = parseInt(leaseTermYears);
    const startAmount = parseFloat(leaseStartAmount);
    const escalation = parseFloat(escalationPercent) / 100;
    const escalationFreq = parseInt(escalationFrequencyYears);
    const startDate = new Date();

    let currentAmount = startAmount;
    for (let year = 0; year < term; year++) {
      const periodStartDate = new Date(startDate);
      periodStartDate.setFullYear(startDate.getFullYear() + year);
      
      const periodEndDate = new Date(periodStartDate);
      periodEndDate.setFullYear(periodStartDate.getFullYear() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);

      periods.push({
        startDate: periodStartDate,
        endDate: periodEndDate,
        amount: currentAmount,
      });

      // Apply escalation at the specified frequency
      if ((year + 1) % escalationFreq === 0) {
        currentAmount = currentAmount * (1 + escalation);
      }
    }

    return periods;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const costData: Partial<CostItem> = {
      name,
      category,
      amount: frequency === 'schedule' ? parseFloat(leaseStartAmount) : parseFloat(amount),
      frequency,
      glAccountId,
      effectiveDate: new Date(),
    };

    // Add lease schedule if frequency is schedule
    if (frequency === 'schedule') {
      costData.leaseSchedule = { periods: generateLeasePeriods() };
    }

    onSave(costData);
  };

  const isValid = name.trim() && 
    glAccountId && 
    (frequency === 'schedule' 
      ? leaseStartAmount && parseFloat(leaseStartAmount) > 0 && leaseTermYears && parseInt(leaseTermYears) > 0
      : amount && parseFloat(amount) > 0
    );

  const leasePeriods = frequency === 'schedule' && leaseStartAmount && leaseTermYears && escalationPercent && escalationFrequencyYears
    ? generateLeasePeriods()
    : [];

  return (
    <>
      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Cost</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="rent">Rent</option>
                <option value="cams">CAMs / NNN</option>
                <option value="utilities">Utilities</option>
                <option value="insurance">Insurance</option>
                <option value="saas">Software / SaaS</option>
                <option value="repairs">Repairs & Maintenance</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Monthly Rent, POS Software"
                required
              />
            </div>

            {/* P&L Mapping Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P&L Mapping Category <span className="text-red-500">*</span>
              </label>
              <select
                value={glAccountId}
                onChange={(e) => setGLAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              >
                {operatingExpenseAccounts.length === 0 ? (
                  <option value="">No operating expense accounts available</option>
                ) : (
                  <>
                    <option value="">Select a category...</option>
                    {operatingExpenseAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {`${account.accountNumber} - ${account.accountName}`}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Links this cost to P&L structure and exports
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
                <option value="schedule">Schedule</option>
              </select>
            </div>

            {/* Amount - Only show for monthly */}
            {frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            )}

            {/* Amount - Annually */}
            {frequency === 'annually' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be divided by 12 when displayed as monthly
                </p>
              </div>
            )}

            {/* Schedule */}
            {frequency === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Term (Years) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={leaseTermYears}
                        onChange={(e) => setLeaseTermYears(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Starting Monthly Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={leaseStartAmount}
                          onChange={(e) => setLeaseStartAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Escalation %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={escalationPercent}
                          onChange={(e) => setEscalationPercent(e.target.value)}
                          className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Escalation Every (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={escalationFrequencyYears}
                        onChange={(e) => setEscalationFrequencyYears(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Generated Schedule Preview */}
                {leasePeriods.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Generated Schedule</h4>
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Year</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Start Date</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">End Date</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-700">Monthly Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {leasePeriods.map((period, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">Year {index + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{period.startDate.toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{period.endDate.toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">${period.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
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
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function formatOperatingCategory(cat: OperatingCategory): string {
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
}