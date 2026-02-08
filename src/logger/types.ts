/**
 * Log level enumeration
 * Defines severity levels for log entries
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Log entry interface
 * Represents a single log record with timestamp, level, message, and optional metadata
 */
export interface LogEntry {
  /** Unix timestamp in milliseconds */
  ts: number;
  
  /** Log level (severity) */
  lvl: LogLevel;
  
  /** Log message */
  msg: string;
  
  /** Optional metadata object */
  meta?: Record<string, any>;
}
