import React from 'react';
import { Shield, Plus } from 'lucide-react';

const CreditLimitCard = ({
  creditLimit,
  usedLimit,
  availableLimit,
  userProfileStatus,
  onApplyLoan
}) => {
  const usagePercentage = ((usedLimit || 0) / creditLimit) * 100;
  const canApplyLoan = userProfileStatus === 'APPROVED' && (availableLimit || 0) >= 1000;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Credit Limit</h3>
        <Shield className="w-5 h-5 text-blue-600" />
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Available</span>
            <span className="font-bold text-green-600">
              ₹{(availableLimit || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Used</span>
            <span className="font-bold text-blue-600">
              ₹{(usedLimit || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-600">Total Limit</span>
            <span className="font-bold">₹{creditLimit.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {usagePercentage.toFixed(1)}% of limit used
          </p>
        </div>
        <button
          onClick={onApplyLoan}
          disabled={!canApplyLoan}
          className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
            canApplyLoan
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Apply for Loan
        </button>
      </div>
    </div>
  );
};

export default React.memo(CreditLimitCard);
