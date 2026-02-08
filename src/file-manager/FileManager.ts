/**
 * File Manager for Node.js
 * Handles file I/O operations, buffering, and rotation
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileManagerConfig, RotationMetadata } from './types';

/**
 * Retry configuration for error handling
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
}

/**
 * FileManager class for Node.js
 * Manages log file writing, buffering, and rotation
 */
export class FileManager {
  private config: FileManagerConfig;
  private buffer: string[] = [];
  private fileHandle: fs.promises.FileHandle | null = null;
  private rotationMetadata: RotationMetadata;
  private flushTimer: NodeJS.Timeout | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 100
  };
  private retryCount: Map<string, number> = new Map();

  /**
   * Creates a new FileManager instance
   * @param config - Configuration for file operations
   */
  constructor(config: FileManagerConfig) {
    this.config = config;
    
    // Initialize rotation metadata
    this.rotationMetadata = {
      fileCreatedAt: Date.now(),
      currentFileSize: 0,
      sequenceNumber: 0
    };

    // Ensure output directory exists
    this.ensureDirectoryExists();

    // Initialize file handle (synchronously for constructor)
    this.initializeFileSync();

    // Start auto-flush timer if interval is set
    if (this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Ensures the output directory exists
   * Creates the directory if it doesn't exist
   */
  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.config.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Initializes the file handle synchronously
   * Opens the file for appending or creates it if it doesn't exist
   */
  private initializeFileSync(): void {
    try {
      // Check if file exists and get its size
      if (fs.existsSync(this.config.outputPath)) {
        const stats = fs.statSync(this.config.outputPath);
        this.rotationMetadata.currentFileSize = stats.size;
      } else {
        this.rotationMetadata.currentFileSize = 0;
      }

      // Open file for appending (will be converted to async handle when needed)
      // For now, we'll use async operations in write methods
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Starts the auto-flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => this.handleError(error));
    }, this.config.flushInterval);
  }

  /**
   * Stops the auto-flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Writes a TOON-formatted string to the buffer
   * @param toonString - The TOON-formatted log entry
   */
  write(toonString: string): void {
    this.buffer.push(toonString);

    // Auto-flush if buffer size reached
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush().catch(error => this.handleError(error));
    }
  }

  /**
   * Flushes the buffer to disk
   * Writes all buffered entries to the file
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    await this.retryOperation('flush', async () => {
      // Check if rotation is needed before writing
      const needsRotation = await this.shouldRotate();
      if (needsRotation) {
        await this.rotate();
      }

      // Ensure file handle is open
      if (!this.fileHandle) {
        this.fileHandle = await fs.promises.open(this.config.outputPath, 'a');
      }

      // Prepare data to write
      const data = this.buffer.join('\n') + '\n';
      const dataSize = Buffer.byteLength(data, 'utf8');

      // Write to file
      await this.fileHandle.write(data, null, 'utf8');
      this.rotationMetadata.currentFileSize += dataSize;

      // Clear buffer only after successful write
      this.buffer = [];
    });
  }

  /**
   * Closes the file manager
   * Flushes remaining buffer and releases file handle
   */
  async close(): Promise<void> {
    // Stop auto-flush timer
    this.stopFlushTimer();

    // Flush remaining buffer
    await this.flush();

    // Close file handle
    if (this.fileHandle) {
      await this.fileHandle.close();
      this.fileHandle = null;
    }
  }

  /**
   * Checks if file rotation is needed
   * @returns True if rotation is needed, false otherwise
   */
  private async shouldRotate(): Promise<boolean> {
    // Check size-based rotation
    if (this.rotationMetadata.currentFileSize >= this.config.maxFileSize) {
      return true;
    }

    // Check time-based rotation
    if (this.config.rotationInterval !== 'none') {
      const now = Date.now();
      const elapsed = now - this.rotationMetadata.fileCreatedAt;
      
      let rotationThreshold = 0;
      switch (this.config.rotationInterval) {
        case 'hourly':
          rotationThreshold = 60 * 60 * 1000; // 1 hour
          break;
        case 'daily':
          rotationThreshold = 24 * 60 * 60 * 1000; // 1 day
          break;
        case 'weekly':
          rotationThreshold = 7 * 24 * 60 * 60 * 1000; // 1 week
          break;
      }

      if (elapsed >= rotationThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Rotates the log file
   * Creates a new file and writes continuity markers
   */
  private async rotate(): Promise<void> {
    try {
      // Generate new filename
      const newFilename = this.getRotatedFileName();

      // Ensure file handle is open
      if (!this.fileHandle) {
        this.fileHandle = await fs.promises.open(this.config.outputPath, 'a');
      }

      // Write continuity marker to old file
      const marker = `=== CONTINUED IN: ${path.basename(newFilename)} ===\n`;
      await this.fileHandle.write(marker, null, 'utf8');
      await this.fileHandle.close();
      this.fileHandle = null;

      // Update config to point to new file
      const oldPath = this.config.outputPath;
      this.config.outputPath = newFilename;

      // Open new file
      this.fileHandle = await fs.promises.open(this.config.outputPath, 'a');

      // Write continuity marker to new file
      const newMarker = `=== CONTINUED FROM: ${path.basename(oldPath)} ===\n`;
      await this.fileHandle.write(newMarker, null, 'utf8');
      this.rotationMetadata.currentFileSize = Buffer.byteLength(newMarker, 'utf8');

      // Update rotation metadata
      this.rotationMetadata.fileCreatedAt = Date.now();
      this.rotationMetadata.sequenceNumber++;
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Generates a filename for rotated log file
   * @returns The new filename with timestamp or sequence number
   */
  private getRotatedFileName(): string {
    const dir = path.dirname(this.config.outputPath);
    const ext = path.extname(this.config.outputPath);
    const basename = path.basename(this.config.outputPath, ext);

    // Use timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    
    return path.join(dir, `${basename}-${timestamp}${ext}`);
  }

  /**
   * Handles errors by invoking the error callback
   * @param error - The error to handle
   */
  private handleError(error: Error): void {
    if (this.config.onError) {
      this.config.onError(error);
    } else {
      console.error('FileManager Error:', error);
    }
  }

  /**
   * Retries an operation with exponential backoff
   * @param operationKey - Unique key for the operation
   * @param operation - The async operation to retry
   */
  private async retryOperation(operationKey: string, operation: () => Promise<void>): Promise<void> {
    const retries = this.retryCount.get(operationKey) || 0;

    try {
      await operation();
      // Success - reset retry count
      this.retryCount.delete(operationKey);
    } catch (error) {
      if (retries < this.retryConfig.maxRetries) {
        // Increment retry count
        this.retryCount.set(operationKey, retries + 1);
        
        // Calculate delay with exponential backoff
        const delay = this.retryConfig.baseDelay * Math.pow(2, retries);
        
        // Emit error but don't throw
        this.handleError(new Error(`Operation '${operationKey}' failed, retrying (${retries + 1}/${this.retryConfig.maxRetries})...`));
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the operation
        return this.retryOperation(operationKey, operation);
      } else {
        // Max retries exceeded - emit error and reset count
        this.retryCount.delete(operationKey);
        this.handleError(error as Error);
        // Don't throw - continue operating
      }
    }
  }

  /**
   * Gets the current buffer size (for testing)
   * @returns Number of entries in the buffer
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Gets the current file size (for testing)
   * @returns Current file size in bytes
   */
  getCurrentFileSize(): number {
    return this.rotationMetadata.currentFileSize;
  }

  /**
   * Gets the rotation metadata (for testing)
   * @returns Copy of rotation metadata
   */
  getRotationMetadata(): Readonly<RotationMetadata> {
    return { ...this.rotationMetadata };
  }
}
