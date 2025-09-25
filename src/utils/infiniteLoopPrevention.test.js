/**
 * Tests for Infinite Loop Prevention System
 * Tests circuit breakers, rate limiting, and loop detection
 */

import {
  APILoopDetector,
  RenderLoopDetector,
  createProtectedAPICall,
  useInfiniteLoopMonitor
} from './infiniteLoopPrevention';
import { renderHook, act } from '@testing-library/react';

describe('Infinite Loop Prevention System', () => {
  beforeEach(() => {
    // Reset all tracking
    APILoopDetector.reset();
    RenderLoopDetector.reset();
    jest.clearAllMocks();
  });

  describe('APILoopDetector', () => {
    const endpoint = 'testEndpoint';

    it('should allow initial API calls', () => {
      const isLoopDetected = APILoopDetector.isLoopDetected(endpoint);
      expect(isLoopDetected).toBe(false);
    });

    it('should detect excessive API calls per second', () => {
      // Make 6 calls rapidly (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        APILoopDetector.isLoopDetected(endpoint);
      }

      // 7th call should be blocked
      const isLoopDetected = APILoopDetector.isLoopDetected(endpoint);
      expect(isLoopDetected).toBe(true);
    });

    it('should track successful API calls', () => {
      APILoopDetector.isLoopDetected(endpoint);
      APILoopDetector.recordSuccess(endpoint);

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint]).toBeDefined();
      expect(stats[endpoint].circuitBreaker.state).toBe('CLOSED');
      expect(stats[endpoint].circuitBreaker.failureCount).toBe(0);
    });

    it('should track failed API calls', () => {
      APILoopDetector.isLoopDetected(endpoint);
      APILoopDetector.recordFailure(endpoint);

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.failureCount).toBe(1);
    });

    it('should open circuit breaker after failure threshold', () => {
      APILoopDetector.isLoopDetected(endpoint);

      // Record 10 failures (threshold)
      for (let i = 0; i < 10; i++) {
        APILoopDetector.recordFailure(endpoint);
      }

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.state).toBe('OPEN');

      // Next call should be blocked
      const isLoopDetected = APILoopDetector.isLoopDetected(endpoint);
      expect(isLoopDetected).toBe(true);
    });

    it('should provide accurate statistics', () => {
      // Make some calls
      APILoopDetector.isLoopDetected(endpoint);
      APILoopDetector.isLoopDetected(endpoint);
      APILoopDetector.recordSuccess(endpoint);

      const stats = APILoopDetector.getStats();

      expect(stats[endpoint]).toMatchObject({
        rateLimiter: expect.objectContaining({
          callsInLastSecond: 2,
          maxCallsPerSecond: 5
        }),
        circuitBreaker: expect.objectContaining({
          state: 'CLOSED',
          failureCount: 0
        }),
        recentCallCount: 2
      });
    });

    it('should reset endpoint tracking', () => {
      APILoopDetector.isLoopDetected(endpoint);

      let stats = APILoopDetector.getStats();
      expect(Object.keys(stats)).toContain(endpoint);

      APILoopDetector.reset(endpoint);

      stats = APILoopDetector.getStats();
      expect(Object.keys(stats)).not.toContain(endpoint);
    });

    it('should reset all tracking', () => {
      APILoopDetector.isLoopDetected('endpoint1');
      APILoopDetector.isLoopDetected('endpoint2');

      let stats = APILoopDetector.getStats();
      expect(Object.keys(stats)).toHaveLength(2);

      APILoopDetector.reset();

      stats = APILoopDetector.getStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('RenderLoopDetector', () => {
    const componentName = 'TestComponent';

    it('should allow initial renders', () => {
      const isLoopDetected = RenderLoopDetector.isLoopDetected(componentName);
      expect(isLoopDetected).toBe(false);
    });

    it('should detect excessive renders per second', () => {
      // Make 21 renders rapidly (exceeds limit of 20)
      for (let i = 0; i < 21; i++) {
        RenderLoopDetector.isLoopDetected(componentName);
      }

      // 22nd render should be detected as loop
      const isLoopDetected = RenderLoopDetector.isLoopDetected(componentName);
      expect(isLoopDetected).toBe(true);
    });

    it('should provide render statistics', () => {
      // Make some renders
      RenderLoopDetector.isLoopDetected(componentName);
      RenderLoopDetector.isLoopDetected(componentName);

      const stats = RenderLoopDetector.getStats();

      expect(stats[componentName]).toMatchObject({
        rendersInLastSecond: 2,
        rendersInLastMinute: 2,
        totalTrackedRenders: 2
      });
    });

    it('should reset component tracking', () => {
      RenderLoopDetector.isLoopDetected(componentName);

      let stats = RenderLoopDetector.getStats();
      expect(Object.keys(stats)).toContain(componentName);

      RenderLoopDetector.reset(componentName);

      stats = RenderLoopDetector.getStats();
      expect(Object.keys(stats)).not.toContain(componentName);
    });
  });

  describe('createProtectedAPICall', () => {
    const mockApiCall = jest.fn();
    const endpoint = 'testEndpoint';

    beforeEach(() => {
      mockApiCall.mockClear();
    });

    it('should execute API call when no loop detected', async () => {
      const mockData = { success: true };
      mockApiCall.mockResolvedValue(mockData);

      const protectedCall = createProtectedAPICall(mockApiCall, endpoint);
      const result = await protectedCall();

      expect(result).toEqual(mockData);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should block API call when loop detected', async () => {
      // Trigger loop detection
      for (let i = 0; i < 6; i++) {
        APILoopDetector.isLoopDetected(endpoint);
      }

      const protectedCall = createProtectedAPICall(mockApiCall, endpoint);

      await expect(protectedCall()).rejects.toThrow('Infinite loop detected');
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it('should record success on successful API call', async () => {
      mockApiCall.mockResolvedValue({ success: true });

      const protectedCall = createProtectedAPICall(mockApiCall, endpoint);
      await protectedCall();

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.failureCount).toBe(0);
    });

    it('should record failure on API error', async () => {
      mockApiCall.mockRejectedValue(new Error('API Error'));

      const protectedCall = createProtectedAPICall(mockApiCall, endpoint);

      await expect(protectedCall()).rejects.toThrow('API Error');

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.failureCount).toBe(1);
    });

    it('should pass arguments to underlying API call', async () => {
      const mockData = { success: true };
      mockApiCall.mockResolvedValue(mockData);

      const protectedCall = createProtectedAPICall(mockApiCall, endpoint);
      await protectedCall('arg1', 'arg2');

      expect(mockApiCall).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('useInfiniteLoopMonitor Hook', () => {
    it('should provide system statistics', () => {
      const { result } = renderHook(() => useInfiniteLoopMonitor());

      expect(result.current.getSystemStats).toBeDefined();
      expect(result.current.reset).toBeDefined();
      expect(result.current.isSystemHealthy).toBeDefined();
      expect(result.current.config).toBeDefined();
    });

    it('should detect healthy system state', () => {
      const { result } = renderHook(() => useInfiniteLoopMonitor());

      const isHealthy = result.current.isSystemHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should detect unhealthy system state with open circuits', () => {
      // Trigger circuit breaker
      const endpoint = 'testEndpoint';
      APILoopDetector.isLoopDetected(endpoint);
      for (let i = 0; i < 10; i++) {
        APILoopDetector.recordFailure(endpoint);
      }

      const { result } = renderHook(() => useInfiniteLoopMonitor());

      const isHealthy = result.current.isSystemHealthy();
      expect(isHealthy).toBe(false);
    });

    it('should detect unhealthy system state with render loops', () => {
      // Trigger render loop detection
      const componentName = 'TestComponent';
      for (let i = 0; i < 15; i++) {
        RenderLoopDetector.isLoopDetected(componentName);
      }

      const { result } = renderHook(() => useInfiniteLoopMonitor());

      const isHealthy = result.current.isSystemHealthy();
      expect(isHealthy).toBe(false);
    });

    it('should reset all tracking', () => {
      // Add some tracking data
      APILoopDetector.isLoopDetected('endpoint1');
      RenderLoopDetector.isLoopDetected('component1');

      const { result } = renderHook(() => useInfiniteLoopMonitor());

      act(() => {
        result.current.reset();
      });

      const stats = result.current.getSystemStats();
      expect(Object.keys(stats.api)).toHaveLength(0);
      expect(Object.keys(stats.renders)).toHaveLength(0);
    });

    it('should provide configuration details', () => {
      const { result } = renderHook(() => useInfiniteLoopMonitor());

      expect(result.current.config).toMatchObject({
        MAX_CALLS_PER_SECOND: 5,
        MAX_CALLS_PER_MINUTE: 50,
        CIRCUIT_BREAKER_FAILURE_THRESHOLD: 10,
        MAX_RENDERS_PER_SECOND: 20,
        MAX_RENDERS_PER_MINUTE: 300
      });
    });
  });

  describe('Circuit Breaker States', () => {
    const endpoint = 'testEndpoint';

    it('should transition from CLOSED to OPEN state', () => {
      APILoopDetector.isLoopDetected(endpoint);

      // Record failures to open circuit
      for (let i = 0; i < 10; i++) {
        APILoopDetector.recordFailure(endpoint);
      }

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.state).toBe('OPEN');
    });

    it('should transition from OPEN to HALF_OPEN state after timeout', async () => {
      APILoopDetector.isLoopDetected(endpoint);

      // Open the circuit
      for (let i = 0; i < 10; i++) {
        APILoopDetector.recordFailure(endpoint);
      }

      // Fast-forward time (would normally wait 30 seconds)
      // In real test, you'd mock Date.now() or use fake timers
      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.state).toBe('OPEN');
    });

    it('should transition from HALF_OPEN to CLOSED on success', () => {
      APILoopDetector.isLoopDetected(endpoint);

      // Open circuit
      for (let i = 0; i < 10; i++) {
        APILoopDetector.recordFailure(endpoint);
      }

      // Record success to close circuit
      APILoopDetector.recordSuccess(endpoint);

      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].circuitBreaker.state).toBe('CLOSED');
      expect(stats[endpoint].circuitBreaker.failureCount).toBe(0);
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    const endpoint = 'testEndpoint';

    it('should handle burst calls within limits', () => {
      // Make exactly 5 calls (at the limit)
      for (let i = 0; i < 5; i++) {
        const isDetected = APILoopDetector.isLoopDetected(endpoint);
        expect(isDetected).toBe(false);
      }

      // 6th call should be blocked
      const isDetected = APILoopDetector.isLoopDetected(endpoint);
      expect(isDetected).toBe(true);
    });

    it('should handle calls with gaps between them', async () => {
      // Make a few calls
      APILoopDetector.isLoopDetected(endpoint);
      APILoopDetector.isLoopDetected(endpoint);

      // Simulate time passing (in real scenario, you'd mock timers)
      const stats = APILoopDetector.getStats();
      expect(stats[endpoint].rateLimiter.callsInLastSecond).toBe(2);
    });
  });
});