/**
 * StreamingParser class
 * Provides streaming/incremental parsing of TOON log files
 */

import { Readable } from 'stream';
import { TOONParser } from './TOONParser';

/**
 * StreamingParser class
 * Parses TOON entries incrementally from a stream without loading entire file into memory
 */
export class StreamingParser {
  private parser: TOONParser;
  private buffer: string = '';

  constructor() {
    this.parser = new TOONParser();
  }

  /**
   * Parses a stream of TOON-formatted data incrementally
   * @param stream - Readable stream containing TOON data
   * @returns AsyncIterator that yields parsed entries one at a time
   */
  async *parseStream(stream: Readable): AsyncIterator<any> {
    for await (const chunk of stream) {
      this.buffer += chunk.toString();
      
      // Process complete lines
      const lines = this.buffer.split('\n');
      
      // Keep the last incomplete line in buffer
      this.buffer = lines.pop() || '';
      
      // Parse each complete line
      for (const line of lines) {
        if (line.trim().length === 0) {
          continue;
        }
        
        try {
          // Check if it's a marker
          if (line.startsWith('=== MARKER:')) {
            yield line;
          } else {
            // Parse as TOON entry
            const parsed = this.parser.parse(line);
            yield parsed;
          }
        } catch (error) {
          // Skip malformed entries
          continue;
        }
      }
    }
    
    // Process any remaining data in buffer
    if (this.buffer.trim().length > 0) {
      try {
        if (this.buffer.startsWith('=== MARKER:')) {
          yield this.buffer;
        } else {
          const parsed = this.parser.parse(this.buffer);
          yield parsed;
        }
      } catch {
        // Skip malformed final entry
      }
    }
  }
}
