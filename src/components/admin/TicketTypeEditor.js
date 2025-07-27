// Phase 3: Advanced Ticket Type Editor Components
// These components integrate into your existing Phase 2 App.js

import React, { useState } from 'react';
import {
  Settings2,
  PlusCircle,
  ArrowLeftIcon,
  Trash2,
  CheckCircle2
} from '../shared/Icons';

// ============================================================================
// EXTRACTED MODULAR COMPONENTS FROM TicketTypeEditor.js
// ============================================================================

// 1. General Settings Component
function GeneralSettings({ typeData, onUpdate }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            value={typeData.name || ''} 
            onChange={(e) => onUpdate('name', e.target.value)} 
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="e.g., Purchase Request"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code (for ticket numbering)</label>
          <input 
            type="text" 
            value={typeData.code || ''} 
            onChange={(e) => onUpdate('code', e.target.value.toUpperCase())} 
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="e.g., PR"
            maxLength="5"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea 
            value={typeData.description || ''} 
            onChange={(e) => onUpdate('description', e.target.value)} 
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
            rows="3"
            placeholder="Describe when this ticket type should be used"
          />
        </div>
        <div>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={typeData.isActive || false} 
              onChange={(e) => onUpdate('isActive', e.target.checked)} 
              className="h-5 w-5 text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Active (visible to users)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// 2. Custom Field Builder Component
function CustomFieldBuilder({ fields = [], onFieldsUpdate }) {
  const handleFieldUpdate = (index, field, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    onFieldsUpdate(newFields);
  };

  const addField = () => {
    const newField = { 
      name: `field_${Date.now()}`, 
      label: 'New Field', 
      type: 'text', 
      required: false,
      isNew: true
    };
    onFieldsUpdate([...fields, newField]);
  };

  const removeField = (index) => {
    if (fields[index].isNew || window.confirm('Are you sure? This field is used in existing tickets.')) {
      onFieldsUpdate(fields.filter((_, i) => i !== index));
    }
  };

  const fieldTypes = [
    { value: 'text', label: 'Single Line Text' },
    { value: 'textarea', label: 'Multi-line Text' },
    { value: 'number', label: 'Number' },
    { value: 'amount', label: 'Currency Amount' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown List' },
    { value: 'file', label: 'File Upload' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">Custom Fields</h3>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-gray-800">Field {index + 1}</h4>
              <button 
                onClick={() => removeField(index)}
                className={`text-red-500 hover:text-red-700 ${!field.isNew ? 'opacity-50' : ''}`}
                title={!field.isNew ? 'Cannot delete - used in existing tickets' : 'Delete field'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Label</label>
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={e => handleFieldUpdate(index, 'label', e.target.value)} 
                  className="mt-1 w-full border-gray-300 rounded"
                  placeholder="Field label"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select 
                  value={field.type} 
                  onChange={e => handleFieldUpdate(index, 'type', e.target.value)} 
                  className="mt-1 w-full border-gray-300 rounded"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={field.required} 
                    onChange={e => handleFieldUpdate(index, 'required', e.target.checked)} 
                    className="h-4 w-4"
                  />
                  <span className="ml-2 text-sm">Required</span>
                </label>
              </div>
            </div>
            {field.type === 'dropdown' && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  📝 Dropdown configuration will be linked to your Dropdown Lists in the final implementation.
                </p>
              </div>
            )}
          </div>
        ))}
        <button 
          onClick={addField} 
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800"
        >
          <PlusCircle className="h-5 w-5" /> Add Custom Field
        </button>
      </div>
    </div>
  );
}

// 3. Workflow Step Builder Component
function WorkflowStepBuilder({ steps = [], onStepsUpdate, roles = [] }) {
  const handleStepUpdate = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onStepsUpdate(newSteps);
  };

  const handleNestedUpdate = (index, section, field, value) => {
    const newSteps = [...steps];
    newSteps[index] = { 
      ...newSteps[index], 
      [section]: { ...newSteps[index][section], [field]: value }
    };
    onStepsUpdate(newSteps);
  };

  const addStep = () => {
    const stepNumber = steps.length + 1;
    const newStep = {
      name: `For Approval of Approver (${stepNumber})`,
      status: 'Pending Approval',
      step_type: 'approval',
      approvers: { roles: [], required: 'any' },
      sla: { duration: 1, unit: 'days', excludeWeekends: true }
    };
    onStepsUpdate([...steps, newStep]);
  };

  const removeStep = (index) => {
    if (window.confirm('Are you sure you want to remove this workflow step?')) {
      onStepsUpdate(steps.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">Workflow Steps</h3>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50/50 relative">
            <span className="absolute -top-3 -left-3 bg-indigo-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </span>
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => removeStep(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Step Name</label>
                <input 
                  type="text" 
                  value={step.name} 
                  onChange={e => handleStepUpdate(index, 'name', e.target.value)} 
                  className="w-full mt-1 border-gray-300 rounded"
                  placeholder="e.g., Manager Approval"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ticket Status at this Step</label>
                <input 
                  type="text" 
                  value={step.status} 
                  onChange={e => handleStepUpdate(index, 'status', e.target.value)} 
                  className="w-full mt-1 border-gray-300 rounded"
                  placeholder="e.g., Pending Manager Approval"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Step Type</label>
              <select 
                value={step.step_type} 
                onChange={e => handleStepUpdate(index, 'step_type', e.target.value)} 
                className="w-full mt-1 border-gray-300 rounded"
              >
                <option value="approval">Approval Step</option>
                <option value="task">External Task</option>
                <option value="notification">Notification Only</option>
              </select>
            </div>

            {step.step_type === 'approval' && (
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Required Approver Roles</label>
                  <input 
                    type="text" 
                    placeholder="e.g., manager,finance (comma-separated)" 
                    value={(step.approvers?.roles || []).join(',')} 
                    onChange={e => handleNestedUpdate(index, 'approvers', 'roles', e.target.value.split(',').map(r => r.trim()).filter(r => r))} 
                    className="w-full mt-1 border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available roles: {roles.map(r => r.name).join(', ') || 'None configured yet'}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Approval Requirement</label>
                  <select 
                    value={step.approvers?.required || 'any'} 
                    onChange={e => handleNestedUpdate(index, 'approvers', 'required', e.target.value)} 
                    className="w-auto mt-1 ml-2 border-gray-300 rounded"
                  >
                    <option value="any">Any one approver</option>
                    <option value="all">All approvers must approve</option>
                  </select>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">SLA (Service Level Agreement)</label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number" 
                  value={step.sla?.duration || 1} 
                  onChange={e => handleNestedUpdate(index, 'sla', 'duration', Number(e.target.value))} 
                  className="w-20 border-gray-300 rounded"
                  min="1"
                />
                <select 
                  value={step.sla?.unit || 'days'} 
                  onChange={e => handleNestedUpdate(index, 'sla', 'unit', e.target.value)} 
                  className="border-gray-300 rounded"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={step.sla?.excludeWeekends || false} 
                    onChange={e => handleNestedUpdate(index, 'sla', 'excludeWeekends', e.target.checked)} 
                    className="mr-1"
                  />
                  <span className="text-sm">Exclude weekends</span>
                </label>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={addStep} 
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800"
        >
          <PlusCircle className="h-5 w-5" /> Add Workflow Step
        </button>
      </div>
    </div>
  );
}

// 4. Comment Requirements Component
function CommentRequirements({ requirements = {}, onUpdate }) {
  const actions = [
    { key: 'approve', label: 'Approve' },
    { key: 'return', label: 'Return' },
    { key: 'reject', label: 'Reject' },
    { key: 'cancel', label: 'Cancel' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">Comment Requirements</h3>
      <p className="text-gray-600 mb-4">Select which actions require a comment from the user:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map(action => (
          <label key={action.key} className="flex items-center">
            <input 
              type="checkbox" 
              checked={requirements[action.key] || false} 
              onChange={(e) => onUpdate({ ...requirements, [action.key]: e.target.checked })} 
              className="h-5 w-5 text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Require on {action.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TICKET TYPE EDITOR (Composed of modular components)
// ============================================================================

function TicketTypeEditor({ ticketType, companies, roles, onBack, onSave }) {
  const [typeData, setTypeData] = useState(
    ticketType || {
      name: '',
      code: '',
      description: '',
      isActive: true,
      requireAttachmentOnCreate: false,
      commentRequirements: {},
      fields: [],
      workflow: { steps: [] }
    }
  );

  const handleTopLevelUpdate = (field, value) => {
    setTypeData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldsUpdate = (fields) => {
    setTypeData(prev => ({ ...prev, fields }));
  };

  const handleStepsUpdate = (steps) => {
    setTypeData(prev => ({ ...prev, workflow: { ...prev.workflow, steps } }));
  };

  const handleCommentRequirementsUpdate = (requirements) => {
    setTypeData(prev => ({ ...prev, commentRequirements: requirements }));
  };

  const handleSave = () => {
    if (!typeData.name || !typeData.code) {
      alert('Name and Code are required.');
      return;
    }
    onSave(typeData);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">
          {typeData.id ? `Editing: ${typeData.name}` : 'Create New Ticket Type'}
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={onBack} 
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2"/> Back
          </button>
          <button 
            onClick={handleSave} 
            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center"
          >
            <CheckCircle2 className="h-4 w-4 mr-2"/> Save Changes
          </button>
        </div>
      </div>

      {/* General Settings */}
      <GeneralSettings 
        typeData={typeData} 
        onUpdate={handleTopLevelUpdate} 
      />

      {/* Submission Rules */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Submission Rules</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={typeData.requireAttachmentOnCreate || false} 
              onChange={(e) => handleTopLevelUpdate('requireAttachmentOnCreate', e.target.checked)} 
              className="h-5 w-5 text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Require attachment when creating this ticket type</span>
          </label>
        </div>
      </div>

      {/* Comment Requirements */}
      <CommentRequirements 
        requirements={typeData.commentRequirements} 
        onUpdate={handleCommentRequirementsUpdate} 
      />
      
      {/* Custom Fields Builder */}
      <CustomFieldBuilder 
        fields={typeData.fields} 
        onFieldsUpdate={handleFieldsUpdate} 
      />

      {/* Workflow Steps Builder */}
      <WorkflowStepBuilder 
        steps={typeData.workflow?.steps || []} 
        onStepsUpdate={handleStepsUpdate}
        roles={roles}
      />

      {/* Preview Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Configuration Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Basic Info</p>
            <p>Name: {typeData.name || 'Not set'}</p>
            <p>Code: {typeData.code || 'Not set'}</p>
            <p>Status: {typeData.isActive ? 'Active' : 'Inactive'}</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Fields & Rules</p>
            <p>Custom Fields: {typeData.fields?.length || 0}</p>
            <p>Require Attachment: {typeData.requireAttachmentOnCreate ? 'Yes' : 'No'}</p>
            <p>Comment Rules: {Object.values(typeData.commentRequirements || {}).filter(Boolean).length} actions</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Workflow</p>
            <p>Steps: {typeData.workflow?.steps?.length || 0}</p>
            <p>Approvers Required: {typeData.workflow?.steps?.filter(s => s.step_type === 'approval').length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketTypeEditor;