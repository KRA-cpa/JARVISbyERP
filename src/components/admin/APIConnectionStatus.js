import React, { useState, useEffect } from 'react';
import { getAPIHealthStatus, apiConfig, extractDeploymentId } from '../../config/apiConfig';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const APIConnectionStatus = () => {
  const { success, error: showError } = useToast();
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking',
    message: 'Checking API connection...',
    details: {}
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnection();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const status = await getAPIHealthStatus();
      setConnectionStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: `Failed to check API status: ${error.message}`,
        details: { error: error.message }
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualCheck = async () => {
    await checkConnection();
    if (connectionStatus.status === 'healthy') {
      success('API connection verified successfully');
    } else {
      showError('API connection failed - check configuration');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'healthy': return 'green';
      case 'unhealthy': return 'red';
      case 'checking': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'healthy': return Icons.Success;
      case 'unhealthy': return Icons.Error;
      case 'checking': return Icons.Clock;
      default: return Icons.Warning;
    }
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Google Sheets API Connection
        </h3>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {isChecking && (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>Check Now</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className={`border rounded-lg p-4 mb-4 bg-${statusColor}-50 border-${statusColor}-200`}>
        <div className="flex items-center space-x-3">
          <StatusIcon
            size={24}
            className={`text-${statusColor}-600 ${connectionStatus.status === 'checking' ? 'animate-spin' : ''}`}
          />
          <div className="flex-1">
            <div className={`font-medium text-${statusColor}-900`}>
              {connectionStatus.status === 'healthy' ? 'Connected' :
               connectionStatus.status === 'unhealthy' ? 'Disconnected' :
               connectionStatus.status === 'checking' ? 'Checking...' : 'Unknown'}
            </div>
            <div className={`text-sm text-${statusColor}-700`}>
              {connectionStatus.message}
            </div>
            {lastChecked && (
              <div className={`text-xs text-${statusColor}-600 mt-1`}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Details Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          {showDetails ? (
            <Icons.ChevronUp size={16} />
          ) : (
            <Icons.ChevronDown size={16} />
          )}
        </button>
      </div>

      {/* Collapsible Configuration & Connection Details */}
      {showDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Environment:</span>
                <span className="font-mono text-gray-900">
                  {process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Deployment ID:</span>
                <span className="font-mono text-gray-900 text-xs">
                  {extractDeploymentId(apiConfig.baseURL)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Timeout:</span>
                <span className="font-mono text-gray-900">
                  {apiConfig.timeout}ms
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Mock Mode:</span>
                <span className={`font-mono ${apiConfig.mockMode ? 'text-yellow-600' : 'text-green-600'}`}>
                  {apiConfig.mockMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          {connectionStatus.details && Object.keys(connectionStatus.details).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Details</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {connectionStatus.details.responseTime && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-mono text-gray-900">
                      {connectionStatus.details.responseTime}ms
                    </span>
                  </div>
                )}
                {connectionStatus.details.serverTime && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Server Time:</span>
                    <span className="font-mono text-gray-900 text-xs">
                      {new Date(connectionStatus.details.serverTime).toLocaleString()}
                    </span>
                  </div>
                )}
                {connectionStatus.details.version && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">API Version:</span>
                    <span className="font-mono text-gray-900">
                      {connectionStatus.details.version}
                    </span>
                  </div>
                )}
                {connectionStatus.details.error && (
                  <div className="text-sm">
                    <span className="text-gray-600">Error:</span>
                    <div className="font-mono text-red-600 text-xs mt-1 p-2 bg-red-50 rounded border">
                      {connectionStatus.details.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

        {/* Troubleshooting */}
        {connectionStatus.status === 'unhealthy' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Icons.Warning size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-900">Troubleshooting</h5>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Verify the Google Apps Script deployment URL is correct</li>
                  <li>• Check that the script is deployed as a web app with proper permissions</li>
                  <li>• Ensure CORS is configured in the Apps Script project</li>
                  <li>• Verify environment variables are set correctly</li>
                  <li>• Check network connectivity and firewall settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Mock Mode Warning */}
        {apiConfig.mockMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Icons.Warning size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-900">Mock Mode Active</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  The application is currently using mock data instead of the live Google Sheets API.
                  Disable mock mode in the API configuration to use real data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIConnectionStatus;