import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const CREDIT_LIMIT = 100000;

/**
 * Custom hook for fetching and managing dashboard data
 * @param {boolean} isAuthenticated - Authentication status
 * @param {string} username - Current username
 * @returns {Object} Dashboard data and loading states
 */
const useDashboardData = (isAuthenticated, username) => {
  // State management
  const [user, setUser] = useState({
    username: username || 'Loading...',
    email: '',
    profile: {
      status: 'APPROVED',
      phone_number: '',
      pan_number: '',
      full_address: ''
    }
  });

  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await API.get('/auth/users/me/');
      if (response.data) {
        setUser({
          username: response.data.username || username || 'User',
          email: response.data.email || '',
          profile: {
            status: response.data.profile?.status || 'PENDING',
            phone_number: response.data.profile?.phone_number || '',
            pan_number: response.data.profile?.pan_number || '',
            full_address: response.data.profile?.full_address || ''
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Don't set error state here to avoid blocking dashboard load
    }
  }, [username]);

  // Main data fetching function
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile and loans in parallel
      await fetchUserProfile();

      // Fetch loans from API
      const loansResponse = await API.get('/loans/');
      const loansData = loansResponse.data;

      setLoans(loansData);

      // Calculate statistics from real data
      const activeLoans = loansData.filter(l => l.status === 'APPROVED');
      const pendingLoans = loansData.filter(l => l.status === 'PENDING');

      const totalOutstanding = activeLoans.reduce((sum, l) =>
        sum + (parseFloat(l.monthly_installment || 0) * (l.payments_remaining || 0)), 0
      );

      const totalBorrowed = loansData
        .filter(l => ['APPROVED', 'REPAID'].includes(l.status))
        .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

      const usedLimit = loansData
        .filter(l => ['APPROVED', 'PENDING'].includes(l.status))
        .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

      setStats({
        totalLoans: loansData.length,
        activeLoans: activeLoans.length,
        pendingLoans: pendingLoans.length,
        totalOutstanding: totalOutstanding,
        totalBorrowed: totalBorrowed,
        usedLimit: usedLimit,
        availableLimit: CREDIT_LIMIT - usedLimit,
        completedLoans: loansData.filter(l => l.status === 'REPAID').length
      });

      // Fetch upcoming payments for active loans
      const payments = await Promise.all(
        activeLoans.map(async (loan) => {
          try {
            const nextPaymentRes = await API.get(`/loans/${loan.id}/next-payment/`);
            if (nextPaymentRes.data.next_payment) {
              return {
                loanId: loan.id,
                amount: nextPaymentRes.data.next_payment.emi_amount,
                dueDate: nextPaymentRes.data.next_payment.due_date,
                emiNumber: nextPaymentRes.data.emi_number,
                totalEmis: loan.tenure
              };
            }
          } catch (err) {
            console.error(`Error fetching payment for loan ${loan.id}:`, err);
          }
          return null;
        })
      );

      setUpcomingPayments(
        payments
          .filter(p => p !== null)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      );

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to load dashboard data');
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Fetch dashboard data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  return {
    user,
    loans,
    stats,
    loading,
    error,
    upcomingPayments,
    refreshData: fetchDashboardData,
    CREDIT_LIMIT
  };
};

export default useDashboardData;
