/**
 * Integration Tests for Admin Workflow
 * Tests complete admin workflows end-to-end
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAPI, generateTestData, testHelpers } from '../../utils/testUtils';
import AdminPage from '../../pages/AdminPage';

// Mock all required hooks and contexts
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: {
      uid: 'admin-user-id',
      email: 'admin@test.com',
      displayName: 'Admin User'
    },
    userRoles: [{ name: 'admin', id: 'admin-role' }]
  })
}));

jest.mock('../../hooks/useAPI', () => ({
  useCompanies: jest.fn(),
  useRoles: jest.fn(),
  useDropdownLists: jest.fn(),
  useTickets: jest.fn(),
  useUsers: jest.fn(),
  useTicketTypes: jest.fn(),
  useCompanyMutations: jest.fn(),
  useRoleMutations: jest.fn(),
  useDropdownMutations: jest.fn()
}));

describe('Admin Workflow Integration Tests', () => {
  const mockData = {
    companies: [
      generateTestData.company({ id: '1', name: 'Company A', code: 'COMP_A' }),
      generateTestData.company({ id: '2', name: 'Company B', code: 'COMP_B' })
    ],
    roles: [
      { id: '1', name: 'admin', company_id: null },
      { id: '2', name: 'manager', company_id: '1' },
      { id: '3', name: 'user', company_id: '1' }
    ],
    ticketTypes: [
      generateTestData.ticketType({ id: '1', name: 'Purchase Request', code: 'PR' }),
      generateTestData.ticketType({ id: '2', name: 'Leave Request', code: 'LR' })
    ],
    tickets: [
      generateTestData.ticket({ id: '1', title: 'Test Ticket 1', status: 'New' }),
      generateTestData.ticket({ id: '2', title: 'Test Ticket 2', status: 'In Progress' })
    ],
    users: [
      { id: '1', email: 'admin@test.com', displayName: 'Admin User', roles: ['admin'] },
      { id: '2', email: 'manager@test.com', displayName: 'Manager User', roles: ['manager'] }
    ],
    dropdowns: [
      { id: '1', name: 'Priority Levels', options: ['Low', 'Medium', 'High', 'Critical'] },
      { id: '2', name: 'Departments', options: ['IT', 'HR', 'Finance', 'Operations'] }
    ]
  };

  const mockMutations = {
    companies: {
      createCompany: jest.fn(),
      updateCompany: jest.fn(),
      deleteCompany: jest.fn(),
      loading: false,
      error: null
    },
    roles: {
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      loading: false,
      error: null
    },
    dropdowns: {
      createList: jest.fn(),
      updateList: jest.fn(),
      deleteList: jest.fn(),
      loading: false,
      error: null
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.setupMocks();

    // Setup all hooks
    const hooks = require('../../hooks/useAPI');

    hooks.useCompanies.mockReturnValue({
      data: mockData.companies,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useRoles.mockReturnValue({
      data: mockData.roles,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useTicketTypes.mockReturnValue({
      data: mockData.ticketTypes,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useTickets.mockReturnValue({
      data: mockData.tickets,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useUsers.mockReturnValue({
      data: mockData.users,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useDropdownLists.mockReturnValue({
      data: mockData.dropdowns,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useCompanyMutations.mockReturnValue(mockMutations.companies);
    hooks.useRoleMutations.mockReturnValue(mockMutations.roles);
    hooks.useDropdownMutations.mockReturnValue(mockMutations.dropdowns);
  });

  describe('Admin Dashboard Overview', () => {
    it('should load admin dashboard with all modules', async () => {
      renderWithProviders(<AdminPage />);

      // Wait for loading to complete
      await testHelpers.waitForLoading();

      // Check overview tab is active by default
      expect(screen.getByText('System Overview and Statistics')).toBeInTheDocument();

      // Check API connection status
      expect(screen.getByText(/API connection/i)).toBeInTheDocument();

      // Check infinite loop monitor
      expect(screen.getByText('Infinite Loop Monitor')).toBeInTheDocument();

      // Check that statistics are displayed
      expect(screen.getByText(/companies/i)).toBeInTheDocument();
      expect(screen.getByText(/users/i)).toBeInTheDocument();
      expect(screen.getByText(/tickets/i)).toBeInTheDocument();
    });

    it('should show system health status', async () => {
      renderWithProviders(<AdminPage />);

      await testHelpers.waitForLoading();

      // Should show healthy status
      expect(screen.getByText('System Healthy')).toBeInTheDocument();
    });

    it('should allow refreshing all data', async () => {
      const hooks = require('../../hooks/useAPI');
      const mockRefetch = jest.fn();

      hooks.useCompanies().refetch = mockRefetch;
      hooks.useRoles().refetch = mockRefetch;
      hooks.useTickets().refetch = mockRefetch;

      renderWithProviders(<AdminPage />);

      await testHelpers.waitForLoading();
      await testHelpers.clickButton('Refresh All');

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('Complete Company Management Workflow', () => {
    it('should complete full company CRUD workflow', async () => {
      mockMutations.companies.createCompany.mockResolvedValue({
        success: true,
        data: generateTestData.company({ name: 'New Company', code: 'NEW' })
      });

      mockMutations.companies.updateCompany.mockResolvedValue({
        success: true,
        data: generateTestData.company({ name: 'Updated Company', code: 'UPD' })
      });

      mockMutations.companies.deleteCompany.mockResolvedValue({ success: true });

      renderWithProviders(<AdminPage />);

      // Navigate to Companies tab
      await testHelpers.clickButton('Companies');

      // Wait for companies to load
      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
        expect(screen.getByText('Company B')).toBeInTheDocument();
      });

      // CREATE: Add new company
      await testHelpers.clickButton('Add Company');
      await testHelpers.fillField('Company Name', 'New Company');
      await testHelpers.fillField('Company Code', 'NEW');
      await testHelpers.clickButton('Create Company');

      await waitFor(() => {
        expect(mockMutations.companies.createCompany).toHaveBeenCalledWith({
          name: 'New Company',
          code: 'NEW'
        });
      });

      // UPDATE: Edit existing company
      const editButtons = screen.getAllByText(/edit/i);
      await userEvent.click(editButtons[0]);

      const nameField = screen.getByDisplayValue('Company A');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Company');

      await testHelpers.clickButton('Update Company');

      await waitFor(() => {
        expect(mockMutations.companies.updateCompany).toHaveBeenCalled();
      });

      // DELETE: Remove company
      const deleteButtons = screen.getAllByText(/delete/i);
      await userEvent.click(deleteButtons[0]);
      await testHelpers.clickButton('Delete'); // Confirm deletion

      await waitFor(() => {
        expect(mockMutations.companies.deleteCompany).toHaveBeenCalled();
      });
    });
  });

  describe('Multi-Tab Navigation Workflow', () => {
    it('should navigate between admin tabs seamlessly', async () => {
      renderWithProviders(<AdminPage />);

      // Start at Overview
      expect(screen.getByText('System Overview and Statistics')).toBeInTheDocument();

      // Navigate to Companies
      await testHelpers.clickButton('Companies');
      await waitFor(() => {
        expect(screen.getByText('Company Management')).toBeInTheDocument();
      });

      // Navigate to Roles
      await testHelpers.clickButton('Roles');
      await waitFor(() => {
        expect(screen.getByText('Role Management')).toBeInTheDocument();
      });

      // Navigate to Ticket Types
      await testHelpers.clickButton('Ticket Types');
      await waitFor(() => {
        expect(screen.getByText('Ticket Type Management')).toBeInTheDocument();
      });

      // Navigate to Dropdowns
      await testHelpers.clickButton('Dropdowns');
      await waitFor(() => {
        expect(screen.getByText('Dropdown Management')).toBeInTheDocument();
      });

      // Navigate back to Overview
      await testHelpers.clickButton('Overview');
      await waitFor(() => {
        expect(screen.getByText('System Overview and Statistics')).toBeInTheDocument();
      });
    });

    it('should maintain state when switching tabs', async () => {
      renderWithProviders(<AdminPage />);

      // Go to Companies and start creating
      await testHelpers.clickButton('Companies');
      await testHelpers.clickButton('Add Company');

      // Switch to another tab
      await testHelpers.clickButton('Roles');

      // Switch back to Companies
      await testHelpers.clickButton('Companies');

      // Form should be reset (this is expected behavior)
      expect(screen.queryByText(/create new company/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle API failures gracefully', async () => {
      const hooks = require('../../hooks/useAPI');

      // Simulate API failure
      hooks.useCompanies.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load companies',
        refetch: jest.fn()
      });

      renderWithProviders(<AdminPage />);

      await testHelpers.clickButton('Companies');

      expect(screen.getByText(/failed to load companies/i)).toBeInTheDocument();
    });

    it('should handle creation failures with user feedback', async () => {
      mockMutations.companies.createCompany.mockRejectedValue(
        new Error('Company code already exists')
      );

      renderWithProviders(<AdminPage />);

      await testHelpers.clickButton('Companies');
      await testHelpers.clickButton('Add Company');
      await testHelpers.fillField('Company Name', 'Test Company');
      await testHelpers.fillField('Company Code', 'TEST');
      await testHelpers.clickButton('Create Company');

      await waitFor(() => {
        expect(screen.getByText(/company code already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      const hooks = require('../../hooks/useAPI');

      hooks.useCompanies.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      });

      renderWithProviders(<AdminPage />);

      await testHelpers.clickButton('Companies');

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load quickly with large datasets', async () => {
      const largeDataset = {
        companies: Array.from({ length: 50 }, (_, i) =>
          generateTestData.company({ id: `${i}`, name: `Company ${i}`, code: `C${i}` })
        ),
        roles: Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          name: `Role ${i}`,
          company_id: i % 2 === 0 ? '1' : '2'
        }))
      };

      const hooks = require('../../hooks/useAPI');
      hooks.useCompanies.mockReturnValue({
        data: largeDataset.companies,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const start = performance.now();
      renderWithProviders(<AdminPage />);

      await testHelpers.clickButton('Companies');
      const end = performance.now();

      expect(end - start).toBeLessThan(200); // Should load in under 200ms
    });

    it('should be responsive during heavy operations', async () => {
      renderWithProviders(<AdminPage />);

      // Simulate heavy operation
      mockMutations.companies.createCompany.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      await testHelpers.clickButton('Companies');
      await testHelpers.clickButton('Add Company');
      await testHelpers.fillField('Company Name', 'Test Company');
      await testHelpers.fillField('Company Code', 'TEST');

      // UI should remain responsive
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeEnabled();

      await testHelpers.clickButton('Create Company');

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should support full keyboard navigation', async () => {
      renderWithProviders(<AdminPage />);

      // Tab through main navigation
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      const companiesTab = screen.getByRole('button', { name: /companies/i });

      overviewTab.focus();
      expect(overviewTab).toHaveFocus();

      // Navigate with keyboard
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(companiesTab).toHaveFocus();
      });
    });

    it('should have proper ARIA attributes', () => {
      renderWithProviders(<AdminPage />);

      // Check for proper roles and labels
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5); // Overview, Companies, Roles, Ticket Types, Dropdowns
    });

    it('should announce status changes to screen readers', async () => {
      renderWithProviders(<AdminPage />);

      await testHelpers.clickButton('Companies');
      await testHelpers.clickButton('Add Company');

      // Form validation errors should be announced
      await testHelpers.clickButton('Create Company');

      const errorMessage = screen.getByText(/company name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });
});