import { useState, useMemo } from 'react';
import { Users, Plus, Eye, Edit2, DollarSign, Search, X, Clock, Calendar } from 'lucide-react';
import type { Employee, TimePunch, PayChangeHistory, EmployeeChangeHistory } from './types';

interface EmployeeManagementProps {
  employees: Employee[];
  timePunches: TimePunch[];
  payChangeHistory: PayChangeHistory[];
  employeeChangeHistory: EmployeeChangeHistory[];
  onUpdateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onAddPayChange: (change: Omit<PayChangeHistory, 'id' | 'changedAt'>) => void;
  onAddEmployeeChange: (change: Omit<EmployeeChangeHistory, 'id' | 'changedAt'>) => void;
  onEditPunch: (punchId: string, newTimestamp: Date) => void;
  onDeletePunch: (punchId: string) => void;
}

interface EmployeeFormData {
  name: string;
  title: string;
  startDate: string;
  payType: 'hourly' | 'salary';
  payRate: string;
  status: 'active' | 'inactive';
  pin: string;
  tipEligible: boolean;
}

interface PayChangeFormData {
  newRate: string;
  effectiveDate: string;
  comment: string;
}

const availableTitles = [
  'Manager',
  'Assistant Manager', 
  'Shift Lead',
  'Cook',
  'Line Cook',
  'Prep Cook',
  'Cashier',
  'Server',
  'Drive-Thru Attendant',
  'Kitchen Staff',
  'Front of House Staff',
  'Back of House Staff'
];

export function EmployeeManagement({
  employees,
  timePunches,
  payChangeHistory,
  employeeChangeHistory,
  onUpdateEmployee,
  onAddEmployee,
  onAddPayChange,
  onAddEmployeeChange,
  onEditPunch,
  onDeletePunch,
}: EmployeeManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [showPayChangeForm, setShowPayChangeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    payType: 'hourly',
    payRate: '',
    status: 'active',
    pin: '',
    tipEligible: false,
  });

  const [payChangeData, setPayChangeData] = useState<PayChangeFormData>({
    newRate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    comment: '',
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const handleOpenAddForm = () => {
    setFormData({
      name: '',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      payType: 'hourly',
      payRate: '',
      status: 'active',
      pin: '',
      tipEligible: false,
    });
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setFormData({
      name: '',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      payType: 'hourly',
      payRate: '',
      status: 'active',
      pin: '',
      tipEligible: false,
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const employeeData = {
      name: formData.name,
      title: formData.title,
      startDate: new Date(formData.startDate),
      payType: formData.payType,
      payRate: parseFloat(formData.payRate),
      status: formData.status,
      pin: formData.pin || undefined,
      tipEligible: formData.tipEligible,
    };

    onAddEmployee(employeeData);
    handleCloseAddForm();
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditingEmployee(false);
    setActiveTab('details');
  };

  const handleCloseModal = () => {
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
    setShowPayChangeForm(false);
    setActiveTab('details');
  };

  const handleStartEdit = () => {
    if (selectedEmployee) {
      setFormData({
        name: selectedEmployee.name,
        title: selectedEmployee.title,
        startDate: selectedEmployee.startDate.toISOString().split('T')[0],
        payType: selectedEmployee.payType,
        payRate: selectedEmployee.payRate.toString(),
        status: selectedEmployee.status,
        pin: selectedEmployee.pin || '',
        tipEligible: selectedEmployee.tipEligible ?? false,
      });
      setIsEditingEmployee(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingEmployee(false);
  };

  const handleSaveEdit = () => {
    if (!selectedEmployee) return;

    const updates: Partial<Employee> = {};
    const changes: Array<Omit<EmployeeChangeHistory, 'id' | 'changedAt'>> = [];

    if (formData.name !== selectedEmployee.name) {
      updates.name = formData.name;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'name',
        previousValue: selectedEmployee.name,
        newValue: formData.name,
        changedBy: 'Manager', // In a real app, this would be the logged-in user
      });
    }

    if (formData.title !== selectedEmployee.title) {
      updates.title = formData.title;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'title',
        previousValue: selectedEmployee.title,
        newValue: formData.title,
        changedBy: 'Manager',
      });
    }

    const newStartDate = new Date(formData.startDate);
    if (newStartDate.getTime() !== selectedEmployee.startDate.getTime()) {
      updates.startDate = newStartDate;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'startDate',
        previousValue: selectedEmployee.startDate.toISOString().split('T')[0],
        newValue: formData.startDate,
        changedBy: 'Manager',
      });
    }

    if (formData.status !== selectedEmployee.status) {
      updates.status = formData.status;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'status',
        previousValue: selectedEmployee.status,
        newValue: formData.status,
        changedBy: 'Manager',
      });
    }

    if (formData.pin !== (selectedEmployee.pin || '')) {
      updates.pin = formData.pin || undefined;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'pin',
        previousValue: selectedEmployee.pin || '',
        newValue: formData.pin || '',
        changedBy: 'Manager',
      });
    }

    if (formData.tipEligible !== selectedEmployee.tipEligible) {
      updates.tipEligible = formData.tipEligible;
      changes.push({
        employeeId: selectedEmployee.id,
        field: 'tipEligible',
        previousValue: selectedEmployee.tipEligible.toString(),
        newValue: formData.tipEligible.toString(),
        changedBy: 'Manager',
      });
    }

    if (Object.keys(updates).length > 0) {
      onUpdateEmployee(selectedEmployee.id, updates);
      changes.forEach(change => onAddEmployeeChange(change));
      
      // Update the selected employee for the modal
      setSelectedEmployee({ ...selectedEmployee, ...updates });
    }

    setIsEditingEmployee(false);
  };

  const handleOpenPayChangeForm = () => {
    if (selectedEmployee) {
      setPayChangeData({
        newRate: selectedEmployee.payRate.toString(),
        effectiveDate: new Date().toISOString().split('T')[0],
        comment: '',
      });
      setShowPayChangeForm(true);
    }
  };

  const handleClosePayChangeForm = () => {
    setShowPayChangeForm(false);
    setPayChangeData({
      newRate: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      comment: '',
    });
  };

  const handleSubmitPayChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const newRate = parseFloat(payChangeData.newRate);

    // Record the pay change
    onAddPayChange({
      employeeId: selectedEmployee.id,
      previousRate: selectedEmployee.payRate,
      newRate: newRate,
      previousPayType: selectedEmployee.payType,
      newPayType: selectedEmployee.payType,
      effectiveDate: new Date(payChangeData.effectiveDate),
      comment: payChangeData.comment,
      changedBy: 'Manager',
    });

    // Update the employee
    onUpdateEmployee(selectedEmployee.id, { payRate: newRate });

    // Update the selected employee for the modal
    setSelectedEmployee({ ...selectedEmployee, payRate: newRate });

    handleClosePayChangeForm();
  };

  const employeeHistory = useMemo(() => {
    if (!selectedEmployee) return { payChanges: [], generalChanges: [] };

    const payChanges = payChangeHistory
      .filter(h => h.employeeId === selectedEmployee.id)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

    const generalChanges = employeeChangeHistory
      .filter(h => h.employeeId === selectedEmployee.id)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

    return { payChanges, generalChanges };
  }, [selectedEmployee, payChangeHistory, employeeChangeHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Employee
          </h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <select
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a title</option>
                  {availableTitles.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN (4 digits, optional)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({ ...formData, pin: val });
                  }}
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Type *
                </label>
                <select
                  value={formData.payType}
                  onChange={(e) => setFormData({ ...formData, payType: e.target.value as 'hourly' | 'salary' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.payType === 'hourly' ? 'Hourly Rate *' : 'Salary *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.payRate}
                    onChange={(e) => setFormData({ ...formData, payRate: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.payType === 'hourly' ? '15.00' : '45000.00'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip Eligible
                </label>
                <input
                  type="checkbox"
                  checked={formData.tipEligible}
                  onChange={(e) => setFormData({ ...formData, tipEligible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseAddForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Title</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Start Date</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Pay Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Rate</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{employee.name}</div>
                    {employee.pin && (
                      <div className="text-xs text-gray-500 mt-0.5">PIN: {employee.pin}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{employee.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(employee.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                      {employee.payType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {employee.payType === 'hourly' 
                      ? `$${employee.payRate.toFixed(2)}/hr`
                      : `$${employee.payRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewEmployee(employee)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && !showPayChangeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-h-[85vh] overflow-hidden flex flex-col border-2 border-gray-300 w-full max-w-4xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedEmployee.title}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 px-1 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-2 px-1 font-medium text-sm transition-colors ${
                    activeTab === 'history'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Change History
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Name
                      </label>
                      {isEditingEmployee ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-gray-900">{selectedEmployee.name}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      {isEditingEmployee ? (
                        <select
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {availableTitles.map(title => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-gray-900">{selectedEmployee.title}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      {isEditingEmployee ? (
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-gray-900">
                          {new Date(selectedEmployee.startDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PIN
                      </label>
                      {isEditingEmployee ? (
                        <input
                          type="text"
                          value={formData.pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setFormData({ ...formData, pin: val });
                          }}
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1234"
                        />
                      ) : (
                        <div className="text-gray-900">{selectedEmployee.pin || '—'}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pay Type
                      </label>
                      <div className="text-gray-900 capitalize">{selectedEmployee.payType}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedEmployee.payType === 'hourly' ? 'Hourly Rate' : 'Salary'}
                      </label>
                      <div className="text-gray-900 font-semibold">
                        {selectedEmployee.payType === 'hourly' 
                          ? `$${selectedEmployee.payRate.toFixed(2)}/hr`
                          : `$${selectedEmployee.payRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr`
                        }
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {isEditingEmployee ? (
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedEmployee.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedEmployee.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tip Eligible
                      </label>
                      {isEditingEmployee ? (
                        <input
                          type="checkbox"
                          checked={formData.tipEligible}
                          onChange={(e) => setFormData({ ...formData, tipEligible: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      ) : (
                        <div className="text-gray-900">
                          {selectedEmployee.tipEligible ? 'Yes' : 'No'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Pay Changes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Pay Changes</h4>
                    {employeeHistory.payChanges.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No pay changes recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employeeHistory.payChanges.map(change => (
                          <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  ${change.previousRate.toFixed(2)} → ${change.newRate.toFixed(2)}
                                  {change.previousPayType === 'hourly' ? '/hr' : '/yr'}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Effective: {new Date(change.effectiveDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(change.changedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                              {change.comment}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Changed by: {change.changedBy}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* General Changes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Profile Changes</h4>
                    {employeeHistory.generalChanges.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        <Edit2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No profile changes recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employeeHistory.generalChanges.map(change => (
                          <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 capitalize mb-1">
                                  {change.field.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="line-through">{String(change.previousValue)}</span>
                                  {' → '}
                                  <span className="font-medium">{String(change.newValue)}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Changed by: {change.changedBy}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(change.changedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'details' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                {isEditingEmployee ? (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleOpenPayChangeForm}
                      className="inline-flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                      Edit Pay
                    </button>
                    <button
                      onClick={handleStartEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Employee
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Change Form Modal */}
      {selectedEmployee && showPayChangeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Pay - {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Current: {selectedEmployee.payType === 'hourly' 
                      ? `$${selectedEmployee.payRate.toFixed(2)}/hr`
                      : `$${selectedEmployee.payRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr`
                    }
                  </p>
                </div>
                <button
                  onClick={handleClosePayChangeForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitPayChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New {selectedEmployee.payType === 'hourly' ? 'Hourly Rate' : 'Salary'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payChangeData.newRate}
                    onChange={(e) => setPayChangeData({ ...payChangeData, newRate: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={selectedEmployee.payType === 'hourly' ? '15.00' : '45000.00'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={payChangeData.effectiveDate}
                  onChange={(e) => setPayChangeData({ ...payChangeData, effectiveDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment / Reason *
                </label>
                <textarea
                  value={payChangeData.comment}
                  onChange={(e) => setPayChangeData({ ...payChangeData, comment: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter reason for pay change..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePayChangeForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}