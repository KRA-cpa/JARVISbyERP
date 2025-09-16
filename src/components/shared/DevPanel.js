import React, { useState } from 'react';
import DEV_CONFIG from '../../config/development';
import Icons from './Icons';

const DevPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (!DEV_CONFIG.SHOW_DEBUG_INFO) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Development Panel"
      >
        <Icons.Admin size={20} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Development Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.Close size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Environment Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Environment</h4>
              <div className="bg-gray-50 rounded p-2 text-xs">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-gray-600">NODE_ENV:</span>
                  <span className="font-mono">{process.env.NODE_ENV}</span>
                  <span className="text-gray-600">Auth:</span>
                  <span className={`font-mono ${DEV_CONFIG.DISABLE_AUTH ? 'text-red-600' : 'text-green-600'}`}>
                    {DEV_CONFIG.DISABLE_AUTH ? 'DISABLED' : 'ENABLED'}
                  </span>
                  <span className="text-gray-600">Mock Data:</span>
                  <span className={`font-mono ${DEV_CONFIG.USE_MOCK_DATA ? 'text-yellow-600' : 'text-green-600'}`}>
                    {DEV_CONFIG.USE_MOCK_DATA ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Configuration Status */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Configuration</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${DEV_CONFIG.DISABLE_AUTH ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span>Authentication: {DEV_CONFIG.DISABLE_AUTH ? 'Bypassed' : 'Active'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${DEV_CONFIG.ALLOW_DIRECT_ACCESS ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                  <span>Direct Access: {DEV_CONFIG.ALLOW_DIRECT_ACCESS ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${DEV_CONFIG.USE_MOCK_DATA ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span>API Data: {DEV_CONFIG.USE_MOCK_DATA ? 'Mock' : 'Real'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${DEV_CONFIG.SHOW_API_PANEL ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <span>API Panel: {DEV_CONFIG.SHOW_API_PANEL ? 'Shown' : 'Hidden'}</span>
                </div>
              </div>
            </div>

            {/* Stats Display Toggles */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Admin Stats</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_USER_COUNT ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_TICKET_COUNT ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Tickets</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_COMPANY_COUNT ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Companies</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_SYSTEM_HEALTH ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Health</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_MODULE_STATS ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Modules</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.STATS_DISPLAY.SHOW_BACKEND_INFO ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Backend</span>
                </div>
              </div>
            </div>

            {/* Dashboard Cards Toggles */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Dashboard Cards</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.DASHBOARD_CARDS.SHOW_MY_TICKETS ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>My Tickets</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.DASHBOARD_CARDS.SHOW_PENDING_APPROVAL ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.DASHBOARD_CARDS.SHOW_COMPLETED ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.DASHBOARD_CARDS.SHOW_OVERDUE ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Overdue</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${DEV_CONFIG.DASHBOARD_CARDS.SHOW_FOR_YOUR_APPROVAL ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>For Approval</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Quick Actions</h4>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200"
                >
                  Admin
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                >
                  Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                >
                  Reload
                </button>
              </div>
            </div>

            {/* Environment Variables Preview */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Environment Variables</h4>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                <div className="space-y-1">
                  <div>DISABLE_AUTH: {String(DEV_CONFIG.DISABLE_AUTH)}</div>
                  <div>ALLOW_DIRECT_ACCESS: {String(DEV_CONFIG.ALLOW_DIRECT_ACCESS)}</div>
                  <div>USE_MOCK_DATA: {String(DEV_CONFIG.USE_MOCK_DATA)}</div>
                  <div>SHOW_DEBUG: {String(DEV_CONFIG.SHOW_DEBUG_INFO)}</div>
                  <div>SHOW_API_PANEL: {String(DEV_CONFIG.SHOW_API_PANEL)}</div>
                </div>
              </div>
            </div>

            {/* Production Warning */}
            {(DEV_CONFIG.DISABLE_AUTH || DEV_CONFIG.ALLOW_DIRECT_ACCESS) && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-center space-x-1">
                  <Icons.Warning size={14} className="text-red-600" />
                  <span className="text-xs font-medium text-red-800">Development Mode</span>
                </div>
                <div className="text-xs text-red-700 mt-1 space-y-1">
                  {DEV_CONFIG.DISABLE_AUTH && (
                    <p>Authentication is disabled. Set REACT_APP_DISABLE_AUTH=false for production.</p>
                  )}
                  {DEV_CONFIG.ALLOW_DIRECT_ACCESS && (
                    <p>Direct access enabled. Set REACT_APP_ALLOW_DIRECT_ACCESS=false when auth is ready.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;