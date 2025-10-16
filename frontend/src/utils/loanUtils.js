/**
 * Utility functions for loan management
 */

/**
 * Get status badge styling based on loan status
 * @param {string} status - The loan status
 * @returns {string} Tailwind CSS classes for badge styling
 */
export const getStatusBadge = (status) => {
  const styles = {
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'APPROVED': 'bg-green-100 text-green-800 border-green-200',
    'REJECTED': 'bg-red-100 text-red-800 border-red-200',
    'REPAID': 'bg-blue-100 text-blue-800 border-blue-200',
    'FORECLOSED': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Calculate days until due date
 * @param {string} dueDate - The due date string
 * @returns {number} Number of days until due (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate EMI (Equated Monthly Installment)
 * @param {number} amount - Loan amount
 * @param {number} tenure - Loan tenure in months
 * @returns {string} EMI amount fixed to 2 decimal places
 */
export const calculateEMI = (amount, tenure) => {
  const monthlyRate = 0.10 / 12; // 10% annual rate
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return emi.toFixed(2);
};

/**
 * Format currency to Indian Rupee format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toLocaleString()}`;
};

/**
 * Get profile status badge styling
 * @param {string} status - Profile status
 * @returns {string} Tailwind CSS classes for profile badge
 */
export const getProfileStatusBadge = (status) => {
  return status === 'APPROVED'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';
};

/**
 * Export schedule data to CSV
 * @param {Object} scheduleData - Schedule data object
 * @param {number} loanId - Loan ID for filename
 */
export const exportScheduleToCSV = (scheduleData, loanId) => {
  if (!scheduleData) return;
  const schedule = scheduleData.schedule || [];

  // Helper function to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headers = ['EMI #', 'Due Date', 'EMI Amount', 'Principal', 'Interest', 'Balance', 'Status', 'Payment Date'];
  const rows = schedule.map(p => [
    p.emi_number || '',
    p.due_date || '',
    (p.emi_amount || 0).toFixed(2),
    (p.principal || 0).toFixed(2),
    (p.interest || 0).toFixed(2),
    (p.remaining_balance || 0).toFixed(2),
    p.paid ? 'Paid' : 'Pending',
    p.payment_date || '-'
  ].map(escapeCSV));

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loan_${loanId}_schedule.csv`;
  a.click();

  // Delay revocation to ensure download completes
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Get due date status styling
 * @param {number} daysUntil - Days until due
 * @returns {Object} Style information for due date display
 */
export const getDueDateStatus = (daysUntil) => {
  const isOverdue = daysUntil < 0;
  const isDueSoon = daysUntil <= 7 && daysUntil >= 0;

  return {
    isOverdue,
    isDueSoon,
    borderClass: isOverdue ? 'border-red-200 bg-red-50' :
                 isDueSoon ? 'border-yellow-200 bg-yellow-50' :
                 'border-gray-200',
    iconClass: isOverdue ? 'text-red-600' :
               isDueSoon ? 'text-yellow-600' :
               'text-gray-400',
    textClass: isOverdue ? 'text-red-600' :
               isDueSoon ? 'text-yellow-600' :
               'text-gray-500',
    label: isOverdue ? `${Math.abs(daysUntil)} days overdue` :
           daysUntil === 0 ? 'Due today' :
           `${daysUntil} days left`
  };
};
