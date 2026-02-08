/**
 * Unit tests for LogLevel enum and LogEntry interface
 * Validates: Requirements 2.1, 2.2
 */

import { LogLevel, LogEntry } from '../../src/logger';

describe('LogLevel enum', () => {
  test('should have correct numeric values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
    expect(LogLevel.FATAL).toBe(4);
  });

  test('should have all required levels', () => {
    const levels = Object.keys(LogLevel).filter(key => isNaN(Number(key)));
    expect(levels).toContain('DEBUG');
    expect(levels).toContain('INFO');
    expect(levels).toContain('WARN');
    expect(levels).toContain('ERROR');
    expect(levels).toContain('FATAL');
    expect(levels.length).toBe(5);
  });

  test('should support numeric comparison for level filtering', () => {
    expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true);
    expect(LogLevel.INFO < LogLevel.WARN).toBe(true);
    expect(LogLevel.WARN < LogLevel.ERROR).toBe(true);
    expect(LogLevel.ERROR < LogLevel.FATAL).toBe(true);
  });

  test('should be usable as array index', () => {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    expect(levelNames[LogLevel.DEBUG]).toBe('DEBUG');
    expect(levelNames[LogLevel.INFO]).toBe('INFO');
    expect(levelNames[LogLevel.WARN]).toBe('WARN');
    expect(levelNames[LogLevel.ERROR]).toBe('ERROR');
    expect(levelNames[LogLevel.FATAL]).toBe('FATAL');
  });
});

describe('LogEntry interface', () => {
  test('should accept valid log entry with all fields', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: 'Test message',
      meta: { userId: 123, action: 'login' }
    };

    expect(entry.ts).toBeGreaterThan(0);
    expect(entry.lvl).toBe(LogLevel.INFO);
    expect(entry.msg).toBe('Test message');
    expect(entry.meta).toEqual({ userId: 123, action: 'login' });
  });

  test('should accept log entry without metadata', () => {
    const entry: LogEntry = {
      ts: 1705334400000,
      lvl: LogLevel.ERROR,
      msg: 'Error occurred'
    };

    expect(entry.ts).toBe(1705334400000);
    expect(entry.lvl).toBe(LogLevel.ERROR);
    expect(entry.msg).toBe('Error occurred');
    expect(entry.meta).toBeUndefined();
  });

  test('should accept log entry with empty metadata', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.DEBUG,
      msg: 'Debug info',
      meta: {}
    };

    expect(entry.meta).toEqual({});
  });

  test('should accept log entry with nested metadata', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.WARN,
      msg: 'Warning message',
      meta: {
        user: {
          id: 123,
          name: 'Alice'
        },
        context: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      }
    };

    expect(entry.meta?.user).toEqual({ id: 123, name: 'Alice' });
    expect(entry.meta?.context).toEqual({ 
      ip: '192.168.1.1', 
      userAgent: 'Mozilla/5.0' 
    });
  });

  test('should accept log entry with various metadata types', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: 'Mixed metadata',
      meta: {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' }
      }
    };

    expect(entry.meta?.string).toBe('value');
    expect(entry.meta?.number).toBe(42);
    expect(entry.meta?.boolean).toBe(true);
    expect(entry.meta?.null).toBeNull();
    expect(entry.meta?.undefined).toBeUndefined();
    expect(entry.meta?.array).toEqual([1, 2, 3]);
    expect(entry.meta?.object).toEqual({ nested: 'value' });
  });

  test('should use abbreviated field names', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: 'Test'
    };

    // Verify the interface uses abbreviated names
    expect('ts' in entry).toBe(true);
    expect('lvl' in entry).toBe(true);
    expect('msg' in entry).toBe(true);
    
    // These should not exist (not using verbose names)
    expect('timestamp' in entry).toBe(false);
    expect('level' in entry).toBe(false);
    expect('message' in entry).toBe(false);
  });

  test('should support all log levels', () => {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL
    ];

    levels.forEach(level => {
      const entry: LogEntry = {
        ts: Date.now(),
        lvl: level,
        msg: `Message at level ${level}`
      };
      expect(entry.lvl).toBe(level);
    });
  });

  test('should handle empty message', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: ''
    };

    expect(entry.msg).toBe('');
  });

  test('should handle very long messages', () => {
    const longMessage = 'x'.repeat(10000);
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: longMessage
    };

    expect(entry.msg.length).toBe(10000);
  });

  test('should handle special characters in message', () => {
    const entry: LogEntry = {
      ts: Date.now(),
      lvl: LogLevel.INFO,
      msg: 'Message with\nnewlines\tand\ttabs, commas, and "quotes"'
    };

    expect(entry.msg).toContain('\n');
    expect(entry.msg).toContain('\t');
    expect(entry.msg).toContain(',');
    expect(entry.msg).toContain('"');
  });
});

describe('detectEnvironment', () => {
  test('should detect Node.js environment', () => {
    // In Jest/Node.js environment, should detect as 'node'
    const { detectEnvironment } = require('../../src/logger/types');
    const env = detectEnvironment();
    expect(env).toBe('node');
  });

  test('should return valid environment type', () => {
    const { detectEnvironment } = require('../../src/logger/types');
    const env = detectEnvironment();
    expect(['node', 'browser']).toContain(env);
  });
});

describe('LoggerConfig interface', () => {
  test('should accept minimal configuration', () => {
    const { LogLevel } = require('../../src/logger/types');
    const config = {
      outputPath: './logs/test.txt',
      level: LogLevel.INFO
    };

    expect(config.outputPath).toBe('./logs/test.txt');
    expect(config.level).toBe(LogLevel.INFO);
  });

  test('should accept full configuration', () => {
    const { LogLevel } = require('../../src/logger/types');
    const config = {
      outputPath: './logs/test.txt',
      level: LogLevel.DEBUG,
      maxFileSize: 5 * 1024 * 1024,
      rotationInterval: 'hourly' as const,
      fieldAliases: { timestamp: 't', level: 'l' },
      omitNullValues: false,
      bufferSize: 50,
      flushInterval: 3000,
      delimiter: '\t' as const,
      onError: (err: Error) => console.log(err)
    };

    expect(config.maxFileSize).toBe(5 * 1024 * 1024);
    expect(config.rotationInterval).toBe('hourly');
    expect(config.fieldAliases).toEqual({ timestamp: 't', level: 'l' });
    expect(config.omitNullValues).toBe(false);
    expect(config.bufferSize).toBe(50);
    expect(config.flushInterval).toBe(3000);
    expect(config.delimiter).toBe('\t');
    expect(typeof config.onError).toBe('function');
  });

  test('should support all rotation intervals', () => {
    const { LogLevel } = require('../../src/logger/types');
    const intervals: Array<'hourly' | 'daily' | 'weekly' | 'none'> = [
      'hourly',
      'daily',
      'weekly',
      'none'
    ];

    intervals.forEach(interval => {
      const config = {
        outputPath: './logs/test.txt',
        level: LogLevel.INFO,
        rotationInterval: interval
      };
      expect(config.rotationInterval).toBe(interval);
    });
  });

  test('should support all delimiter types', () => {
    const { LogLevel } = require('../../src/logger/types');
    const delimiters: Array<',' | '\t' | '|'> = [',', '\t', '|'];

    delimiters.forEach(delimiter => {
      const config = {
        outputPath: './logs/test.txt',
        level: LogLevel.INFO,
        delimiter: delimiter
      };
      expect(config.delimiter).toBe(delimiter);
    });
  });

  test('should accept custom field aliases', () => {
    const { LogLevel } = require('../../src/logger/types');
    const config = {
      outputPath: './logs/test.txt',
      level: LogLevel.INFO,
      fieldAliases: {
        timestamp: 't',
        level: 'l',
        message: 'm',
        metadata: 'meta',
        customField: 'cf'
      }
    };

    expect(config.fieldAliases.timestamp).toBe('t');
    expect(config.fieldAliases.customField).toBe('cf');
  });
});

describe('DEFAULT_CONFIG', () => {
  test('should have all required fields', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.outputPath).toBeDefined();
    expect(DEFAULT_CONFIG.level).toBeDefined();
    expect(DEFAULT_CONFIG.maxFileSize).toBeDefined();
    expect(DEFAULT_CONFIG.rotationInterval).toBeDefined();
    expect(DEFAULT_CONFIG.fieldAliases).toBeDefined();
    expect(DEFAULT_CONFIG.omitNullValues).toBeDefined();
    expect(DEFAULT_CONFIG.bufferSize).toBeDefined();
    expect(DEFAULT_CONFIG.flushInterval).toBeDefined();
    expect(DEFAULT_CONFIG.delimiter).toBeDefined();
    expect(DEFAULT_CONFIG.onError).toBeDefined();
    expect(DEFAULT_CONFIG.environment).toBeDefined();
  });

  test('should have sensible default values', () => {
    const { DEFAULT_CONFIG, LogLevel } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.outputPath).toBe('./logs/axon.txt');
    expect(DEFAULT_CONFIG.level).toBe(LogLevel.INFO);
    expect(DEFAULT_CONFIG.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
    expect(DEFAULT_CONFIG.rotationInterval).toBe('daily');
    expect(DEFAULT_CONFIG.omitNullValues).toBe(true);
    expect(DEFAULT_CONFIG.bufferSize).toBe(100);
    expect(DEFAULT_CONFIG.flushInterval).toBe(5000);
    expect(DEFAULT_CONFIG.delimiter).toBe(',');
  });

  test('should have default field aliases', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.fieldAliases).toEqual({
      timestamp: 'ts',
      level: 'lvl',
      message: 'msg',
      metadata: 'meta'
    });
  });

  test('should have default error handler', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(typeof DEFAULT_CONFIG.onError).toBe('function');
    
    // Test that error handler doesn't throw
    const testError = new Error('Test error');
    expect(() => DEFAULT_CONFIG.onError(testError)).not.toThrow();
  });

  test('should have detected environment', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(['node', 'browser']).toContain(DEFAULT_CONFIG.environment);
  });

  test('should use valid rotation interval', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    const validIntervals = ['hourly', 'daily', 'weekly', 'none'];
    
    expect(validIntervals).toContain(DEFAULT_CONFIG.rotationInterval);
  });

  test('should use valid delimiter', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    const validDelimiters = [',', '\t', '|'];
    
    expect(validDelimiters).toContain(DEFAULT_CONFIG.delimiter);
  });

  test('should have positive buffer size', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.bufferSize).toBeGreaterThan(0);
  });

  test('should have positive flush interval', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.flushInterval).toBeGreaterThan(0);
  });

  test('should have positive max file size', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG.maxFileSize).toBeGreaterThan(0);
  });
});

describe('ResolvedConfig interface', () => {
  test('should extend LoggerConfig with required fields', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    // ResolvedConfig should have all fields as required
    const config = DEFAULT_CONFIG;
    
    // All fields should be defined (no undefined values)
    expect(config.outputPath).toBeDefined();
    expect(config.level).toBeDefined();
    expect(config.maxFileSize).toBeDefined();
    expect(config.rotationInterval).toBeDefined();
    expect(config.fieldAliases).toBeDefined();
    expect(config.omitNullValues).toBeDefined();
    expect(config.bufferSize).toBeDefined();
    expect(config.flushInterval).toBeDefined();
    expect(config.delimiter).toBeDefined();
    expect(config.onError).toBeDefined();
    expect(config.environment).toBeDefined();
  });

  test('should include environment field', () => {
    const { DEFAULT_CONFIG } = require('../../src/logger/types');
    
    expect(DEFAULT_CONFIG).toHaveProperty('environment');
    expect(['node', 'browser']).toContain(DEFAULT_CONFIG.environment);
  });
});
