import React, { useState, useEffect } from 'react';
import { useRoles, useCompanies } from '../../hooks/useAPI';
import { roleAPI } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const AdminRoleManager = () => {
  const { data: roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { ToastContainer, success, error: showError } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    description: '',
    permissions: {
      canCreateTickets: false,
      canApproveTickets: false,
      canAccessAdmin: false,
      canViewReports: false,
      canManageUsers: false,
      canManageCompanies: false,
      canManageRoles: false,
      canManageDropdowns: false
    }
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when closing
  useEffect(() => {
    if (!showCreateForm && !editingRole) {
      setFormData({
        name: '',
        company_id: '',
        description: '',
        permissions: {
          canCreateTickets: false,
          canApproveTickets: false,
          canAccessAdmin: false,
          canViewReports: false,
          canManageUsers: false,
          canManageCompanies: false,
          canManageRoles: false,
          canManageDropdowns: false
        }
      });
      setFormError('');
    }
  }, [showCreateForm, editingRole]);

  // Populate form when editing
  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name || '',
        company_id: editingRole.company_id || '',
        description: editingRole.description || '',
        permissions: {
          canCreateTickets: editingRole.permissions?.canCreateTickets || false,
          canApproveTickets: editingRole.permissions?.canApproveTickets || false,
          canAccessAdmin: editingRole.permissions?.canAccessAdmin || false,
          canViewReports: editingRole.permissions?.canViewReports || false,
          canManageUsers: editingRole.permissions?.canManageUsers || false,
          canManageCompanies: editingRole.permissions?.canManageCompanies || false,
          canManageRoles: editingRole.permissions?.canManageRoles || false,
          canManageDropdowns: editingRole.permissions?.canManageDropdowns || false
        }
      });
    }
  }, [editingRole]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Role name is required');
      return false;
    }

    // Check for duplicate role names within the same company
    const existingRole = roles?.find(r =>
      r.name.toLowerCase() === formData.name.toLowerCase() &&
      r.company_id === formData.company_id &&
      r.id !== editingRole?.id
    );
    if (existingRole) {
      setFormError('Role name already exists for this company');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const roleData = {
        name: formData.name.trim(),
        company_id: formData.company_id || null,
        description: formData.description.trim(),
        permissions: formData.permissions
      };

      if (editingRole) {
        // Update existing role
        await roleAPI.update(editingRole.id, roleData);
      } else {
        // Create new role
        await roleAPI.create(roleData);
      }

      // Close form and refresh data
      setShowCreateForm(false);
      setEditingRole(null);
      refetchRoles();

      // Show success message
      success(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
    } catch (error) {
      console.error('Role operation failed:', error);
      const errorMessage = error.message || 'Failed to save role. Please try again.';
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      return;
    }

    try {
      await roleAPI.delete(role.id);
      refetchRoles();
      success(`Role "${role.name}" deleted successfully!`);
    } catch (error) {
      console.error('Delete role failed:', error);
      const errorMessage = error.message || 'Failed to delete role. Please try again.';
      showError(errorMessage);
    }
  };

  const handlePermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const getPermissionPresets = () => [
    {
      name: 'Admin',
      permissions: {
        canCreateTickets: true,
        canApproveTickets: true,
        canAccessAdmin: true,
        canViewReports: true,
        canManageUsers: true,
        canManageCompanies: true,
        canManageRoles: true,
        canManageDropdowns: true
      }
    },
    {
      name: 'Manager',
      permissions: {
        canCreateTickets: true,
        canApproveTickets: true,
        canAccessAdmin: false,
        canViewReports: true,
        canManageUsers: false,
        canManageCompanies: false,
        canManageRoles: false,
        canManageDropdowns: false
      }
    },
    {
      name: 'User',
      permissions: {
        canCreateTickets: true,
        canApproveTickets: false,
        canAccessAdmin: false,
        canViewReports: false,
        canManageUsers: false,
        canManageCompanies: false,
        canManageRoles: false,
        canManageDropdowns: false
      }
    }
  ];

  const applyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...preset.permissions }
    }));
  };

  const renderForm = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </h3>
        <button
          onClick={() => {
            setShowCreateForm(false);
            setEditingRole(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <Icons.Close size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icons.Warning size={16} className="text-red-600" />
              <span className="text-sm text-red-700">{formError}</span>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter role name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting || companiesLoading}
            >
              <option value="">Global Role (All Companies)</option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for global roles that apply to all companies
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe this role's responsibilities"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Permission Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permission Presets
          </label>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {getPermissionPresets().map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                disabled={isSubmitting}
              >
                Apply {preset.name} Permissions
              </button>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions
          </label>
          <div className="space-y-4">
            {/* Basic Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">Basic Permissions</h4>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canCreateTickets}
                    onChange={(e) => handlePermissionChange('canCreateTickets', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Create Tickets</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canApproveTickets}
                    onChange={(e) => handlePermissionChange('canApproveTickets', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Approve Tickets</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canViewReports}
                    onChange={(e) => handlePermissionChange('canViewReports', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">View Reports</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canAccessAdmin}
                    onChange={(e) => handlePermissionChange('canAccessAdmin', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Access Admin Panel</span>
                </label>
              </div>
            </div>

            {/* Administrative Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">Administrative Permissions</h4>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageUsers}
                    onChange={(e) => handlePermissionChange('canManageUsers', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Manage Users</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageCompanies}
                    onChange={(e) => handlePermissionChange('canManageCompanies', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Manage Companies</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageRoles}
                    onChange={(e) => handlePermissionChange('canManageRoles', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Manage Roles</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.canManageDropdowns}
                    onChange={(e) => handlePermissionChange('canManageDropdowns', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Manage Dropdown Lists</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setEditingRole(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isSubmitting && <Icons.Loading size={16} className="animate-spin" />}
            <span>{editingRole ? 'Update Role' : 'Create Role'}</span>
          </button>
        </div>
      </form>
    </div>
  );

  const renderRoleList = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Roles</h3>
      </div>

      {rolesLoading ? (
        <div className="p-6 text-center">
          <Icons.Loading size={32} className="mx-auto text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Loading roles...</p>
        </div>
      ) : rolesError ? (
        <div className="p-6 text-center">
          <Icons.Warning size={32} className="mx-auto text-red-400 mb-4" />
          <p className="text-red-600 mb-4">Failed to load roles</p>
          <button
            onClick={refetchRoles}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      ) : roles?.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {roles.map((role) => {
            const company = companies?.find(c => c.id === role.company_id);
            const permissionCount = Object.values(role.permissions || {}).filter(Boolean).length;

            return (
              <div key={role.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Icons.Role size={20} className="text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>
                            {company ? `${company.name} (${company.code})` : 'Global Role'}
                          </span>
                          <span>•</span>
                          <span>{permissionCount} permissions</span>
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-400 mt-1">{role.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => setEditingRole(role)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Role"
                    >
                      <Icons.Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Role"
                    >
                      <Icons.Close size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center">
          <Icons.Role size={32} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No roles found</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            Create First Role
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Define user roles and permission system</p>
        </div>
        {!showCreateForm && !editingRole && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center sm:justify-start space-x-2"
          >
            <Icons.Create size={16} />
            <span>Add Role</span>
          </button>
        )}
      </div>

      {/* Form */}
      {(showCreateForm || editingRole) && renderForm()}

      {/* Role List */}
      {renderRoleList()}
    </div>
    </>
  );
};

export default AdminRoleManager;