import React from 'react';

const AlertBanner = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const typeStyles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  return (
    <div className={`p-3 text-center border ${typeStyles[type] || typeStyles.info}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 font-bold hover:opacity-70"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default React.memo(AlertBanner);
