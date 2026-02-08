/**
 * LogExtractor class
 * Provides utilities for extracting and filtering log entries from TOON-formatted log files
 */

import * as fs from 'fs';
import { TOONParser } from '../parser/TOONParser';
import { LogLevel, LogEntry } from '../logger/types';

/**
 * LogExtractor class
 * Loads and parses log files, provides methods for extracting sections, time ranges, and filtering by level
 */
export class LogExtractor {
  private logFilePath: string;
  private parser: TOONParser;
  private entries: (LogEntry | string)[] = [];

  /**
   * Creates a new LogExtractor instance
   * @param logFilePath - Path to the log file to extract from
   */
  constructor(logFilePath: string) {
    if (!logFilePath || typeof logFilePath !== 'string') {
      throw new Error('Invalid logFilePath: must be a non-empty string');
    }

    this.logFilePath = logFilePath;
    this.parser = new TOONParser();
    this.loadLogFile();
  }

  /**
   * Loads and parses the log file
   * @private
   */
  private loadLogFile(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        throw new Error(`Log file not found: ${this.logFilePath}`);
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);

      // Parse each entry (could be a log entry or a marker)
      for (const line of lines) {
        if (line.startsWith('=== MARKER:')) {
          // It's a marker, keep as string
          this.entries.push(line);
        } else {
          try {
            // Try to parse as TOON log entry
            const parsed = this.parser.parse(line);
            this.entries.push(parsed as LogEntry);
          } catch {
            // If parsing fails, skip the line
            continue;
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to load log file: ${(error as Error).message}`);
    }
  }

  /**
   * Gets all entries (for testing purposes)
   * @returns Array of log entries and markers
   */
  getEntries(): (LogEntry | string)[] {
    return [...this.entries];
  }

  /**
   * Extracts a section of logs between markers
   * @param startMarker - The label of the start marker
   * @param endMarker - Optional label of the end marker. If not provided, extracts to end of file
   * @returns TOON-formatted string containing the extracted section
   */
  extractSection(startMarker: string, endMarker?: string): string {
    const markerRegex = /^=== MARKER: (.+) \| (\d+) ===$/;
    let inSection = false;
    let sectionEntries: (LogEntry | string)[] = [];

    for (const entry of this.entries) {
      if (typeof entry === 'string') {
        // It's a marker
        const match = entry.match(markerRegex);
        if (match) {
          const label = match[1];
          
          if (label === startMarker) {
            inSection = true;
            sectionEntries.push(entry); // Include start marker
            continue;
          }
          
          if (endMarker && label === endMarker) {
            sectionEntries.push(entry); // Include end marker
            break;
          }
        }
        
        if (inSection) {
          sectionEntries.push(entry);
        }
      } else {
        // It's a log entry
        if (inSection) {
          sectionEntries.push(entry);
        }
      }
    }

    // Serialize entries back to TOON format
    return this.serializeEntries(sectionEntries);
  }

  /**
   * Serializes entries back to TOON format
   * @param entries - Array of log entries and markers
   * @returns TOON-formatted string
   * @private
   */
  private serializeEntries(entries: (LogEntry | string)[]): string {
    const { TOONSerializer } = require('../serializer/TOONSerializer');
    const serializer = new TOONSerializer();
    
    return entries.map(entry => {
      if (typeof entry === 'string') {
        return entry;
      } else {
        return serializer.serialize(entry);
      }
    }).join('\n');
  }

  /**
   * Extracts log entries within a time range
   * @param start - Start date/time
   * @param end - End date/time
   * @returns TOON-formatted string containing entries within the time range
   */
  extractTimeRange(start: Date, end: Date): string {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const filteredEntries: (LogEntry | string)[] = [];

    for (const entry of this.entries) {
      if (typeof entry === 'string') {
        // It's a marker - check timestamp in marker
        const match = entry.match(/\| (\d+) ===$/);
        if (match) {
          const timestamp = parseInt(match[1]);
          if (timestamp >= startTime && timestamp <= endTime) {
            filteredEntries.push(entry);
          }
        }
      } else {
        // It's a log entry - check ts field
        if (entry.ts >= startTime && entry.ts <= endTime) {
          filteredEntries.push(entry);
        }
      }
    }

    return this.serializeEntries(filteredEntries);
  }

  /**
   * Extracts log entries at or above a specific log level
   * @param level - Minimum log level to extract
   * @returns TOON-formatted string containing entries at or above the specified level
   */
  extractByLevel(level: LogLevel): string {
    const filteredEntries: (LogEntry | string)[] = [];

    for (const entry of this.entries) {
      if (typeof entry === 'string') {
        // Include all markers
        filteredEntries.push(entry);
      } else {
        // Filter by log level
        if (entry.lvl >= level) {
          filteredEntries.push(entry);
        }
      }
    }

    return this.serializeEntries(filteredEntries);
  }

  /**
   * Exports a section to a new file
   * @param section - TOON-formatted section string
   * @param outputPath - Path to write the exported section
   * @returns Promise that resolves when export is complete
   */
  async exportSection(section: string, outputPath: string): Promise<void> {
    if (!outputPath || typeof outputPath !== 'string') {
      throw new Error('Invalid outputPath: must be a non-empty string');
    }

    try {
      // Ensure directory exists
      const path = require('path');
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write section to file
      await fs.promises.writeFile(outputPath, section, 'utf8');
    } catch (error) {
      throw new Error(`Failed to export section: ${(error as Error).message}`);
    }
  }
}
