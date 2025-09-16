import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useCompanies, useRoles, useDropdownLists } from '../hooks/useAPI';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import DEV_CONFIG from '../config/development';
import AdminCompanyManager from '../components/admin/AdminCompanyManager';
import AdminRoleManager from '../components/admin/AdminRoleManager';
import AdminDropdownManager from '../components/admin/AdminDropdownManager';

const AdminPage = () => {
  const { user, userRoles } = useUser();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real data from API
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { data: roles, loading: rolesLoading } = useRoles();
  const { data: dropdownLists, loading: dropdownsLoading } = useDropdownLists();

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
      description: 'Configure ticket types (Coming Soon)',
      disabled: true
    },
    {
      id: 'custom-fields',
      name: 'Custom Fields',
      icon: Icons.Edit,
      description: 'Build dynamic form fields (Coming Soon)',
      disabled: true
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
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-3xl font-bold text-green-600">99%</p>
                  </div>
                  <Icons.Success size={32} className="text-green-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  All systems operational
                </div>
              </div>
            )}
          </div>

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

            {/* Tab Description */}
            <div className="px-6 py-3 bg-gray-50">
              <p className="text-sm text-gray-600">
                {adminTabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg p-6">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
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