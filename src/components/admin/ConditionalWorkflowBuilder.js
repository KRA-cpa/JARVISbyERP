import React, { useState } from 'react';
import {
  CONDITION_OPERATORS,
  FIELD_TYPES,
  LOGICAL_OPERATORS,
  getAvailableFields,
  validateConditionalRouting,
  createSampleConditionalRouting
} from '../../utils/conditionalWorkflows';
import { useTicketTypes } from '../../hooks/useAPI';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const ConditionalWorkflowBuilder = ({
  workflowStep,
  workflowSteps = [],
  onSave,
  onCancel
}) => {
  const { data: ticketTypes } = useTicketTypes();
  const { success, error: showError } = useToast();

  const [conditionalRouting, setConditionalRouting] = useState(
    workflowStep?.conditional_routing || {
      enabled: false,
      routes: []
    }
  );

  const [validationErrors, setValidationErrors] = useState([]);
  const availableFields = getAvailableFields(ticketTypes);

  const handleEnableToggle = () => {
    setConditionalRouting(prev => ({
      ...prev,
      enabled: !prev.enabled,
      routes: !prev.enabled ? [] : prev.routes
    }));
  };

  const addRoute = () => {
    const newRoute = {
      id: `route_${Date.now()}`,
      name: '',
      conditions: {
        operator: LOGICAL_OPERATORS.AND,
        conditions: [createEmptyCondition()]
      },
      target_step_id: '',
      is_default: false
    };

    setConditionalRouting(prev => ({
      ...prev,
      routes: [...prev.routes, newRoute]
    }));
  };

  const addDefaultRoute = () => {
    const defaultRoute = {
      id: `default_route_${Date.now()}`,
      name: 'Default Route',
      conditions: null,
      target_step_id: '',
      is_default: true
    };

    setConditionalRouting(prev => ({
      ...prev,
      routes: [...prev.routes, defaultRoute]
    }));
  };

  const removeRoute = (routeId) => {
    setConditionalRouting(prev => ({
      ...prev,
      routes: prev.routes.filter(route => route.id !== routeId)
    }));
  };

  const updateRoute = (routeId, updates) => {
    setConditionalRouting(prev => ({
      ...prev,
      routes: prev.routes.map(route =>
        route.id === routeId ? { ...route, ...updates } : route
      )
    }));
  };

  const createEmptyCondition = () => ({
    field_name: '',
    operator: CONDITION_OPERATORS.EQUALS,
    value: '',
    field_type: FIELD_TYPES.STRING
  });

  const addCondition = (routeId) => {
    setConditionalRouting(prev => ({
      ...prev,
      routes: prev.routes.map(route =>
        route.id === routeId
          ? {
              ...route,
              conditions: {
                ...route.conditions,
                conditions: [...route.conditions.conditions, createEmptyCondition()]
              }
            }
          : route
      )
    }));
  };

  const removeCondition = (routeId, conditionIndex) => {
    setConditionalRouting(prev => ({
      ...prev,
      routes: prev.routes.map(route =>
        route.id === routeId
          ? {
              ...route,
              conditions: {
                ...route.conditions,
                conditions: route.conditions.conditions.filter((_, index) => index !== conditionIndex)
              }
            }
          : route
      )
    }));
  };

  const updateCondition = (routeId, conditionIndex, updates) => {
    setConditionalRouting(prev => ({
      ...prev,
      routes: prev.routes.map(route =>
        route.id === routeId
          ? {
              ...route,
              conditions: {
                ...route.conditions,
                conditions: route.conditions.conditions.map((condition, index) =>
                  index === conditionIndex ? { ...condition, ...updates } : condition
                )
              }
            }
          : route
      )
    }));
  };

  const loadSampleConfiguration = () => {
    const sample = createSampleConditionalRouting();
    setConditionalRouting(sample);
  };

  const validateConfiguration = () => {
    const validation = validateConditionalRouting(conditionalRouting, workflowSteps);
    setValidationErrors(validation.errors);
    return validation.valid;
  };

  const handleSave = () => {
    if (!validateConfiguration()) {
      showError('Please fix the configuration errors before saving');
      return;
    }

    onSave?.(conditionalRouting);
    success('Conditional workflow configuration saved successfully');
  };

  const renderCondition = (condition, conditionIndex, routeId) => (
    <div key={conditionIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <h6 className="text-sm font-medium text-gray-700">
          Condition {conditionIndex + 1}
        </h6>
        <button
          onClick={() => removeCondition(routeId, conditionIndex)}
          className="text-red-500 hover:text-red-700"
          title="Remove Condition"
        >
          <Icons.Close size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Field Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field
          </label>
          <select
            value={condition.field_name}
            onChange={(e) => updateCondition(routeId, conditionIndex, { field_name: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select field...</option>
            {availableFields.map(field => (
              <option key={field.name} value={field.name}>
                {field.label}
              </option>
            ))}
          </select>
        </div>

        {/* Operator Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Operator
          </label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(routeId, conditionIndex, { operator: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(CONDITION_OPERATORS).map(([key, value]) => (
              <option key={value} value={value}>
                {key.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Value
          </label>
          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(routeId, conditionIndex, { value: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Enter value..."
          />
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={condition.field_type}
            onChange={(e) => updateCondition(routeId, conditionIndex, { field_type: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(FIELD_TYPES).map(([key, value]) => (
              <option key={value} value={value}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderRoute = (route) => (
    <div key={route.id} className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={route.name}
            onChange={(e) => updateRoute(route.id, { name: e.target.value })}
            placeholder="Route name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          {route.is_default && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              Default
            </span>
          )}
          <button
            onClick={() => removeRoute(route.id)}
            className="text-red-500 hover:text-red-700"
            title="Remove Route"
          >
            <Icons.Close size={20} />
          </button>
        </div>
      </div>

      {/* Target Step Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Step
        </label>
        <select
          value={route.target_step_id}
          onChange={(e) => updateRoute(route.id, { target_step_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select target step...</option>
          {workflowSteps.map(step => (
            <option key={step.id} value={step.id}>
              {step.name} ({step.step_type})
            </option>
          ))}
        </select>
      </div>

      {/* Conditions (not for default route) */}
      {!route.is_default && route.conditions && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Conditions
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={route.conditions.operator}
                onChange={(e) => updateRoute(route.id, {
                  conditions: { ...route.conditions, operator: e.target.value }
                })}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                {Object.entries(LOGICAL_OPERATORS).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addCondition(route.id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Condition
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {route.conditions.conditions.map((condition, index) =>
              renderCondition(condition, index, route.id)
            )}
          </div>

          {route.conditions.conditions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No conditions defined. Click "Add Condition" to start.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Conditional Workflow Configuration
        </h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={conditionalRouting.enabled}
              onChange={handleEnableToggle}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable Conditional Routing</span>
          </label>
        </div>
      </div>

      {conditionalRouting.enabled && (
        <div className="space-y-6">
          {/* Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Routes</h4>
              <div className="flex space-x-2">
                <button
                  onClick={loadSampleConfiguration}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Load Sample
                </button>
                <button
                  onClick={addRoute}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Route
                </button>
                <button
                  onClick={addDefaultRoute}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={conditionalRouting.routes.some(route => route.is_default)}
                >
                  Add Default Route
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {conditionalRouting.routes.map(renderRoute)}

              {conditionalRouting.routes.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Icons.Route size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-4">No routes configured</p>
                  <button
                    onClick={addRoute}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add First Route
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Icons.Warning size={16} className="text-red-600 mr-2" />
                <h5 className="text-sm font-medium text-red-900">Configuration Errors</h5>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={validateConfiguration}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Validate
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {!conditionalRouting.enabled && (
        <div className="text-center py-8 text-gray-500">
          <Icons.Route size={48} className="mx-auto text-gray-400 mb-2" />
          <p>Enable conditional routing to configure field-based workflow branching</p>
        </div>
      )}
    </div>
  );
};

export default ConditionalWorkflowBuilder;