import React from 'react';
import { getProfileStatusBadge } from '../utils/loanUtils';

const ProfileInfoCard = ({ profile }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfileStatusBadge(profile.status)}`}>
            {profile.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Phone</span>
          <span className="font-medium">{profile.phone_number || 'Not set'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">PAN</span>
          <span className="font-medium">{profile.pan_number || 'Not set'}</span>
        </div>
        <div>
          <span className="text-gray-600">Address</span>
          <p className="font-medium text-xs mt-1">{profile.full_address || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileInfoCard);
