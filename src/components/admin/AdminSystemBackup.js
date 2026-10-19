import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useCompanies } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';
import APITestPanel from '../shared/APITestPanel';
import ConfigurationExportImportDialog from './ConfigurationExportImportDialog';

/**
 * AdminSystemBackup - Admin -> System & Backup (AppScript v9.3).
 *
 * - API status + read-only schema health check (APITestPanel -> getSystemHealth)
 * - Backup: a company's configuration as a JSON file in the script owner's Google Drive
 *   (createConfigurationBackup; admins only)
 * - Export (download JSON) / import (company to company, dry-run preview first) through
 *   ConfigurationExportImportDialog
 */
const AdminSystemBackup = () => {
  const { user } = useUser();
  const userId = user?.uid || user?.id;
  const { data: companies } = useCompanies();
  const { ToastContainer, success, error: showError } = useToast();

  const [dialogMode, setDialogMode] = useState(null); // 'export' | 'import' | null
  const [backupCompanyId, setBackupCompanyId] = useState('');
  const [backupName, setBackupName] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const handleBackup = async () => {
    if (!backupCompanyId) {
      showError('Pick a company to back up');
      return;
    }
    setBackingUp(true);
    try {
      const result = await API.System.createConfigurationBackup({
        user_id: userId,
        company_id: backupCompanyId,
        backup_name: backupName.trim() || 'manual'
      });
      setLastBackup(result?.data || result);
      success('Backup saved to Google Drive');
    } catch (err) {
      showError(err.message || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {dialogMode && (
        <ConfigurationExportImportDialog
          key={dialogMode}
          isOpen
          mode={dialogMode}
          onClose={() => setDialogMode(null)}
          onSuccess={() => success('Configuration imported')}
        />
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System & Backup</h2>
          <p className="mt-1 text-sm text-gray-600">API status, schema health, configuration backup, export and import</p>
        </div>

        <APITestPanel />

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Back up a company's configuration</h3>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Saves ticket types, workflows, SLAs, routes, custom fields, roles and dropdowns as a JSON file in the
            script owner's Google Drive. Tickets are not included.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <select
              value={backupCompanyId}
              onChange={e => setBackupCompanyId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a company...</option>
              {(companies || []).map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            <input
              type="text"
              value={backupName}
              onChange={e => setBackupName(e.target.value)}
              placeholder="Backup name (optional)"
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleBackup}
              disabled={backingUp || !userId}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Icons.Save size={16} className="mr-2" />
              {backingUp ? 'Saving...' : 'Back up to Drive'}
            </button>
          </div>
          {lastBackup?.url && (
            <p className="mt-3 text-sm text-green-700">
              Saved <a href={lastBackup.url} target="_blank" rel="noopener noreferrer" className="underline">{lastBackup.name}</a>
              {lastBackup.size ? ` (${(lastBackup.size / 1024).toFixed(1)} KB)` : ''}
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Export or copy configuration</h3>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Export downloads a company's setup as JSON. Import copies one company's setup into others - it shows a dry
            run first and changes nothing until you apply it.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDialogMode('export')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icons.Download size={16} className="mr-2" /> Export
            </button>
            <button
              onClick={() => setDialogMode('import')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icons.Upload size={16} className="mr-2" /> Copy to other companies
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSystemBackup;
