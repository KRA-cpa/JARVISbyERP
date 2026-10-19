import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTicketTypes, useCompanies, useReportConfig } from '../../hooks/useAPI';
import { API } from '../../api/googleSheet';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const SOURCE_TEXT = {
  company: 'This company has its own columns.',
  global: 'Using the global columns - saving here creates columns for this company only.',
  default: 'No columns saved yet - showing the defaults (key ticket fields + every custom field).'
};

/**
 * AdminReportConfigManager - Admin -> Reports (spec 3.3 Report Configuration).
 *
 * For each ticket type, pick which standard fields, custom fields and computed values (current step, SLA
 * status) the report shows, their order and their column names. "All companies" saves the global
 * configuration; a company's own configuration wins over it (AppScript v9.2 saveReportConfig).
 */
const AdminReportConfigManager = () => {
  const { user } = useUser();
  const { ToastContainer, success, error: showError } = useToast();
  const { data: ticketTypes } = useTicketTypes();
  const { data: companies } = useCompanies();

  const [ticketTypeId, setTicketTypeId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const { data: config, loading, refetch } = useReportConfig(ticketTypeId, companyId || null);

  const [columns, setColumns] = useState([]);
  const [saving, setSaving] = useState(false);

  // Start editing from what the report shows now
  useEffect(() => {
    setColumns((config?.columns || []).map(c => ({ field_name: c.field_name, display_name: c.display_name, field_type: c.field_type })));
  }, [config]);

  const available = config?.available || [];
  const chosen = new Set(columns.map(c => c.field_name));

  const toggle = (field) => setColumns(prev => (chosen.has(field.field_name)
    ? prev.filter(c => c.field_name !== field.field_name)
    : [...prev, { field_name: field.field_name, display_name: field.display_name, field_type: field.field_type }]));

  const move = (index, delta) => setColumns(prev => {
    const target = index + delta;
    if (target < 0 || target >= prev.length) return prev;
    const next = prev.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const rename = (index, name) => setColumns(prev => prev.map((c, i) => (i === index ? { ...c, display_name: name } : c)));

  const save = async () => {
    if (columns.length === 0) {
      showError('Pick at least one column');
      return;
    }
    setSaving(true);
    try {
      await API.Reports.saveConfig(ticketTypeId, companyId, columns.map(c => ({
        field_name: c.field_name,
        display_name: String(c.display_name || '').trim()
      })), user?.uid || user?.id);
      success(companyId ? 'Report columns saved for this company' : 'Global report columns saved');
      refetch();
    } catch (err) {
      showError(err.message || 'Failed to save report columns');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Configuration</h2>
          <p className="mt-1 text-sm text-gray-600">Choose the columns of each ticket type's report (Reports page and CSV export)</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type</label>
            <select
              value={ticketTypeId}
              onChange={e => setTicketTypeId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a ticket type...</option>
              {(ticketTypes || []).map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applies to</label>
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All companies (global)</option>
              {(companies || []).map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
        </div>

        {ticketTypeId && (
          loading ? (
            <div className="bg-white shadow rounded-lg p-6 text-gray-600">Loading report columns...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Available fields</h3>
                <p className="text-sm text-gray-600 mb-4">Tick a field to add it as a column</p>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {available.map(field => (
                    <label key={field.field_name} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50">
                      <span className="flex items-center">
                        <input type="checkbox" checked={chosen.has(field.field_name)} onChange={() => toggle(field)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2" />
                        <span className="text-sm text-gray-800">{field.display_name}</span>
                      </span>
                      <span className="text-xs text-gray-500">{field.field_type === 'custom' ? 'custom field' : 'ticket'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Report columns</h3>
                <p className="text-sm text-gray-600 mb-4">{SOURCE_TEXT[config?.source] || ''}</p>
                {columns.length === 0 ? (
                  <p className="text-sm text-gray-500">No columns - tick fields on the left.</p>
                ) : (
                  <ol className="space-y-2">
                    {columns.map((column, index) => (
                      <li key={column.field_name} className="flex items-center gap-2">
                        <span className="w-6 text-sm text-gray-500 text-right">{index + 1}.</span>
                        <input
                          type="text"
                          value={column.display_name}
                          onChange={e => rename(index, e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          aria-label={`Column name for ${column.field_name}`}
                        />
                        <button type="button" onClick={() => move(index, -1)} disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move up">
                          <Icons.ChevronUp size={16} />
                        </button>
                        <button type="button" onClick={() => move(index, 1)} disabled={index === columns.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move down">
                          <Icons.ChevronDown size={16} />
                        </button>
                        <button type="button" onClick={() => toggle(column)} className="p-1 text-red-500 hover:text-red-700" title="Remove column">
                          <Icons.Close size={16} />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={save}
                    disabled={saving || columns.length === 0}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Icons.Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : (companyId ? 'Save for this company' : 'Save for all companies')}
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default AdminReportConfigManager;
