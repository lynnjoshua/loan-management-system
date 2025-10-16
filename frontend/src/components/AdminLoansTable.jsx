import React, { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import ContactModal from './ContactModal';

const AdminLoansTable = ({
  loans = [],
  isLoading = false,
  processingId = null,
  onDelete,
  onForeclose,
  onApprove,
  formatCurrency,
  displayLoanUser,
  normalizedStatus
}) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const handleOpenContactModal = (loan, tab = 'email') => {
    setSelectedLoan({ ...loan, activeTab: tab });
    setIsContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedLoan(null);
  };
  if (isLoading) {
    return <p>Loading loans...</p>;
  }

  if (loans.length === 0) {
    return <p>No loans found</p>;
  }

  return (
    <>
      <div className="overflow-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Contact</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Tenure</th>
              <th className="p-2 border">Interest</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className="text-center">
              <td className="p-2 border">{loan.id}</td>
              <td className="p-2 border">{displayLoanUser(loan)}</td>
              <td className="p-2 border">
                <div className="flex items-center justify-center space-x-2">
                  {/* Email Button */}
                  <button
                    onClick={() => handleOpenContactModal(loan, 'email')}
                    disabled={!loan.user_email}
                    title={loan.user_email ? `Send email to ${loan.user_email}` : 'No email available'}
                    className="group relative p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  >
                    <Mail className="w-[18px] h-[18px]" />
                  </button>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => handleOpenContactModal(loan, 'whatsapp')}
                    disabled={!loan.user_phone}
                    title={loan.user_phone ? `Send WhatsApp to ${loan.user_phone}` : 'No phone number available'}
                    className="group relative p-2.5 bg-[#25D366] text-white rounded-lg shadow-sm hover:shadow-md hover:scale-105 hover:bg-[#20BA5A] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  >
                    <MessageCircle className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </td>
              <td className="p-2 border">{formatCurrency(loan.amount)}</td>
              <td className="p-2 border">{loan.tenure} months</td>
              <td className="p-2 border">{loan.interest_rate}%</td>
              <td className="p-2 border">{loan.status}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => onDelete(loan.id)}
                  disabled={processingId === loan.id}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
                {normalizedStatus(loan.status) === 'approved' && (
                  <button
                    onClick={() => onForeclose(loan.id)}
                    disabled={processingId === loan.id}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Foreclose
                  </button>
                )}
                {normalizedStatus(loan.status) === 'pending' && (
                  <button
                    onClick={() => onApprove(loan.id)}
                    disabled={processingId === loan.id}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      {/* Contact Modal */}
      {selectedLoan && (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={handleCloseContactModal}
          initialTab={selectedLoan.activeTab}
          userData={{
            username: selectedLoan.user,
            user_email: selectedLoan.user_email,
            user_phone: selectedLoan.user_phone,
            user_full_name: selectedLoan.user_full_name
          }}
          loanData={{
            id: selectedLoan.id,
            amount: selectedLoan.amount,
            status: selectedLoan.status
          }}
        />
      )}
    </>
  );
};

export default React.memo(AdminLoansTable);
