import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTickets, useCompanies, useTicketTypes, useSLAStatus } from '../../hooks/useAPI';
import { useToast } from '../shared/Toast';
import { useConfirmation, useInformation } from '../shared/ConfirmationModal';
import Icons from '../shared/Icons';

const TicketDashboard = () => {
  const { user, hasPermission } = useUser();
  const { data: tickets, loading, error, refetch } = useTickets();
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { ToastContainer, success, error: showError } = useToast();

  // Modal hooks
  const { confirm, ConfirmationModal } = useConfirmation();
  const { showInfo, InformationModal } = useInformation();

  const [filters, setFilters] = useState({
    search: '',
    company: '',
    status: '',
    priority: '',
    assignee: '',
    creator: '',
    dateRange: 'all',
    slaStatus: 'all' // New SLA filter
  });

  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // list, grid, kanban
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort tickets
  const filteredTickets = tickets?.filter(ticket => {
    const searchMatch = !filters.search ||
      ticket.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.ticket_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(filters.search.toLowerCase());

    const companyMatch = !filters.company || ticket.company_id === filters.company;
    const statusMatch = !filters.status || ticket.status === filters.status;
    const priorityMatch = !filters.priority || ticket.priority === filters.priority;
    const assigneeMatch = !filters.assignee || ticket.assignee_email === filters.assignee;
    const creatorMatch = !filters.creator || ticket.creator_email === filters.creator;

    const dateMatch = (() => {
      if (filters.dateRange === 'all') return true;
      if (!ticket.created_date) return false;

      const ticketDate = new Date(ticket.created_date);
      const now = new Date();

      switch (filters.dateRange) {
        case 'today': return ticketDate.toDateString() === now.toDateString();
        case 'week': return (now - ticketDate) <= 7 * 24 * 60 * 60 * 1000;
        case 'month': return (now - ticketDate) <= 30 * 24 * 60 * 60 * 1000;
        default: return true;
      }
    })();

    // SLA Status filtering
    const slaMatch = (() => {
      if (filters.slaStatus === 'all') return true;
      if (!ticket.step_due_date && filters.slaStatus === 'no_sla') return true;
      if (!ticket.step_due_date && filters.slaStatus !== 'no_sla') return false;

      // Calculate SLA status for filtering (simplified)
      const now = new Date();
      const dueDate = new Date(ticket.step_due_date);
      const isOverdue = now > dueDate;
      const isDueToday = dueDate.toDateString() === now.toDateString();

      switch (filters.slaStatus) {
        case 'overdue': return isOverdue;
        case 'due_today': return isDueToday && !isOverdue;
        case 'on_time': return !isDueToday && !isOverdue;
        case 'no_sla': return false; // Already handled above
        default: return true;
      }
    })();

    return searchMatch && companyMatch && statusMatch && priorityMatch && assigneeMatch && creatorMatch && dateMatch && slaMatch;
  }) || [];

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date sorting
    if (sortBy.includes('date')) {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTickets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + pageSize);

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(tickets?.map(t => t.status).filter(Boolean) || [])];
  const uniquePriorities = [...new Set(tickets?.map(t => t.priority).filter(Boolean) || [])];
  const uniqueAssignees = [...new Set(tickets?.map(t => t.assignee_email).filter(Boolean) || [])];
  const uniqueCreators = [...new Set(tickets?.map(t => t.creator_email).filter(Boolean) || [])];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      company: '',
      status: '',
      priority: '',
      assignee: '',
      creator: '',
      dateRange: 'all'
    });
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleTicketSelect = (ticketId, selected) => {
    setSelectedTickets(prev =>
      selected
        ? [...prev, ticketId]
        : prev.filter(id => id !== ticketId)
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedTickets.length === 0) {
      showError('No tickets selected');
      return;
    }

    if (!hasPermission('canApproveTickets')) {
      showError('Insufficient permissions for bulk actions');
      return;
    }

    const confirmed = await confirm({
      title: `${action} Tickets`,
      message: `Are you sure you want to ${action.toLowerCase()} ${selectedTickets.length} selected ticket${selectedTickets.length !== 1 ? 's' : ''}?`,
      type: action === 'Delete' ? 'error' : 'warning',
      confirmText: action,
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      // Simulate bulk action API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success(`${action} completed for ${selectedTickets.length} tickets`);
      setSelectedTickets([]);
      refetch();
    } catch (error) {
      showError(`Failed to ${action.toLowerCase()} tickets`);
    }
  };

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

  // SLA Status Component for individual tickets
  const SLAStatusBadge = ({ ticketId, stepDueDate }) => {
    const [slaStatus, setSlaStatus] = useState(null);

    useEffect(() => {
      if (stepDueDate) {
        // Calculate SLA status client-side for performance
        import('../../utils/slaCalculator').then(({ getSLAStatus }) => {
          const status = getSLAStatus(stepDueDate);
          setSlaStatus(status);
        });
      }
    }, [stepDueDate]);

    if (!slaStatus) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No SLA
        </span>
      );
    }

    const colorMap = {
      gray: 'bg-gray-100 text-gray-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };

    const iconMap = {
      no_sla: Icons.Clock,
      on_time: Icons.Success,
      due_today: Icons.Urgent,
      overdue: Icons.Warning
    };

    const StatusIcon = iconMap[slaStatus.type] || Icons.Clock;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[slaStatus.color]}`}>
        <StatusIcon size={12} className="mr-1" />
        {slaStatus.label}
      </span>
    );
  };

  const renderTicketRow = (ticket) => {
    const company = companies?.find(c => c.id === ticket.company_id);
    const ticketType = ticketTypes?.find(t => t.id === ticket.ticket_type_id);
    const isSelected = selectedTickets.includes(ticket.id);

    return (
      <div key={ticket.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}>
        <div className="flex items-start space-x-3">
          {hasPermission('canApproveTickets') && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleTicketSelect(ticket.id, e.target.checked)}
              className="mt-1 rounded border-gray-300 focus:ring-blue-500"
            />
          )}

          <Icons.Ticket size={20} className="text-gray-400 flex-shrink-0 mt-1" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {ticket.ticket_number || `TICKET-${ticket.id}`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {ticket.title || 'No title provided'}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                  {company && <span>{company.name}</span>}
                  {ticketType && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{ticketType.name}</span>
                    </>
                  )}
                  {ticket.creator_email && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>Created by {ticket.creator_email}</span>
                    </>
                  )}
                  {ticket.created_date && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{new Date(ticket.created_date).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority || 'Normal'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                  {ticket.status || 'Open'}
                </span>
                <SLAStatusBadge ticketId={ticket.id} stepDueDate={ticket.step_due_date} />

                <button
                  onClick={() => showInfo({
                    title: 'Ticket Details',
                    message: `Viewing details for ticket ${ticket.ticket_number || ticket.id}. Full ticket detail modal will be implemented in the next phase.`,
                    type: 'info'
                  })}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                  title="View Details"
                >
                  <Icons.Edit size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <ConfirmationModal />
      <InformationModal />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ticket Dashboard</h2>
            <p className="text-gray-600">Advanced ticket management and filtering</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <Icons.List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <Icons.Dashboard size={16} />
            </button>
            {hasPermission('canCreateTickets') && (
              <button
                onClick={() => showInfo({
                  title: 'Create New Ticket',
                  message: 'Ticket creation functionality will be implemented in Phase 6. This will include a comprehensive form builder with custom fields.',
                  type: 'info'
                })}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Icons.Create size={20} />
                <span>Create New Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Icons.Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:col-span-3">
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                {uniquePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Assignees</option>
              {uniqueAssignees.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>

            <select
              value={filters.creator}
              onChange={(e) => handleFilterChange('creator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Creators</option>
              {uniqueCreators.map((creator) => (
                <option key={creator} value={creator}>
                  {creator}
                </option>
              ))}
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              value={filters.slaStatus}
              onChange={(e) => handleFilterChange('slaStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Filter by SLA status"
            >
              <option value="all">All SLA Status</option>
              <option value="overdue">🔴 Overdue</option>
              <option value="due_today">🟡 Due Today</option>
              <option value="on_time">🟢 On Time</option>
              <option value="no_sla">⚫ No SLA</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {hasPermission('canApproveTickets') && selectedTickets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  {selectedTickets.length} tickets selected
                </h3>
                <p className="text-sm text-blue-700">Choose a bulk action to apply</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('Approve')}
                  className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded"
                >
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('Reject')}
                  className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                >
                  Reject All
                </button>
                <button
                  onClick={() => handleBulkAction('Assign')}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded"
                >
                  Bulk Assign
                </button>
                <button
                  onClick={() => setSelectedTickets([])}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_date">Created Date</option>
                <option value="updated_date">Updated Date</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="title">Title</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                {sortOrder === 'asc' ? (
                  <Icons.ChevronUp size={14} />
                ) : (
                  <Icons.ChevronDown size={14} />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {sortedTickets.length} tickets found
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <Icons.Warning size={32} className="mx-auto text-red-400 mb-4" />
              <p className="text-red-600 mb-4">Failed to load tickets</p>
              <button
                onClick={refetch}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : paginatedTickets.length > 0 ? (
            <div className="p-4 space-y-4">
              {paginatedTickets.map(renderTicketRow)}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Icons.Ticket size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No tickets match your filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedTickets.length)} of {sortedTickets.length} tickets
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TicketDashboard;