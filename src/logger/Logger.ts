/**
 * Logger class
 * Main logging interface for AXON framework
 */

import { LogLevel, LogEntry, LoggerConfig, ResolvedConfig, DEFAULT_CONFIG } from './types';

/**
 * Validates configuration values and throws descriptive errors for invalid settings
 */
function validateConfig(config: ResolvedConfig): void {
  // Validate log level
  if (!Object.values(LogLevel).includes(config.level)) {
    throw new Error(`Invalid log level: ${config.level}. Must be one of: ${Object.keys(LogLevel).filter(k => isNaN(Number(k))).join(', ')}`);
  }

  // Validate output path
  if (!config.outputPath || typeof config.outputPath !== 'string') {
    throw new Error('Invalid outputPath: must be a non-empty string');
  }

  // Validate maxFileSize
  if (config.maxFileSize <= 0) {
    throw new Error(`Invalid maxFileSize: ${config.maxFileSize}. Must be greater than 0`);
  }

  // Validate bufferSize
  if (config.bufferSize <= 0) {
    throw new Error(`Invalid bufferSize: ${config.bufferSize}. Must be greater than 0`);
  }

  // Validate flushInterval
  if (config.flushInterval < 0) {
    throw new Error(`Invalid flushInterval: ${config.flushInterval}. Must be non-negative`);
  }

  // Validate rotationInterval
  const validRotationIntervals = ['hourly', 'daily', 'weekly', 'none'];
  if (!validRotationIntervals.includes(config.rotationInterval)) {
    throw new Error(`Invalid rotationInterval: ${config.rotationInterval}. Must be one of: ${validRotationIntervals.join(', ')}`);
  }

  // Validate delimiter
  const validDelimiters = [',', '\t', '|'];
  if (!validDelimiters.includes(config.delimiter)) {
    throw new Error(`Invalid delimiter: ${config.delimiter}. Must be one of: comma, tab, or pipe`);
  }
}

/**
 * Logger class
 * Provides methods for logging at different severity levels with metadata support
 */
export class Logger {
  private config: ResolvedConfig;
  private buffer: (LogEntry | string)[] = [];
  private globalMetadata: Record<string, any> = {};

  /**
   * Creates a new Logger instance
   * @param config - Configuration options for the logger
   * @throws Error if configuration values are invalid
   */
  constructor(config: LoggerConfig) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      // Ensure nested objects are properly merged
      fieldAliases: {
        ...DEFAULT_CONFIG.fieldAliases,
        ...(config.fieldAliases || {})
      }
    };

    // Validate the merged configuration
    validateConfig(this.config);
  }

  /**
   * Logs a debug message
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Logs an info message
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Logs a warning message
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Logs an error message
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Logs a fatal error message
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  fatal(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, metadata);
  }

  /**
   * Internal log method that handles log level filtering and entry creation
   * @param level - The log level
   * @param message - The log message
   * @param metadata - Optional metadata to attach to the log entry
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Apply log level filtering - skip if below threshold
    if (level < this.config.level) {
      return;
    }

    // Create log entry with timestamp
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: level,
      msg: message
    };

    // Merge global and per-entry metadata (per-entry wins on conflicts)
    const hasGlobalMeta = Object.keys(this.globalMetadata).length > 0;
    const hasPerEntryMeta = metadata && Object.keys(metadata).length > 0;
    
    if (hasGlobalMeta || hasPerEntryMeta) {
      entry.meta = {
        ...this.globalMetadata,
        ...(metadata || {})
      };
    }

    // Add entry to buffer
    this.buffer.push(entry);
  }

  /**
   * Sets global metadata that will be included in all subsequent log entries
   * @param metadata - Metadata object to set as global
   */
  setGlobalMetadata(metadata: Record<string, any>): void {
    this.globalMetadata = { ...metadata };
  }

  /**
   * Clears all global metadata
   */
  clearGlobalMetadata(): void {
    this.globalMetadata = {};
  }

  /**
   * Inserts a section marker into the log
   * Section markers help identify and extract specific sections of logs
   * @param label - The label for the section marker
   */
  mark(label: string): void {
    const timestamp = Date.now();
    const marker = `=== MARKER: ${label} | ${timestamp} ===`;
    this.buffer.push(marker);
  }

  /**
   * Gets the current configuration
   * @returns The resolved configuration object
   */
  getConfig(): Readonly<ResolvedConfig> {
    return { ...this.config };
  }

  /**
   * Gets the current buffer contents (for testing purposes)
   * @returns Copy of the current buffer
   */
  getBuffer(): ReadonlyArray<LogEntry | string> {
    return [...this.buffer];
  }

  /**
   * Gets the current global metadata (for testing purposes)
   * @returns Copy of the current global metadata
   */
  getGlobalMetadata(): Readonly<Record<string, any>> {
    return { ...this.globalMetadata };
  }
}
