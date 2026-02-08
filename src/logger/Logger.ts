/**
 * Logger class
 * Main logging interface for AXON framework
 */

import { LogLevel, LogEntry, LoggerConfig, ResolvedConfig } from './types';
import { mergeConfigurations } from './ConfigLoader';

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

  // Validate output path doesn't contain invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  if (invalidChars.test(config.outputPath)) {
    throw new Error(`Invalid outputPath: contains invalid characters. Path: ${config.outputPath}`);
  }

  // Validate maxFileSize
  if (typeof config.maxFileSize !== 'number' || !isFinite(config.maxFileSize)) {
    throw new Error(`Invalid maxFileSize: ${config.maxFileSize}. Must be a finite number`);
  }
  if (config.maxFileSize <= 0) {
    throw new Error(`Invalid maxFileSize: ${config.maxFileSize}. Must be greater than 0`);
  }
  // Reasonable upper limit: 1GB
  if (config.maxFileSize > 1024 * 1024 * 1024) {
    throw new Error(`Invalid maxFileSize: ${config.maxFileSize}. Must be less than or equal to 1GB (1073741824 bytes)`);
  }

  // Validate bufferSize
  if (typeof config.bufferSize !== 'number' || !isFinite(config.bufferSize) || !Number.isInteger(config.bufferSize)) {
    throw new Error(`Invalid bufferSize: ${config.bufferSize}. Must be a finite integer`);
  }
  if (config.bufferSize <= 0) {
    throw new Error(`Invalid bufferSize: ${config.bufferSize}. Must be greater than 0`);
  }
  // Reasonable upper limit: 10000 entries
  if (config.bufferSize > 10000) {
    throw new Error(`Invalid bufferSize: ${config.bufferSize}. Must be less than or equal to 10000`);
  }

  // Validate flushInterval
  if (typeof config.flushInterval !== 'number' || !isFinite(config.flushInterval) || !Number.isInteger(config.flushInterval)) {
    throw new Error(`Invalid flushInterval: ${config.flushInterval}. Must be a finite integer`);
  }
  if (config.flushInterval < 0) {
    throw new Error(`Invalid flushInterval: ${config.flushInterval}. Must be non-negative`);
  }
  // Reasonable upper limit: 1 hour (3600000 ms)
  if (config.flushInterval > 3600000) {
    throw new Error(`Invalid flushInterval: ${config.flushInterval}. Must be less than or equal to 3600000 ms (1 hour)`);
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

  // Validate omitNullValues
  if (typeof config.omitNullValues !== 'boolean') {
    throw new Error(`Invalid omitNullValues: ${config.omitNullValues}. Must be a boolean`);
  }

  // Validate fieldAliases
  if (typeof config.fieldAliases !== 'object' || config.fieldAliases === null || Array.isArray(config.fieldAliases)) {
    throw new Error('Invalid fieldAliases: must be an object');
  }

  // Validate onError
  if (typeof config.onError !== 'function') {
    throw new Error('Invalid onError: must be a function');
  }

  // Validate environment
  if (config.environment !== 'node' && config.environment !== 'browser') {
    throw new Error(`Invalid environment: ${config.environment}. Must be 'node' or 'browser'`);
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
    // Merge configuration from all sources: constructor > env > file > defaults
    this.config = mergeConfigurations(config);

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

  /**
   * Sets the log level at runtime
   * @param level - The new log level
   * @throws Error if the log level is invalid
   */
  setLevel(level: LogLevel): void {
    // Validate the new level
    if (!Object.values(LogLevel).includes(level)) {
      throw new Error(`Invalid log level: ${level}. Must be one of: ${Object.keys(LogLevel).filter(k => isNaN(Number(k))).join(', ')}`);
    }
    this.config.level = level;
  }

  /**
   * Updates configuration at runtime
   * Only non-critical settings can be updated (level, bufferSize, flushInterval, fieldAliases, omitNullValues, delimiter)
   * Critical settings like outputPath, maxFileSize, and rotationInterval cannot be changed at runtime
   * @param partial - Partial configuration to update
   * @throws Error if trying to update critical settings or if validation fails
   */
  updateConfig(partial: Partial<LoggerConfig>): void {
    // Check for critical settings that cannot be updated at runtime
    if (partial.outputPath !== undefined) {
      throw new Error('Cannot update outputPath at runtime. This is a critical setting that requires logger restart.');
    }
    if (partial.maxFileSize !== undefined) {
      throw new Error('Cannot update maxFileSize at runtime. This is a critical setting that requires logger restart.');
    }
    if (partial.rotationInterval !== undefined) {
      throw new Error('Cannot update rotationInterval at runtime. This is a critical setting that requires logger restart.');
    }

    // Create a temporary config with the updates
    const tempConfig: ResolvedConfig = {
      ...this.config,
      ...partial,
      // Handle fieldAliases specially
      fieldAliases: partial.fieldAliases !== undefined 
        ? (typeof partial.fieldAliases === 'object' && partial.fieldAliases !== null && !Array.isArray(partial.fieldAliases)
            ? { ...this.config.fieldAliases, ...partial.fieldAliases }
            : partial.fieldAliases as any)
        : this.config.fieldAliases
    };

    // Validate the updated configuration
    validateConfig(tempConfig);

    // Apply the updates
    if (partial.level !== undefined) {
      this.config.level = partial.level;
    }
    if (partial.bufferSize !== undefined) {
      this.config.bufferSize = partial.bufferSize;
    }
    if (partial.flushInterval !== undefined) {
      this.config.flushInterval = partial.flushInterval;
    }
    if (partial.delimiter !== undefined) {
      this.config.delimiter = partial.delimiter;
    }
    if (partial.omitNullValues !== undefined) {
      this.config.omitNullValues = partial.omitNullValues;
    }
    if (partial.fieldAliases !== undefined) {
      this.config.fieldAliases = tempConfig.fieldAliases;
    }
    if (partial.onError !== undefined) {
      this.config.onError = partial.onError;
    }
  }
}
