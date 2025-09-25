/**
 * Tests for useAPI hooks
 * Tests API integration, infinite loop prevention, and data fetching
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useCompanies, useUsers, useTickets, useTicketTypes } from './useAPI';
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
});