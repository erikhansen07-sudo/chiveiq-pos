import { useState } from 'react';
import { DollarSign, Calendar, Download, Lock, AlertTriangle, Plus, Edit2, CheckCircle, Users } from 'lucide-react';
import type { 
  Employee, 
  TimePunch, 
  TimeApproval, 
  PaySchedule, 
  PayrollRun, 
  PayrollRunEmployee,
  PayFrequency 
} from './types';

interface PayrollViewProps {
  employees: Employee[];
  timePunches: TimePunch[];
  timeApprovals: TimeApproval[];
  paySchedules: PaySchedule[];
  payrollRuns: PayrollRun[];
  onAddPaySchedule: (schedule: Omit<PaySchedule, 'id' | 'createdAt' | 'createdBy'>) => void;
  onUpdatePaySchedule: (scheduleId: string, updates: Partial<PaySchedule>) => void;
  onGeneratePayrollRun: (payScheduleId: string, periodStart: Date, periodEnd: Date) => void;
  onExportPayrollRun: (payrollRunId: string) => void;
}

export function PayrollView({
  employees,
  timePunches,
  timeApprovals,
  paySchedules,
  payrollRuns,
  onAddPaySchedule,
  onUpdatePaySchedule,
  onGeneratePayrollRun,
  onExportPayrollRun,
}: PayrollViewProps) {
  const [activeSection, setActiveSection] = useState<'schedules' | 'runs'>('schedules');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaySchedule | null>(null);
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<PayrollRun | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateScheduleId, setGenerateScheduleId] = useState<string>('');

  // Schedule form state
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<PayFrequency>('weekly');
  const [scheduleStartDay, setScheduleStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

  const activeSchedules = paySchedules.filter(s => s.active);

  const handleAddSchedule = () => {
    if (!scheduleName) return;

    onAddPaySchedule({
      name: scheduleName,
      frequency: scheduleFrequency,
      startDayOfWeek: scheduleFrequency !== 'semi-monthly' ? scheduleStartDay : undefined,
      active: true,
    });

    setScheduleName('');
    setScheduleFrequency('weekly');
    setScheduleStartDay(0);
    setShowScheduleModal(false);
  };

  const handleGenerateRun = () => {
    if (!generateScheduleId) return;

    const schedule = paySchedules.find(s => s.id === generateScheduleId);
    if (!schedule) return;

    // Calculate period dates based on schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let periodStart: Date;
    let periodEnd: Date;

    if (schedule.frequency === 'weekly') {
      // Find last occurrence of start day
      const daysBack = (today.getDay() - (schedule.startDayOfWeek || 0) + 7) % 7;
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - daysBack - 7); // Previous week
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
    } else if (schedule.frequency === 'biweekly') {
      // Simplified: last 2 weeks
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - 14);
      periodEnd = new Date(today);
      periodEnd.setDate(today.getDate() - 1);
    } else {
      // Semi-monthly: simplified to first half or second half
      const currentDay = today.getDate();
      if (currentDay <= 15) {
        // Previous second half
        periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 16);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      } else {
        // Current first half
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), 15);
      }
    }

    onGeneratePayrollRun(generateScheduleId, periodStart, periodEnd);
    setShowGenerateModal(false);
    setGenerateScheduleId('');
    setActiveSection('runs');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getFrequencyLabel = (frequency: PayFrequency): string => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-Weekly';
      case 'semi-monthly': return 'Semi-Monthly';
    }
  };

  const getStatusBadge = (run: PayrollRun) => {
    if (run.status === 'exported') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <Lock className="w-3 h-3" />
          Exported
        </span>
      );
    }

    const hasUnapproved = run.employees.some(e => e.hasUnapprovedTime);
    if (hasUnapproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Incomplete
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3" />
        Ready
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Payroll</h2>
        <p className="text-sm text-gray-600 mt-1">
          Prepare approved labor data for external payroll systems
        </p>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveSection('schedules')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeSection === 'schedules'
                  ? 'border-b-2 border-gray-900 text-gray-900 -mb-px'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Pay Schedules
            </button>
            <button
              onClick={() => setActiveSection('runs')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeSection === 'runs'
                  ? 'border-b-2 border-gray-900 text-gray-900 -mb-px'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Payroll Runs
            </button>
          </div>
        </div>

        {/* Pay Schedules Section */}
        {activeSection === 'schedules' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">Pay Schedules</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Define how employee time is grouped for payroll
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Schedule
              </button>
            </div>

            {activeSchedules.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pay schedules configured</p>
                <p className="text-sm mt-1">Create your first pay schedule to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getFrequencyLabel(schedule.frequency)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {schedule.frequency !== 'semi-monthly' && schedule.startDayOfWeek !== undefined && (
                          <span>Starts on {getDayName(schedule.startDayOfWeek)}</span>
                        )}
                        {schedule.frequency === 'semi-monthly' && (
                          <span>1st-15th and 16th-End of Month</span>
                        )}
                        {' • '}
                        <span>
                          {schedule.applicableEmployeeIds 
                            ? `${schedule.applicableEmployeeIds.length} employees` 
                            : 'All employees'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setGenerateScheduleId(schedule.id);
                          setShowGenerateModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        Generate Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payroll Runs Section */}
        {activeSection === 'runs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">Payroll Runs</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Review and export payroll-ready summaries
                </p>
              </div>
              {activeSchedules.length > 0 && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate Run
                </button>
              )}
            </div>

            {payrollRuns.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No payroll runs yet</p>
                <p className="text-sm mt-1">Generate your first payroll run from a pay schedule</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payrollRuns
                  .sort((a, b) => b.periodEndDate.getTime() - a.periodEndDate.getTime())
                  .map(run => {
                    const schedule = paySchedules.find(s => s.id === run.payScheduleId);
                    const totalHours = run.employees.reduce((sum, e) => sum + e.totalHours, 0);
                    const hasUnapproved = run.employees.some(e => e.hasUnapprovedTime);

                    return (
                      <div
                        key={run.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-900">
                                {schedule?.name || 'Unknown Schedule'}
                              </h4>
                              {getStatusBadge(run)}
                              {run.modifiedAfterExport && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Modified
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {formatDate(run.periodStartDate)} - {formatDate(run.periodEndDate)}
                              {' • '}
                              {run.employees.length} employees
                              {' • '}
                              {totalHours.toFixed(1)} total hours
                            </div>
                            {run.exportedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Exported {formatDate(run.exportedAt)} by {run.exportedBy}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedPayrollRun(run)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              Review
                            </button>
                            {run.status !== 'exported' && !hasUnapproved && (
                              <button
                                onClick={() => onExportPayrollRun(run.id)}
                                className="inline-flex items-center gap-1 px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Export
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Add Pay Schedule</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Name
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g., Default Weekly"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Frequency
              </label>
              <select
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value as PayFrequency)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="semi-monthly">Semi-Monthly</option>
              </select>
            </div>

            {scheduleFrequency !== 'semi-monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period Start Day
                </label>
                <select
                  value={scheduleStartDay}
                  onChange={(e) => setScheduleStartDay(Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowScheduleModal(false);
                setScheduleName('');
                setScheduleFrequency('weekly');
                setScheduleStartDay(0);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSchedule}
              disabled={!scheduleName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Schedule
            </button>
          </div>
        </div>
      )}

      {/* Generate Run Modal */}
      {showGenerateModal && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Generate Payroll Run</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Schedule
              </label>
              <select
                value={generateScheduleId}
                onChange={(e) => setGenerateScheduleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a schedule...</option>
                {activeSchedules.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name} ({getFrequencyLabel(schedule.frequency)})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                This will generate a payroll run for the most recent completed pay period based on the selected schedule.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowGenerateModal(false);
                setGenerateScheduleId('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateRun}
              disabled={!generateScheduleId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Payroll Run Detail Modal */}
      {selectedPayrollRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payroll Run: {formatDate(selectedPayrollRun.periodStartDate)} - {formatDate(selectedPayrollRun.periodEndDate)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPayrollRun.employees.length} employees • {selectedPayrollRun.employees.reduce((sum, e) => sum + e.totalHours, 0).toFixed(1)} total hours
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedPayrollRun)}
                  <button
                    onClick={() => setSelectedPayrollRun(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Warning if unapproved time */}
              {selectedPayrollRun.employees.some(e => e.hasUnapprovedTime) && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-900">Incomplete Payroll Run</div>
                      <div className="text-sm text-amber-800 mt-1">
                        This payroll run includes unapproved time. Complete time approval in the Approve Time tab before exporting.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modified after export warning */}
              {selectedPayrollRun.modifiedAfterExport && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-purple-900">Changes After Export</div>
                      <div className="text-sm text-purple-800 mt-1">
                        Time data has been modified since this payroll run was exported. Review changes and re-export if necessary.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee payroll table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900">Employee</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900">Payroll ID</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">Regular Hrs</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">Regular Rate</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">OT Hrs</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">OT Rate</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">DT Hrs</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">DT Rate</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">Tips</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">Total Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPayrollRun.employees.map((empRun) => {
                      const employee = employees.find(e => e.id === empRun.employeeId);
                      return (
                        <tr key={empRun.employeeId} className={empRun.hasUnapprovedTime ? 'bg-amber-50' : ''}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{employee?.name || 'Unknown'}</div>
                              {empRun.hasUnapprovedTime && (
                                <div className="text-xs text-amber-600 font-medium mt-0.5">Unapproved time</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{empRun.employeePayrollId || '—'}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{empRun.regularHours.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">${empRun.regularRate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {empRun.overtimeHours > 0 ? empRun.overtimeHours.toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {empRun.overtimeHours > 0 ? `$${empRun.overtimeRate.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {empRun.doubleTimeHours > 0 ? empRun.doubleTimeHours.toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {empRun.doubleTimeHours > 0 ? `$${empRun.doubleTimeRate.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {empRun.tips > 0 ? `$${empRun.tips.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{empRun.totalHours.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900">Totals</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {selectedPayrollRun.employees.reduce((sum, e) => sum + e.regularHours, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {selectedPayrollRun.employees.reduce((sum, e) => sum + e.overtimeHours, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {selectedPayrollRun.employees.reduce((sum, e) => sum + e.doubleTimeHours, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${selectedPayrollRun.employees.reduce((sum, e) => sum + e.tips, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {selectedPayrollRun.employees.reduce((sum, e) => sum + e.totalHours, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between sticky bottom-0">
              <button
                onClick={() => setSelectedPayrollRun(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedPayrollRun.status !== 'exported' && (
                <button
                  onClick={() => {
                    onExportPayrollRun(selectedPayrollRun.id);
                    setSelectedPayrollRun(null);
                  }}
                  disabled={selectedPayrollRun.employees.some(e => e.hasUnapprovedTime)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedPayrollRun.employees.some(e => e.hasUnapprovedTime) ? 'Complete time approval before exporting' : 'Export payroll data'}
                >
                  <Download className="w-4 h-4" />
                  Export Payroll
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}