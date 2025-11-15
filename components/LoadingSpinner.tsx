
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Generating Conversation...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment.</p>
    </div>
  );
};

export default LoadingSpinner;
