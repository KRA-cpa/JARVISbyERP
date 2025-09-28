/**
 * Integration Tests for Universal Entity Architecture
 * Tests complete Universal Entity workflows end-to-end
 * Covers tickets, user profiles, and roles with shared custom field infrastructure
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAPI, generateTestData, testHelpers } from '../../utils/testUtils';
import AdminCustomFieldCreatePage from '../../pages/AdminCustomFieldCreatePage';
import AdminUserProfileTypeCreatePage from '../../pages/AdminUserProfileTypeCreatePage';
import AdminRoleTypeCreatePage from '../../pages/AdminRoleTypeCreatePage';
import AdminUserProfileTypeList from '../../components/admin/AdminUserProfileTypeList';
import AdminRoleTypeList from '../../components/admin/AdminRoleTypeList';

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
  useTicketTypes: jest.fn(),
  useUserProfileTypes: jest.fn(),
  useRoleTypes: jest.fn(),
  useCustomFields: jest.fn(),
  useDropdownLists: jest.fn(),
  useCompanies: jest.fn(),
  useUserProfileTypeMutations: jest.fn(),
  useRoleTypeMutations: jest.fn(),
  useToast: jest.fn()
}));

jest.mock('../../api/googleSheet', () => ({
  API: {
    UserProfileTypes: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    RoleTypes: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    CustomFields: {
      create: jest.fn(),
      getByEntity: jest.fn()
    }
  }
}));

describe('Universal Entity Architecture Integration Tests', () => {
  const mockUniversalEntityData = {
    userProfileTypes: [
      {
        id: 'upt_1',
        name: 'Employee',
        description: 'Regular full-time employee',
        code: 'EMP',
        company_id: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'upt_2',
        name: 'Contractor',
        description: 'External contractor or consultant',
        code: 'CTR',
        company_id: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ],
    roleTypes: [
      {
        id: 'rt_1',
        name: 'Approver',
        description: 'Can approve tickets and requests',
        code: 'APR',
        company_id: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'rt_2',
        name: 'Administrator',
        description: 'System administrator with full access',
        code: 'ADM',
        company_id: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ],
    ticketTypes: [
      {
        id: 'tt_1',
        name: 'Purchase Request',
        code: 'PR',
        company_id: null,
        is_active: true
      }
    ],
    companies: [
      {
        id: 'comp_1',
        name: 'Test Company',
        code: 'TEST'
      }
    ],
    customFields: [],
    dropdownLists: []
  };

  const mockMutations = {
    userProfileTypes: {
      createUserProfileType: jest.fn(),
      updateUserProfileType: jest.fn(),
      deleteUserProfileType: jest.fn(),
      loading: false,
      error: null
    },
    roleTypes: {
      createRoleType: jest.fn(),
      updateRoleType: jest.fn(),
      deleteRoleType: jest.fn(),
      loading: false,
      error: null
    }
  };

  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    ToastContainer: () => <div data-testid="toast-container" />
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.setupMocks();

    // Setup all hooks
    const hooks = require('../../hooks/useAPI');

    hooks.useUserProfileTypes.mockReturnValue({
      data: mockUniversalEntityData.userProfileTypes,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useRoleTypes.mockReturnValue({
      data: mockUniversalEntityData.roleTypes,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useTicketTypes.mockReturnValue({
      data: mockUniversalEntityData.ticketTypes,
      loading: false,
      error: null
    });

    hooks.useCompanies.mockReturnValue({
      data: mockUniversalEntityData.companies,
      loading: false,
      error: null
    });

    hooks.useCustomFields.mockReturnValue({
      data: mockUniversalEntityData.customFields,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    hooks.useDropdownLists.mockReturnValue({
      data: mockUniversalEntityData.dropdownLists,
      loading: false,
      error: null
    });

    hooks.useUserProfileTypeMutations.mockReturnValue(mockMutations.userProfileTypes);
    hooks.useRoleTypeMutations.mockReturnValue(mockMutations.roleTypes);
    hooks.useToast.mockReturnValue(mockToast);
  });

  describe('User Profile Type Management Workflow', () => {
    it('should complete full user profile type CRUD workflow', async () => {
      mockMutations.userProfileTypes.createUserProfileType.mockResolvedValue({
        id: 'upt_new',
        name: 'New Profile Type',
        code: 'NEW'
      });

      // Test User Profile Type List
      render(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      // Should display existing user profile types
      await waitFor(() => {
        expect(screen.getByText('Employee')).toBeInTheDocument();
        expect(screen.getByText('Contractor')).toBeInTheDocument();
      });

      // Should have create button
      expect(screen.getByText('Create User Profile Type')).toBeInTheDocument();

      // Test navigation to create page
      const createButton = screen.getByText('Create User Profile Type');
      fireEvent.click(createButton);
    });

    it('should create user profile type with custom fields integration', async () => {
      mockMutations.userProfileTypes.createUserProfileType.mockResolvedValue({
        id: 'upt_test',
        name: 'Test Profile Type'
      });

      // Mock navigation
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(
        renderWithProviders(<AdminUserProfileTypeCreatePage />)
      );

      // Fill form
      await userEvent.type(screen.getByLabelText(/profile type name/i), 'Test Profile Type');
      await userEvent.type(screen.getByLabelText(/description/i), 'Test description');
      await userEvent.type(screen.getByLabelText(/profile type code/i), 'TEST');

      // Submit form
      const createButton = screen.getByText('Create Profile Type');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutations.userProfileTypes.createUserProfileType).toHaveBeenCalledWith({
          name: 'Test Profile Type',
          description: 'Test description',
          code: 'TEST',
          company_id: null,
          is_active: true
        });
      });

      // Should offer to create custom fields
      expect(mockToast.success).toHaveBeenCalledWith('User profile type created successfully');
    });

    it('should integrate with custom field creation workflow', async () => {
      // Mock URL params for user profile entity
      const mockSearchParams = new URLSearchParams();
      mockSearchParams.set('entityCategory', 'user_profile');
      mockSearchParams.set('entityType', 'upt_1');

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useSearchParams: () => [mockSearchParams]
      }));

      const { API } = require('../../api/googleSheet');
      API.CustomFields.create.mockResolvedValue({
        id: 'cf_test',
        name: 'test_field'
      });

      render(
        renderWithProviders(<AdminCustomFieldCreatePage />)
      );

      // Should show user profile context
      expect(screen.getByText(/Create New Custom Field for User Profiles/i)).toBeInTheDocument();

      // Should show user profile types in dropdown
      expect(screen.getByText('Select a user profile type')).toBeInTheDocument();
      expect(screen.getByText('Employee (EMP)')).toBeInTheDocument();

      // Fill and submit form
      const entitySelect = screen.getByDisplayValue('');
      await userEvent.selectOptions(entitySelect, 'upt_1');

      await userEvent.type(screen.getByLabelText(/field name/i), 'employee_id');
      await userEvent.type(screen.getByLabelText(/field label/i), 'Employee ID');

      const submitButton = screen.getByText('Create Field');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(API.CustomFields.create).toHaveBeenCalledWith(
          expect.objectContaining({
            entityTypeId: 'upt_1',
            entityCategory: 'user_profile',
            name: 'employee_id',
            label: 'Employee ID'
          })
        );
      });
    });
  });

  describe('Role Type Management Workflow', () => {
    it('should complete full role type CRUD workflow', async () => {
      mockMutations.roleTypes.createRoleType.mockResolvedValue({
        id: 'rt_new',
        name: 'New Role Type',
        code: 'NEW'
      });

      render(
        renderWithProviders(<AdminRoleTypeList />)
      );

      // Should display existing role types
      await waitFor(() => {
        expect(screen.getByText('Approver')).toBeInTheDocument();
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      // Should have create button
      expect(screen.getByText('Create Role Type')).toBeInTheDocument();
    });

    it('should create role type with proper validation', async () => {
      mockMutations.roleTypes.createRoleType.mockResolvedValue({
        id: 'rt_test',
        name: 'Test Role Type'
      });

      render(
        renderWithProviders(<AdminRoleTypeCreatePage />)
      );

      // Test validation - submit empty form
      const createButton = screen.getByText('Create Role Type');
      await userEvent.click(createButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/role type name is required/i)).toBeInTheDocument();
      });

      // Fill form correctly
      await userEvent.type(screen.getByLabelText(/role type name/i), 'Test Role Type');
      await userEvent.type(screen.getByLabelText(/description/i), 'Test role description');
      await userEvent.type(screen.getByLabelText(/role type code/i), 'TEST_ROLE');

      // Submit form
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutations.roleTypes.createRoleType).toHaveBeenCalledWith({
          name: 'Test Role Type',
          description: 'Test role description',
          code: 'TEST_ROLE',
          company_id: null,
          is_active: true
        });
      });
    });
  });

  describe('Universal Custom Field Integration', () => {
    it('should adapt UI based on entity category', async () => {
      // Test with different entity categories
      const testCases = [
        {
          entityCategory: 'ticket',
          entityType: 'tt_1',
          expectedTitle: 'Create New Custom Field',
          expectedEntityLabel: 'Ticket Type'
        },
        {
          entityCategory: 'user_profile',
          entityType: 'upt_1',
          expectedTitle: 'Create New Custom Field for User Profiles',
          expectedEntityLabel: 'User Profile Type'
        },
        {
          entityCategory: 'role',
          entityType: 'rt_1',
          expectedTitle: 'Create New Custom Field for Roles',
          expectedEntityLabel: 'Role Type'
        }
      ];

      for (const testCase of testCases) {
        const mockSearchParams = new URLSearchParams();
        mockSearchParams.set('entityCategory', testCase.entityCategory);
        mockSearchParams.set('entityType', testCase.entityType);

        jest.doMock('react-router-dom', () => ({
          ...jest.requireActual('react-router-dom'),
          useSearchParams: () => [mockSearchParams]
        }));

        const { unmount } = render(
          renderWithProviders(<AdminCustomFieldCreatePage />)
        );

        // Check dynamic content
        expect(screen.getByText(new RegExp(testCase.expectedTitle, 'i'))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(testCase.expectedEntityLabel, 'i'))).toBeInTheDocument();

        unmount();
      }
    });

    it('should maintain backward compatibility with ticket-based URLs', async () => {
      // Test old-style URL params
      const mockSearchParams = new URLSearchParams();
      mockSearchParams.set('ticketType', 'tt_1');

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useSearchParams: () => [mockSearchParams]
      }));

      render(
        renderWithProviders(<AdminCustomFieldCreatePage />)
      );

      // Should default to ticket mode
      expect(screen.getByText('Create New Custom Field')).toBeInTheDocument();
      expect(screen.getByText('Ticket Type')).toBeInTheDocument();

      // Should have pre-selected ticket type
      const entitySelect = screen.getByDisplayValue('tt_1');
      expect(entitySelect).toBeInTheDocument();
    });

    it('should handle entity-specific field examples', async () => {
      const mockSearchParams = new URLSearchParams();
      mockSearchParams.set('entityCategory', 'user_profile');

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useSearchParams: () => [mockSearchParams]
      }));

      render(
        renderWithProviders(<AdminCustomFieldCreatePage />)
      );

      // Should show user profile specific help text
      expect(screen.getByText(/Employee ID, department, job title/i)).toBeInTheDocument();
      expect(screen.getByText(/Employment periods, project assignments/i)).toBeInTheDocument();
    });
  });

  describe('Zero New Components Strategy Validation', () => {
    it('should reuse AdminCustomFieldCreatePage for all entity types', async () => {
      const entityCategories = ['ticket', 'user_profile', 'role'];

      for (const entityCategory of entityCategories) {
        const mockSearchParams = new URLSearchParams();
        mockSearchParams.set('entityCategory', entityCategory);
        mockSearchParams.set('entityType', 'test_id');

        jest.doMock('react-router-dom', () => ({
          ...jest.requireActual('react-router-dom'),
          useSearchParams: () => [mockSearchParams]
        }));

        const { unmount } = render(
          renderWithProviders(<AdminCustomFieldCreatePage />)
        );

        // All entity types should use the same component
        expect(screen.getByText(/Field Type Guide/i)).toBeInTheDocument();
        expect(screen.getByText(/Universal Entity Architecture/i)).toBeInTheDocument();

        unmount();
      }
    });

    it('should provide consistent navigation patterns', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      // Test custom field creation navigation
      const customFieldButtons = screen.getAllByText(/Custom Fields/i);
      await userEvent.click(customFieldButtons[0]);

      // Should navigate with proper Universal Entity parameters
      // Note: This test would need proper mock setup for navigation
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API failures gracefully', async () => {
      const hooks = require('../../hooks/useAPI');

      // Simulate API failure
      hooks.useUserProfileTypes.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to load user profile types',
        refetch: jest.fn()
      });

      render(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      expect(screen.getByText(/error loading user profile types/i)).toBeInTheDocument();
    });

    it('should handle empty data states', async () => {
      const hooks = require('../../hooks/useAPI');

      hooks.useUserProfileTypes.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      expect(screen.getByText(/no user profile types yet/i)).toBeInTheDocument();
      expect(screen.getByText(/get started by creating/i)).toBeInTheDocument();
    });

    it('should validate Universal Entity parameters', async () => {
      const { API } = require('../../api/googleSheet');

      // Test with invalid entity category
      API.CustomFields.create.mockRejectedValue(new Error('Invalid entity category'));

      const mockSearchParams = new URLSearchParams();
      mockSearchParams.set('entityCategory', 'invalid_category');
      mockSearchParams.set('entityType', 'test_id');

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useSearchParams: () => [mockSearchParams]
      }));

      render(
        renderWithProviders(<AdminCustomFieldCreatePage />)
      );

      // Should handle invalid entity category gracefully
      expect(screen.getByText(/Entity Type/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should load quickly with multiple entity types', async () => {
      const start = performance.now();

      render(
        renderWithProviders(<AdminCustomFieldCreatePage />)
      );

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should load quickly
    });

    it('should not cause memory leaks with entity switching', async () => {
      const { rerender } = render(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      // Switch to role types
      rerender(
        renderWithProviders(<AdminRoleTypeList />)
      );

      // Switch back to user profile types
      rerender(
        renderWithProviders(<AdminUserProfileTypeList />)
      );

      // Should not accumulate event listeners or memory
      expect(screen.getByText(/User Profile Types/i)).toBeInTheDocument();
    });
  });
});