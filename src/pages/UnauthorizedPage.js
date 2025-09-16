import React from 'react';
import { Link } from 'react-router-dom';
import Icons from '../components/shared/Icons';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Icons.Warning size={32} className="text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Icons.Dashboard size={16} className="mr-2" />
            Go to Dashboard
          </Link>

          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <Icons.User size={16} className="mr-2" />
            Sign In Again
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need admin access? Contact your system administrator to request the appropriate permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;