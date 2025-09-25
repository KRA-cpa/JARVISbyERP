/**
 * Dropdown Creation Logger - Local Development Only
 * Creates downloadable .log files for dropdown creation debugging
 * Only active in development mode, silent in production
 */

class DropdownLogger {
  constructor() {
    this.isLocal = process.env.NODE_ENV === 'development';
    this.sessionId = `dropdown_${Date.now()}`;
    this.dropdownLogs = []; // Store only dropdown creation logs
  }

  /**
   * Download dropdown creation logs as .log file
   */
  downloadDropdownLogs() {
    if (!this.isLocal || typeof window === 'undefined' || this.dropdownLogs.length === 0) {
      return;
    }

    try {
      // Format as .log file content
      const logContent = this.dropdownLogs
        .map(log => `${log.timestamp} | ${JSON.stringify(log, null, 2)}`)
        .join('\n\n');

      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `dropdown-creation-${this.sessionId}.log`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('💾 Dropdown creation logs downloaded!');
    } catch (error) {
      console.error('Failed to download dropdown logs:', error);
    }
  }

  /**
   * Log dropdown creation attempt
   */
  logDropdownCreation(payload, result = null, error = null) {
    if (!this.isLocal) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId: this.sessionId,
      type: 'dropdown_creation_attempt',
      payload,
      result: result ? { success: true, data: result } : null,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      environment: process.env.NODE_ENV,
      connectionType: process.env.NODE_ENV === 'development' ? 'DIRECT' : 'PROXY',
      url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side'
    };

    // Store in memory
    this.dropdownLogs.push(logEntry);

    // Enhanced console logging
    console.group(`🎯 DROPDOWN CREATION LOG - ${timestamp}`);
    console.log('📊 Payload:', payload);
    if (result) console.log('✅ Result:', result);
    if (error) console.error('❌ Error:', error);
    console.log('🔧 Connection:', logEntry.connectionType);
    console.groupEnd();

    // Auto-trigger download after each attempt in development
    if (this.dropdownLogs.length > 0) {
      setTimeout(() => this.downloadDropdownLogs(), 1000);
    }
  }
}

// Create singleton instance
const dropdownLogger = new DropdownLogger();

export default dropdownLogger;

// Export method for dropdown creation logging
export const logDropdownCreation = (payload, result, error) =>
  dropdownLogger.logDropdownCreation(payload, result, error);