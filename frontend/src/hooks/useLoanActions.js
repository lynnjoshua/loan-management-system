import { useState } from 'react';
import API from '../api/axios';

/**
 * Custom hook for handling loan-related actions
 * @param {Function} refreshData - Callback to refresh dashboard data
 * @returns {Object} Loan action handlers and state
 */
const useLoanActions = (refreshData) => {
  const [loadingScheduleId, setLoadingScheduleId] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handle EMI payment
  const handlePayment = async (loanId) => {
    if (!window.confirm('Are you sure you want to make this EMI payment?')) {
      return;
    }

    try {
      const response = await API.post(`/loans/${loanId}/pay/`);
      alert(response.data.message || 'Payment successful!');
      refreshData();
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
                      err.response?.data?.detail ||
                      'Payment failed. Please try again.';
      alert(errorMsg);
    }
  };

  // Handle loan foreclosure
  const handleForeclose = async (loanId) => {
    try {
      // First, fetch accurate foreclosure amount from backend
      const previewResponse = await API.get(`/loans/${loanId}/foreclose/`);
      const { foreclosure_amount, payments_remaining } = previewResponse.data;

      const confirmMsg = `Are you sure you want to foreclose this loan?\n\n` +
                         `Outstanding Amount: ₹${parseFloat(foreclosure_amount).toLocaleString()}\n` +
                         `Remaining EMIs: ${payments_remaining}\n\n` +
                         `Note: This is the remaining principal balance only.\n` +
                         `This will close the loan permanently.`;

      if (!window.confirm(confirmMsg)) {
        return;
      }

      // Proceed with foreclosure
      const response = await API.post(`/loans/${loanId}/foreclose/`);
      alert(response.data.message || 'Loan foreclosed successfully!');
      refreshData();
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
                      err.response?.data?.detail ||
                      'Foreclosure failed. Please try again.';
      alert(errorMsg);
    }
  };

  // Fetch loan amortization schedule
  const fetchLoanSchedule = async (loanId) => {
    try {
      setLoadingScheduleId(loanId);
      const response = await API.get(`/loans/${loanId}/schedule/`);
      setScheduleData(response.data);
      setShowScheduleModal(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
                      err.response?.data?.detail ||
                      'Failed to load schedule';
      alert(errorMsg);
    } finally {
      setLoadingScheduleId(null);
    }
  };

  // Close schedule modal
  const closeScheduleModal = () => {
    setShowScheduleModal(false);
  };

  return {
    handlePayment,
    handleForeclose,
    fetchLoanSchedule,
    closeScheduleModal,
    loadingScheduleId,
    scheduleData,
    showScheduleModal
  };
};

export default useLoanActions;
