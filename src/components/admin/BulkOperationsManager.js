import React, { useState } from 'react';
import { useCompanies, useTicketTypes, useRoles } from '../../hooks/useAPI';
import Icons from '../shared/Icons';
import BulkWorkflowDialog from './BulkWorkflowDialog';
import WorkflowCopyDialog from './WorkflowCopyDialog';
import ConfigurationExportImportDialog from './ConfigurationExportImportDialog';
import BulkRoleAssignmentDialog from './BulkRoleAssignmentDialog';

/**
 * BulkOperationsManager Component
 *
 * Central hub for all bulk operations across companies:
 * - Bulk workflow operations
 * - Export/import configurations
 * - Bulk role assignments
 * - System-wide operations
 */
const BulkOperationsManager = () => {
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { data: ticketTypes, loading: ticketTypesLoading } = useTicketTypes();
  const { data: roles, loading: rolesLoading } = useRoles();

  const [showBulkWorkflowDialog, setShowBulkWorkflowDialog] = useState(false);
  const [showWorkflowCopyDialog, setShowWorkflowCopyDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [activeSection, setActiveSection] = useState('workflows');

  const isLoading = companiesLoading || ticketTypesLoading || rolesLoading;

  const handleBulkOperationSuccess = () => {
    // Refresh data or show confirmation
    console.log('Bulk operation completed successfully');
  };

  const bulkOperationCards = [
    {
      id: 'bulk-workflows',
      title: 'Bulk Workflow Management',
      description: 'Assign or copy workflows across multiple companies and ticket types',
      icon: Icons.Settings,
      color: 'purple',
      stats: [
        { label: 'Companies', value: companies?.length || 0 },
        { label: 'Ticket Types', value: ticketTypes?.length || 0 }
      ],
      actions: [
        {
          label: 'Bulk Assign/Copy',
          onClick: () => setShowBulkWorkflowDialog(true),
          primary: true
        },
        {
          label: 'Single Copy',
          onClick: () => setShowWorkflowCopyDialog(true),
          primary: false
        }
      ]
    },
    {
      id: 'export-import',
      title: 'Configuration Export/Import',
      description: 'Export configurations from one company and import to another',
      icon: Icons.Download,
      color: 'green',
      stats: [
        { label: 'Exportable Types', value: 5 },
        { label: 'Companies', value: companies?.length || 0 }
      ],
      actions: [
        {
          label: 'Export Configuration',
          onClick: () => setShowExportDialog(true),
          primary: true
        },
        {
          label: 'Import Configuration',
          onClick: () => setShowImportDialog(true),
          primary: false
        }
      ]
    },
    {
      id: 'bulk-roles',
      title: 'Bulk Role Assignment',
      description: 'Assign roles to multiple users across companies and ticket types',
      icon: Icons.Users,
      color: 'blue',
      stats: [
        { label: 'Roles', value: roles?.length || 0 },
        { label: 'Companies', value: companies?.length || 0 }
      ],
      actions: [
        {
          label: 'Bulk Assign Roles',
          onClick: () => setShowBulkRoleDialog(true),
          primary: true
        },
        {
          label: 'Role Templates',
          onClick: () => console.log('Role templates clicked'),
          primary: false
        }
      ]
    }
  ];

  const systemOperationCards = [
    {
      id: 'data-migration',
      title: 'Data Migration Tools',
      description: 'Migrate data between environments or perform bulk updates',
      icon: Icons.Database,
      color: 'yellow',
      actions: [
        {
          label: 'Database Sync',
          onClick: () => console.log('Database sync clicked'),
          primary: true
        }
      ],
      comingSoon: true
    },
    {
      id: 'audit-reports',
      title: 'Bulk Audit & Reports',
      description: 'Generate comprehensive reports across all companies',
      icon: Icons.FileText,
      color: 'indigo',
      actions: [
        {
          label: 'Generate Report',
          onClick: () => console.log('Generate report clicked'),
          primary: true
        }
      ],
      comingSoon: true
    }
  ];

  const renderOperationCard = (card) => {
    const colorClasses = {
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };

    const iconColorClasses = {
      purple: 'text-purple-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      indigo: 'text-indigo-600'
    };

    const buttonColorClasses = {
      purple: {
        primary: 'bg-purple-600 hover:bg-purple-700 text-white',
        secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
      },
      green: {
        primary: 'bg-green-600 hover:bg-green-700 text-white',
        secondary: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
      },
      blue: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
      },
      yellow: {
        primary: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        secondary: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      indigo: {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        secondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    };

    return (
      <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
              <card.icon size={24} className={iconColorClasses[card.color]} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span>{card.title}</span>
                {card.comingSoon && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Coming Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{card.description}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {card.stats && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {card.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {card.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={card.comingSoon || isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                action.primary
                  ? buttonColorClasses[card.color].primary
                  : `border ${buttonColorClasses[card.color].secondary}`
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading bulk operations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Operations Manager</h2>
          <p className="text-gray-600 mt-1">
            Manage operations across multiple companies, ticket types, and users
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{companies?.length || 0}</div>
            <div className="text-sm text-gray-600">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{ticketTypes?.length || 0}</div>
            <div className="text-sm text-gray-600">Ticket Types</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{roles?.length || 0}</div>
            <div className="text-sm text-gray-600">Roles</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'workflows', label: 'Workflow Operations', icon: Icons.Settings },
            { id: 'system', label: 'System Operations', icon: Icons.Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeSection === tab.id
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

      {/* Content */}
      {activeSection === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {bulkOperationCards.map(renderOperationCard)}
        </div>
      )}

      {activeSection === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {systemOperationCards.map(renderOperationCard)}
        </div>
      )}

      {/* Dialogs */}
      <BulkWorkflowDialog
        isOpen={showBulkWorkflowDialog}
        onClose={() => setShowBulkWorkflowDialog(false)}
        onSuccess={handleBulkOperationSuccess}
      />

      <WorkflowCopyDialog
        isOpen={showWorkflowCopyDialog}
        onClose={() => setShowWorkflowCopyDialog(false)}
        onSuccess={handleBulkOperationSuccess}
      />

      <ConfigurationExportImportDialog
        isOpen={showExportDialog}
        mode="export"
        onClose={() => setShowExportDialog(false)}
        onSuccess={handleBulkOperationSuccess}
      />

      <ConfigurationExportImportDialog
        isOpen={showImportDialog}
        mode="import"
        onClose={() => setShowImportDialog(false)}
        onSuccess={handleBulkOperationSuccess}
      />

      <BulkRoleAssignmentDialog
        isOpen={showBulkRoleDialog}
        onClose={() => setShowBulkRoleDialog(false)}
        onSuccess={handleBulkOperationSuccess}
      />
    </div>
  );
};

export default BulkOperationsManager;