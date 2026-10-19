import React, { useState, useEffect } from 'react';
import { CONDITION_OPERATORS } from '../../utils/conditionalWorkflows';
import { useCustomFields, useStepConditions } from '../../hooks/useAPI';
import { useUser } from '../../contexts/UserContext';
import { API } from '../../api/googleSheet';
import Icons from '../shared/Icons';

// Route target that ends the workflow instead of moving to a step (AppScript v9.2 STEP_CONDITION_END)
const END_OF_WORKFLOW = '__end__';

// Ticket fields a condition can test besides the ticket type's custom fields (AppScript STANDARD_CONDITION_FIELDS)
const STANDARD_FIELDS = [
  { id: 'field:priority', label: 'Priority (ticket)' },
  { id: 'field:title', label: 'Title (ticket)' }
];

const OPERATOR_LABELS = {
  [CONDITION_OPERATORS.EQUALS]: 'equals',
  [CONDITION_OPERATORS.NOT_EQUALS]: 'does not equal',
  [CONDITION_OPERATORS.GREATER_THAN]: 'is greater than',
  [CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL]: 'is at least',
  [CONDITION_OPERATORS.LESS_THAN]: 'is less than',
  [CONDITION_OPERATORS.LESS_THAN_OR_EQUAL]: 'is at most',
  [CONDITION_OPERATORS.CONTAINS]: 'contains',
  [CONDITION_OPERATORS.NOT_CONTAINS]: 'does not contain',
  [CONDITION_OPERATORS.IN]: 'is one of (comma separated)',
  [CONDITION_OPERATORS.NOT_IN]: 'is none of (comma separated)',
  [CONDITION_OPERATORS.IS_EMPTY]: 'is empty',
  [CONDITION_OPERATORS.IS_NOT_EMPTY]: 'is not empty',
  [CONDITION_OPERATORS.REGEX_MATCH]: 'matches pattern'
};

const NO_VALUE_OPERATORS = [CONDITION_OPERATORS.IS_EMPTY, CONDITION_OPERATORS.IS_NOT_EMPTY];

let routeCounter = 0;
const newKey = () => `route_${Date.now()}_${routeCounter++}`;
const emptyCondition = () => ({ custom_field_id: '', operator: CONDITION_OPERATORS.EQUALS, value: '' });

/**
 * Conditional routing for one workflow step (spec 3.3 "stitching"), saved through AppScript v9.2
 * saveStepConditions. When the step is approved, the first route whose conditions all hold decides the next
 * step; otherwise the default route, else the next step in order. A route can only target a later step or
 * end the workflow, so routing never loops (the backend refuses anything else).
 * @param {Object} props.step - The step being configured
 * @param {Array} props.workflowSteps - The workflow's steps (same ticket type and company), in order
 * @param {Function} props.onClose - Called with a success message after a save, or with nothing on cancel
 */
const ConditionalWorkflowBuilder = ({ step, workflowSteps = [], onClose }) => {
  const { user } = useUser();
  const { data: fields } = useCustomFields(step?.ticket_type_id);
  const { data: saved, loading } = useStepConditions(step?.id);

  const [enabled, setEnabled] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Load the saved routes once they arrive
  useEffect(() => {
    if (!saved) return;
    setEnabled(Boolean(saved.enabled));
    setRoutes((saved.routes || []).map(route => ({
      key: newKey(),
      target_step_id: route.target_step_id || '',
      is_default: Boolean(route.is_default),
      conditions: route.is_default ? [] : (route.conditions?.conditions || []).map(c => ({
        custom_field_id: c.custom_field_id || '',
        operator: c.operator || CONDITION_OPERATORS.EQUALS,
        value: c.value ?? ''
      }))
    })));
  }, [saved]);

  const stepIndex = workflowSteps.findIndex(s => String(s.id) === String(step?.id));
  const laterSteps = workflowSteps.slice(stepIndex + 1);
  const fieldOptions = [
    ...(fields || [])
      .filter(f => f.is_active !== false && String(f.is_active).toUpperCase() !== 'FALSE')
      .map(f => ({ id: String(f.id), label: f.label || f.name || String(f.id) })),
    ...STANDARD_FIELDS
  ];
  const hasDefault = routes.some(r => r.is_default);

  const updateRoute = (key, changes) => setRoutes(prev => prev.map(r => (r.key === key ? { ...r, ...changes } : r)));
  const removeRoute = key => setRoutes(prev => prev.filter(r => r.key !== key));
  const moveRoute = (key, delta) => setRoutes(prev => {
    const index = prev.findIndex(r => r.key === key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= prev.length) return prev;
    const next = prev.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const updateCondition = (key, index, changes) => setRoutes(prev => prev.map(r => (r.key === key
    ? { ...r, conditions: r.conditions.map((c, i) => (i === index ? { ...c, ...changes } : c)) }
    : r)));

  const addRoute = () => setRoutes(prev => {
    // Conditional routes go before the default route, which is always tried last
    const route = { key: newKey(), target_step_id: '', is_default: false, conditions: [emptyCondition()] };
    const defaults = prev.filter(r => r.is_default);
    return [...prev.filter(r => !r.is_default), route, ...defaults];
  });
  const addDefaultRoute = () => setRoutes(prev => [...prev, { key: newKey(), target_step_id: '', is_default: true, conditions: [] }]);

  // Same rules as the backend, so most mistakes show before saving
  const validate = () => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const label = route.is_default ? 'Default route' : `Route ${i + 1}`;
      if (!route.target_step_id) return `${label}: pick where it goes`;
      if (route.is_default) continue;
      if (route.conditions.length === 0) return `${label}: add at least one condition`;
      for (let j = 0; j < route.conditions.length; j++) {
        const c = route.conditions[j];
        if (!c.custom_field_id) return `${label}, condition ${j + 1}: pick a field`;
        if (!NO_VALUE_OPERATORS.includes(c.operator) && !String(c.value).trim()) return `${label}, condition ${j + 1}: enter a value`;
        if (c.operator === CONDITION_OPERATORS.REGEX_MATCH) {
          try {
            new RegExp(c.value);
          } catch (e) {
            return `${label}, condition ${j + 1}: the pattern is not valid`;
          }
        }
      }
    }
    return '';
  };

  const handleSave = async () => {
    const problem = enabled ? validate() : '';
    setFormError(problem);
    if (problem) return;

    setSaving(true);
    try {
      const payload = routes.map(route => ({
        target_step_id: route.target_step_id,
        is_default: route.is_default,
        conditions: route.is_default ? null : { operator: 'and', conditions: route.conditions }
      }));
      await API.WorkflowSteps.saveConditions(step.id, enabled ? payload : [], enabled, user?.uid || user?.id);
      onClose?.(enabled && routes.length ? 'Routing saved' : 'Conditional routing turned off');
    } catch (err) {
      setFormError(err.message || 'Failed to save routing');
    } finally {
      setSaving(false);
    }
  };

  const targetSelect = route => (
    <select
      value={route.target_step_id}
      onChange={e => updateRoute(route.key, { target_step_id: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Go to...</option>
      {laterSteps.map(s => (
        <option key={s.id} value={s.id}>{s.name} ({s.step_type})</option>
      ))}
      <option value={END_OF_WORKFLOW}>Complete the workflow</option>
    </select>
  );

  const renderCondition = (route, condition, index) => (
    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <select
        value={condition.custom_field_id}
        onChange={e => updateCondition(route.key, index, { custom_field_id: e.target.value })}
        className="md:col-span-4 px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Field...</option>
        {fieldOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <select
        value={condition.operator}
        onChange={e => updateCondition(route.key, index, { operator: e.target.value })}
        className="md:col-span-3 px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
      >
        {Object.entries(OPERATOR_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input
        type="text"
        value={condition.value}
        disabled={NO_VALUE_OPERATORS.includes(condition.operator)}
        onChange={e => updateCondition(route.key, index, { value: e.target.value })}
        placeholder={NO_VALUE_OPERATORS.includes(condition.operator) ? '' : 'Value (dropdown: option label or value)'}
        className="md:col-span-4 px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        type="button"
        onClick={() => updateRoute(route.key, { conditions: route.conditions.filter((_, i) => i !== index) })}
        className="md:col-span-1 p-2 text-red-500 hover:text-red-700"
        title="Remove condition"
      >
        <Icons.Close size={16} />
      </button>
    </div>
  );

  const renderRoute = (route, index) => (
    <div key={route.key} className={`border rounded-lg p-4 ${route.is_default ? 'border-blue-200 bg-blue-50' : 'border-gray-300 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium text-gray-900">
          {route.is_default ? 'Default route (when no route above matches)' : `Route ${index + 1}: when ALL of these hold`}
        </h5>
        <div className="flex items-center space-x-1">
          {!route.is_default && (
            <>
              <button type="button" onClick={() => moveRoute(route.key, -1)} disabled={index === 0}
                className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move up">
                <Icons.ChevronUp size={16} />
              </button>
              <button type="button" onClick={() => moveRoute(route.key, 1)}
                disabled={index + 1 >= routes.length || routes[index + 1]?.is_default}
                className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move down">
                <Icons.ChevronDown size={16} />
              </button>
            </>
          )}
          <button type="button" onClick={() => removeRoute(route.key)} className="p-1 text-red-500 hover:text-red-700" title="Remove route">
            <Icons.Delete size={16} />
          </button>
        </div>
      </div>

      {!route.is_default && (
        <div className="space-y-2 mb-3">
          {route.conditions.map((condition, i) => renderCondition(route, condition, i))}
          <button
            type="button"
            onClick={() => updateRoute(route.key, { conditions: [...route.conditions, emptyCondition()] })}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
          >
            <Icons.Plus size={12} className="mr-1" /> Add condition
          </button>
        </div>
      )}

      <label className="block text-xs font-medium text-gray-700 mb-1">Then go to</label>
      {targetSelect(route)}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Routing after "{step?.name}"</h3>
          <p className="text-sm text-gray-600 mt-1">
            Routes are checked top to bottom when this step is approved or completed. For "either / or", add a
            second route to the same step. A route can only go to a later step or complete the workflow.
          </p>
        </div>
        <label className="flex items-center ml-4 whitespace-nowrap">
          <input type="checkbox" checked={enabled} onChange={() => setEnabled(v => !v)} className="mr-2" />
          <span className="text-sm font-medium text-gray-700">Conditional routing</span>
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading routes...</p>}

      {!loading && enabled && (
        <div className="space-y-4">
          {laterSteps.length === 0 && (
            <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              This is the last step: a route can only complete the workflow.
            </div>
          )}
          {routes.map(renderRoute)}
          {routes.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-600">
              <Icons.Workflow size={36} className="mx-auto text-gray-400 mb-2" />
              No routes yet - the ticket goes to the next step in order.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addRoute} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Add route
            </button>
            <button type="button" onClick={addDefaultRoute} disabled={hasDefault}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50">
              Add default route
            </button>
          </div>
        </div>
      )}

      {!loading && !enabled && (
        <p className="text-sm text-gray-600 py-4">Off: after this step the ticket goes to the next step in order.</p>
      )}

      {formError && (
        <div className="mt-4 flex items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <Icons.Warning size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
        <button type="button" onClick={() => onClose?.()} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save routing'}
        </button>
      </div>
    </div>
  );
};

export default ConditionalWorkflowBuilder;
