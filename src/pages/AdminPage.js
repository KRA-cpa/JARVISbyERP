import React from 'react';

const AdminPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Companies</h3>
              <p className="mt-2 text-gray-600">Manage company configurations</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Roles</h3>
              <p className="mt-2 text-gray-600">Define user roles and permissions</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Ticket Types</h3>
              <p className="mt-2 text-gray-600">Configure ticket types and workflows</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
              <p className="mt-2 text-gray-600">Build dynamic form fields</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Dropdown Lists</h3>
              <p className="mt-2 text-gray-600">Manage dropdown options</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Reports</h3>
              <p className="mt-2 text-gray-600">Configure report layouts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;