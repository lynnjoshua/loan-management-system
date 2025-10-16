import React from 'react';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Printer,
  XCircle
} from 'lucide-react';

const ScheduleModal = ({
  scheduleData,
  filterStatus,
  setFilterStatus,
  onClose,
  onExportCSV,
  onPrint,
  onBackdropClick
}) => {
  if (!scheduleData) return null;

  // Safely get schedule array with fallback
  const schedule = scheduleData.schedule || [];

  // Filter schedule based on status only
  const filteredSchedule = schedule.filter(payment => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && payment.paid) ||
      (filterStatus === 'pending' && !payment.paid);

    return matchesStatus;
  });

  // Calculate summary stats with safe defaults
  const paidCount = schedule.filter(p => p && p.paid).length;
  const pendingCount = schedule.filter(p => p && !p.paid).length;
  const totalInterest = schedule.reduce((sum, p) => sum + (p?.interest || 0), 0);
  const paidAmount = schedule.filter(p => p && p.paid).reduce((sum, p) => sum + (p?.emi_amount || 0), 0);
  const pendingAmount = schedule.filter(p => p && !p.paid).reduce((sum, p) => sum + (p?.emi_amount || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onBackdropClick}
    >
      <div
        className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Loan Repayment Schedule</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Loan #{scheduleData.loan_id} • ₹{scheduleData.amount.toLocaleString()} @ {scheduleData.interest_rate}% p.a.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Summary Stats - Enhanced */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Total Tenure
              </p>
              <p className="text-lg md:text-xl font-bold mt-1">{scheduleData.tenure} months</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Paid EMIs
              </p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-1">{paidCount}</p>
              <p className="text-xs text-gray-500">₹{paidAmount.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pending EMIs
              </p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-1">{pendingCount}</p>
              <p className="text-xs text-gray-500">₹{pendingAmount.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-red-100">
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Total Interest
              </p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-1">
                ₹{totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <p className="text-xs text-gray-600">Progress</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-lg md:text-xl font-bold text-purple-600">
                  {((paidCount / scheduleData.tenure) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${(paidCount / scheduleData.tenure) * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
              <p className="text-xs text-gray-600">EMI Amount</p>
              <p className="text-lg md:text-xl font-bold text-indigo-600 mt-1">
                ₹{schedule[0]?.emi_amount?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '0'}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b bg-white">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            {/* Filter Buttons */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium">Filter:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({schedule.length})
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paid ({paidCount})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({pendingCount})
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onExportCSV}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export CSV</span>
              </button>
              <button
                onClick={onPrint}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Results count */}
          {filterStatus !== 'all' && (
            <div className="mt-2 text-xs text-gray-600">
              Showing {filteredSchedule.length} of {schedule.length} EMIs
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No matching EMIs found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">EMI #</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Due Date</th>
                    <th className="text-right p-3 font-semibold text-gray-700">EMI Amount</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Principal</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Interest</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Balance</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSchedule.map((payment, index) => {
                    const isOverdue = !payment.paid && new Date(payment.due_date) < new Date();
                    const isDueSoon = !payment.paid &&
                      new Date(payment.due_date) >= new Date() &&
                      new Date(payment.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-blue-50 transition-colors ${
                          payment.paid ? 'bg-green-50/50' :
                          isOverdue ? 'bg-red-50' :
                          isDueSoon ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-gray-900">{payment.emi_number}</td>
                        <td className="p-3">
                          <div className="text-gray-700">{new Date(payment.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          {isOverdue && <div className="text-xs text-red-600 font-medium">Overdue!</div>}
                          {isDueSoon && <div className="text-xs text-yellow-600 font-medium">Due soon</div>}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          ₹{payment.emi_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          ₹{payment.principal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3 text-right text-red-600 font-medium">
                          ₹{payment.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900">
                          ₹{payment.remaining_balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3">
                          {payment.paid ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </span>
                              {payment.payment_date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isOverdue ? 'bg-red-100 text-red-800 border-red-200' :
                                isDueSoon ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Pending'}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-gray-100 to-slate-100 font-bold sticky bottom-0 shadow-lg">
                  <tr className="border-t-2 border-gray-300">
                    <td className="p-3 text-gray-900" colSpan="2">Grand Total</td>
                    <td className="p-3 text-right text-gray-900">
                      ₹{filteredSchedule.reduce((sum, p) => sum + p.emi_amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="p-3 text-right text-gray-900">
                      ₹{filteredSchedule.reduce((sum, p) => sum + p.principal, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="p-3 text-right text-red-600">
                      ₹{filteredSchedule.reduce((sum, p) => sum + p.interest, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="p-3" colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-slate-50 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Next Payment:</span> {
              (() => {
                const nextPayment = schedule.find(p => !p.paid);
                return nextPayment
                  ? `₹${nextPayment.emi_amount.toFixed(2)} on ${new Date(nextPayment.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : 'All payments completed!';
              })()
            }
          </div>
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScheduleModal);
