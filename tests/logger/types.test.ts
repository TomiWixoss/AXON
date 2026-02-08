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
