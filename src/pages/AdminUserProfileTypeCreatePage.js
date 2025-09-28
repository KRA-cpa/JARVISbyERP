import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Header from '../components/shared/Header';
import Icons from '../components/shared/Icons';
import ErrorBoundary130, { validateComponentReferences } from '../components/shared/ErrorBoundary130';
import { useToast } from '../components/shared/Toast';
import { useUserProfileTypeMutations, useCompanies } from '../hooks/useAPI';
import { API } from '../api/googleSheet';

/**
 * AdminUserProfileTypeCreatePage Component
 *
 * Universal Entity Architecture - Create new user profile types
 * - Full-page form for user profile type creation
 * - Company assignment (global or company-specific)
 * - Integration with custom field creation workflow
 * - Validation and error handling
 */
const AdminUserProfileTypeCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { success, error: showError, warning, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);

  // API data
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { createUserProfileType } = useUserProfileTypeMutations();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    company_id: '', // Empty for global, specific ID for company-specific
    is_active: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'User profile type name is required';
    }

    if (formData.code && !/^[A-Z0-9_]+$/i.test(formData.code.trim())) {
      errors.code = 'Code must contain only letters, numbers, and underscores';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const profileTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        code: formData.code.trim() || null,
        company_id: formData.company_id || null,
        is_active: formData.is_active
      };

      const result = await createUserProfileType(profileTypeData);
      success('User profile type created successfully');

      // Clear draft
      localStorage.removeItem('userProfileTypeDraft');

      // Navigate to list or offer to create custom fields
      if (window.confirm('User profile type created! Would you like to create custom fields for this profile type?')) {
        navigate(`/admin/custom-fields/create?entityCategory=user_profile&entityType=${result.id}`);
      } else {
        navigate('/admin?tab=user-profile-types');
      }
    } catch (err) {
      showError(err.message || 'Failed to create user profile type');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Mark draft as modified
    setDraftSaved(false);
  };

  // Auto-save draft functionality
  const saveDraft = () => {
    localStorage.setItem('userProfileTypeDraft', JSON.stringify(formData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('userProfileTypeDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

  // Development-time component validation to prevent Error #130
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Validate all icon references
      const requiredIcons = [
        'Home', 'ChevronRight', 'CheckCircle', 'ArrowLeft', 'Save', 'Plus',
        'Users', 'Info', 'Warning', 'Error'
      ];

      // Hook validation using already-available hook results
      validateComponentReferences('AdminUserProfileTypeCreatePage', {
        icons: requiredIcons,
        hooks: [
          { name: 'useToast', expectedMethods: ['success', 'error', 'warning', 'ToastContainer'], hookResult: { success, error: showError, warning, ToastContainer } },
          { name: 'useCompanies', expectedMethods: ['data', 'loading', 'error'], hookResult: { data: companies, loading: companiesLoading } }
        ]
      });
    }
  }, [success, showError, warning, ToastContainer, companies, companiesLoading]);

  return (
    <ErrorBoundary130>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <ToastContainer />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => navigate('/admin')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <Icons.Home size={14} className="mr-2" />
                    Admin
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <Icons.ChevronRight size={14} className="text-gray-400" />
                    <button
                      onClick={() => navigate('/admin?tab=user-profile-types')}
                      className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                    >
                      User Profile Types
                    </button>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <Icons.ChevronRight size={14} className="text-gray-400" />
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Create New</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create New User Profile Type</h1>
              <p className="mt-2 text-sm text-gray-600">
                Define a new category for user profiles with configurable custom fields and company assignment.
              </p>
              {draftSaved && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <Icons.CheckCircle size={16} className="mr-1" />
                  Draft saved automatically
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Form - 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <form onSubmit={handleSubmit}>
                    <div className="px-6 py-6">
                      <div className="space-y-6">
                        {/* Profile Type Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Type Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Employee, Contractor, Manager"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            A descriptive name for this user profile category
                          </p>
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Describe the purpose and characteristics of this user profile type..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Optional description to help users understand when to use this profile type
                          </p>
                        </div>

                        {/* Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Type Code
                          </label>
                          <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.code ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., EMP, CTR, MGR"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Short code for system identification (letters, numbers, underscores only)
                          </p>
                          {formErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                          )}
                        </div>

                        {/* Company Assignment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Company Assignment
                          </label>
                          <select
                            name="company_id"
                            value={formData.company_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Global (available to all companies)</option>
                            {companies?.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Choose whether this profile type is available globally or specific to one company
                          </p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Active (available for use)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => navigate('/admin?tab=user-profile-types')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Icons.ArrowLeft size={16} className="mr-2" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveDraft}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <Icons.Save size={16} className="mr-2" />
                          Save Draft
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Icons.Plus size={16} className="mr-2" />
                            Create Profile Type
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                {/* Help Documentation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">
                    <Icons.Info size={20} className="inline mr-2" />
                    User Profile Types Guide
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium text-blue-900">Universal Entity Architecture</h4>
                      <p className="text-blue-700">
                        Profile types use the same custom field system as tickets and roles
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Common Profile Types</h4>
                      <p className="text-blue-700">
                        Employee, Contractor, Consultant, Manager, Administrator, Intern
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Custom Fields</h4>
                      <p className="text-blue-700">
                        After creation, add fields like department, hire date, employee ID, clearance level
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Company Assignment</h4>
                      <p className="text-blue-700">
                        Global types are shared across companies, company-specific types are isolated
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-900 mb-4">
                    <Icons.CheckCircle size={20} className="inline mr-2" />
                    Next Steps
                  </h3>
                  <div className="space-y-2 text-sm text-green-700">
                    <p>1. Create the user profile type</p>
                    <p>2. Add custom fields (department, hire date, etc.)</p>
                    <p>3. Assign profile types to users</p>
                    <p>4. Configure role-based permissions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary130>
  );
};

export default AdminUserProfileTypeCreatePage;