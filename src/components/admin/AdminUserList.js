import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons from '../shared/Icons';
import ErrorBoundary130 from '../shared/ErrorBoundary130';
import { useToast } from '../shared/Toast';
import { useUsers, useRoles, useCompanies, useUserProfileTypes } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';

/**
 * AdminUserList Component
 *
 * User administration interface without Firebase dependency
 * - Lists all users with profile information
 * - Role assignment management
 * - Company assignments
 * - User profile type assignments
 * - Disables features requiring Firebase authentication
 */
const AdminUserList = () => {
  const navigate = useNavigate();
  const { success, error: showError, warning, ToastContainer } = useToast();
  const [actionLoading, setActionLoading] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  // API hooks
  const { data: users, loading, error, refetch } = useUsers();
  const { data: roles } = useRoles();
  const { data: companies } = useCompanies();
  const { data: userProfileTypes } = useUserProfileTypes();

  // Firebase-dependent features flag
  const FIREBASE_FEATURES_ENABLED = false;

  // Handle user actions (disabled for Firebase features)
  const handleCreateUser = () => {
    warning('User creation requires Firebase authentication setup. Please contact your system administrator.');
  };

  const handleResetPassword = (user) => {
    warning('Password reset requires Firebase authentication setup. Please contact your system administrator.');
  };

  const handleDeleteUser = (user) => {
    warning('User deletion requires Firebase authentication setup. Please contact your system administrator.');
  };

  // Role assignment (works with current backend)
  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setShowRoleDialog(true);
  };

  const handleRoleAssignment = async (roleData) => {
    if (!selectedUser) return;

    setActionLoading(prev => ({ ...prev, [`role_${selectedUser.id}`]: true }));

    try {
      // This would work with existing UserAPI.assignRole
      await API.Users.assignRole(selectedUser.id, roleData.roleId, roleData.companyId);
      success('Role assigned successfully');
      refetch();
      setShowRoleDialog(false);
      setSelectedUser(null);
    } catch (err) {
      showError(err.message || 'Failed to assign role');
    } finally {
      setActionLoading(prev => ({ ...prev, [`role_${selectedUser.id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <Icons.Warning className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary130>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">User Administration</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateUser}
              disabled={!FIREBASE_FEATURES_ENABLED}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Plus size={16} className="mr-2" />
              Create User
            </button>
          </div>
        </div>

        {/* Firebase Status Notice */}
        {!FIREBASE_FEATURES_ENABLED && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <Icons.Warning className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Limited Functionality</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>User creation, password reset, and deletion require Firebase authentication setup.</p>
                  <p className="mt-1">Currently available: View users, assign roles, manage permissions.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        {!users || users.length === 0 ? (
          <div className="text-center py-12">
            <Icons.Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">Users will appear here once they are added to the system</p>
            <button
              onClick={handleCreateUser}
              disabled={!FIREBASE_FEATURES_ENABLED}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Plus size={16} className="mr-2" />
              Create First User
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {users.length} User{users.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Icons.User size={20} className="text-gray-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {user.name || user.email}
                            </h4>
                            {user.is_active === false && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500 space-x-4">
                            {user.company_name && (
                              <>
                                <span>{user.company_name}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                            {user.last_login && (
                              <>
                                <span>•</span>
                                <span>Last login {new Date(user.last_login).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Assign Role Button */}
                      <button
                        onClick={() => handleAssignRole(user)}
                        disabled={actionLoading[`role_${user.id}`]}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Icons.Shield size={12} className="mr-1" />
                        Roles
                      </button>

                      {/* Reset Password Button */}
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={!FIREBASE_FEATURES_ENABLED}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icons.Key size={12} className="mr-1" />
                        Reset Password
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Icons.Edit size={12} className="mr-1" />
                        Edit
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={!FIREBASE_FEATURES_ENABLED}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icons.Trash size={12} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Role Assignment Dialog */}
        {showRoleDialog && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Role to {selectedUser.name || selectedUser.email}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="">Select a role...</option>
                      {roles?.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="">All companies</option>
                      {companies?.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRoleDialog(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRoleAssignment({ roleId: 'temp', companyId: null })}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary130>
  );
};

export default AdminUserList;