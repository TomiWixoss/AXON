/**
 * Tests for runtime configuration updates
 */

import { Logger } from '../../src/logger/Logger';
import { LogLevel } from '../../src/logger/types';

describe('Runtime Configuration Updates', () => {
  describe('setLevel', () => {
    it('should update log level at runtime', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(logger.getConfig().level).toBe(LogLevel.INFO);
      
      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getConfig().level).toBe(LogLevel.DEBUG);
      
      logger.setLevel(LogLevel.ERROR);
      expect(logger.getConfig().level).toBe(LogLevel.ERROR);
    });

    it('should apply new level to subsequent logs', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.WARN });
      
      logger.info('This should be filtered');
      expect(logger.getBuffer().length).toBe(0);
      
      logger.setLevel(LogLevel.INFO);
      logger.info('This should be logged');
      expect(logger.getBuffer().length).toBe(1);
    });

    it('should reject invalid log level', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(() => logger.setLevel(999 as LogLevel)).toThrow('Invalid log level');
    });

    it('should not affect existing buffer entries', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      logger.info('Message 1');
      logger.warn('Message 2');
      expect(logger.getBuffer().length).toBe(2);
      
      logger.setLevel(LogLevel.ERROR);
      expect(logger.getBuffer().length).toBe(2); // Existing entries remain
    });
  });

  describe('updateConfig', () => {
    it('should update buffer size at runtime', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO, bufferSize: 100 });
      
      expect(logger.getConfig().bufferSize).toBe(100);
      
      logger.updateConfig({ bufferSize: 200 });
      expect(logger.getConfig().bufferSize).toBe(200);
    });

    it('should update flush interval at runtime', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO, flushInterval: 5000 });
      
      expect(logger.getConfig().flushInterval).toBe(5000);
      
      logger.updateConfig({ flushInterval: 10000 });
      expect(logger.getConfig().flushInterval).toBe(10000);
    });

    it('should update delimiter at runtime', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO, delimiter: ',' });
      
      expect(logger.getConfig().delimiter).toBe(',');
      
      logger.updateConfig({ delimiter: '|' });
      expect(logger.getConfig().delimiter).toBe('|');
    });

    it('should update omitNullValues at runtime', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO, omitNullValues: true });
      
      expect(logger.getConfig().omitNullValues).toBe(true);
      
      logger.updateConfig({ omitNullValues: false });
      expect(logger.getConfig().omitNullValues).toBe(false);
    });

    it('should update field aliases at runtime', () => {
      const logger = new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO,
        fieldAliases: { timestamp: 't' }
      });
      
      expect(logger.getConfig().fieldAliases.timestamp).toBe('t');
      
      logger.updateConfig({ fieldAliases: { message: 'm' } });
      expect(logger.getConfig().fieldAliases.timestamp).toBe('t'); // Preserved
      expect(logger.getConfig().fieldAliases.message).toBe('m'); // Added
    });

    it('should update error handler at runtime', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const logger = new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO,
        onError: handler1
      });
      
      expect(logger.getConfig().onError).toBe(handler1);
      
      logger.updateConfig({ onError: handler2 });
      expect(logger.getConfig().onError).toBe(handler2);
    });

    it('should update multiple settings at once', () => {
      const logger = new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO,
        bufferSize: 100,
        flushInterval: 5000
      });
      
      logger.updateConfig({ 
        level: LogLevel.DEBUG,
        bufferSize: 200,
        flushInterval: 10000,
        delimiter: '|'
      });
      
      expect(logger.getConfig().level).toBe(LogLevel.DEBUG);
      expect(logger.getConfig().bufferSize).toBe(200);
      expect(logger.getConfig().flushInterval).toBe(10000);
      expect(logger.getConfig().delimiter).toBe('|');
    });

    it('should validate updates before applying', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(() => logger.updateConfig({ bufferSize: -10 }))
        .toThrow('Invalid bufferSize');
      
      // Original config should be unchanged
      expect(logger.getConfig().bufferSize).toBe(100);
    });

    it('should reject updating outputPath', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(() => logger.updateConfig({ outputPath: '/new/path.txt' }))
        .toThrow('Cannot update outputPath at runtime');
    });

    it('should reject updating maxFileSize', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(() => logger.updateConfig({ maxFileSize: 5000000 }))
        .toThrow('Cannot update maxFileSize at runtime');
    });

    it('should reject updating rotationInterval', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      expect(() => logger.updateConfig({ rotationInterval: 'hourly' }))
        .toThrow('Cannot update rotationInterval at runtime');
    });

    it('should not apply any changes if validation fails', () => {
      const logger = new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO,
        bufferSize: 100,
        flushInterval: 5000
      });
      
      expect(() => logger.updateConfig({ 
        bufferSize: 200,
        flushInterval: -1000 // Invalid
      })).toThrow();
      
      // No changes should be applied
      expect(logger.getConfig().bufferSize).toBe(100);
      expect(logger.getConfig().flushInterval).toBe(5000);
    });

    it('should handle empty update object', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      const originalConfig = logger.getConfig();
      
      expect(() => logger.updateConfig({})).not.toThrow();
      
      // Config should remain unchanged
      expect(logger.getConfig()).toEqual(originalConfig);
    });
  });

  describe('Integration: setLevel and updateConfig', () => {
    it('should work together correctly', () => {
      const logger = new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO,
        bufferSize: 100
      });
      
      logger.setLevel(LogLevel.DEBUG);
      logger.updateConfig({ bufferSize: 200 });
      
      expect(logger.getConfig().level).toBe(LogLevel.DEBUG);
      expect(logger.getConfig().bufferSize).toBe(200);
    });

    it('should allow setLevel after updateConfig', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      logger.updateConfig({ bufferSize: 200 });
      logger.setLevel(LogLevel.WARN);
      
      expect(logger.getConfig().level).toBe(LogLevel.WARN);
      expect(logger.getConfig().bufferSize).toBe(200);
    });

    it('should allow updateConfig to change level', () => {
      const logger = new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO });
      
      logger.updateConfig({ level: LogLevel.ERROR });
      
      expect(logger.getConfig().level).toBe(LogLevel.ERROR);
    });
  });
});
