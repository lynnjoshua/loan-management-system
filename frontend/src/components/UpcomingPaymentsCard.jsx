import React from 'react';
import { Calendar } from 'lucide-react';
import { getDaysUntilDue, getDueDateStatus } from '../utils/loanUtils';

const UpcomingPaymentsCard = ({ payments }) => {
  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Upcoming Payments</h3>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {payments.slice(0, 3).map((payment, idx) => {
            const daysUntil = getDaysUntilDue(payment.dueDate);
            const status = getDueDateStatus(daysUntil);

            return (
              <div key={idx} className={`border rounded-lg p-4 ${status.borderClass}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className={`w-5 h-5 mr-3 ${status.iconClass}`} />
                    <div>
                      <p className="font-semibold">
                        Loan #{payment.loanId} - EMI {payment.emiNumber}/{payment.totalEmis}
                      </p>
                      <p className="text-sm text-gray-600">Due: {payment.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{parseFloat(payment.amount).toFixed(2)}</p>
                    <p className={`text-xs font-medium ${status.textClass}`}>
                      {status.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UpcomingPaymentsCard);
