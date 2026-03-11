import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Circle } from 'lucide-react';
import type { RoleType, ShiftType, DefaultShift, TimeClockSettings, DayOperatingHours } from './types';

interface ConfigViewProps {
  roleTypes: RoleType[];
  shiftTypes: ShiftType[];
  defaultShifts: DefaultShift[];
  timeClockSettings: TimeClockSettings;
  onUpdateRoleTypes: (roleTypes: RoleType[]) => void;
  onUpdateShiftTypes: (shiftTypes: ShiftType[]) => void;
  onUpdateDefaultShifts: (defaultShifts: DefaultShift[]) => void;
  onUpdateTimeClockSettings: (settings: TimeClockSettings) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ConfigView({
  roleTypes,
  shiftTypes,
  defaultShifts,
  timeClockSettings,
  onUpdateRoleTypes,
  onUpdateShiftTypes,
  onUpdateDefaultShifts,
  onUpdateTimeClockSettings,
}: ConfigViewProps) {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingShiftTypeId, setEditingShiftTypeId] = useState<string | null>(null);
  const [editingDefaultShiftId, setEditingDefaultShiftId] = useState<string | null>(null);

  const [newRole, setNewRole] = useState<Partial<RoleType> | null>(null);
  const [newShiftType, setNewShiftType] = useState<Partial<ShiftType> | null>(null);
  const [newDefaultShift, setNewDefaultShift] = useState<Partial<DefaultShift> | null>(null);

  // Role Types Section
  const handleAddRole = () => {
    setNewRole({
      name: '',
      color: PRESET_COLORS[roleTypes.length % PRESET_COLORS.length],
      active: true,
      sortOrder: roleTypes.length,
    });
  };

  const handleSaveNewRole = () => {
    if (newRole && newRole.name) {
      const role: RoleType = {
        id: `role-${Date.now()}`,
        name: newRole.name,
        defaultHourlyRate: newRole.defaultHourlyRate,
        color: newRole.color || PRESET_COLORS[0],
        active: true,
        sortOrder: roleTypes.length,
      };
      onUpdateRoleTypes([...roleTypes, role]);
      setNewRole(null);
    }
  };

  const handleUpdateRole = (roleId: string, updates: Partial<RoleType>) => {
    onUpdateRoleTypes(roleTypes.map(r => r.id === roleId ? { ...r, ...updates } : r));
  };

  const handleDeleteRole = (roleId: string) => {
    onUpdateRoleTypes(roleTypes.filter(r => r.id !== roleId));
  };

  // Shift Types Section
  const handleAddShiftType = () => {
    setNewShiftType({
      name: '',
      active: true,
      sortOrder: shiftTypes.length,
    });
  };

  const handleSaveNewShiftType = () => {
    if (newShiftType && newShiftType.name) {
      const shiftType: ShiftType = {
        id: `shift-type-${Date.now()}`,
        name: newShiftType.name,
        defaultStartTime: newShiftType.defaultStartTime,
        defaultEndTime: newShiftType.defaultEndTime,
        defaultRoleId: newShiftType.defaultRoleId,
        breakExpectation: newShiftType.breakExpectation,
        active: true,
        sortOrder: shiftTypes.length,
      };
      onUpdateShiftTypes([...shiftTypes, shiftType]);
      setNewShiftType(null);
    }
  };

  const handleUpdateShiftType = (shiftTypeId: string, updates: Partial<ShiftType>) => {
    onUpdateShiftTypes(shiftTypes.map(st => st.id === shiftTypeId ? { ...st, ...updates } : st));
  };

  const handleDeleteShiftType = (shiftTypeId: string) => {
    onUpdateShiftTypes(shiftTypes.filter(st => st.id !== shiftTypeId));
  };

  // Default Shifts Section
  const handleAddDefaultShift = () => {
    setNewDefaultShift({
      dayOfWeek: 1,
      roleId: roleTypes[0]?.id,
      quantity: 1,
    });
  };

  const handleSaveNewDefaultShift = () => {
    if (newDefaultShift && newDefaultShift.roleId && newDefaultShift.dayOfWeek !== undefined) {
      const defaultShift: DefaultShift = {
        id: `default-shift-${Date.now()}`,
        dayOfWeek: newDefaultShift.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        roleId: newDefaultShift.roleId,
        shiftTypeId: newDefaultShift.shiftTypeId,
        quantity: newDefaultShift.quantity || 1,
        notes: newDefaultShift.notes,
      };
      onUpdateDefaultShifts([...defaultShifts, defaultShift]);
      setNewDefaultShift(null);
    }
  };

  const handleUpdateDefaultShift = (defaultShiftId: string, updates: Partial<DefaultShift>) => {
    onUpdateDefaultShifts(defaultShifts.map(ds => ds.id === defaultShiftId ? { ...ds, ...updates } : ds));
  };

  const handleDeleteDefaultShift = (defaultShiftId: string) => {
    onUpdateDefaultShifts(defaultShifts.filter(ds => ds.id !== defaultShiftId));
  };

  const getRoleName = (roleId: string) => roleTypes.find(r => r.id === roleId)?.name || 'Unknown';
  const getShiftTypeName = (shiftTypeId?: string) => shiftTypes.find(st => st.id === shiftTypeId)?.name || '-';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Configuration</h2>
        <p className="text-gray-600 mt-1">
          Define roles, shift templates, and time clock settings for scheduling and labor tracking.
        </p>
      </div>

      {/* Section 1: Role Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Role Types</h3>
            <p className="text-sm text-gray-600 mt-1">
              Define positions used in scheduling, time tracking, and labor reports.
            </p>
          </div>
          <button
            onClick={handleAddRole}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Default Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Color</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roleTypes.map(role => (
                <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingRoleId === role.id ? (
                      <input
                        type="text"
                        value={role.name}
                        onChange={(e) => handleUpdateRole(role.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{role.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingRoleId === role.id ? (
                      <input
                        type="number"
                        step="0.50"
                        value={role.defaultHourlyRate || ''}
                        onChange={(e) => handleUpdateRole(role.id, { defaultHourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="Optional"
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-gray-700">
                        {role.defaultHourlyRate ? `$${role.defaultHourlyRate.toFixed(2)}/hr` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingRoleId === role.id ? (
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => handleUpdateRole(role.id, { color })}
                            className={`w-6 h-6 rounded border-2 ${role.color === color ? 'border-gray-900' : 'border-gray-300'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Circle className="w-5 h-5" style={{ fill: role.color, color: role.color }} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      role.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {role.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingRoleId === role.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRoleId(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRoleId(role.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateRole(role.id, { active: !role.active })}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                          {role.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {newRole && (
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newRole.name || ''}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      placeholder="Role name"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      autoFocus
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.50"
                      value={newRole.defaultHourlyRate || ''}
                      onChange={(e) => setNewRole({ ...newRole, defaultHourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Optional"
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewRole({ ...newRole, color })}
                          className={`w-6 h-6 rounded border-2 ${newRole.color === color ? 'border-gray-900' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSaveNewRole}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNewRole(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Shift Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shift Types</h3>
            <p className="text-sm text-gray-600 mt-1">
              Define reusable shift templates with default times and roles.
            </p>
          </div>
          <button
            onClick={handleAddShiftType}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Shift Type
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Shift Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Default Times</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Default Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Break</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shiftTypes.map(shiftType => (
                <tr key={shiftType.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingShiftTypeId === shiftType.id ? (
                      <input
                        type="text"
                        value={shiftType.name}
                        onChange={(e) => handleUpdateShiftType(shiftType.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{shiftType.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingShiftTypeId === shiftType.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={shiftType.defaultStartTime || ''}
                          onChange={(e) => handleUpdateShiftType(shiftType.id, { defaultStartTime: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={shiftType.defaultEndTime || ''}
                          onChange={(e) => handleUpdateShiftType(shiftType.id, { defaultEndTime: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        {shiftType.defaultStartTime && shiftType.defaultEndTime
                          ? `${shiftType.defaultStartTime} - ${shiftType.defaultEndTime}`
                          : '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingShiftTypeId === shiftType.id ? (
                      <select
                        value={shiftType.defaultRoleId || ''}
                        onChange={(e) => handleUpdateShiftType(shiftType.id, { defaultRoleId: e.target.value || undefined })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">None</option>
                        {roleTypes.filter(r => r.active).map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700">
                        {shiftType.defaultRoleId ? getRoleName(shiftType.defaultRoleId) : '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingShiftTypeId === shiftType.id ? (
                      <input
                        type="text"
                        value={shiftType.breakExpectation || ''}
                        onChange={(e) => handleUpdateShiftType(shiftType.id, { breakExpectation: e.target.value })}
                        placeholder="e.g., 30 min"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-gray-700">{shiftType.breakExpectation || '-'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      shiftType.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {shiftType.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingShiftTypeId === shiftType.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingShiftTypeId(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingShiftTypeId(shiftType.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateShiftType(shiftType.id, { active: !shiftType.active })}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                          {shiftType.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteShiftType(shiftType.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {newShiftType && (
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newShiftType.name || ''}
                      onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                      placeholder="Shift type name"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      autoFocus
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={newShiftType.defaultStartTime || ''}
                        onChange={(e) => setNewShiftType({ ...newShiftType, defaultStartTime: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={newShiftType.defaultEndTime || ''}
                        onChange={(e) => setNewShiftType({ ...newShiftType, defaultEndTime: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={newShiftType.defaultRoleId || ''}
                      onChange={(e) => setNewShiftType({ ...newShiftType, defaultRoleId: e.target.value || undefined })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">None</option>
                      {roleTypes.filter(r => r.active).map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newShiftType.breakExpectation || ''}
                      onChange={(e) => setNewShiftType({ ...newShiftType, breakExpectation: e.target.value })}
                      placeholder="e.g., 30 min"
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSaveNewShiftType}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNewShiftType(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Default Shifts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Default Shifts</h3>
            <p className="text-sm text-gray-600 mt-1">
              Define a weekly staffing skeleton as a starting point for new schedules.
            </p>
          </div>
          <button
            onClick={handleAddDefaultShift}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Default Shift
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Day</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Shift Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Notes</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {defaultShifts.map(defaultShift => (
                <tr key={defaultShift.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <select
                        value={defaultShift.dayOfWeek}
                        onChange={(e) => handleUpdateDefaultShift(defaultShift.id, { dayOfWeek: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {DAYS.map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-gray-900">{DAYS[defaultShift.dayOfWeek]}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <select
                        value={defaultShift.roleId}
                        onChange={(e) => handleUpdateDefaultShift(defaultShift.id, { roleId: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {roleTypes.filter(r => r.active).map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700">{getRoleName(defaultShift.roleId)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <select
                        value={defaultShift.shiftTypeId || ''}
                        onChange={(e) => handleUpdateDefaultShift(defaultShift.id, { shiftTypeId: e.target.value || undefined })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">None</option>
                        {shiftTypes.filter(st => st.active).map(shiftType => (
                          <option key={shiftType.id} value={shiftType.id}>{shiftType.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700">{getShiftTypeName(defaultShift.shiftTypeId)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <input
                        type="number"
                        min="1"
                        value={defaultShift.quantity}
                        onChange={(e) => handleUpdateDefaultShift(defaultShift.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-gray-700">{defaultShift.quantity}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <input
                        type="text"
                        value={defaultShift.notes || ''}
                        onChange={(e) => handleUpdateDefaultShift(defaultShift.id, { notes: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">{defaultShift.notes || '-'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingDefaultShiftId === defaultShift.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingDefaultShiftId(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingDefaultShiftId(defaultShift.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDefaultShift(defaultShift.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {newDefaultShift && (
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4">
                    <select
                      value={newDefaultShift.dayOfWeek || 1}
                      onChange={(e) => setNewDefaultShift({ ...newDefaultShift, dayOfWeek: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {DAYS.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={newDefaultShift.roleId || roleTypes[0]?.id}
                      onChange={(e) => setNewDefaultShift({ ...newDefaultShift, roleId: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {roleTypes.filter(r => r.active).map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={newDefaultShift.shiftTypeId || ''}
                      onChange={(e) => setNewDefaultShift({ ...newDefaultShift, shiftTypeId: e.target.value || undefined })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">None</option>
                      {shiftTypes.filter(st => st.active).map(shiftType => (
                        <option key={shiftType.id} value={shiftType.id}>{shiftType.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      value={newDefaultShift.quantity || 1}
                      onChange={(e) => setNewDefaultShift({ ...newDefaultShift, quantity: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newDefaultShift.notes || ''}
                      onChange={(e) => setNewDefaultShift({ ...newDefaultShift, notes: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSaveNewDefaultShift}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNewDefaultShift(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Time Clock Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Time Clock Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure essential time clock behavior and authentication.
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          {/* PIN-based punching */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="font-medium text-gray-900">PIN-Based Authentication</label>
              <p className="text-sm text-gray-600 mt-1">Require employees to enter a PIN to clock in/out</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={timeClockSettings.pinEnabled}
                onChange={(e) => onUpdateTimeClockSettings({ ...timeClockSettings, pinEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* PIN Length */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="font-medium text-gray-900">PIN Length</label>
              <p className="text-sm text-gray-600 mt-1">Number of digits required for employee PINs</p>
            </div>
            <select
              value={timeClockSettings.pinLength}
              onChange={(e) => onUpdateTimeClockSettings({ ...timeClockSettings, pinLength: parseInt(e.target.value) as 4 | 6 })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!timeClockSettings.pinEnabled}
            >
              <option value="4">4 digits</option>
              <option value="6">6 digits</option>
            </select>
          </div>

          {/* Break Tracking */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="font-medium text-gray-900">Break Tracking</label>
              <p className="text-sm text-gray-600 mt-1">Allow employees to clock in/out for breaks</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={timeClockSettings.breakTrackingEnabled}
                onChange={(e) => onUpdateTimeClockSettings({ ...timeClockSettings, breakTrackingEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Role Selection at Clock-In */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="font-medium text-gray-900">Role Selection at Clock-In</label>
              <p className="text-sm text-gray-600 mt-1">Allow employees to choose their role when clocking in</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={timeClockSettings.roleSelectionAtClockIn}
                onChange={(e) => onUpdateTimeClockSettings({ ...timeClockSettings, roleSelectionAtClockIn: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Labor Burden Rate */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="font-medium text-gray-900">Labor Burden Rate</label>
              <p className="text-sm text-gray-600 mt-1">
                Percentage to add to base labor costs for payroll taxes, benefits, and insurance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={timeClockSettings.burdenRate}
                onChange={(e) => onUpdateTimeClockSettings({ ...timeClockSettings, burdenRate: parseFloat(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
              />
              <span className="text-gray-600">%</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="py-3">
            <div className="mb-3">
              <label className="font-medium text-gray-900">Operating Hours</label>
              <p className="text-sm text-gray-600 mt-1">Define store operating hours by day for visual dimming in schedule views</p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Day</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Opens At</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Closes At</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((dayName, dayOfWeek) => {
                    const dayHours = timeClockSettings.operatingHoursByDay?.find(d => d.dayOfWeek === dayOfWeek) || {
                      dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                      enabled: true,
                      opensAt: timeClockSettings.operatingHoursStart || '06:00',
                      closesAt: timeClockSettings.operatingHoursEnd || '23:00',
                    };

                    const handleUpdateDayHours = (updates: Partial<DayOperatingHours>) => {
                      const existingDays = timeClockSettings.operatingHoursByDay || [];
                      const otherDays = existingDays.filter(d => d.dayOfWeek !== dayOfWeek);
                      const updatedDay = { ...dayHours, ...updates };
                      onUpdateTimeClockSettings({
                        ...timeClockSettings,
                        operatingHoursByDay: [...otherDays, updatedDay].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
                      });
                    };

                    return (
                      <tr key={dayOfWeek} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{dayName}</td>
                        <td className="px-4 py-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dayHours.enabled}
                              onChange={(e) => handleUpdateDayHours({ enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm text-gray-700">
                              {dayHours.enabled ? 'Open' : 'Closed'}
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          {dayHours.enabled ? (
                            <input
                              type="time"
                              value={dayHours.opensAt || '06:00'}
                              onChange={(e) => handleUpdateDayHours({ opensAt: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {dayHours.enabled ? (
                            <input
                              type="time"
                              value={dayHours.closesAt || '23:00'}
                              onChange={(e) => handleUpdateDayHours({ closesAt: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}