import React from 'react';

const AdminStatsCards = ({
  totalLoans = 0,
  activeLoans = 0,
  foreclosedLoans = 0,
  pendingLoans = 0,
  onRefresh,
  isRefreshing = false,
  activeFilter = 'all',
  onFilterChange
}) => {
  const stats = [
    { label: 'Total Loans', value: totalLoans, filter: 'all' },
    { label: 'Active', value: activeLoans, filter: 'approved' },
    { label: 'Foreclosed', value: foreclosedLoans, filter: 'foreclosed' },
    { label: 'Pending', value: pendingLoans, filter: 'pending' }
  ];

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const isActive = activeFilter === stat.filter;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onFilterChange(stat.filter)}
            className={`p-4 rounded transition-all duration-200 text-left ${
              isActive
                ? 'bg-green-600 text-white shadow-lg transform scale-105'
                : 'bg-green-100 hover:bg-green-200 hover:shadow-md'
            }`}
          >
            <div className="font-medium">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </button>
        );
      })}
      <div className="p-4 bg-green-100 rounded flex items-center justify-center">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(AdminStatsCards);
