/**
 * File Manager types and interfaces
 */

import { Environment } from '../logger/types';

/**
 * File Manager configuration interface
 * Defines configuration for file operations, rotation, and buffering
 */
export interface FileManagerConfig {
  /** Output file path (Node.js) or storage key (Browser) */
  outputPath: string;
  
  /** Maximum file size in bytes before rotation */
  maxFileSize: number;
  
  /** Time-based rotation interval */
  rotationInterval: 'hourly' | 'daily' | 'weekly' | 'none';
  
  /** Number of entries to buffer before writing */
  bufferSize: number;
  
  /** Milliseconds between automatic buffer flushes */
  flushInterval: number;
  
  /** Runtime environment (node or browser) */
  environment: Environment;
  
  /** Error callback for handling file operation errors */
  onError?: (error: Error) => void;
}

/**
 * File rotation metadata
 * Tracks information about file rotation events
 */
export interface RotationMetadata {
  /** Timestamp when the current file was created */
  fileCreatedAt: number;
  
  /** Current file size in bytes */
  currentFileSize: number;
  
  /** Sequence number for rotated files */
  sequenceNumber: number;
}
