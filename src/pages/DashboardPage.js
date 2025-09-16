import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTickets, useCompanies, useTicketTypes } from '../hooks/useAPI';
import { useToast } from '../components/shared/Toast';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import { DetailedClock } from '../components/shared/LiveClock';
import DEV_CONFIG from '../config/development';

const DashboardPage = () => {
  const { user, userRoles, currentCompany, userCompanies, permissions, hasPermission } = useUser();
  const { data: tickets, loading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useTickets();
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { ToastContainer, success } = useToast();

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

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

  // Filter tickets based on current selections
  const filteredTickets = tickets?.filter(ticket => {
    const companyMatch = !selectedCompany || ticket.company_id === selectedCompany;
    const statusMatch = !selectedStatus || ticket.status === selectedStatus;
    const priorityMatch = !selectedPriority || ticket.priority === selectedPriority;

    return companyMatch && statusMatch && priorityMatch;
  }) || [];

  // Calculate real statistics from filtered tickets
  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length,
    pending: filteredTickets.filter(t => t.status === 'pending').length,
    overdue: filteredTickets.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && !['completed', 'closed'].includes(t.status);
    }).length,
    myTickets: filteredTickets.filter(t => t.assignee_email === user?.email || t.creator_email === user?.email).length,
    completed: filteredTickets.filter(t => ['completed', 'closed'].includes(t.status)).length,
    forApproval: hasPermission('canApproveTickets') ? filteredTickets.filter(t => t.status === 'pending').length : 0
  };

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(tickets?.map(t => t.status) || [])];
  const uniquePriorities = [...new Set(tickets?.map(t => t.priority) || [])];

  const handleQuickAction = (action, ticketId) => {
    success(`${action} action completed for ticket ${ticketId}`);
    refetchTickets();
  };

  const renderTicketRow = (ticket) => {
    const company = companies?.find(c => c.id === ticket.company_id);
    const ticketType = ticketTypes?.find(t => t.id === ticket.ticket_type_id);

    const getPriorityColor = (priority) => {
      switch (priority?.toLowerCase()) {
        case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'low': return 'text-green-600 bg-green-50 border-green-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'in_progress': return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'completed': return 'text-green-600 bg-green-50 border-green-200';
        case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    return (
      <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <Icons.Ticket size={20} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {ticket.ticket_number || `TICKET-${ticket.id}`}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {ticket.title || 'No title provided'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {company && (
                    <span className="text-xs text-gray-500">
                      {company.name}
                    </span>
                  )}
                  {ticketType && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {ticketType.name}
                      </span>
                    </>
                  )}
                  {ticket.due_date && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(ticket.due_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority || 'Normal'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
              {ticket.status || 'Open'}
            </span>

            {hasPermission('canApproveTickets') && ticket.status === 'pending' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleQuickAction('Approve', ticket.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                  title="Quick Approve"
                >
                  <Icons.Success size={16} />
                </button>
                <button
                  onClick={() => handleQuickAction('Reject', ticket.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  title="Quick Reject"
                >
                  <Icons.Close size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => window.alert(`View ticket details for ${ticket.id}`)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
              title="View Details"
            >
              <Icons.Edit size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />

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
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Ticket Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              {DEV_CONFIG.DASHBOARD_CARDS.SHOW_MY_TICKETS && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Tickets</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.myTickets}</p>
                    </div>
                    <Icons.Ticket size={32} className="text-blue-600" />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Assigned to or created by you
                  </div>
                </div>
              )}

              {DEV_CONFIG.DASHBOARD_CARDS.SHOW_PENDING_APPROVAL && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                    <Icons.Pending size={32} className="text-yellow-600" />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Awaiting approval
                  </div>
                </div>
              )}

              {DEV_CONFIG.DASHBOARD_CARDS.SHOW_COMPLETED && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                    </div>
                    <Icons.Success size={32} className="text-green-600" />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Successfully completed
                  </div>
                </div>
              )}

              {DEV_CONFIG.DASHBOARD_CARDS.SHOW_OVERDUE && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.overdue}</p>
                    </div>
                    <Icons.Overdue size={32} className="text-red-600" />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <span className="text-red-600">Needs attention</span>
                  </div>
                </div>
              )}

              {DEV_CONFIG.DASHBOARD_CARDS.SHOW_FOR_YOUR_APPROVAL && hasPermission('canApproveTickets') && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">For Your Approval</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.forApproval}</p>
                    </div>
                    <Icons.Approval size={32} className="text-purple-600" />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Requires your approval
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Companies</option>
                    {companies?.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Priorities</option>
                    {uniquePriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Normal'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedCompany('');
                      setSelectedStatus('');
                      setSelectedPriority('');
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {hasPermission('canCreateTickets') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                    <p className="text-gray-600">Common ticket operations</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => window.alert('Create New Ticket - Phase 6 Implementation')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Icons.Create size={16} />
                      <span>New Ticket</span>
                    </button>
                    {hasPermission('canViewReports') && (
                      <button
                        onClick={() => window.alert('View Reports - Future Phase')}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Icons.Dashboard size={16} />
                        <span>Reports</span>
                      </button>
                    )}
                    <button
                      onClick={() => refetchTickets()}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Icons.Loading size={16} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tickets ({filteredTickets.length})
                  </h3>
                  {filteredTickets.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Showing {filteredTickets.length} of {tickets?.length || 0} total tickets
                    </div>
                  )}
                </div>
              </div>

              {ticketsLoading ? (
                <div className="p-6 text-center">
                  <Icons.Loading size={32} className="mx-auto text-gray-400 animate-spin mb-4" />
                  <p className="text-gray-500">Loading tickets...</p>
                </div>
              ) : ticketsError ? (
                <div className="p-6 text-center">
                  <Icons.Warning size={32} className="mx-auto text-red-400 mb-4" />
                  <p className="text-red-600 mb-4">Failed to load tickets</p>
                  <button
                    onClick={refetchTickets}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredTickets.length > 0 ? (
                <div className="p-4 space-y-4">
                  {filteredTickets.slice(0, 10).map(renderTicketRow)}
                  {filteredTickets.length > 10 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => window.alert('View All Tickets - Full list implementation coming in Phase 6')}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        View All {filteredTickets.length} Tickets
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Icons.Ticket size={32} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">
                    {tickets?.length > 0 ? 'No tickets match your filters' : 'No tickets found'}
                  </p>
                  {hasPermission('canCreateTickets') && (
                    <button
                      onClick={() => window.alert('Create First Ticket - Implementation in progress')}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      Create First Ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;