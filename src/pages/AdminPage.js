import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useCompanies, useRoles, useDropdownLists } from '../hooks/useAPI';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import APITestPanel from '../components/shared/APITestPanel';

const AdminPage = () => {
  const { user, userRoles, permissions } = useUser();

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

  const adminModules = [
    {
      id: 'companies',
      name: 'Companies',
      description: 'Manage company configurations and multi-tenant setup',
      icon: Icons.Company,
      available: true,
      stats: getModuleStats('companies')
    },
    {
      id: 'roles',
      name: 'Roles',
      description: 'Define user roles and permissions system',
      icon: Icons.Role,
      available: true,
      stats: getModuleStats('roles')
    },
    {
      id: 'ticket-types',
      name: 'Ticket Types',
      description: 'Configure ticket types and workflow definitions',
      icon: Icons.Workflow,
      available: false,
      stats: 'Coming in Phase 5'
    },
    {
      id: 'custom-fields',
      name: 'Custom Fields',
      description: 'Build dynamic form fields and validation rules',
      icon: Icons.Edit,
      available: false,
      stats: 'Coming in Phase 5'
    },
    {
      id: 'dropdown-lists',
      name: 'Dropdown Lists',
      description: 'Manage dropdown options and hierarchical data',
      icon: Icons.ChevronDown,
      available: true,
      stats: getModuleStats('dropdown-lists')
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Configure report layouts and data visualization',
      icon: Icons.View,
      available: false,
      stats: 'Coming in Phase 8'
    }
  ];

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

          {/* Admin Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Companies</p>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                </div>
                <Icons.Company size={32} className="text-purple-600" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Multi-tenant setup
              </div>
            </div>

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
          </div>

          {/* Admin Modules Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminModules.map((module) => (
              <div key={module.id} className={`bg-white shadow rounded-lg p-6 transition-all duration-200 ${
                module.available
                  ? 'hover:shadow-lg cursor-pointer border-l-4 border-l-blue-500'
                  : 'opacity-60 cursor-not-allowed border-l-4 border-l-gray-300'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <module.icon size={24} className={module.available ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {module.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  {module.available ? (
                    <Icons.ChevronRight size={20} className="text-gray-400" />
                  ) : (
                    <Icons.Clock size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {module.stats}
                  </span>
                  {module.available ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Backend Integration Status */}
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
        </div>
      </div>
    </div>
  );
};

export default AdminPage;