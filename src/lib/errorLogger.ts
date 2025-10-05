/**
 * Client-side error logger for mobile debugging
 * Stores errors in localStorage for later retrieval
 */

export interface ErrorLog {
  timestamp: string;
  type: 'api_error' | 'validation_error' | 'network_error' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
  url?: string;
  statusCode?: number;
  userAgent: string;
}

const MAX_LOGS = 50;
const STORAGE_KEY = 'fleetzen_error_logs';

export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with full context
   */
  log(
    type: ErrorLog['type'],
    message: string,
    details?: Record<string, unknown>,
    url?: string,
    statusCode?: number
  ): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details: this.sanitizeDetails(details),
      url,
      statusCode,
      userAgent: navigator.userAgent,
    };

    console.error('📋 ErrorLogger:', log);

    this.saveTolocalStorage(log);
  }

  /**
   * Sanitize details to avoid storing sensitive data
   */
  private sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveKeys = ['password', 'token', 'authorization', 'cookie'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Save log to localStorage
   */
  private saveTolocalStorage(log: ErrorLog): void {
    try {
      const logsJson = localStorage.getItem(STORAGE_KEY);
      const logs: ErrorLog[] = logsJson ? JSON.parse(logsJson) : [];

      logs.push(log);

      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save error log to localStorage:', error);
    }
  }

  /**
   * Retrieve all logs
   */
  getLogs(): ErrorLog[] {
    try {
      const logsJson = localStorage.getItem(STORAGE_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Error logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Get logs as formatted string for debugging
   */
  getLogsAsString(): string {
    const logs = this.getLogs();
    return logs.map(log => {
      return `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}
${log.url ? `URL: ${log.url}` : ''}
${log.statusCode ? `Status: ${log.statusCode}` : ''}
${log.details ? `Details: ${JSON.stringify(log.details, null, 2)}` : ''}
User-Agent: ${log.userAgent}
---`;
    }).join('\n\n');
  }

  /**
   * Export logs as downloadable file
   */
  exportLogs(): void {
    const logsString = this.getLogsAsString();
    const blob = new Blob([logsString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetzen-errors-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton export
export const errorLogger = ErrorLogger.getInstance();
