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

/**
 * Runtime environment type
 */
export type Environment = 'node' | 'browser';

/**
 * Logger configuration interface
 * Defines all configuration options for the Logger
 * 
 * @example
 * ```typescript
 * const config: LoggerConfig = {
 *   outputPath: './logs/app.txt',
 *   level: LogLevel.INFO,
 *   maxFileSize: 10 * 1024 * 1024,
 *   rotationInterval: 'daily',
 *   bufferSize: 100,
 *   flushInterval: 5000
 * };
 * ```
 */
export interface LoggerConfig {
  /** File path (Node.js) or storage key (Browser) for log output */
  outputPath: string;
  
  /** Minimum log level to process (entries below this level are filtered) */
  level: LogLevel;
  
  /** Maximum file size in bytes before rotation (default: 10MB) */
  maxFileSize?: number;
  
  /** Time-based rotation interval */
  rotationInterval?: 'hourly' | 'daily' | 'weekly' | 'none';
  
  /** Map of verbose field names to short aliases for token optimization */
  fieldAliases?: Record<string, string>;
  
  /** Whether to omit null/undefined values from serialization (default: true) */
  omitNullValues?: boolean;
  
  /** Number of log entries to buffer before writing (default: 100) */
  bufferSize?: number;
  
  /** Milliseconds between automatic buffer flushes (default: 5000) */
  flushInterval?: number;
  
  /** Field delimiter for TOON format (default: ',') */
  delimiter?: ',' | '\t' | '|';
  
  /** Error callback for handling logging errors */
  onError?: (error: Error) => void;
  
  /** Metadata filter patterns - fields matching these patterns will be removed before serialization */
  metadataFilter?: MetadataFilter;
}

/**
 * Metadata filter configuration
 * Defines patterns for filtering sensitive metadata fields
 * 
 * @example
 * ```typescript
 * const filter: MetadataFilter = {
 *   fieldNames: ['password', 'apiKey'],
 *   fieldPatterns: ['.*secret.*', '.*token.*']
 * };
 * ```
 */
export interface MetadataFilter {
  /** Array of field name patterns (regex strings) to filter */
  fieldPatterns?: string[];
  
  /** Array of exact field names to filter */
  fieldNames?: string[];
}

/**
 * Resolved configuration with all optional fields filled with defaults
 */
export interface ResolvedConfig extends Required<Omit<LoggerConfig, 'metadataFilter'>> {
  /** Detected runtime environment */
  environment: Environment;
  
  /** Metadata filter patterns - fields matching these patterns will be removed before serialization */
  metadataFilter?: MetadataFilter;
}

/**
 * Detects the current runtime environment
 * @returns 'node' if running in Node.js, 'browser' if running in a browser
 */
export function detectEnvironment(): Environment {
  // Check for Node.js-specific globals
  if (typeof process !== 'undefined' && 
      process.versions != null && 
      process.versions.node != null) {
    return 'node';
  }
  
  // Check for browser-specific globals
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  }
  
  // Default to Node.js if uncertain (e.g., in test environments)
  return 'node';
}

/**
 * Default configuration values
 * Provides sensible defaults for all optional configuration options
 */
export const DEFAULT_CONFIG: ResolvedConfig = {
  outputPath: './logs/axon.txt',
  level: LogLevel.INFO,
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  rotationInterval: 'daily',
  fieldAliases: {
    timestamp: 'ts',
    level: 'lvl',
    message: 'msg',
    metadata: 'meta'
  },
  omitNullValues: true,
  bufferSize: 100,
  flushInterval: 5000,
  delimiter: ',',
  onError: (err: Error) => console.error('AXON Error:', err),
  environment: detectEnvironment()
};
