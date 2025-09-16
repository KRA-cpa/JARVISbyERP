import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useCompanies, useTicketTypes, useUsers } from '../../hooks/useAPI';
import { useToast } from '../shared/Toast';
import WorkflowStep from './WorkflowStep';
import Icons from '../shared/Icons';

const TicketDetail = ({ ticket, onClose, onUpdate, onStatusChange }) => {
  const { user, hasPermission } = useUser();
  const { data: companies } = useCompanies();
  const { data: ticketTypes } = useTicketTypes();
  const { data: users } = useUsers();
  const { ToastContainer, success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [workflowAction, setWorkflowAction] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // Mock data - in real app, this would come from API
  const [comments] = useState([
    {
      id: 1,
      user_email: 'john.doe@company.com',
      comment: 'Initial ticket creation',
      created_date: '2025-01-15T10:00:00Z',
      type: 'comment'
    },
    {
      id: 2,
      user_email: 'manager@company.com',
      comment: 'Ticket assigned to technical team',
      created_date: '2025-01-15T11:30:00Z',
      type: 'status_change',
      old_status: 'open',
      new_status: 'in_progress'
    }
  ]);

  const [history] = useState([
    {
      id: 1,
      action: 'created',
      user_email: 'john.doe@company.com',
      timestamp: '2025-01-15T10:00:00Z',
      details: 'Ticket created'
    },
    {
      id: 2,
      action: 'status_change',
      user_email: 'manager@company.com',
      timestamp: '2025-01-15T11:30:00Z',
      details: 'Status changed from Open to In Progress'
    }
  ]);

  if (!ticket) return null;

  const company = companies?.find(c => c.id === ticket.company_id);
  const ticketType = ticketTypes?.find(t => t.id === ticket.ticket_type_id);
  const creator = users?.find(u => u.email === ticket.creator_email);
  const assignee = users?.find(u => u.email === ticket.assignee_email);

  const canEdit = hasPermission('canApproveTickets') || ticket.creator_email === user?.email;
  const canApprove = hasPermission('canApproveTickets') && ticket.status === 'pending';
  const canAssign = hasPermission('canApproveTickets');

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

  const getAvailableActions = () => {
    const actions = [];

    switch (ticket.status?.toLowerCase()) {
      case 'open':
        if (canAssign) {
          actions.push({ value: 'start', label: 'Start Work', color: 'blue' });
          actions.push({ value: 'assign', label: 'Assign', color: 'purple' });
        }
        break;
      case 'in_progress':
        actions.push({ value: 'complete', label: 'Mark Complete', color: 'green' });
        if (canAssign) {
          actions.push({ value: 'pause', label: 'Pause', color: 'yellow' });
        }
        break;
      case 'pending':
        if (canApprove) {
          actions.push({ value: 'approve', label: 'Approve', color: 'green' });
          actions.push({ value: 'reject', label: 'Reject', color: 'red' });
        }
        break;
      case 'completed':
        if (canApprove) {
          actions.push({ value: 'close', label: 'Close Ticket', color: 'gray' });
          actions.push({ value: 'reopen', label: 'Reopen', color: 'blue' });
        }
        break;
    }

    if (canAssign && !['closed'].includes(ticket.status?.toLowerCase())) {
      actions.push({ value: 'reassign', label: 'Reassign', color: 'purple' });
    }

    return actions;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      success('Comment added successfully');
      setNewComment('');
      // In real app, would refresh comments from API
    } catch (error) {
      showError('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleWorkflowAction = async (e) => {
    e.preventDefault();
    if (!workflowAction) return;

    setIsPerformingAction(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        start: 'started',
        complete: 'completed',
        pause: 'paused',
        close: 'closed',
        reopen: 'reopened',
        assign: 'assigned',
        reassign: 'reassigned'
      };

      success(`Ticket ${actionLabels[workflowAction]} successfully`);
      setWorkflowAction('');
      setActionComment('');
      onStatusChange?.(workflowAction);
    } catch (error) {
      showError('Failed to perform action');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Ticket Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <p className="text-gray-900">{ticket.title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Company</label>
            <p className="text-gray-900">{company?.name || 'Unknown Company'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Ticket Type</label>
            <p className="text-gray-900">{ticketType?.name || 'Unknown Type'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority || 'Normal'}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
              {ticket.status || 'Open'}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Created By</label>
            <p className="text-gray-900">{creator?.name || ticket.creator_email || 'Unknown'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Assigned To</label>
            <p className="text-gray-900">{assignee?.name || ticket.assignee_email || 'Unassigned'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Created Date</label>
            <p className="text-gray-900">{formatDate(ticket.created_date)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Due Date</label>
            <p className={`${ticket.due_date && new Date(ticket.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(ticket.due_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      {ticket.custom_fields && Object.keys(ticket.custom_fields).length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ticket.custom_fields).map(([key, value]) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700">{key}</label>
                <p className="text-gray-900">{value || 'Not provided'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-6">
      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your comment..."
          disabled={isAddingComment}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isAddingComment || !newComment.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAddingComment && <Icons.Loading size={16} className="animate-spin" />}
            <span>Add Comment</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Icons.User size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{comment.user_email}</span>
                {comment.type === 'status_change' && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Status Change</span>
                )}
              </div>
              <span className="text-sm text-gray-500">{formatDate(comment.created_date)}</span>
            </div>
            <div className="mt-2">
              <p className="text-gray-900">{comment.comment}</p>
              {comment.type === 'status_change' && (
                <p className="text-sm text-gray-600 mt-1">
                  Status changed from <span className="font-medium">{comment.old_status}</span> to <span className="font-medium">{comment.new_status}</span>
                </p>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8">
            <Icons.User size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No comments yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Icons.History size={16} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{item.user_email}</p>
              <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-600">{item.details}</p>
          </div>
        </div>
      ))}

      {history.length === 0 && (
        <div className="text-center py-8">
          <Icons.History size={32} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No history available</p>
        </div>
      )}
    </div>
  );

  const renderActionsTab = () => {
    const availableActions = getAvailableActions();

    return (
      <div className="space-y-6">
        {availableActions.length > 0 ? (
          <form onSubmit={handleWorkflowAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Action</label>
              <select
                value={workflowAction}
                onChange={(e) => setWorkflowAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPerformingAction}
              >
                <option value="">Choose an action</option>
                {availableActions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional comment about this action..."
                disabled={isPerformingAction}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPerformingAction || !workflowAction}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isPerformingAction && <Icons.Loading size={16} className="animate-spin" />}
                <span>Perform Action</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <Icons.Close size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No actions available for this ticket</p>
          </div>
        )}
      </div>
    );
  };

  const renderWorkflowTab = () => (
    <div className="space-y-6">
      <WorkflowStep
        ticket={ticket}
        onTicketUpdate={() => {
          onUpdate?.(ticket);
          success('Ticket updated');
        }}
      />
    </div>
  );

  const tabs = [
    { id: 'details', name: 'Details', icon: Icons.Info },
    { id: 'workflow', name: 'Workflow', icon: Icons.Workflow },
    { id: 'comments', name: 'Comments', icon: Icons.User, count: comments.length },
    { id: 'history', name: 'History', icon: Icons.History, count: history.length },
    { id: 'actions', name: 'Actions', icon: Icons.Create }
  ];

  return (
    <>
      <ToastContainer />

      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {ticket.ticket_number || `TICKET-${ticket.id}`}
                </h2>
                <p className="text-sm text-gray-500">{ticket.title}</p>
              </div>

              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button
                    onClick={() => onUpdate?.(ticket)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                    title="Edit Ticket"
                  >
                    <Icons.Edit size={20} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <Icons.Close size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'comments' && renderCommentsTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'actions' && renderActionsTab()}
            {activeTab === 'workflow' && renderWorkflowTab()}
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetail;