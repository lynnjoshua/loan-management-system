import React from 'react';
import { Info } from 'lucide-react';

const HelpSection = () => {
  return (
    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 text-sm">Need Help?</h4>
          <p className="text-blue-700 text-xs mt-1">
            Contact support at support@loanfriend.com or call 1800-900-9000
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HelpSection);
