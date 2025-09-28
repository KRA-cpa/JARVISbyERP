/**
 * Tests for useAPI hooks
 * Tests API integration, infinite loop prevention, and data fetching
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useCompanies, useUsers, useTickets, useTicketTypes, useUserProfileTypes, useRoleTypes, useUserProfileTypeMutations, useRoleTypeMutations } from './useAPI';
import { mockAPI, mockAPIResponses } from '../utils/testUtils';

// Mock the API module
jest.mock('../api/googleSheet', () => ({
  API: {
    Companies: {
      getAll: jest.fn()
    },
    Users: {
      getAll: jest.fn()
    },
    Tickets: {
      getAll: jest.fn()
    },
    TicketTypes: {
      getAll: jest.fn()
    },
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
    System: {
      ping: jest.fn()
    }
  }
}));

// Mock infinite loop prevention
jest.mock('../utils/infiniteLoopPrevention', () => ({
  APILoopDetector: {
    isLoopDetected: jest.fn(() => false),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn()
  }
}));

describe('useAPI Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.setupMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useCompanies', () => {
    it('should fetch companies successfully', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockResolvedValue(mockAPIResponses.companies.data);

      const { result } = renderHook(() => useCompanies());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAPIResponses.companies.data);
      expect(result.current.error).toBe(null);
      expect(API.Companies.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const { API } = require('../api/googleSheet');
      const errorMessage = 'Failed to fetch companies';
      API.Companies.getAll.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should provide refetch functionality', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockResolvedValue(mockAPIResponses.companies.data);

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear the mock to test refetch
      API.Companies.getAll.mockClear();
      API.Companies.getAll.mockResolvedValue([]);

      // Trigger refetch
      await result.current.refetch();

      expect(API.Companies.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUsers', () => {
    it('should fetch users successfully', async () => {
      const { API } = require('../api/googleSheet');
      API.Users.getAll.mockResolvedValue(mockAPIResponses.users.data);

      const { result } = renderHook(() => useUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAPIResponses.users.data);
      expect(result.current.error).toBe(null);
    });
  });

  describe('useTickets', () => {
    it('should fetch tickets with filters', async () => {
      const { API } = require('../api/googleSheet');
      API.Tickets.getAll.mockResolvedValue(mockAPIResponses.tickets.data);

      const filters = { status: 'New' };
      const { result } = renderHook(() => useTickets(filters));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAPIResponses.tickets.data);
      expect(API.Tickets.getAll).toHaveBeenCalledWith(filters);
    });

    it('should handle filter changes', async () => {
      const { API } = require('../api/googleSheet');
      API.Tickets.getAll.mockResolvedValue(mockAPIResponses.tickets.data);

      const { result, rerender } = renderHook(
        ({ filters }) => useTickets(filters),
        { initialProps: { filters: { status: 'New' } } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change filters
      rerender({ filters: { status: 'In Progress' } });

      await waitFor(() => {
        expect(API.Tickets.getAll).toHaveBeenCalledWith({ status: 'In Progress' });
      });
    });
  });

  describe('useTicketTypes', () => {
    it('should fetch ticket types with company filter', async () => {
      const { API } = require('../api/googleSheet');
      API.TicketTypes = { getAll: jest.fn() };
      API.TicketTypes.getAll.mockResolvedValue(mockAPIResponses.ticketTypes.data);

      const companyId = 'comp_1';
      const { result } = renderHook(() => useTicketTypes(companyId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAPIResponses.ticketTypes.data);
      expect(API.TicketTypes.getAll).toHaveBeenCalledWith(companyId);
    });
  });

  describe('Infinite Loop Prevention', () => {
    it('should detect and prevent infinite loops', async () => {
      const { APILoopDetector } = require('../utils/infiniteLoopPrevention');
      APILoopDetector.isLoopDetected.mockReturnValue(true);

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Infinite loop detected');
      expect(APILoopDetector.isLoopDetected).toHaveBeenCalledWith('getCompanies');
    });

    it('should record API successes and failures', async () => {
      const { API } = require('../api/googleSheet');
      const { APILoopDetector } = require('../utils/infiniteLoopPrevention');

      API.Companies.getAll.mockResolvedValue(mockAPIResponses.companies.data);

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(APILoopDetector.recordSuccess).toHaveBeenCalledWith('getCompanies');
    });

    it('should track call counts', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockResolvedValue(mockAPIResponses.companies.data);

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.callCount).toBe(1);

      // Trigger refetch
      await result.current.refetch();
      expect(result.current.callCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockRejectedValue(new Error('JSON parse error'));

      const { result } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('JSON parse error');
    });
  });

  describe('Performance', () => {
    it('should not refetch when dependencies haven\'t changed', async () => {
      const { API } = require('../api/googleSheet');
      API.Companies.getAll.mockResolvedValue(mockAPIResponses.companies.data);

      const { result, rerender } = renderHook(() => useCompanies());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = API.Companies.getAll.mock.calls.length;

      // Rerender without changing dependencies
      rerender();

      // Should not trigger additional API calls
      expect(API.Companies.getAll.mock.calls.length).toBe(initialCallCount);
    });

    it('should refetch when dependencies change', async () => {
      const { API } = require('../api/googleSheet');
      API.Tickets.getAll.mockResolvedValue(mockAPIResponses.tickets.data);

      const { result, rerender } = renderHook(
        ({ filters }) => useTickets(filters),
        { initialProps: { filters: { status: 'New' } } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = API.Tickets.getAll.mock.calls.length;

      // Change dependencies
      rerender({ filters: { status: 'Completed' } });

      // Should trigger additional API call
      expect(API.Tickets.getAll.mock.calls.length).toBe(initialCallCount + 1);
    });
  });

  describe('Universal Entity Architecture Hooks', () => {
    describe('useUserProfileTypes', () => {
      it('should fetch user profile types successfully', async () => {
        const { API } = require('../api/googleSheet');
        const mockUserProfileTypes = [
          { id: 'upt_1', name: 'Employee', code: 'EMP' },
          { id: 'upt_2', name: 'Contractor', code: 'CTR' }
        ];
        API.UserProfileTypes.getAll.mockResolvedValue(mockUserProfileTypes);

        const { result } = renderHook(() => useUserProfileTypes());

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);

        // Wait for data to load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockUserProfileTypes);
        expect(result.current.error).toBe(null);
        expect(API.UserProfileTypes.getAll).toHaveBeenCalledTimes(1);
      });

      it('should handle user profile type API errors gracefully', async () => {
        const { API } = require('../api/googleSheet');
        const errorMessage = 'Failed to fetch user profile types';
        API.UserProfileTypes.getAll.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useUserProfileTypes());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    describe('useRoleTypes', () => {
      it('should fetch role types successfully', async () => {
        const { API } = require('../api/googleSheet');
        const mockRoleTypes = [
          { id: 'rt_1', name: 'Approver', code: 'APR' },
          { id: 'rt_2', name: 'Administrator', code: 'ADM' }
        ];
        API.RoleTypes.getAll.mockResolvedValue(mockRoleTypes);

        const { result } = renderHook(() => useRoleTypes());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockRoleTypes);
        expect(result.current.error).toBe(null);
        expect(API.RoleTypes.getAll).toHaveBeenCalledTimes(1);
      });
    });

    describe('useUserProfileTypeMutations', () => {
      it('should create user profile types successfully', async () => {
        const { API } = require('../api/googleSheet');
        const mockCreatedType = { id: 'upt_new', name: 'New Profile Type' };
        API.UserProfileTypes.create.mockResolvedValue(mockCreatedType);

        const { result } = renderHook(() => useUserProfileTypeMutations());

        const createData = {
          name: 'New Profile Type',
          description: 'Test description',
          code: 'NEW'
        };

        const createdType = await result.current.createUserProfileType(createData);

        expect(createdType).toEqual(mockCreatedType);
        expect(API.UserProfileTypes.create).toHaveBeenCalledWith(createData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      it('should handle creation errors', async () => {
        const { API } = require('../api/googleSheet');
        const errorMessage = 'User profile type name already exists';
        API.UserProfileTypes.create.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useUserProfileTypeMutations());

        try {
          await result.current.createUserProfileType({
            name: 'Duplicate Type'
          });
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    describe('useRoleTypeMutations', () => {
      it('should create role types successfully', async () => {
        const { API } = require('../api/googleSheet');
        const mockCreatedType = { id: 'rt_new', name: 'New Role Type' };
        API.RoleTypes.create.mockResolvedValue(mockCreatedType);

        const { result } = renderHook(() => useRoleTypeMutations());

        const createData = {
          name: 'New Role Type',
          description: 'Test role description',
          code: 'NEW_ROLE'
        };

        const createdType = await result.current.createRoleType(createData);

        expect(createdType).toEqual(mockCreatedType);
        expect(API.RoleTypes.create).toHaveBeenCalledWith(createData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Universal Entity Architecture Integration', () => {
    it('should handle cross-entity operations without conflicts', async () => {
      const { API } = require('../api/googleSheet');

      // Mock data for different entity types
      API.UserProfileTypes.getAll.mockResolvedValue([
        { id: 'upt_1', name: 'Employee' }
      ]);
      API.RoleTypes.getAll.mockResolvedValue([
        { id: 'rt_1', name: 'Approver' }
      ]);
      API.TicketTypes.getAll.mockResolvedValue([
        { id: 'tt_1', name: 'Purchase Request' }
      ]);

      // Render all hooks simultaneously
      const { result: userProfileResult } = renderHook(() => useUserProfileTypes());
      const { result: roleResult } = renderHook(() => useRoleTypes());
      const { result: ticketResult } = renderHook(() => useTicketTypes());

      await waitFor(() => {
        expect(userProfileResult.current.loading).toBe(false);
        expect(roleResult.current.loading).toBe(false);
        expect(ticketResult.current.loading).toBe(false);
      });

      // All should load independently without conflicts
      expect(userProfileResult.current.data).toHaveLength(1);
      expect(roleResult.current.data).toHaveLength(1);
      expect(ticketResult.current.data).toHaveLength(1);

      // Each should call its respective API
      expect(API.UserProfileTypes.getAll).toHaveBeenCalledTimes(1);
      expect(API.RoleTypes.getAll).toHaveBeenCalledTimes(1);
      expect(API.TicketTypes.getAll).toHaveBeenCalledTimes(1);
    });
  });
});