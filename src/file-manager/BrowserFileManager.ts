/**
 * File Manager for Browser
 * Handles log storage using localStorage or IndexedDB
 */

import { FileManagerConfig } from './types';

/**
 * BrowserFileManager class
 * Manages log storage in browser environments using localStorage or IndexedDB
 */
export class BrowserFileManager {
  private config: FileManagerConfig;
  private buffer: string[] = [];
  private storageKey: string;
  private useIndexedDB: boolean = false;
  private dbName: string = 'axon-logs';
  private storeName: string = 'logs';
  private flushTimer: number | null = null;

  /**
   * Creates a new BrowserFileManager instance
   * @param config - Configuration for file operations
   */
  constructor(config: FileManagerConfig) {
    this.config = config;
    this.storageKey = `axon:${config.outputPath}`;
    
    // Detect storage mechanism based on estimated size
    this.detectStorageMechanism();

    // Start auto-flush timer if interval is set
    if (this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Detects whether to use localStorage or IndexedDB
   * Uses localStorage for small logs, IndexedDB for larger logs
   */
  private detectStorageMechanism(): void {
    // Check if we have existing data
    try {
      const existingData = localStorage.getItem(this.storageKey);
      if (existingData && existingData.length > 5 * 1024 * 1024) {
        // Existing data > 5MB, use IndexedDB
        this.useIndexedDB = true;
      }
    } catch (error) {
      // localStorage might be full or unavailable, use IndexedDB
      this.useIndexedDB = true;
    }
  }

  /**
   * Starts the auto-flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush().catch(error => this.handleError(error));
    }, this.config.flushInterval);
  }

  /**
   * Stops the auto-flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer !== null) {
      window.clearInterval(this.flushTimer);
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
   * Flushes the buffer to storage
   * Writes all buffered entries to localStorage or IndexedDB
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    try {
      const data = this.buffer.join('\n') + '\n';

      if (this.useIndexedDB) {
        await this.writeToIndexedDB(data);
      } else {
        await this.writeToLocalStorage(data);
      }

      // Clear buffer after successful write
      this.buffer = [];
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Writes data to localStorage
   * @param data - The data to write
   */
  private async writeToLocalStorage(data: string): Promise<void> {
    try {
      const existingData = localStorage.getItem(this.storageKey) || '';
      const newData = existingData + data;

      // Check if we're approaching quota
      if (newData.length > 5 * 1024 * 1024) {
        // Switch to IndexedDB
        this.useIndexedDB = true;
        await this.migrateToIndexedDB(newData);
      } else {
        localStorage.setItem(this.storageKey, newData);
      }
    } catch (error) {
      // Quota exceeded or other error
      if ((error as any).name === 'QuotaExceededError') {
        // Switch to IndexedDB
        this.useIndexedDB = true;
        const existingData = localStorage.getItem(this.storageKey) || '';
        await this.migrateToIndexedDB(existingData + data);
      } else {
        throw error;
      }
    }
  }

  /**
   * Writes data to IndexedDB
   * @param data - The data to write
   */
  private async writeToIndexedDB(data: string): Promise<void> {
    const db = await this.openIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const entry = {
        timestamp: Date.now(),
        data: data
      };

      const request = store.add(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Opens IndexedDB connection
   * @returns Promise that resolves to IDBDatabase
   */
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Migrates data from localStorage to IndexedDB
   * @param data - The data to migrate
   */
  private async migrateToIndexedDB(data: string): Promise<void> {
    // Write to IndexedDB
    await this.writeToIndexedDB(data);
    
    // Clear localStorage
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      // Ignore errors when clearing localStorage
    }
  }

  /**
   * Downloads logs as a file
   * Triggers browser download of all log data
   */
  async downloadLogs(): Promise<void> {
    try {
      let logData = '';

      if (this.useIndexedDB) {
        logData = await this.readFromIndexedDB();
      } else {
        logData = localStorage.getItem(this.storageKey) || '';
      }

      // Add buffered data
      if (this.buffer.length > 0) {
        logData += this.buffer.join('\n') + '\n';
      }

      // Create blob and trigger download
      const blob = new Blob([logData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axon-logs-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Reads all data from IndexedDB
   * @returns Promise that resolves to concatenated log data
   */
  private async readFromIndexedDB(): Promise<string> {
    const db = await this.openIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const data = entries.map((entry: any) => entry.data).join('');
        resolve(data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Closes the file manager
   * Flushes remaining buffer
   */
  async close(): Promise<void> {
    // Stop auto-flush timer
    this.stopFlushTimer();

    // Flush remaining buffer
    await this.flush();
  }

  /**
   * Handles errors by invoking the error callback
   * @param error - The error to handle
   */
  private handleError(error: Error): void {
    if (this.config.onError) {
      this.config.onError(error);
    } else {
      console.error('BrowserFileManager Error:', error);
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
   * Gets the current buffer (for testing)
   * @returns Copy of the current buffer
   */
  getBuffer(): ReadonlyArray<string> {
    return [...this.buffer];
  }

  /**
   * Gets whether IndexedDB is being used (for testing)
   * @returns True if using IndexedDB, false if using localStorage
   */
  isUsingIndexedDB(): boolean {
    return this.useIndexedDB;
  }
}
