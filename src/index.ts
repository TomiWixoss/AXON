/**
 * AXON - Token-Oriented Logging Framework
 * Main export file
 */

// Logger exports
export {
  Logger,
  LogLevel,
  LogEntry,
  LoggerConfig,
  ResolvedConfig,
  Environment,
  MetadataFilter,
  DEFAULT_CONFIG,
  detectEnvironment,
  loadFromEnvironment,
  loadFromFile,
  mergeConfigurations
} from './logger';

// Serializer exports
export {
  TOONSerializer,
  TOONSerializerConfig
} from './serializer';

// Parser exports
export {
  TOONParser,
  StreamingParser
} from './parser';

// File Manager exports
export {
  BrowserFileManager,
  FileManagerConfig,
  RotationMetadata
} from './file-manager';

// Conditional export for Node.js only modules
export type { FileManager } from './file-manager/FileManager';
export type { LogExtractor } from './extractor/LogExtractor';

// Utils exports
export {
  TokenCounter
} from './utils';

// Dynamic imports for Node.js only (prevents bundling in browser)
export const loadFileManager = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('FileManager is only available in Node.js. Use BrowserFileManager for browser environments.');
  }
  const { FileManager } = await import('./file-manager/FileManager');
  return FileManager;
};

export const loadLogExtractor = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('LogExtractor is only available in Node.js.');
  }
  const { LogExtractor } = await import('./extractor/LogExtractor');
  return LogExtractor;
};
