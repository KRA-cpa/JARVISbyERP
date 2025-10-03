import React, { useState, useEffect } from 'react';
import Icons from '../shared/Icons';

/**
 * TicketCollaborationManager Component
 *
 * Comprehensive ticket collaboration and sharing interface
 * Handles sharing tickets with users/companies, managing permissions, and collaboration requests
 */
const TicketCollaborationManager = ({
  ticketId,
  ticketNumber,
  ticketTitle,
  companyId,
  currentUserId,
  canShare = true,
  onCollaborationUpdated,
  className = ""
}) => {
  // State management
  const [collaborations, setCollaborations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Share modal state
  const [shareData, setShareData] = useState({
    shareWith: 'user', // 'user' or 'company'
    userId: '',
    companyId: '',
    permissionLevel: 'viewer',
    canView: true,
    canComment: false,
    canEdit: false,
    canApprove: false,
    expirationDate: '',
    shareReason: ''
  });

  // Request modal state
  const [requestData, setRequestData] = useState({
    requestFrom: 'user', // 'user' or 'company'
    userId: '',
    companyId: '',
    permissionLevel: 'viewer',
    requestMessage: ''
  });

  // Available users and companies (mock data - would come from API)
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);

  // Load collaboration data on mount
  useEffect(() => {
    if (ticketId) {
      loadCollaborations();
      loadPendingRequests();
      loadAvailableUsersAndCompanies();
    }
  }, [ticketId]);

  // Load current collaborations
  const loadCollaborations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tickets/${ticketId}/collaborations`);
      if (response.ok) {
        const data = await response.json();
        setCollaborations(data.collaborations || []);
      } else {
        throw new Error('Failed to load collaborations');
      }
    } catch (error) {
      console.error('Error loading collaborations:', error);
      setError('Failed to load collaborations');
      // Mock data for development
      setCollaborations([
        {
          id: 'collab_1',
          shared_with_user_id: 'user_2',
          shared_with_user_name: 'Jane Smith',
          shared_with_user_email: 'jane.smith@company.com',
          permission_level: 'editor',
          can_view: true,
          can_comment: true,
          can_edit: true,
          can_approve: false,
          shared_at: '2025-09-28T10:00:00Z',
          shared_by_user_name: 'John Doe',
          expiration_date: null,
          share_reason: 'Needs input from finance team'
        },
        {
          id: 'collab_2',
          shared_with_company_id: 'comp_2',
          shared_with_company_name: 'Partner Company LLC',
          permission_level: 'viewer',
          can_view: true,
          can_comment: false,
          can_edit: false,
          can_approve: false,
          shared_at: '2025-09-28T11:00:00Z',
          shared_by_user_name: 'John Doe',
          expiration_date: '2025-10-28T23:59:59Z',
          share_reason: 'External vendor review required'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending collaboration requests
  const loadPendingRequests = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tickets/${ticketId}/collaboration-requests`);
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      // Mock data for development
      setPendingRequests([
        {
          id: 'req_1',
          requested_by_user_id: 'user_3',
          requested_by_user_name: 'Bob Wilson',
          requested_by_user_email: 'bob.wilson@company.com',
          permission_level: 'commenter',
          request_message: 'I need to review this ticket for compliance purposes',
          request_status: 'pending',
          requested_at: '2025-09-28T09:00:00Z'
        }
      ]);
    }
  };

  // Load available users and companies
  const loadAvailableUsersAndCompanies = async () => {
    try {
      // TODO: Replace with actual API calls
      setAvailableUsers([
        { id: 'user_3', name: 'Bob Wilson', email: 'bob.wilson@company.com' },
        { id: 'user_4', name: 'Sarah Davis', email: 'sarah.davis@company.com' },
        { id: 'user_5', name: 'Mike Johnson', email: 'mike.johnson@partner.com' }
      ]);

      setAvailableCompanies([
        { id: 'comp_2', name: 'Partner Company LLC' },
        { id: 'comp_3', name: 'Vendor Corp' },
        { id: 'comp_4', name: 'Client Solutions Inc' }
      ]);
    } catch (error) {
      console.error('Error loading users and companies:', error);
    }
  };

  // Handle share ticket
  const handleShareTicket = async () => {
    if (!shareData.userId && !shareData.companyId) {
      setError('Please select a user or company to share with');
      return;
    }

    try {
      const payload = {
        ticketId,
        shareData: {
          shared_by_user_id: currentUserId,
          shared_with_user_id: shareData.shareWith === 'user' ? shareData.userId : null,
          shared_with_company_id: shareData.shareWith === 'company' ? shareData.companyId : null,
          permission_level: shareData.permissionLevel,
          can_view: shareData.canView,
          can_comment: shareData.canComment,
          can_edit: shareData.canEdit,
          can_approve: shareData.canApprove,
          expiration_date: shareData.expirationDate || null,
          share_reason: shareData.shareReason
        }
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/collaborations/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowShareModal(false);
        resetShareData();
        loadCollaborations();

        if (onCollaborationUpdated) {
          onCollaborationUpdated();
        }
      } else {
        throw new Error('Failed to share ticket');
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
      setError('Failed to share ticket: ' + error.message);
    }
  };

  // Handle collaboration request
  const handleRequestAccess = async () => {
    if (!requestData.userId && !requestData.companyId) {
      setError('Please select a user or company to request from');
      return;
    }

    try {
      const payload = {
        ticketId,
        requestData: {
          requested_by_user_id: currentUserId,
          requested_from_user_id: requestData.requestFrom === 'user' ? requestData.userId : null,
          requested_from_company_id: requestData.requestFrom === 'company' ? requestData.companyId : null,
          permission_level: requestData.permissionLevel,
          request_message: requestData.requestMessage
        }
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/collaborations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowRequestModal(false);
        resetRequestData();
        // Show success message
        alert('Access request sent successfully');
      } else {
        throw new Error('Failed to send access request');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      setError('Failed to send access request: ' + error.message);
    }
  };

  // Handle request response (approve/reject)
  const handleRequestResponse = async (requestId, action, rejectionReason = '') => {
    try {
      const payload = {
        requestId,
        responseData: {
          action, // 'approve' or 'reject'
          responded_by_user_id: currentUserId,
          rejection_reason: rejectionReason
        }
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/collaborations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        loadPendingRequests();
        if (action === 'approve') {
          loadCollaborations();
        }
      } else {
        throw new Error(`Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setError(`Failed to ${action} request: ` + error.message);
    }
  };

  // Revoke collaboration
  const handleRevokeCollaboration = async (collaborationId, reason = 'admin_request') => {
    if (!confirm('Are you sure you want to revoke this collaboration?')) {
      return;
    }

    try {
      const payload = {
        collaborationId,
        revokedByUserId: currentUserId,
        reason
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/collaborations/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        loadCollaborations();
        if (onCollaborationUpdated) {
          onCollaborationUpdated();
        }
      } else {
        throw new Error('Failed to revoke collaboration');
      }
    } catch (error) {
      console.error('Error revoking collaboration:', error);
      setError('Failed to revoke collaboration: ' + error.message);
    }
  };

  // Reset share form data
  const resetShareData = () => {
    setShareData({
      shareWith: 'user',
      userId: '',
      companyId: '',
      permissionLevel: 'viewer',
      canView: true,
      canComment: false,
      canEdit: false,
      canApprove: false,
      expirationDate: '',
      shareReason: ''
    });
  };

  // Reset request form data
  const resetRequestData = () => {
    setRequestData({
      requestFrom: 'user',
      userId: '',
      companyId: '',
      permissionLevel: 'viewer',
      requestMessage: ''
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get permission level badge color
  const getPermissionBadgeColor = (level) => {
    const colors = {
      viewer: 'bg-blue-100 text-blue-800',
      commenter: 'bg-green-100 text-green-800',
      editor: 'bg-yellow-100 text-yellow-800',
      approver: 'bg-purple-100 text-purple-800',
      owner: 'bg-red-100 text-red-800'
    };
    return colors[level] || colors.viewer;
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Icons.Loading className="animate-spin h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Loading collaboration data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              Collaboration {collaborations.length > 0 && `(${collaborations.length})`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {canShare && (
              <>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <Icons.UserPlus size={14} />
                  Request
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Icons.Share size={14} />
                  Share
                </button>
              </>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <Icons.Alert size={16} />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <Icons.X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Current Collaborations */}
      <div className="p-4">
        {collaborations.length > 0 ? (
          <div className="space-y-3">
            {collaborations.map((collaboration) => (
              <div
                key={collaboration.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {collaboration.shared_with_user_id ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icons.User size={16} className="text-blue-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Icons.Building size={16} className="text-green-600" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {collaboration.shared_with_user_name || collaboration.shared_with_company_name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPermissionBadgeColor(collaboration.permission_level)}`}>
                        {collaboration.permission_level}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Shared by {collaboration.shared_by_user_name} • {formatTimestamp(collaboration.shared_at)}
                      {collaboration.expiration_date && (
                        <span className="text-orange-600">
                          • Expires {formatTimestamp(collaboration.expiration_date)}
                        </span>
                      )}
                    </div>

                    {isExpanded && collaboration.share_reason && (
                      <div className="text-xs text-gray-600 mt-1">
                        Reason: {collaboration.share_reason}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={collaboration.can_view ? 'text-green-600' : 'text-gray-400'}>
                          View: {collaboration.can_view ? '✓' : '✗'}
                        </span>
                        <span className={collaboration.can_comment ? 'text-green-600' : 'text-gray-400'}>
                          Comment: {collaboration.can_comment ? '✓' : '✗'}
                        </span>
                        <span className={collaboration.can_edit ? 'text-green-600' : 'text-gray-400'}>
                          Edit: {collaboration.can_edit ? '✓' : '✗'}
                        </span>
                        <span className={collaboration.can_approve ? 'text-green-600' : 'text-gray-400'}>
                          Approve: {collaboration.can_approve ? '✓' : '✗'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {canShare && (
                  <button
                    onClick={() => handleRevokeCollaboration(collaboration.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Revoke access"
                  >
                    <Icons.UserMinus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Icons.Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No active collaborations</p>
            {canShare && (
              <p className="text-xs mt-1">Share this ticket to collaborate with others</p>
            )}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Icons.Clock className="h-4 w-4" />
            Pending Requests ({pendingRequests.length})
          </h4>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {request.requested_by_user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      requested {request.permission_level} access
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(request.requested_at)}
                  </div>

                  {request.request_message && (
                    <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border">
                      "{request.request_message}"
                    </div>
                  )}
                </div>

                {canShare && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestResponse(request.id, 'approve')}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        if (reason !== null) {
                          handleRequestResponse(request.id, 'reject', reason);
                        }
                      }}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Ticket Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-90vw max-h-90vh overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Ticket</h3>

            <div className="space-y-4">
              {/* Share with selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share with</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="user"
                      checked={shareData.shareWith === 'user'}
                      onChange={(e) => setShareData(prev => ({ ...prev, shareWith: e.target.value }))}
                      className="mr-2"
                    />
                    Specific User
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="company"
                      checked={shareData.shareWith === 'company'}
                      onChange={(e) => setShareData(prev => ({ ...prev, shareWith: e.target.value }))}
                      className="mr-2"
                    />
                    Company
                  </label>
                </div>
              </div>

              {/* User/Company selector */}
              {shareData.shareWith === 'user' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    value={shareData.userId}
                    onChange={(e) => setShareData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
                  <select
                    value={shareData.companyId}
                    onChange={(e) => setShareData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a company...</option>
                    {availableCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permission level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
                <select
                  value={shareData.permissionLevel}
                  onChange={(e) => setShareData(prev => ({ ...prev, permissionLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer (can view only)</option>
                  <option value="commenter">Commenter (can view and comment)</option>
                  <option value="editor">Editor (can view, comment, and edit)</option>
                  <option value="approver">Approver (can view, comment, edit, and approve)</option>
                </select>
              </div>

              {/* Detailed permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareData.canView}
                      onChange={(e) => setShareData(prev => ({ ...prev, canView: e.target.checked }))}
                      className="mr-2"
                    />
                    Can view ticket details
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareData.canComment}
                      onChange={(e) => setShareData(prev => ({ ...prev, canComment: e.target.checked }))}
                      className="mr-2"
                    />
                    Can add comments
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareData.canEdit}
                      onChange={(e) => setShareData(prev => ({ ...prev, canEdit: e.target.checked }))}
                      className="mr-2"
                    />
                    Can edit ticket
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareData.canApprove}
                      onChange={(e) => setShareData(prev => ({ ...prev, canApprove: e.target.checked }))}
                      className="mr-2"
                    />
                    Can approve workflow steps
                  </label>
                </div>
              </div>

              {/* Expiration date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={shareData.expirationDate}
                  onChange={(e) => setShareData(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Share reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for sharing (optional)
                </label>
                <textarea
                  value={shareData.shareReason}
                  onChange={(e) => setShareData(prev => ({ ...prev, shareReason: e.target.value }))}
                  placeholder="Explain why you're sharing this ticket..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  resetShareData();
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleShareTicket}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Share Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] max-w-90vw">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Access</h3>

            <div className="space-y-4">
              {/* Request from selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Request from</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="user"
                      checked={requestData.requestFrom === 'user'}
                      onChange={(e) => setRequestData(prev => ({ ...prev, requestFrom: e.target.value }))}
                      className="mr-2"
                    />
                    Specific User
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="company"
                      checked={requestData.requestFrom === 'company'}
                      onChange={(e) => setRequestData(prev => ({ ...prev, requestFrom: e.target.value }))}
                      className="mr-2"
                    />
                    Company
                  </label>
                </div>
              </div>

              {/* User/Company selector */}
              {requestData.requestFrom === 'user' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    value={requestData.userId}
                    onChange={(e) => setRequestData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
                  <select
                    value={requestData.companyId}
                    onChange={(e) => setRequestData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a company...</option>
                    {availableCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permission level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested Permission Level</label>
                <select
                  value={requestData.permissionLevel}
                  onChange={(e) => setRequestData(prev => ({ ...prev, permissionLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer (can view only)</option>
                  <option value="commenter">Commenter (can view and comment)</option>
                  <option value="editor">Editor (can view, comment, and edit)</option>
                  <option value="approver">Approver (can view, comment, edit, and approve)</option>
                </select>
              </div>

              {/* Request message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Message
                </label>
                <textarea
                  value={requestData.requestMessage}
                  onChange={(e) => setRequestData(prev => ({ ...prev, requestMessage: e.target.value }))}
                  placeholder="Explain why you need access to this ticket..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetRequestData();
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestAccess}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketCollaborationManager;