/**
 * Infinite Loop Detection and Prevention System
 * Provides circuit breakers, rate limiting, and detection for API calls
 */

import { useCallback } from 'react';

// Global tracking for API calls
const API_CALL_TRACKER = new Map();
const COMPONENT_RENDER_TRACKER = new Map();
const CIRCUIT_BREAKERS = new Map();

// Configuration
const CONFIG = {
  // Circuit breaker thresholds
  MAX_CALLS_PER_SECOND: 5,
  MAX_CALLS_PER_MINUTE: 50,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 10,
  CIRCUIT_BREAKER_TIMEOUT: 30000, // 30 seconds

  // Render tracking
  MAX_RENDERS_PER_SECOND: 20,
  MAX_RENDERS_PER_MINUTE: 300,

  // Detection windows
  DETECTION_WINDOW_MS: 1000, // 1 second
  CLEANUP_INTERVAL_MS: 60000, // 1 minute
};

/**
 * Circuit Breaker State
 */
class CircuitBreaker {
  constructor(name, threshold = CONFIG.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    this.name = name;
    this.failureCount = 0;
    this.failureThreshold = threshold;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
    this.timeout = CONFIG.CIRCUIT_BREAKER_TIMEOUT;
  }

  canExecute() {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now > this.nextAttempt) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.warn(`Circuit breaker OPEN for ${this.name}. Next attempt at: ${new Date(this.nextAttempt)}`);
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt) : null
    };
  }
}

/**
 * Rate Limiter for API calls
 */
class RateLimiter {
  constructor(maxCallsPerSecond = CONFIG.MAX_CALLS_PER_SECOND, maxCallsPerMinute = CONFIG.MAX_CALLS_PER_MINUTE) {
    this.maxCallsPerSecond = maxCallsPerSecond;
    this.maxCallsPerMinute = maxCallsPerMinute;
    this.callHistory = [];
  }

  canMakeCall() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    // Clean old entries
    this.callHistory = this.callHistory.filter(timestamp => timestamp > oneMinuteAgo);

    // Check limits
    const callsInLastSecond = this.callHistory.filter(timestamp => timestamp > oneSecondAgo).length;
    const callsInLastMinute = this.callHistory.length;

    if (callsInLastSecond >= this.maxCallsPerSecond) {
      console.warn(`Rate limit exceeded: ${callsInLastSecond} calls in last second (max: ${this.maxCallsPerSecond})`);
      return false;
    }

    if (callsInLastMinute >= this.maxCallsPerMinute) {
      console.warn(`Rate limit exceeded: ${callsInLastMinute} calls in last minute (max: ${this.maxCallsPerMinute})`);
      return false;
    }

    return true;
  }

  recordCall() {
    this.callHistory.push(Date.now());
  }

  getStats() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    this.callHistory = this.callHistory.filter(timestamp => timestamp > oneMinuteAgo);

    return {
      callsInLastSecond: this.callHistory.filter(timestamp => timestamp > oneSecondAgo).length,
      callsInLastMinute: this.callHistory.length,
      maxCallsPerSecond: this.maxCallsPerSecond,
      maxCallsPerMinute: this.maxCallsPerMinute
    };
  }
}

/**
 * Infinite Loop Detection for API calls
 */
export const APILoopDetector = {
  isLoopDetected(apiEndpoint) {
    const now = Date.now();
    const key = apiEndpoint;

    if (!API_CALL_TRACKER.has(key)) {
      API_CALL_TRACKER.set(key, {
        rateLimiter: new RateLimiter(),
        circuitBreaker: new CircuitBreaker(key),
        lastCall: now,
        recentCalls: []
      });
    }

    const tracker = API_CALL_TRACKER.get(key);

    // Clean old calls
    tracker.recentCalls = tracker.recentCalls.filter(timestamp =>
      now - timestamp < CONFIG.DETECTION_WINDOW_MS
    );

    // Check if we can make the call
    if (!tracker.circuitBreaker.canExecute()) {
      console.error(`Circuit breaker OPEN for ${key}. Call blocked.`);
      return true;
    }

    if (!tracker.rateLimiter.canMakeCall()) {
      tracker.circuitBreaker.recordFailure();
      return true;
    }

    // Record the call
    tracker.recentCalls.push(now);
    tracker.rateLimiter.recordCall();
    tracker.lastCall = now;

    return false;
  },

  recordSuccess(apiEndpoint) {
    const tracker = API_CALL_TRACKER.get(apiEndpoint);
    if (tracker) {
      tracker.circuitBreaker.recordSuccess();
    }
  },

  recordFailure(apiEndpoint) {
    const tracker = API_CALL_TRACKER.get(apiEndpoint);
    if (tracker) {
      tracker.circuitBreaker.recordFailure();
    }
  },

  getStats() {
    const stats = {};
    for (const [key, tracker] of API_CALL_TRACKER.entries()) {
      stats[key] = {
        rateLimiter: tracker.rateLimiter.getStats(),
        circuitBreaker: tracker.circuitBreaker.getState(),
        lastCall: new Date(tracker.lastCall),
        recentCallCount: tracker.recentCalls.length
      };
    }
    return stats;
  },

  reset(apiEndpoint) {
    if (apiEndpoint) {
      API_CALL_TRACKER.delete(apiEndpoint);
    } else {
      API_CALL_TRACKER.clear();
    }
  }
};

/**
 * Component Render Loop Detection
 */
export const RenderLoopDetector = {
  isLoopDetected(componentName) {
    const now = Date.now();
    const key = componentName;

    if (!COMPONENT_RENDER_TRACKER.has(key)) {
      COMPONENT_RENDER_TRACKER.set(key, {
        recentRenders: [],
        lastRender: now
      });
    }

    const tracker = COMPONENT_RENDER_TRACKER.get(key);

    // Clean old renders
    tracker.recentRenders = tracker.recentRenders.filter(timestamp =>
      now - timestamp < CONFIG.DETECTION_WINDOW_MS
    );

    // Check render frequency
    const rendersInLastSecond = tracker.recentRenders.length;
    const rendersInLastMinute = tracker.recentRenders.filter(timestamp =>
      now - timestamp < 60000
    ).length;

    if (rendersInLastSecond >= CONFIG.MAX_RENDERS_PER_SECOND) {
      console.error(`Render loop detected in ${componentName}: ${rendersInLastSecond} renders in last second`);
      return true;
    }

    if (rendersInLastMinute >= CONFIG.MAX_RENDERS_PER_MINUTE) {
      console.error(`Render loop detected in ${componentName}: ${rendersInLastMinute} renders in last minute`);
      return true;
    }

    // Record the render
    tracker.recentRenders.push(now);
    tracker.lastRender = now;

    return false;
  },

  getStats() {
    const stats = {};
    for (const [key, tracker] of COMPONENT_RENDER_TRACKER.entries()) {
      const now = Date.now();
      stats[key] = {
        lastRender: new Date(tracker.lastRender),
        rendersInLastSecond: tracker.recentRenders.filter(timestamp => now - timestamp < 1000).length,
        rendersInLastMinute: tracker.recentRenders.filter(timestamp => now - timestamp < 60000).length,
        totalTrackedRenders: tracker.recentRenders.length
      };
    }
    return stats;
  },

  reset(componentName) {
    if (componentName) {
      COMPONENT_RENDER_TRACKER.delete(componentName);
    } else {
      COMPONENT_RENDER_TRACKER.clear();
    }
  }
};

/**
 * Enhanced useAPI hook with infinite loop prevention
 */
export const createProtectedAPICall = (apiCall, endpoint) => {
  return async (...args) => {
    // Check for infinite loop
    if (APILoopDetector.isLoopDetected(endpoint)) {
      const error = new Error(`Infinite loop detected for ${endpoint}. Call blocked.`);
      error.code = 'INFINITE_LOOP_DETECTED';
      throw error;
    }

    try {
      const result = await apiCall(...args);
      APILoopDetector.recordSuccess(endpoint);
      return result;
    } catch (error) {
      APILoopDetector.recordFailure(endpoint);
      throw error;
    }
  };
};

/**
 * Hook for monitoring infinite loops
 */
export const useInfiniteLoopMonitor = () => {
  const getSystemStats = useCallback(() => {
    return {
      api: APILoopDetector.getStats(),
      renders: RenderLoopDetector.getStats(),
      timestamp: new Date()
    };
  }, []);

  const reset = useCallback(() => {
    APILoopDetector.reset();
    RenderLoopDetector.reset();
  }, []);

  const isSystemHealthy = useCallback(() => {
    const apiStats = APILoopDetector.getStats();
    const renderStats = RenderLoopDetector.getStats();

    // Check if any circuit breakers are open
    const hasOpenCircuits = Object.values(apiStats).some(stat =>
      stat.circuitBreaker.state === 'OPEN'
    );

    // Check if any components are render looping
    const hasRenderLoops = Object.values(renderStats).some(stat =>
      stat.rendersInLastSecond > CONFIG.MAX_RENDERS_PER_SECOND / 2 // Warning threshold
    );

    return !hasOpenCircuits && !hasRenderLoops;
  }, []);

  return {
    getSystemStats,
    reset,
    isSystemHealthy,
    config: CONFIG
  };
};

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  const cutoff = now - CONFIG.CLEANUP_INTERVAL_MS;

  // Clean API tracker
  for (const [key, tracker] of API_CALL_TRACKER.entries()) {
    if (tracker.lastCall < cutoff) {
      API_CALL_TRACKER.delete(key);
    }
  }

  // Clean render tracker
  for (const [key, tracker] of COMPONENT_RENDER_TRACKER.entries()) {
    if (tracker.lastRender < cutoff) {
      COMPONENT_RENDER_TRACKER.delete(key);
    }
  }
}, CONFIG.CLEANUP_INTERVAL_MS);

export default {
  APILoopDetector,
  RenderLoopDetector,
  createProtectedAPICall,
  useInfiniteLoopMonitor,
  CONFIG
};