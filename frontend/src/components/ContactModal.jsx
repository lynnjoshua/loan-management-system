import React, { useState } from 'react';
import { Mail, MessageCircle, X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { sendEmailToLoanUser, sendWhatsAppToLoanUser } from '../api/axios';

const ContactModal = ({ isOpen, onClose, userData, loanData, initialTab = 'email' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [emailSubject, setEmailSubject] = useState(`Regarding your loan #${loanData?.id || ''}`);
  const [emailMessage, setEmailMessage] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update active tab when initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Reset states when modal opens
      setShowSuccess(false);
      setErrorMessage('');
      setIsSending(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    // Validate inputs
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setErrorMessage('Subject and message are required');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setShowSuccess(false);

    try {
      await sendEmailToLoanUser(loanData.id, {
        subject: emailSubject,
        message: emailMessage
      });

      // Show success message
      setShowSuccess(true);

      // Close modal and reset form after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setEmailSubject(`Regarding your loan #${loanData?.id || ''}`);
        setEmailMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to send email';
      setErrorMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    // Validate input
    if (!whatsappMessage.trim()) {
      setErrorMessage('Message is required');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setShowSuccess(false);

    try {
      await sendWhatsAppToLoanUser(loanData.id, {
        message: whatsappMessage
      });

      // Show success message
      setShowSuccess(true);

      // Close modal and reset form after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setWhatsappMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to send WhatsApp message';
      setErrorMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-green-900">Contact User</h2>
            <p className="text-sm text-gray-600 mt-1">
              {userData?.user_full_name || userData?.username || 'User'} - Loan #{loanData?.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'email'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'border-b-2 border-[#25D366] text-[#25D366] bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="m-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-medium">
              {activeTab === 'email' ? 'Email sent successfully!' : 'WhatsApp message sent successfully!'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="m-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Email Tab Content */}
        {activeTab === 'email' && (
          <div className="p-6">
            <div className="space-y-4">
              {/* To Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="email"
                  value={userData?.user_email || 'No email available'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message here..."
                />
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEmailMessage('Your loan application has been approved. Please check your dashboard for details.')}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  >
                    Approval Notice
                  </button>
                  <button
                    onClick={() => setEmailMessage('This is a reminder that your loan payment is due soon. Please make the payment to avoid late fees.')}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  >
                    Payment Reminder
                  </button>
                  <button
                    onClick={() => setEmailMessage('We need additional documents to process your loan application. Please upload the required documents.')}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  >
                    Document Request
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isSending}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!userData?.user_email || !emailMessage.trim() || !emailSubject.trim() || isSending}
                  className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Tab Content */}
        {activeTab === 'whatsapp' && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={userData?.user_phone || 'No phone number available'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Type your WhatsApp message here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {whatsappMessage.length}
                </p>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setWhatsappMessage('Hi! Your loan has been approved. Check your dashboard for details.')}
                    className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700"
                  >
                    Approval
                  </button>
                  <button
                    onClick={() => setWhatsappMessage('Reminder: Your loan payment is due soon. Please pay to avoid penalties.')}
                    className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700"
                  >
                    Payment Due
                  </button>
                  <button
                    onClick={() => setWhatsappMessage('We need some additional information. Please contact us or check your email.')}
                    className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700"
                  >
                    Info Required
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isSending}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!userData?.user_phone || !whatsappMessage.trim() || isSending}
                  className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] hover:shadow-md transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
