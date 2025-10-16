import React from 'react';

const TabNavigation = ({ tabs = [], activeTab, onTabChange }) => {
  if (!tabs.length) return null;

  return (
    <div className="px-6 border-b border-green-200 flex space-x-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-2 transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-green-600 font-semibold'
              : 'hover:text-green-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default React.memo(TabNavigation);
