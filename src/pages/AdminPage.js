import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useCompanies, useRoles, useDropdownLists } from '../hooks/useAPI';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import DEV_CONFIG from '../config/development';
import AdminCompanyManager from '../components/admin/AdminCompanyManager';
import AdminRoleManager from '../components/admin/AdminRoleManager';
import AdminDropdownManager from '../components/admin/AdminDropdownManager';
import AdminTicketTypeList from '../components/admin/AdminTicketTypeList';
import AdminCustomFieldList from '../components/admin/AdminCustomFieldList';
import APIConnectionStatus from '../components/admin/APIConnectionStatus';

const AdminPage = () => {
  const { user, userRoles } = useUser();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real data from API with manual refresh capability
  const { data: companies, loading: companiesLoading, error: companiesError, refetch: refetchCompanies } = useCompanies();
  const { data: roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { data: dropdownLists, loading: dropdownsLoading, error: dropdownsError, refetch: refetchDropdowns } = useDropdownLists();

  // Manual refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refetchCompanies(),
        refetchRoles(),
        refetchDropdowns()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // Determine API health status
  const getAPIHealthStatus = () => {
    const errors = [companiesError, rolesError, dropdownsError].filter(Boolean);
    const loading = companiesLoading || rolesLoading || dropdownsLoading;

    if (errors.length > 0) {
      // Analyze error types
      const hasNetworkError = errors.some(err => err.includes('net::ERR_FAILED') || err.includes('Failed to fetch'));
      const hasCORSError = errors.some(err => err.includes('CORS') || err.includes('blocked by CORS policy'));
      const hasTimeoutError = errors.some(err => err.includes('timeout') || err.includes('AbortError'));
      const hasServerError = errors.some(err => err.includes('500') || err.includes('502') || err.includes('503'));

      if (hasNetworkError) {
        return {
          status: 'error',
          type: 'NETWORK_ERROR',
          code: 'NET_001',
          message: 'Network connection failed',
          details: 'Cannot connect to Google Apps Script API',
          solution: 'Check deployment status and network connection'
        };
      }

      if (hasCORSError) {
        return {
          status: 'error',
          type: 'CORS_ERROR',
          code: 'CORS_001',
          message: 'Cross-Origin Request Blocked',
          details: 'CORS policy preventing API access',
          solution: 'Update Google Apps Script CORS configuration'
        };
      }

      if (hasTimeoutError) {
        return {
          status: 'error',
          type: 'TIMEOUT_ERROR',
          code: 'API_002',
          message: 'API Request Timeout',
          details: 'Google Apps Script not responding within timeout',
          solution: 'Check Apps Script execution logs and performance'
        };
      }

      if (hasServerError) {
        return {
          status: 'error',
          type: 'SERVER_ERROR',
          code: 'API_003',
          message: 'Server Error',
          details: 'Google Apps Script internal error',
          solution: 'Check Apps Script logs and deployment status'
        };
      }

      return {
        status: 'error',
        type: 'UNKNOWN_ERROR',
        code: 'API_999',
        message: 'Unknown API Error',
        details: errors[0],
        solution: 'Check browser console and Apps Script logs'
      };
    }

    if (loading) {
      return {
        status: 'loading',
        message: 'Loading data...'
      };
    }

    return {
      status: 'healthy',
      message: 'All systems operational'
    };
  };

  const apiHealth = getAPIHealthStatus();

  // Mock notifications
  const mockNotifications = [
    {
      type: 'info',
      title: 'System maintenance scheduled',
      message: 'System maintenance scheduled for Sunday 2:00 AM PHT',
      timestamp: '1 hour ago',
      read: false
    }
  ];

  // Admin tabs configuration
  const adminTabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Icons.Dashboard,
      description: 'System overview and statistics'
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: Icons.Company,
      description: 'Manage company configurations',
      component: AdminCompanyManager
    },
    {
      id: 'roles',
      name: 'Roles',
      icon: Icons.Role,
      description: 'Define user roles and permissions',
      component: AdminRoleManager
    },
    {
      id: 'dropdown-lists',
      name: 'Dropdown Lists',
      icon: Icons.ChevronDown,
      description: 'Manage dropdown options',
      component: AdminDropdownManager
    },
    {
      id: 'ticket-types',
      name: 'Ticket Types',
      icon: Icons.Workflow,
      description: 'Configure ticket types and transaction IDs',
      component: AdminTicketTypeList
    },
    {
      id: 'custom-fields',
      name: 'Custom Fields',
      icon: Icons.Edit,
      description: 'Build dynamic form fields for ticket types',
      component: AdminCustomFieldList
    }
  ];

  // Generate admin modules with real data
  const getModuleStats = (moduleId) => {
    switch (moduleId) {
      case 'companies':
        if (companiesLoading) return 'Loading...';
        return `${companies?.length || 0} companies`;
      case 'roles':
        if (rolesLoading) return 'Loading...';
        return `${roles?.length || 0} roles`;
      case 'dropdown-lists':
        if (dropdownsLoading) return 'Loading...';
        return `${dropdownLists?.length || 0} lists`;
      case 'ticket-types':
        return 'Phase 8.5 - Available';
      case 'custom-fields':
        return 'Phase 8.5 - Available';
      default:
        return 'Coming Soon';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header
        user={user}
        userRole={userRoles?.[0]?.name?.toLowerCase() || 'admin'}
        notifications={mockNotifications}
      />

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Header */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <Icons.Admin size={48} className="text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-gray-600">
                    System configuration and management
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Logged in as: {user?.email}</span>
                    <span>•</span>
                    <span>Admin Role: {userRoles?.[0]?.name || 'System Admin'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Stats - with toggles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {DEV_CONFIG.STATS_DISPLAY.SHOW_USER_COUNT && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">24</p>
                  </div>
                  <Icons.User size={32} className="text-blue-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-green-600">+3</span> this month
                </div>
              </div>
            )}

            {DEV_CONFIG.STATS_DISPLAY.SHOW_TICKET_COUNT && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">87</p>
                  </div>
                  <Icons.Ticket size={32} className="text-green-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-yellow-600">12</span> pending
                </div>
              </div>
            )}

            {DEV_CONFIG.STATS_DISPLAY.SHOW_COMPANY_COUNT && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Companies</p>
                    <p className="text-3xl font-bold text-gray-900">{companies?.length || 3}</p>
                  </div>
                  <Icons.Company size={32} className="text-purple-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Multi-tenant setup
                </div>
              </div>
            )}

            {DEV_CONFIG.STATS_DISPLAY.SHOW_SYSTEM_HEALTH && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Health</p>
                    <div className="flex items-center space-x-2">
                      <p className={`text-3xl font-bold ${
                        apiHealth.status === 'healthy' ? 'text-green-600' :
                        apiHealth.status === 'loading' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {apiHealth.status === 'healthy' ? '✓' :
                         apiHealth.status === 'loading' ? '⟳' : '✗'}
                      </p>
                      {apiHealth.code && (
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {apiHealth.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {apiHealth.status === 'healthy' && <Icons.Success size={32} className="text-green-600" />}
                    {apiHealth.status === 'loading' && <Icons.Loading size={32} className="text-yellow-600" />}
                    {apiHealth.status === 'error' && <Icons.Error size={32} className="text-red-600" />}
                    <button
                      onClick={refreshAllData}
                      disabled={apiHealth.status === 'loading'}
                      className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      title="Refresh all data"
                    >
                      <Icons.Refresh size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">{apiHealth.message}</p>
                  {apiHealth.status === 'error' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-800">{apiHealth.details}</p>
                      <p className="text-xs text-red-600 mt-1">💡 {apiHealth.solution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* API Error Banner */}
          {apiHealth.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Icons.Error size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Apps Script API Error ({apiHealth.code})
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p><strong>{apiHealth.type}:</strong> {apiHealth.message}</p>
                    <p className="mt-1"><strong>Details:</strong> {apiHealth.details}</p>
                    <p className="mt-1"><strong>Solution:</strong> {apiHealth.solution}</p>
                  </div>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={refreshAllData}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Icons.Refresh size={14} className="mr-1" />
                      Retry Connection
                    </button>
                    <a
                      href="https://script.google.com/home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Icons.ExternalLink size={14} className="mr-1" />
                      Check Apps Script
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Navigation Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap gap-2 sm:space-x-8 sm:gap-0 px-4 sm:px-6" aria-label="Tabs">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    className={`py-3 px-2 sm:py-4 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    disabled={tab.disabled}
                  >
                    <tab.icon size={16} />
                    <span>{tab.name}</span>
                    {tab.disabled && (
                      <Icons.Clock size={14} className="text-gray-400" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Description with Refresh Controls */}
            <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {adminTabs.find(tab => tab.id === activeTab)?.description}
              </p>

              {/* Refresh Controls for Data Tabs */}
              <div className="flex items-center space-x-2">
                {activeTab === 'companies' && (
                  <button
                    onClick={refetchCompanies}
                    disabled={companiesLoading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh companies data"
                  >
                    <Icons.Refresh size={12} className={`mr-1 ${companiesLoading ? 'animate-spin' : ''}`} />
                    Refresh Companies
                  </button>
                )}

                {activeTab === 'roles' && (
                  <button
                    onClick={refetchRoles}
                    disabled={rolesLoading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh roles data"
                  >
                    <Icons.Refresh size={12} className={`mr-1 ${rolesLoading ? 'animate-spin' : ''}`} />
                    Refresh Roles
                  </button>
                )}

                {activeTab === 'dropdowns' && (
                  <button
                    onClick={refetchDropdowns}
                    disabled={dropdownsLoading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh dropdown data"
                  >
                    <Icons.Refresh size={12} className={`mr-1 ${dropdownsLoading ? 'animate-spin' : ''}`} />
                    Refresh Dropdowns
                  </button>
                )}

                {/* Universal refresh for overview */}
                {activeTab === 'overview' && (
                  <button
                    onClick={refreshAllData}
                    disabled={companiesLoading || rolesLoading || dropdownsLoading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh all data"
                  >
                    <Icons.Refresh size={12} className={`mr-1 ${(companiesLoading || rolesLoading || dropdownsLoading) ? 'animate-spin' : ''}`} />
                    Refresh All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg p-6">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* API Connection Status */}
                <APIConnectionStatus />

                {/* Admin Stats - with toggle */}
                {DEV_CONFIG.STATS_DISPLAY.SHOW_MODULE_STATS && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {adminTabs.filter(tab => tab.component).map((tab) => (
                      <div
                        key={tab.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <tab.icon size={24} className="text-blue-600" />
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {tab.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">
                                {tab.description}
                              </p>
                            </div>
                          </div>
                          <Icons.ChevronRight size={20} className="text-gray-400" />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {getModuleStats(tab.id)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Coming Soon Modules */}
                    {adminTabs.filter(tab => tab.disabled).map((tab) => (
                      <div key={tab.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 opacity-60">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <tab.icon size={24} className="text-gray-400" />
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {tab.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">
                                {tab.description}
                              </p>
                            </div>
                          </div>
                          <Icons.Clock size={20} className="text-gray-400" />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm text-gray-500">Coming Soon</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Phase 6+
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const activeTabConfig = adminTabs.find(tab => tab.id === activeTab);
                const Component = activeTabConfig?.component;
                return Component ? <Component /> : (
                  <div className="text-center py-12">
                    <Icons.Clock size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">This feature will be available in a future update.</p>
                  </div>
                );
              })()
            )}
          </div>

          {/* Backend Integration Status - with toggle */}
          {DEV_CONFIG.STATS_DISPLAY.SHOW_BACKEND_INFO && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Icons.Info size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    Backend Integration Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-700">✅ Available APIs:</p>
                      <ul className="mt-2 space-y-1 text-blue-600">
                        <li>• Companies CRUD</li>
                        <li>• Roles CRUD</li>
                        <li>• Dropdown Lists CRUD</li>
                        <li>• User Login Logging</li>
                        <li>• Ticket Creation</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">🚧 Implementation Status:</p>
                      <ul className="mt-2 space-y-1 text-blue-600">
                        <li>• Google Apps Script: Production Ready</li>
                        <li>• Frontend Integration: Phase 4</li>
                        <li>• UI Components: Phase 5</li>
                        <li>• Testing: Phase 9</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;