/**
 * Unit tests for Logger class
 * Tests constructor, log level methods, metadata management, and section markers
 */

import { Logger } from '../../src/logger/Logger';
import { LogLevel, LogEntry } from '../../src/logger/types';

describe('Logger', () => {
  describe('Constructor and Configuration', () => {
    test('creates logger with minimal config', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      const config = logger.getConfig();
      
      expect(config.outputPath).toBe('./test.txt');
      expect(config.level).toBe(LogLevel.INFO);
      expect(config.maxFileSize).toBe(10 * 1024 * 1024); // Default 10MB
      expect(config.bufferSize).toBe(100); // Default
    });

    test('merges provided config with defaults', () => {
      const logger = new Logger({
        outputPath: './custom.txt',
        level: LogLevel.DEBUG,
        maxFileSize: 5000000,
        bufferSize: 50
      });
      const config = logger.getConfig();
      
      expect(config.outputPath).toBe('./custom.txt');
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.maxFileSize).toBe(5000000);
      expect(config.bufferSize).toBe(50);
      expect(config.delimiter).toBe(','); // Default
      expect(config.omitNullValues).toBe(true); // Default
    });

    test('merges field aliases with defaults', () => {
      const logger = new Logger({
        outputPath: './test.txt',
        level: LogLevel.INFO,
        fieldAliases: {
          userId: 'uid',
          requestId: 'rid'
        }
      });
      const config = logger.getConfig();
      
      // Should have both default and custom aliases
      expect(config.fieldAliases.timestamp).toBe('ts');
      expect(config.fieldAliases.userId).toBe('uid');
      expect(config.fieldAliases.requestId).toBe('rid');
    });

    test('validates log level', () => {
      expect(() => {
        new Logger({ outputPath: './test.txt', level: 999 as LogLevel });
      }).toThrow('Invalid log level');
    });

    test('validates output path', () => {
      expect(() => {
        new Logger({ outputPath: '', level: LogLevel.INFO });
      }).toThrow('Invalid outputPath');
    });

    test('validates maxFileSize', () => {
      expect(() => {
        new Logger({ outputPath: './test.txt', level: LogLevel.INFO, maxFileSize: 0 });
      }).toThrow('Invalid maxFileSize');
      
      expect(() => {
        new Logger({ outputPath: './test.txt', level: LogLevel.INFO, maxFileSize: -100 });
      }).toThrow('Invalid maxFileSize');
    });

    test('validates bufferSize', () => {
      expect(() => {
        new Logger({ outputPath: './test.txt', level: LogLevel.INFO, bufferSize: 0 });
      }).toThrow('Invalid bufferSize');
    });

    test('validates flushInterval', () => {
      expect(() => {
        new Logger({ outputPath: './test.txt', level: LogLevel.INFO, flushInterval: -1 });
      }).toThrow('Invalid flushInterval');
    });

    test('validates rotationInterval', () => {
      expect(() => {
        new Logger({ 
          outputPath: './test.txt', 
          level: LogLevel.INFO, 
          rotationInterval: 'invalid' as any 
        });
      }).toThrow('Invalid rotationInterval');
    });

    test('validates delimiter', () => {
      expect(() => {
        new Logger({ 
          outputPath: './test.txt', 
          level: LogLevel.INFO, 
          delimiter: ';' as any 
        });
      }).toThrow('Invalid delimiter');
    });
  });

  describe('Log Level Methods', () => {
    test('debug() creates log entry with DEBUG level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.DEBUG });
      logger.debug('Debug message');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const entry = buffer[0] as LogEntry;
      expect(entry.lvl).toBe(LogLevel.DEBUG);
      expect(entry.msg).toBe('Debug message');
      expect(entry.ts).toBeGreaterThan(0);
    });

    test('info() creates log entry with INFO level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Info message');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const entry = buffer[0] as LogEntry;
      expect(entry.lvl).toBe(LogLevel.INFO);
      expect(entry.msg).toBe('Info message');
    });

    test('warn() creates log entry with WARN level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.WARN });
      logger.warn('Warning message');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const entry = buffer[0] as LogEntry;
      expect(entry.lvl).toBe(LogLevel.WARN);
      expect(entry.msg).toBe('Warning message');
    });

    test('error() creates log entry with ERROR level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.ERROR });
      logger.error('Error message');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const entry = buffer[0] as LogEntry;
      expect(entry.lvl).toBe(LogLevel.ERROR);
      expect(entry.msg).toBe('Error message');
    });

    test('fatal() creates log entry with FATAL level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.FATAL });
      logger.fatal('Fatal message');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const entry = buffer[0] as LogEntry;
      expect(entry.lvl).toBe(LogLevel.FATAL);
      expect(entry.msg).toBe('Fatal message');
    });

    test('log entry includes timestamp', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      const before = Date.now();
      logger.info('Test message');
      const after = Date.now();
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.ts).toBeGreaterThanOrEqual(before);
      expect(entry.ts).toBeLessThanOrEqual(after);
    });

    test('multiple log calls add entries to buffer', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.DEBUG });
      
      logger.debug('Debug 1');
      logger.info('Info 1');
      logger.warn('Warn 1');
      logger.error('Error 1');
      logger.fatal('Fatal 1');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(5);
      expect((buffer[0] as LogEntry).msg).toBe('Debug 1');
      expect((buffer[1] as LogEntry).msg).toBe('Info 1');
      expect((buffer[2] as LogEntry).msg).toBe('Warn 1');
      expect((buffer[3] as LogEntry).msg).toBe('Error 1');
      expect((buffer[4] as LogEntry).msg).toBe('Fatal 1');
    });
  });

  describe('Log Level Filtering', () => {
    test('filters out logs below configured level', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.WARN });
      
      logger.debug('Should be filtered');
      logger.info('Should be filtered');
      logger.warn('Should appear');
      logger.error('Should appear');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(2);
      expect((buffer[0] as LogEntry).msg).toBe('Should appear');
      expect((buffer[1] as LogEntry).msg).toBe('Should appear');
    });

    test('DEBUG level allows all logs', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.DEBUG });
      
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.fatal('Fatal');
      
      expect(logger.getBuffer()).toHaveLength(5);
    });

    test('FATAL level filters all except fatal', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.FATAL });
      
      logger.debug('Filtered');
      logger.info('Filtered');
      logger.warn('Filtered');
      logger.error('Filtered');
      logger.fatal('Appears');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      expect((buffer[0] as LogEntry).msg).toBe('Appears');
    });
  });

  describe('Metadata Handling', () => {
    test('includes per-entry metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test message', { userId: 123, action: 'login' });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ userId: 123, action: 'login' });
    });

    test('does not include meta field when no metadata provided', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test message');
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toBeUndefined();
    });

    test('setGlobalMetadata sets global metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ appName: 'test-app', version: '1.0' });
      
      const globalMeta = logger.getGlobalMetadata();
      expect(globalMeta).toEqual({ appName: 'test-app', version: '1.0' });
    });

    test('global metadata is included in log entries', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ appName: 'test-app' });
      logger.info('Test message');
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ appName: 'test-app' });
    });

    test('per-entry metadata merges with global metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ appName: 'test-app', env: 'prod' });
      logger.info('Test message', { userId: 123 });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ 
        appName: 'test-app', 
        env: 'prod', 
        userId: 123 
      });
    });

    test('per-entry metadata wins on conflicts', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ env: 'prod', version: '1.0' });
      logger.info('Test message', { env: 'staging', userId: 123 });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ 
        env: 'staging',  // Per-entry wins
        version: '1.0',
        userId: 123 
      });
    });

    test('clearGlobalMetadata removes all global metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ appName: 'test-app', version: '1.0' });
      logger.clearGlobalMetadata();
      
      const globalMeta = logger.getGlobalMetadata();
      expect(globalMeta).toEqual({});
    });

    test('logs after clearGlobalMetadata have no global metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ appName: 'test-app' });
      logger.clearGlobalMetadata();
      logger.info('Test message');
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toBeUndefined();
    });

    test('setGlobalMetadata replaces previous global metadata', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.setGlobalMetadata({ old: 'value' });
      logger.setGlobalMetadata({ new: 'value' });
      
      const globalMeta = logger.getGlobalMetadata();
      expect(globalMeta).toEqual({ new: 'value' });
      expect(globalMeta).not.toHaveProperty('old');
    });

    test('empty metadata object is handled correctly', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test message', {});
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toBeUndefined();
    });
  });

  describe('Section Markers', () => {
    test('mark() adds section marker to buffer', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.mark('test-section');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(1);
      expect(typeof buffer[0]).toBe('string');
    });

    test('marker has correct format', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      const before = Date.now();
      logger.mark('authentication-flow');
      const after = Date.now();
      
      const marker = logger.getBuffer()[0] as string;
      expect(marker).toMatch(/^=== MARKER: authentication-flow \| \d+ ===$/);
      
      // Extract timestamp from marker
      const match = marker.match(/\| (\d+) ===/);
      expect(match).not.toBeNull();
      const timestamp = parseInt(match![1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('markers can be mixed with log entries', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      
      logger.info('Before marker');
      logger.mark('section-1');
      logger.info('Inside section');
      logger.mark('section-2');
      logger.info('After markers');
      
      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(5);
      expect((buffer[0] as LogEntry).msg).toBe('Before marker');
      expect(buffer[1]).toContain('MARKER: section-1');
      expect((buffer[2] as LogEntry).msg).toBe('Inside section');
      expect(buffer[3]).toContain('MARKER: section-2');
      expect((buffer[4] as LogEntry).msg).toBe('After markers');
    });

    test('marker is searchable with regex', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.mark('my-label');
      
      const marker = logger.getBuffer()[0] as string;
      const regex = /^=== MARKER: (.+) \| (\d+) ===$/;
      const match = marker.match(regex);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('my-label');
      expect(parseInt(match![2])).toBeGreaterThan(0);
    });

    test('marker with special characters in label', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.mark('section-with-dashes_and_underscores');
      
      const marker = logger.getBuffer()[0] as string;
      expect(marker).toContain('section-with-dashes_and_underscores');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty message string', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('');
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.msg).toBe('');
    });

    test('handles message with special characters', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      const message = 'Message with\nnewlines\tand\ttabs, commas, and "quotes"';
      logger.info(message);
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.msg).toBe(message);
    });

    test('handles metadata with nested objects', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test', {
        user: {
          id: 123,
          profile: {
            name: 'Alice',
            age: 30
          }
        }
      });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({
        user: {
          id: 123,
          profile: {
            name: 'Alice',
            age: 30
          }
        }
      });
    });

    test('handles metadata with arrays', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test', { tags: ['auth', 'security', 'login'] });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ tags: ['auth', 'security', 'login'] });
    });

    test('handles metadata with null and undefined values', () => {
      const logger = new Logger({ outputPath: './test.txt', level: LogLevel.INFO });
      logger.info('Test', { nullValue: null, undefinedValue: undefined, normalValue: 'test' });
      
      const entry = logger.getBuffer()[0] as LogEntry;
      expect(entry.meta).toEqual({ 
        nullValue: null, 
        undefinedValue: undefined, 
        normalValue: 'test' 
      });
    });
  });
});
