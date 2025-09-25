/**
 * Tests for AdminCompanyManager Component
 * Tests CRUD operations, form handling, and API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminCompanyManager from './AdminCompanyManager';
import { renderWithProviders, mockAPI, generateTestData, testHelpers } from '../../utils/testUtils';

// Mock the API
jest.mock('../../api/googleSheet', () => ({
  API: {
    Companies: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock useAPI hooks
jest.mock('../../hooks/useAPI', () => ({
  useCompanies: jest.fn(),
  useCompanyMutations: jest.fn()
}));

describe('AdminCompanyManager Component', () => {
  const mockCompanies = [
    generateTestData.company({ id: '1', name: 'Test Company 1', code: 'TC1' }),
    generateTestData.company({ id: '2', name: 'Test Company 2', code: 'TC2' })
  ];

  const mockUseCompanies = {
    data: mockCompanies,
    loading: false,
    error: null,
    refetch: jest.fn()
  };

  const mockUseCompanyMutations = {
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.setupMocks();

    const { useCompanies, useCompanyMutations } = require('../../hooks/useAPI');
    useCompanies.mockReturnValue(mockUseCompanies);
    useCompanyMutations.mockReturnValue(mockUseCompanyMutations);
  });

  describe('Rendering', () => {
    it('should render company list', () => {
      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByText('Company Management')).toBeInTheDocument();
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
      expect(screen.getByText('TC1')).toBeInTheDocument();
      expect(screen.getByText('TC2')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      const { useCompanies } = require('../../hooks/useAPI');
      useCompanies.mockReturnValue({
        ...mockUseCompanies,
        loading: true
      });

      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render error state', () => {
      const { useCompanies } = require('../../hooks/useAPI');
      useCompanies.mockReturnValue({
        ...mockUseCompanies,
        error: 'Failed to load companies'
      });

      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByText(/failed to load companies/i)).toBeInTheDocument();
    });

    it('should render empty state', () => {
      const { useCompanies } = require('../../hooks/useAPI');
      useCompanies.mockReturnValue({
        ...mockUseCompanies,
        data: []
      });

      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
    });
  });

  describe('Company Creation', () => {
    it('should open create form when Add Company is clicked', async () => {
      renderWithProviders(<AdminCompanyManager />);

      await testHelpers.clickButton('Add Company');

      expect(screen.getByText(/create new company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company code/i)).toBeInTheDocument();
    });

    it('should create new company successfully', async () => {
      mockUseCompanyMutations.createCompany.mockResolvedValue({
        success: true,
        data: generateTestData.company({ name: 'New Company', code: 'NEW' })
      });

      renderWithProviders(<AdminCompanyManager />);

      // Open create form
      await testHelpers.clickButton('Add Company');

      // Fill form
      await testHelpers.fillField('Company Name', 'New Company');
      await testHelpers.fillField('Company Code', 'NEW');

      // Submit form
      await testHelpers.clickButton('Create Company');

      await waitFor(() => {
        expect(mockUseCompanyMutations.createCompany).toHaveBeenCalledWith({
          name: 'New Company',
          code: 'NEW'
        });
      });

      expect(mockUseCompanies.refetch).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Open create form
      await testHelpers.clickButton('Add Company');

      // Try to submit empty form
      await testHelpers.clickButton('Create Company');

      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/company code is required/i)).toBeInTheDocument();
    });

    it('should validate company code format', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Open create form
      await testHelpers.clickButton('Add Company');

      // Fill invalid code
      await testHelpers.fillField('Company Name', 'Test Company');
      await testHelpers.fillField('Company Code', 'invalid code');

      await testHelpers.clickButton('Create Company');

      expect(screen.getByText(/company code must be 2-10 uppercase letters/i)).toBeInTheDocument();
    });

    it('should handle creation errors', async () => {
      mockUseCompanyMutations.createCompany.mockRejectedValue(
        new Error('Company code already exists')
      );

      renderWithProviders(<AdminCompanyManager />);

      // Open create form and fill
      await testHelpers.clickButton('Add Company');
      await testHelpers.fillField('Company Name', 'Test Company');
      await testHelpers.fillField('Company Code', 'TEST');
      await testHelpers.clickButton('Create Company');

      await waitFor(() => {
        expect(screen.getByText(/company code already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Company Editing', () => {
    it('should open edit form when Edit is clicked', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Find and click edit button for first company
      const editButtons = screen.getAllByText(/edit/i);
      await userEvent.click(editButtons[0]);

      expect(screen.getByText(/edit company/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Company 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TC1')).toBeInTheDocument();
    });

    it('should update company successfully', async () => {
      mockUseCompanyMutations.updateCompany.mockResolvedValue({
        success: true,
        data: generateTestData.company({ id: '1', name: 'Updated Company', code: 'UPD' })
      });

      renderWithProviders(<AdminCompanyManager />);

      // Open edit form
      const editButtons = screen.getAllByText(/edit/i);
      await userEvent.click(editButtons[0]);

      // Update fields
      const nameField = screen.getByDisplayValue('Test Company 1');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Company');

      const codeField = screen.getByDisplayValue('TC1');
      await userEvent.clear(codeField);
      await userEvent.type(codeField, 'UPD');

      // Submit
      await testHelpers.clickButton('Update Company');

      await waitFor(() => {
        expect(mockUseCompanyMutations.updateCompany).toHaveBeenCalledWith('1', {
          name: 'Updated Company',
          code: 'UPD'
        });
      });
    });

    it('should cancel edit form', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Open edit form
      const editButtons = screen.getAllByText(/edit/i);
      await userEvent.click(editButtons[0]);

      // Cancel
      await testHelpers.clickButton('Cancel');

      expect(screen.queryByText(/edit company/i)).not.toBeInTheDocument();
    });
  });

  describe('Company Deletion', () => {
    it('should show confirmation dialog when Delete is clicked', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Find and click delete button
      const deleteButtons = screen.getAllByText(/delete/i);
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('should delete company when confirmed', async () => {
      mockUseCompanyMutations.deleteCompany.mockResolvedValue({ success: true });

      renderWithProviders(<AdminCompanyManager />);

      // Click delete and confirm
      const deleteButtons = screen.getAllByText(/delete/i);
      await userEvent.click(deleteButtons[0]);

      await testHelpers.clickButton('Delete');

      await waitFor(() => {
        expect(mockUseCompanyMutations.deleteCompany).toHaveBeenCalledWith('1');
      });

      expect(mockUseCompanies.refetch).toHaveBeenCalled();
    });

    it('should cancel deletion', async () => {
      renderWithProviders(<AdminCompanyManager />);

      // Click delete and cancel
      const deleteButtons = screen.getAllByText(/delete/i);
      await userEvent.click(deleteButtons[0]);

      await testHelpers.clickButton('Cancel');

      expect(mockUseCompanyMutations.deleteCompany).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      mockUseCompanyMutations.deleteCompany.mockRejectedValue(
        new Error('Cannot delete company with active tickets')
      );

      renderWithProviders(<AdminCompanyManager />);

      // Click delete and confirm
      const deleteButtons = screen.getAllByText(/delete/i);
      await userEvent.click(deleteButtons[0]);
      await testHelpers.clickButton('Delete');

      await waitFor(() => {
        expect(screen.getByText(/cannot delete company with active tickets/i)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when Refresh button is clicked', async () => {
      renderWithProviders(<AdminCompanyManager />);

      await testHelpers.clickButton('Refresh');

      expect(mockUseCompanies.refetch).toHaveBeenCalled();
    });

    it('should show loading state during refresh', async () => {
      const { useCompanies } = require('../../hooks/useAPI');
      useCompanies.mockReturnValue({
        ...mockUseCompanies,
        loading: true
      });

      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<AdminCompanyManager />);

      expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<AdminCompanyManager />);

      const addButton = screen.getByRole('button', { name: /add company/i });
      const refreshButton = screen.getByRole('button', { name: /refresh/i });

      // Tab navigation
      addButton.focus();
      expect(addButton).toHaveFocus();

      fireEvent.keyDown(addButton, { key: 'Tab' });
      await waitFor(() => {
        expect(refreshButton).toHaveFocus();
      });
    });

    it('should announce form validation errors', async () => {
      renderWithProviders(<AdminCompanyManager />);

      await testHelpers.clickButton('Add Company');
      await testHelpers.clickButton('Create Company');

      const errorMessage = screen.getByText(/company name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Performance', () => {
    it('should render large lists efficiently', () => {
      const manyCompanies = Array.from({ length: 100 }, (_, i) =>
        generateTestData.company({ id: `${i}`, name: `Company ${i}`, code: `C${i}` })
      );

      const { useCompanies } = require('../../hooks/useAPI');
      useCompanies.mockReturnValue({
        ...mockUseCompanies,
        data: manyCompanies
      });

      const start = performance.now();
      renderWithProviders(<AdminCompanyManager />);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should render in under 100ms
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = renderWithProviders(<AdminCompanyManager />);

      const initialRenderCount = screen.getAllByText(/test company/i).length;

      // Re-render with same props
      rerender(<AdminCompanyManager />);

      const afterRerenderCount = screen.getAllByText(/test company/i).length;
      expect(afterRerenderCount).toBe(initialRenderCount);
    });
  });
});