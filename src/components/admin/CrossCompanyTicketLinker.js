import React, { useState } from 'react';
import { useCompanies, useTicketTypes } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

/**
 * CrossCompanyTicketLinker Component
 *
 * Manages cross-company ticket linking and dependencies:
 * - Link tickets across different companies
 * - Set up parent-child relationships between tickets
 * - Define blocking dependencies between tickets
 * - Visual dependency mapping and workflow coordination
 */
const CrossCompanyTicketLinker = () => {
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { success, error: showError } = useToast();

  const [ticketLinks, setTicketLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create-link');

  const [linkFormData, setLinkFormData] = useState({
    parentTicketNumber: '',
    childTicketNumber: '',
    linkType: 'blocks', // blocks, depends_on, related_to, duplicates
    description: '',
    enforceBlockingRules: true,
    syncStatus: false,
    notifyOnUpdate: true
  });

  const [searchCriteria, setSearchCriteria] = useState({
    ticketNumber: '',
    companyId: '',
    ticketTypeId: '',
    status: '',
    includeLinked: false
  });

  const linkTypes = [
    { value: 'blocks', label: 'Blocks', description: 'Parent ticket blocks child ticket from proceeding' },
    { value: 'depends_on', label: 'Depends On', description: 'Child ticket depends on parent ticket completion' },
    { value: 'related_to', label: 'Related To', description: 'Tickets are related but no blocking dependency' },
    { value: 'duplicates', label: 'Duplicates', description: 'Tickets are duplicates of each other' }
  ];

  const handleCreateLink = async () => {
    if (!linkFormData.parentTicketNumber || !linkFormData.childTicketNumber) {
      showError('Please enter both parent and child ticket numbers');
      return;
    }

    if (linkFormData.parentTicketNumber === linkFormData.childTicketNumber) {
      showError('A ticket cannot be linked to itself');
      return;
    }

    try {
      setIsLoading(true);

      const linkData = {
        parent_ticket_number: linkFormData.parentTicketNumber,
        child_ticket_number: linkFormData.childTicketNumber,
        link_type: linkFormData.linkType,
        description: linkFormData.description,
        enforce_blocking_rules: linkFormData.enforceBlockingRules,
        sync_status: linkFormData.syncStatus,
        notify_on_update: linkFormData.notifyOnUpdate
      };

      await API.TicketLinks.create(linkData);
      success('Ticket link created successfully');

      // Reset form
      setLinkFormData({
        parentTicketNumber: '',
        childTicketNumber: '',
        linkType: 'blocks',
        description: '',
        enforceBlockingRules: true,
        syncStatus: false,
        notifyOnUpdate: true
      });

      loadTicketLinks();
    } catch (error) {
      console.error('Failed to create ticket link:', error);
      showError('Failed to create ticket link: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketLinks = async () => {
    setIsLoading(true);
    try {
      const links = await API.TicketLinks.getAll(searchCriteria);
      setTicketLinks(links || []);
    } catch (error) {
      console.error('Failed to load ticket links:', error);
      showError('Failed to load ticket links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to remove this ticket link?')) return;

    try {
      await API.TicketLinks.delete(linkId);
      success('Ticket link removed successfully');
      loadTicketLinks();
    } catch (error) {
      console.error('Failed to delete ticket link:', error);
      showError('Failed to remove ticket link');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLinkFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearchChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateTicketDependencies = async () => {
    try {
      setIsLoading(true);
      const validation = await API.TicketLinks.validateDependencies();

      if (validation.circular_dependencies?.length > 0) {
        showError(`Found ${validation.circular_dependencies.length} circular dependencies`);
      } else {
        success('No circular dependencies found');
      }
    } catch (error) {
      console.error('Failed to validate dependencies:', error);
      showError('Failed to validate ticket dependencies');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadTicketLinks();
  }, [searchCriteria]);

  if (companiesLoading || ticketTypesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cross-company linker...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cross-Company Ticket Linker</h2>
          <p className="text-gray-600 mt-1">
            Create dependencies and relationships between tickets across different companies
          </p>
        </div>
        <button
          onClick={validateTicketDependencies}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Icons.CheckCircle size={16} className="mr-2" />
          Validate Dependencies
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'create-link', label: 'Create Link', icon: Icons.Link },
            { id: 'manage-links', label: 'Manage Links', icon: Icons.List },
            { id: 'dependency-map', label: 'Dependency Map', icon: Icons.Network }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Create Link Tab */}
      {activeTab === 'create-link' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Ticket Link</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Ticket Number *
                  </label>
                  <input
                    type="text"
                    name="parentTicketNumber"
                    value={linkFormData.parentTicketNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC-PR-2025-0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child Ticket Number *
                  </label>
                  <input
                    type="text"
                    name="childTicketNumber"
                    value={linkFormData.childTicketNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., XYZ-IT-2025-0010"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Type
                </label>
                <div className="space-y-2">
                  {linkTypes.map((type) => (
                    <div key={type.value} className="flex items-start">
                      <input
                        type="radio"
                        id={type.value}
                        name="linkType"
                        value={type.value}
                        checked={linkFormData.linkType === type.value}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                      />
                      <div className="ml-2">
                        <label htmlFor={type.value} className="block text-sm font-medium text-gray-900">
                          {type.label}
                        </label>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={linkFormData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the relationship between these tickets..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enforceBlockingRules"
                    checked={linkFormData.enforceBlockingRules}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enforce blocking rules (prevent child from proceeding until parent completes)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="syncStatus"
                    checked={linkFormData.syncStatus}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Sync status updates between linked tickets
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifyOnUpdate"
                    checked={linkFormData.notifyOnUpdate}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Notify stakeholders when linked tickets are updated
                  </label>
                </div>
              </div>

              <button
                onClick={handleCreateLink}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                    Creating Link...
                  </>
                ) : (
                  <>
                    <Icons.Link size={16} className="inline mr-2" />
                    Create Ticket Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Link Types Reference</h3>
            <div className="space-y-4">
              {linkTypes.map((type) => (
                <div key={type.value} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Icons.ArrowRight size={16} className="text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {type.value === 'blocks' && 'Example: Purchase Request → Budget Approval'}
                    {type.value === 'depends_on' && 'Example: Server Setup → Network Configuration'}
                    {type.value === 'related_to' && 'Example: Bug Report ↔ Feature Request'}
                    {type.value === 'duplicates' && 'Example: Duplicate support tickets'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manage Links Tab */}
      {activeTab === 'manage-links' && (
        <div className="space-y-6">
          {/* Search Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Search Ticket Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Number
                </label>
                <input
                  type="text"
                  name="ticketNumber"
                  value={searchCriteria.ticketNumber}
                  onChange={handleSearchChange}
                  placeholder="Enter ticket number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  name="companyId"
                  value={searchCriteria.companyId}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All companies</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Type
                </label>
                <select
                  name="ticketTypeId"
                  value={searchCriteria.ticketTypeId}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All types</option>
                  {ticketTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="includeLinked"
                    checked={searchCriteria.includeLinked}
                    onChange={handleSearchChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Include linked tickets
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Links List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Ticket Links ({ticketLinks.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : ticketLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icons.Link size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No ticket links found</p>
                </div>
              ) : (
                ticketLinks.map((link) => (
                  <div key={link.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <span className="font-medium text-blue-600">{link.parent_ticket_number}</span>
                          <Icons.ArrowRight size={16} className="mx-2 text-gray-400" />
                          <span className="font-medium text-green-600">{link.child_ticket_number}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          link.link_type === 'blocks' ? 'bg-red-100 text-red-800' :
                          link.link_type === 'depends_on' ? 'bg-yellow-100 text-yellow-800' :
                          link.link_type === 'related_to' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {linkTypes.find(t => t.value === link.link_type)?.label || link.link_type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icons.Trash size={16} />
                      </button>
                    </div>
                    {link.description && (
                      <p className="text-sm text-gray-600 mt-2">{link.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {link.enforce_blocking_rules && (
                        <span className="flex items-center">
                          <Icons.Lock size={12} className="mr-1" />
                          Blocking enforced
                        </span>
                      )}
                      {link.sync_status && (
                        <span className="flex items-center">
                          <Icons.Refresh size={12} className="mr-1" />
                          Status synced
                        </span>
                      )}
                      {link.notify_on_update && (
                        <span className="flex items-center">
                          <Icons.Notification size={12} className="mr-1" />
                          Notifications enabled
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dependency Map Tab */}
      {activeTab === 'dependency-map' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dependency Map</h3>
          <div className="text-center py-12 text-gray-500">
            <Icons.Network size={64} className="mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Visual Dependency Map</h4>
            <p className="text-gray-600">
              Interactive visualization of ticket dependencies across companies coming soon.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will show a network graph of all ticket relationships and dependencies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossCompanyTicketLinker;