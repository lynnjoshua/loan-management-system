import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const ProfileStatusBanner = ({ status }) => {
  if (status === 'PENDING') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-900">Profile Verification Pending</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Your profile is under review. You'll be able to apply for loans once approved.
          </p>
        </div>
      </div>
    );
  } else if (status === 'SUSPENDED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
        <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Account Suspended</h3>
          <p className="text-red-700 text-sm mt-1">
            Your account has been suspended. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default React.memo(ProfileStatusBanner);
