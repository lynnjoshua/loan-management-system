import React, { useMemo } from 'react';

const NewLoanModal = ({
  newLoanAmount,
  setNewLoanAmount,
  newLoanTenure,
  setNewLoanTenure,
  onSubmit,
  onClose,
  availableLimit,
  creditLimit,
  userProfileStatus
}) => {
  // Calculate EMI with memoization to prevent unnecessary recalculations
  const monthlyEMI = useMemo(() => {
    if (!newLoanAmount || !newLoanTenure) return null;
    const amount = parseFloat(newLoanAmount);
    const tenure = parseInt(newLoanTenure);
    if (isNaN(amount) || isNaN(tenure) || amount <= 0 || tenure <= 0) return null;

    const monthlyRate = 0.10 / 12; // 10% annual rate
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return emi.toFixed(2);
  }, [newLoanAmount, newLoanTenure]);

  // Validation logic
  const canApply = userProfileStatus === 'APPROVED' && availableLimit >= 1000;
  const maxLoanAmount = Math.min(creditLimit, availableLimit || creditLimit);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">New Loan Application</h3>

        {/* Status Banner - Error or Info */}
        {!canApply ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">
              {userProfileStatus !== 'APPROVED'
                ? 'Your profile must be approved to apply for loans.'
                : `Insufficient credit limit. Available: ₹${availableLimit?.toLocaleString() || 0}`}
            </p>
          </div>
        ) : (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              Available Credit Limit: <span className="font-bold">₹{availableLimit?.toLocaleString()}</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount (₹)
            </label>
            <input
              type="text"
              value={newLoanAmount}
              onChange={(e) => setNewLoanAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount (e.g., 50000)"
              inputMode="numeric"
              disabled={!canApply}
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: ₹1,000 | Max: ₹{maxLoanAmount?.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenure (Months)
            </label>
            <select
              value={newLoanTenure}
              onChange={(e) => setNewLoanTenure(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!canApply}
            >
              <option value="">Select tenure</option>
              {[3, 6, 9, 12, 15, 18, 21, 24].map(month => (
                <option key={month} value={month}>{month} months</option>
              ))}
            </select>
          </div>

          {/* EMI Preview Box */}
          {monthlyEMI && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly EMI</span>
                <span className="text-xl font-bold text-green-700">
                  ₹{monthlyEMI}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Interest Rate: 10% p.a.</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(newLoanAmount, newLoanTenure)}
              disabled={!canApply || !newLoanAmount || !newLoanTenure}
              className={`flex-1 px-4 py-2 rounded-lg ${
                canApply && newLoanAmount && newLoanTenure
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(NewLoanModal);
