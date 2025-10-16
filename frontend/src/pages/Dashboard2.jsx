import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useDashboardData from '../hooks/useDashboardData';
import useLoanActions from '../hooks/useLoanActions';
import API from '../api/axios';

// Components
import DashboardHeader from '../components/DashboardHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ProfileStatusBanner from '../components/ProfileStatusBanner';
import StatsCard from '../components/StatsCard';
import LoansList from '../components/LoansList';
import UpcomingPaymentsCard from '../components/UpcomingPaymentsCard';
import CreditLimitCard from '../components/CreditLimitCard';
import ProfileInfoCard from '../components/ProfileInfoCard';
import HelpSection from '../components/HelpSection';
import NewLoanModal from '../components/NewLoanModal';
import ScheduleModal from '../components/ScheduleModal';

// Icons
import {
  IndianRupee,
  CheckCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

// Utilities
import { exportScheduleToCSV } from '../utils/loanUtils';

const Dashboard2 = () => {
  const navigate = useNavigate();
  const { username, isAuthenticated, isInitialized } = useAuth();

  // Custom hooks
  const {
    user,
    loans,
    stats,
    loading,
    error,
    upcomingPayments,
    refreshData,
    CREDIT_LIMIT
  } = useDashboardData(isAuthenticated, username);

  const {
    handlePayment,
    handleForeclose,
    fetchLoanSchedule,
    closeScheduleModal,
    loadingScheduleId,
    scheduleData,
    showScheduleModal
  } = useLoanActions(refreshData);

  // Local state for modals
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanTenure, setNewLoanTenure] = useState('');

  // Redirect if not authenticated (only after initialization)
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login');
    }
  }, [isInitialized, isAuthenticated, navigate]);

  // Handle new loan submission
  const handleLoanSubmit = async (amount, tenure) => {
    // Validate inputs
    const parsedAmount = parseFloat(amount);
    const parsedTenure = parseInt(tenure);

    if (isNaN(parsedAmount) || parsedAmount < 1000) {
      alert('Loan amount must be at least ₹1,000');
      return;
    }

    if (parsedAmount > stats.availableLimit) {
      alert(`Loan amount cannot exceed available limit of ₹${stats.availableLimit.toLocaleString()}`);
      return;
    }

    if (parsedAmount > CREDIT_LIMIT) {
      alert(`Loan amount cannot exceed ₹${CREDIT_LIMIT.toLocaleString()}`);
      return;
    }

    if (isNaN(parsedTenure) || parsedTenure < 3 || parsedTenure > 24) {
      alert('Tenure must be between 3 and 24 months');
      return;
    }

    try {
      await API.post('/loans/', {
        amount: parsedAmount,
        tenure: parsedTenure
      });

      alert('Loan application submitted successfully! Awaiting admin approval.');
      setShowNewLoanModal(false);
      // Clear form
      setNewLoanAmount('');
      setNewLoanTenure('');

      // Refresh dashboard data
      refreshData();
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
                      err.response?.data?.detail ||
                      JSON.stringify(err.response?.data) ||
                      'Failed to submit loan application';
      alert(errorMsg);
    }
  };

  // Handle closing new loan modal
  const handleCloseNewLoanModal = () => {
    setShowNewLoanModal(false);
    setNewLoanAmount('');
    setNewLoanTenure('');
  };

  // Export to CSV function
  const exportToCSV = () => {
    exportScheduleToCSV(scheduleData, scheduleData?.loan_id);
  };

  // Print schedule function
  const printSchedule = () => {
    window.print();
  };

  // Close modal when clicking backdrop
  const handleScheduleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeScheduleModal();
    }
  };

  // Handle ESC key for modal
  useEffect(() => {
    if (!showScheduleModal) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeScheduleModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showScheduleModal, closeScheduleModal]);



  // Show loading state while auth is initializing
  if (!isInitialized) {
    return <LoadingState message="Initializing..." />;
  }

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader username={username} email={user.email} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Status Banner */}
        <ProfileStatusBanner status={user.profile.status} />

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {username || 'User'}!</h2>
          <p className="text-gray-600 mt-1">Manage your loans and track your payments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={FileText}
            title="Total Loans"
            value={stats.totalLoans || 0}
            subtitle={`${stats.activeLoans || 0} active`}
            color="bg-blue-600"
          />
          <StatsCard
            icon={IndianRupee}
            title="Total Outstanding"
            value={`₹${(stats.totalOutstanding || 0).toLocaleString()}`}
            subtitle="Across all active loans"
            color="bg-red-600"
          />
          <StatsCard
            icon={TrendingUp}
            title="Total Borrowed"
            value={`₹${(stats.totalBorrowed || 0).toLocaleString()}`}
            subtitle="Lifetime"
            color="bg-green-600"
          />
          <StatsCard
            icon={CheckCircle}
            title="Completed Loans"
            value={stats.completedLoans || 0}
            subtitle="Successfully repaid"
            color="bg-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <LoansList
              loans={loans}
              onPayEMI={handlePayment}
              onForeclose={handleForeclose}
              onViewSchedule={fetchLoanSchedule}
              loadingScheduleId={loadingScheduleId}
            />
            <UpcomingPaymentsCard payments={upcomingPayments} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CreditLimitCard
              creditLimit={CREDIT_LIMIT}
              usedLimit={stats.usedLimit}
              availableLimit={stats.availableLimit}
              userProfileStatus={user.profile.status}
              onApplyLoan={() => setShowNewLoanModal(true)}
            />
            <ProfileInfoCard profile={user.profile} />
            <HelpSection />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNewLoanModal && (
        <NewLoanModal
          newLoanAmount={newLoanAmount}
          setNewLoanAmount={setNewLoanAmount}
          newLoanTenure={newLoanTenure}
          setNewLoanTenure={setNewLoanTenure}
          onSubmit={handleLoanSubmit}
          onClose={handleCloseNewLoanModal}
          availableLimit={stats.availableLimit}
          creditLimit={CREDIT_LIMIT}
          userProfileStatus={user.profile.status}
        />
      )}
      {showScheduleModal && (
        <ScheduleModal
          scheduleData={scheduleData}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onClose={closeScheduleModal}
          onExportCSV={exportToCSV}
          onPrint={printSchedule}
          onBackdropClick={handleScheduleBackdropClick}
        />
      )}
    </div>
  );
};

export default Dashboard2;