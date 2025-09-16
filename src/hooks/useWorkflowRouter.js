import { useState, useCallback } from 'react';
import { API } from '../api/googleSheet';
import { processTicketWorkflow, checkPendingWorkflows } from '../utils/approvalRouter';

/**
 * Hook for managing workflow routing operations
 * Provides functions to trigger workflow progression and batch processing
 */
export const useWorkflowRouter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [routingResults, setRoutingResults] = useState(null);

  /**
   * Process workflow for a single ticket
   * @param {string} ticketId - The ticket ID to process
   * @returns {Object} Routing result
   */
  const processTicket = useCallback(async (ticketId) => {
    if (!ticketId) return { success: false, message: 'No ticket ID provided' };

    setIsProcessing(true);
    try {
      const result = await processTicketWorkflow(API, ticketId);
      setRoutingResults(prev => ({
        ...prev,
        [ticketId]: result
      }));
      return result;
    } catch (error) {
      const errorResult = { success: false, error: error.message };
      setRoutingResults(prev => ({
        ...prev,
        [ticketId]: errorResult
      }));
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Process multiple tickets in batch
   * @param {Array} ticketIds - Array of ticket IDs to process
   * @returns {Object} Batch processing results
   */
  const processBatch = useCallback(async (ticketIds) => {
    if (!ticketIds || ticketIds.length === 0) {
      return { success: false, message: 'No ticket IDs provided' };
    }

    setIsProcessing(true);
    try {
      const result = await checkPendingWorkflows(API, ticketIds);

      // Update individual results
      if (result.success && result.results) {
        const newResults = {};
        result.results.forEach(res => {
          newResults[res.ticketId] = res;
        });
        setRoutingResults(prev => ({ ...prev, ...newResults }));
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Check all pending workflows for potential processing
   * @returns {Object} Processing results
   */
  const checkAllPending = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await checkPendingWorkflows(API);

      // Update individual results
      if (result.success && result.results) {
        const newResults = {};
        result.results.forEach(res => {
          newResults[res.ticketId] = res;
        });
        setRoutingResults(prev => ({ ...prev, ...newResults }));
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Get routing result for a specific ticket
   * @param {string} ticketId - The ticket ID
   * @returns {Object|null} Routing result
   */
  const getTicketResult = useCallback((ticketId) => {
    return routingResults?.[ticketId] || null;
  }, [routingResults]);

  /**
   * Clear routing results
   */
  const clearResults = useCallback(() => {
    setRoutingResults(null);
  }, []);

  /**
   * Clear result for specific ticket
   * @param {string} ticketId - The ticket ID
   */
  const clearTicketResult = useCallback((ticketId) => {
    setRoutingResults(prev => {
      if (!prev) return null;
      const { [ticketId]: removed, ...remaining } = prev;
      return Object.keys(remaining).length > 0 ? remaining : null;
    });
  }, []);

  return {
    // State
    isProcessing,
    routingResults,

    // Actions
    processTicket,
    processBatch,
    checkAllPending,

    // Utilities
    getTicketResult,
    clearResults,
    clearTicketResult
  };
};

/**
 * Hook for workflow routing with automatic processing
 * Automatically processes workflows when tickets are updated
 */
export const useAutoWorkflowRouter = () => {
  const router = useWorkflowRouter();

  /**
   * Process ticket with automatic retry on failure
   * @param {string} ticketId - The ticket ID
   * @param {number} maxRetries - Maximum retry attempts (default: 3)
   * @returns {Object} Final routing result
   */
  const processWithRetry = useCallback(async (ticketId, maxRetries = 3) => {
    let lastResult = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      const result = await router.processTicket(ticketId);
      lastResult = result;

      if (result.success) {
        return result;
      }

      attempts++;
      if (attempts <= maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return lastResult;
  }, [router]);

  /**
   * Process ticket after approval action
   * @param {string} ticketId - The ticket ID
   * @param {string} action - The approval action taken
   * @returns {Object} Routing result
   */
  const processAfterApproval = useCallback(async (ticketId, action) => {
    // Small delay to ensure approval is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await processWithRetry(ticketId);

    console.log(`Workflow processing after ${action}:`, {
      ticketId,
      action,
      result
    });

    return result;
  }, [processWithRetry]);

  /**
   * Process ticket after external task completion
   * @param {string} ticketId - The ticket ID
   * @returns {Object} Routing result
   */
  const processAfterTaskCompletion = useCallback(async (ticketId) => {
    // Small delay to ensure task completion is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await processWithRetry(ticketId);

    console.log('Workflow processing after task completion:', {
      ticketId,
      result
    });

    return result;
  }, [processWithRetry]);

  return {
    ...router,
    processWithRetry,
    processAfterApproval,
    processAfterTaskCompletion
  };
};

export default useWorkflowRouter;