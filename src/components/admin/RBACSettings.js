import React, { useState } from 'react';
import {
  SYSTEM_ROLES,
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  createRBACToggleProps,
  isRBACEnabled,
  enableRBAC,
  disableRBAC,
  validateRolePermissions
} from '../../utils/rbac';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const RBACSettings = () => {
  const { success, error: showError, warning } = useToast();
  const [rbacProps, setRbacProps] = useState(createRBACToggleProps());
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES.USER);

  const handleToggleRBAC = () => {
    try {
      if (rbacProps.enabled) {
        disableRBAC();
        warning('RBAC disabled - All users now have full access');
      } else {
        enableRBAC();
        success('RBAC enabled - Permission-based access control is now active');
      }
      setRbacProps(createRBACToggleProps());
    } catch (error) {
      showError('Failed to toggle RBAC settings');
    }
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      [SYSTEM_ROLES.SUPER_ADMIN]: 'Full system access with all permissions',
      [SYSTEM_ROLES.ADMIN]: 'Administrative access with user and system management',
      [SYSTEM_ROLES.MANAGER]: 'Management access with approval and reporting capabilities',
      [SYSTEM_ROLES.SUPERVISOR]: 'Supervisory access with team oversight permissions',
      [SYSTEM_ROLES.USER]: 'Standard user access for creating and managing own tickets',
      [SYSTEM_ROLES.READONLY]: 'Read-only access to view tickets and reports',
      [SYSTEM_ROLES.GUEST]: 'Limited guest access to view basic information'
    };
    return descriptions[role] || 'No description available';
  };

  const getPermissionCount = (role) => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
    if (!rolePermissions) return 0;

    return Object.values(rolePermissions).reduce((total, categoryPermissions) => {
      return total + categoryPermissions.length;
    }, 0);
  };

  const renderPermissionBadge = (category, action, hasPermission) => (
    <span
      key={`${category}-${action}`}
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full mr-1 mb-1 ${
        hasPermission
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {hasPermission && <Icons.Success size={12} className="mr-1" />}
      {action}
    </span>
  );

  const renderRolePermissions = (role) => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || {};

    return (
      <div className="space-y-4">
        {Object.values(PERMISSION_CATEGORIES).map(category => (
          <div key={category} className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 capitalize">
              {category.replace('_', ' ')} Permissions
            </h5>
            <div className="flex flex-wrap">
              {Object.values(PERMISSION_ACTIONS).map(action => {
                const hasPermission = rolePermissions[category]?.includes(action) || false;
                return renderPermissionBadge(category, action, hasPermission);
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Role-Based Access Control (RBAC)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure user permissions and access control
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            rbacProps.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {rbacProps.status}
          </div>
          <button
            onClick={handleToggleRBAC}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              rbacProps.enabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {rbacProps.enabled ? 'Disable RBAC' : 'Enable RBAC'}
          </button>
        </div>
      </div>

      {/* Current Status Alert */}
      <div className={`rounded-lg p-4 mb-6 ${
        rbacProps.enabled
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start">
          {rbacProps.enabled ? (
            <Icons.Success size={20} className="text-green-600 mt-0.5 mr-3" />
          ) : (
            <Icons.Warning size={20} className="text-yellow-600 mt-0.5 mr-3" />
          )}
          <div>
            <h4 className={`font-medium ${
              rbacProps.enabled ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {rbacProps.enabled ? 'RBAC is Active' : 'All Access Mode'}
            </h4>
            <p className={`text-sm mt-1 ${
              rbacProps.enabled ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {rbacProps.enabled
                ? 'Users are restricted based on their assigned roles and permissions. Only authorized actions are allowed.'
                : 'All users currently have full access to all features. Enable RBAC to restrict access based on user roles.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* System Roles Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">System Roles</h4>
          <button
            onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showPermissionsMatrix ? 'Hide' : 'Show'} Permissions Matrix
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(SYSTEM_ROLES).map(role => (
            <div
              key={role}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedRole === role
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 capitalize">
                  {role.replace('_', ' ')}
                </h5>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {getPermissionCount(role)} permissions
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {getRoleDescription(role)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      {showPermissionsMatrix && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Permissions for {selectedRole.replace('_', ' ').toUpperCase()}
            </h4>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(SYSTEM_ROLES).map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {renderRolePermissions(selectedRole)}
        </div>
      )}

      {/* Implementation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Icons.Info size={20} className="text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="font-medium text-blue-900">Implementation Status</h4>
            <p className="text-sm text-blue-700 mt-1">
              RBAC implementation is complete and ready to use. The system is currently configured
              to use "All Access Mode" by default. Enable RBAC when test users can be created in the backend
              to begin using role-based permissions.
            </p>
            <div className="mt-3">
              <h5 className="text-sm font-medium text-blue-900">Features Available:</h5>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Hierarchical role system with 7 predefined roles</li>
                <li>• Granular permissions across 7 categories</li>
                <li>• Custom permission overrides for specific users</li>
                <li>• Context-aware permissions (company-specific access)</li>
                <li>• React hooks and utilities for permission checking</li>
                <li>• Toggle between RBAC and All Access modes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACSettings;