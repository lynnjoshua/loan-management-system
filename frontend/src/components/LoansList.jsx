import React from 'react';
import { FileText } from 'lucide-react';
import LoanCard from './LoanCard';

const LoansList = ({ loans, onPayEMI, onForeclose, onViewSchedule, loadingScheduleId }) => {
  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Your Loans</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No loans found</p>
            <p className="text-sm text-gray-500 mt-1">Apply for your first loan to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Your Loans</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {loans.map(loan => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onPayEMI={onPayEMI}
              onForeclose={onForeclose}
              onViewSchedule={onViewSchedule}
              loadingScheduleId={loadingScheduleId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoansList);
