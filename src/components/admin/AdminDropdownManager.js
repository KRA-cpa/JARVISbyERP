import React, { useState } from 'react';
import { useDropdownLists, useCompanies } from '../../hooks/useAPI';
import { dropdownAPI } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const AdminDropdownManager = () => {
  const [selectedCompany, setSelectedCompany] = useState('all'); // View all dropdown lists
  const { data: companies } = useCompanies();
  const { data: dropdownLists, loading, error, refetch } = useDropdownLists(); // Load all dropdown lists
  const { ToastContainer, success, error: showError } = useToast();
  const [selectedList, setSelectedList] = useState(null);
  const [showCompanyAssignments, setShowCompanyAssignments] = useState(false);
  const [managingList, setManagingList] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter dropdown lists based on selected company
  const filteredDropdownLists = React.useMemo(() => {
    if (!dropdownLists) return [];

    if (selectedCompany === 'all') {
      return dropdownLists;
    }

    if (selectedCompany === 'global') {
      return dropdownLists.filter(list => !list.company_id);
    }

    // Filter by specific company
    return dropdownLists.filter(list => list.company_id === selectedCompany);
  }, [dropdownLists, selectedCompany]);

  const handleManageCompanies = (list) => {
    setManagingList(list);
    setShowCompanyAssignments(true);
  };

  const handleUpdateCompanyAssignments = async (listId, companyAssignments) => {
    setIsSubmitting(true);
    try {
      // For now, simulate the API call since it's not implemented yet
      showError('Company assignment management is not yet implemented in the backend. This feature will be available soon.');

      setShowCompanyAssignments(false);
      setManagingList(null);
    } catch (error) {
      console.error('Update company assignments failed:', error);
      const errorMessage = error.message || 'Failed to update company assignments.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (list) => {
    if (!window.confirm(`Are you sure you want to deactivate "${list.name}"? This will hide it from all companies.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, simulate the API call since it's not implemented yet
      showError('Dropdown deactivation is not yet implemented in the backend. This feature will be available soon.');
    } catch (error) {
      console.error('Deactivate dropdown list failed:', error);
      const errorMessage = error.message || 'Failed to deactivate dropdown list.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (list) => {
    if (!window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
      return;
    }

    try {
      await dropdownAPI.deleteList(list.id);

      // Refresh data
      setTimeout(() => {
        refetch();
      }, 1000);

      if (selectedList?.id === list.id) {
        setSelectedList(null);
      }
      success(`Dropdown list "${list.name}" deleted successfully!`);
    } catch (error) {
      console.error('Delete dropdown list failed:', error);
      const errorMessage = error.message || 'Failed to delete dropdown list. Please try again.';
      showError(errorMessage);
    }
  };

  const getCompanyName = (companyId) => {
    if (!companyId) return 'Global';
    const company = companies?.find(c => c.id === companyId);
    return company ? `${company.name} (${company.code})` : 'Unknown Company';
  };

  const getAssignedCompanies = (list) => {
    // Work with the current schema where company_id is directly on the dropdown list
    if (!list.company_id) {
      return 'Global (All Companies)';
    }

    return getCompanyName(list.company_id);
  };

  const getChildOptions = (parentId, options) => {
    return options?.filter(option => option.parent_id === parentId) || [];
  };

  const renderOptionTree = (options, level = 0) => {
    if (!options || options.length === 0) return null;

    const topLevelOptions = options.filter(option => !option.parent_id);

    return topLevelOptions.map((option) => {
      const children = getChildOptions(option.id, options);
      return (
        <div key={option.id}>
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            style={{ marginLeft: `${level * 20}px` }}
          >
            <div className="flex items-center space-x-2">
              {level > 0 && <span className="text-gray-400">└─</span>}
              <span className="text-sm font-medium text-gray-900">{option.label}</span>
              <span className="text-xs text-gray-500">({option.value})</span>
            </div>
          </div>
          {children.length > 0 && (
            <div className="ml-4">
              {renderOptionTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const CompanyAssignmentModal = () => {
    const [selectedCompanyId, setSelectedCompanyId] = useState(managingList?.company_id || '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Manage Company Access: {managingList?.name}
              </h3>
              <button
                onClick={() => setShowCompanyAssignments(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icons.Close size={20} />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Icons.Warning size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Company assignment management is not yet fully implemented. This feature will be available in a future update.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Assignment:
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                >
                  <option value="">Global (All Companies)</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCompanyAssignments(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDropdownDetails = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {selectedList ? `${selectedList.name} - Details` : 'Select a List'}
        </h3>
      </div>

      {selectedList ? (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">List Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {selectedList.name}</div>
                <div><span className="font-medium">Description:</span> {selectedList.description || 'No description'}</div>
                <div><span className="font-medium">Options:</span> {selectedList.options?.length || 0}</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Company Access</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Access:</span> {getAssignedCompanies(selectedList)}</div>
                <div><span className="font-medium">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {selectedList.options?.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Options</h4>
              <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                {renderOptionTree(selectedList.options)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No options in this list</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center">
          <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Select a dropdown list to view its details and options</p>
        </div>
      )}
    </div>
  );

  const renderDropdownList = () => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Dropdown Lists</h3>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dropdown lists...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <Icons.Warning size={32} className="mx-auto text-red-400 mb-4" />
          <p className="text-red-600 mb-4">Failed to load dropdown lists</p>
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      ) : filteredDropdownLists?.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {filteredDropdownLists.map((list) => (
            <div
              key={list.id}
              className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                selectedList?.id === list.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
              }`}
              onClick={() => setSelectedList(list)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Icons.ChevronDown size={20} className="text-gray-400" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{list.name}</h4>
                      {list.description && (
                        <p className="text-sm text-gray-500">{list.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{list.options?.length || 0} options</span>
                        <span>•</span>
                        <span>{getAssignedCompanies(list)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManageCompanies(list);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Manage Company Access"
                  >
                    <Icons.Company size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivate(list);
                    }}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                    title="Deactivate List"
                  >
                    <Icons.EyeOff size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(list);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete List"
                  >
                    <Icons.Close size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <Icons.ChevronDown size={32} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {selectedCompany === 'all' ? 'No dropdown lists found' : 'No dropdown lists found for this filter'}
          </p>
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
            <h2 className="text-2xl font-bold text-gray-900">Dropdown List Manager</h2>
            <p className="text-gray-600">Manage company assignments, view details, and deactivate lists</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Company Filter */}
            <div className="flex items-center space-x-2">
              <Icons.Company size={16} className="text-gray-500" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Lists</option>
                <option value="global">Global Lists</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dropdown Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderDropdownList()}
          {renderDropdownDetails()}
        </div>

        {/* Company Assignment Modal */}
        {showCompanyAssignments && <CompanyAssignmentModal />}
      </div>
    </>
  );
};

export default AdminDropdownManager;