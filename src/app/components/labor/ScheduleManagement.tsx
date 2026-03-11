import { useState, useMemo } from 'react';
import { Calendar, Plus, Trash2, Edit2, Send } from 'lucide-react';
import type { Employee, ScheduledShift } from './types';

interface ScheduleManagementProps {
  employees: Employee[];
  scheduledShifts: ScheduledShift[];
  onAddShift: (shift: Omit<ScheduledShift, 'id'>) => void;
  onUpdateShift: (shiftId: string, updates: Partial<ScheduledShift>) => void;
  onDeleteShift: (shiftId: string) => void;
  onPublishSchedule: () => void;
}

interface ShiftFormData {
  employeeId: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function ScheduleManagement({
  employees,
  scheduledShifts,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onPublishSchedule,
}: ScheduleManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShift, setEditingShift] = useState<ScheduledShift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    employeeId: '',
    role: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const activeEmployees = employees.filter(e => e.status === 'active');

  const weekSchedule = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day;
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }

    return weekDays.map(date => {
      const dayShifts = scheduledShifts.filter(shift => {
        const shiftDate = new Date(shift.startTime);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === date.getTime();
      }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      return {
        date,
        shifts: dayShifts,
      };
    });
  }, [scheduledShifts]);

  const hasUnpublishedShifts = useMemo(() => {
    return scheduledShifts.some(s => !s.published);
  }, [scheduledShifts]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleOpenAddForm = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setFormData({
      employeeId: '',
      role: '',
      date: dateStr,
      startTime: '09:00',
      endTime: '17:00',
    });
    setEditingShift(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (shift: ScheduledShift) => {
    const dateStr = new Date(shift.startTime).toISOString().split('T')[0];
    const startTime = `${String(new Date(shift.startTime).getHours()).padStart(2, '0')}:${String(new Date(shift.startTime).getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(new Date(shift.endTime).getHours()).padStart(2, '0')}:${String(new Date(shift.endTime).getMinutes()).padStart(2, '0')}`;

    setFormData({
      employeeId: shift.employeeId,
      role: shift.role,
      date: dateStr,
      startTime,
      endTime,
    });
    setEditingShift(shift);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingShift(null);
    setFormData({
      employeeId: '',
      role: '',
      date: '',
      startTime: '',
      endTime: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = formData.date.split('-').map(Number);
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);

    const startTime = new Date(year, month - 1, day, startHour, startMinute);
    const endTime = new Date(year, month - 1, day, endHour, endMinute);

    if (editingShift) {
      onUpdateShift(editingShift.id, {
        employeeId: formData.employeeId,
        role: formData.role,
        startTime,
        endTime,
      });
    } else {
      onAddShift({
        employeeId: formData.employeeId,
        role: formData.role,
        store: 'Main Street',
        startTime,
        endTime,
        published: false,
      });
    }

    handleCloseForm();
  };

  const selectedEmployee = formData.employeeId 
    ? employees.find(e => e.id === formData.employeeId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Week of {formatDate(weekSchedule[0].date)}
            </p>
          </div>
          <div className="flex gap-3">
            {hasUnpublishedShifts && (
              <button
                onClick={onPublishSchedule}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Publish Schedule
              </button>
            )}
            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Shift
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Shift Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const newEmpId = e.target.value;
                    const emp = employees.find(e => e.id === newEmpId);
                    setFormData({
                      ...formData,
                      employeeId: newEmpId,
                      role: emp?.roles[0] || '',
                    });
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  disabled={!selectedEmployee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Role</option>
                  {selectedEmployee?.roles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingShift ? 'Update Shift' : 'Add Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {weekSchedule.map((day, index) => {
            const totalHours = day.shifts.reduce((sum, shift) => {
              const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0);

            return (
              <div key={index} className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-32 flex-shrink-0">
                    <div className="font-semibold text-gray-900">
                      {dayNames[day.date.getDay()]}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(day.date)}
                    </div>
                    {day.shifts.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {totalHours.toFixed(1)} hrs
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {day.shifts.length > 0 ? (
                      <div className="space-y-2">
                        {day.shifts.map(shift => {
                          const employee = employees.find(e => e.id === shift.employeeId);
                          const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
                          
                          return (
                            <div
                              key={shift.id}
                              className={`border rounded-lg p-3 hover:border-blue-300 transition-colors ${
                                shift.published ? 'border-gray-200 bg-white' : 'border-yellow-300 bg-yellow-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {employee?.name}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {shift.role}
                                    </span>
                                    {!shift.published && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Draft
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                    <span className="text-gray-500 ml-2">({duration.toFixed(1)} hrs)</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={() => handleOpenEditForm(shift)}
                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Edit shift"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this shift?')) {
                                        onDeleteShift(shift.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete shift"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-sm">No shifts scheduled</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}