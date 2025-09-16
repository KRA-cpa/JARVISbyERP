import React from 'react';
import { useUser } from '../contexts/UserContext';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import { DetailedClock } from '../components/shared/LiveClock';
import DEV_CONFIG from '../config/development';

const DashboardPage = () => {
  const { user, userRoles, currentCompany, userCompanies, permissions } = useUser();

  // Mock notifications for demo
  const mockNotifications = [
    {
      type: 'approval',
      title: 'Ticket requires your approval',
      message: 'Purchase Request #MAIN-PR-2025-00000001 needs approval',
      timestamp: '2 minutes ago',
      read: false
    },
    {
      type: 'overdue',
      title: 'SLA overdue warning',
      message: 'Equipment Request #TECH-EQ-2025-00000003 is overdue',
      timestamp: '15 minutes ago',
      read: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header
        user={user}
        userRole={userRoles?.[0]?.name?.toLowerCase() || 'user'}
        notifications={mockNotifications}
      />

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
                  </h1>
                  <p className="mt-2 text-gray-600">
                    {currentCompany ? `Current Company: ${currentCompany.name}` : 'Multi-tenant Dashboard'}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Role: {userRoles?.[0]?.name || 'User'}</span>
                    <span>•</span>
                    <span>Companies: {userCompanies?.length || 0}</span>
                    <span>•</span>
                    <span>{permissions.canAccessAdmin ? 'Admin Access' : 'User Access'}</span>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <DetailedClock />
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {DEV_CONFIG.DASHBOARD_CARDS.SHOW_MY_TICKETS && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                  </div>
                  <Icons.Ticket size={32} className="text-blue-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-green-600">+2</span> from last week
                </div>
              </div>
            )}

            {DEV_CONFIG.DASHBOARD_CARDS.SHOW_PENDING_APPROVAL && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-3xl font-bold text-gray-900">5</p>
                  </div>
                  <Icons.Pending size={32} className="text-yellow-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-yellow-600">3</span> due today
                </div>
              </div>
            )}

            {DEV_CONFIG.DASHBOARD_CARDS.SHOW_COMPLETED && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">28</p>
                  </div>
                  <Icons.Success size={32} className="text-green-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  This month
                </div>
              </div>
            )}

            {DEV_CONFIG.DASHBOARD_CARDS.SHOW_OVERDUE && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-3xl font-bold text-gray-900">2</p>
                  </div>
                  <Icons.Overdue size={32} className="text-red-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-red-600">Needs attention</span>
                </div>
              </div>
            )}

            {DEV_CONFIG.DASHBOARD_CARDS.SHOW_FOR_YOUR_APPROVAL && permissions.canApproveTickets && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">For Your Approval</p>
                    <p className="text-3xl font-bold text-gray-900">7</p>
                  </div>
                  <Icons.Approval size={32} className="text-purple-600" />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-purple-600">3</span> urgent
                </div>
              </div>
            )}
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Tickets */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Recent Tickets
                    </h2>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center py-8">
                    <Icons.Ticket size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">
                      Ticket management interface will be implemented in Phase 6.
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      This will show your recent tickets, status updates, and actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Create New Ticket */}
              {permissions.canCreateTickets && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                      <Icons.Create size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        Create New Ticket
                      </span>
                    </button>

                    {permissions.canAccessAdmin && (
                      <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <Icons.Admin size={20} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Admin Panel
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* System Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backend API</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Google Sheets DB</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Firebase Auth</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
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

export default DashboardPage;