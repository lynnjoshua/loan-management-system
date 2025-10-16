import React from 'react';

const AdminDashboardHeader = ({ title = 'Admin Dashboard', subtitle = 'Manage loans & users' }) => {
  return (
    <div className="p-6 bg-green-600 text-white">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
};

export default React.memo(AdminDashboardHeader);
