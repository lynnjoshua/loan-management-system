import React from 'react';
import { CreditCard, XCircle } from 'lucide-react';
import { getStatusBadge } from '../utils/loanUtils';

const LoanCard = ({ loan, onPayEMI, onForeclose, onViewSchedule, loadingScheduleId }) => {
  const isApproved = loan.status === 'APPROVED';
  const paymentProgress = (loan.payments_made / loan.tenure) * 100;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-3">
            <h4 className="font-semibold">Loan #{loan.id}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
              {loan.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Applied: {loan.applied_date}</p>
        </div>
        <p className="text-lg font-bold">₹{parseFloat(loan.amount).toLocaleString()}</p>
      </div>

      {/* Loan Details */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">EMI Amount</p>
          <p className="font-semibold">₹{parseFloat(loan.monthly_installment || 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Tenure</p>
          <p className="font-semibold">{loan.tenure} months</p>
        </div>
        <div>
          <p className="text-gray-600">Interest</p>
          <p className="font-semibold">₹{parseFloat(loan.total_interest || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Active Loan Actions */}
      {isApproved && (
        <>
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Payment Progress</span>
              <span className="font-medium">{loan.payments_made}/{loan.tenure} EMIs</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={() => onPayEMI(loan.id)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay EMI
              </button>
              <button
                onClick={() => onViewSchedule(loan.id)}
                disabled={loadingScheduleId === loan.id}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingScheduleId === loan.id ? 'Loading...' : 'View Schedule'}
              </button>
            </div>
            <button
              onClick={() => onForeclose(loan.id)}
              className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium flex items-center justify-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Foreclose Loan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(LoanCard);
