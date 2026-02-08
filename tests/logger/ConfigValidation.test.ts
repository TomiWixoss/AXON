/**
 * Tests for configuration validation
 */

import { Logger } from '../../src/logger/Logger';
import { LogLevel } from '../../src/logger/types';

describe('Configuration Validation', () => {
  describe('Log Level Validation', () => {
    it('should accept valid log levels', () => {
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: LogLevel.DEBUG })).not.toThrow();
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: LogLevel.INFO })).not.toThrow();
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: LogLevel.WARN })).not.toThrow();
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: LogLevel.ERROR })).not.toThrow();
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: LogLevel.FATAL })).not.toThrow();
    });

    it('should reject invalid log level', () => {
      expect(() => new Logger({ outputPath: '/test/logs.txt', level: 999 as LogLevel }))
        .toThrow('Invalid log level');
    });
  });

  describe('Output Path Validation', () => {
    it('should accept valid output paths', () => {
      expect(() => new Logger({ outputPath: '/var/log/app.txt', level: LogLevel.INFO })).not.toThrow();
      expect(() => new Logger({ outputPath: './logs/app.txt', level: LogLevel.INFO })).not.toThrow();
      expect(() => new Logger({ outputPath: 'logs.txt', level: LogLevel.INFO })).not.toThrow();
    });

    it('should reject empty output path', () => {
      expect(() => new Logger({ outputPath: '', level: LogLevel.INFO }))
        .toThrow('Invalid outputPath: must be a non-empty string');
    });

    it('should reject non-string output path', () => {
      expect(() => new Logger({ outputPath: 123 as any, level: LogLevel.INFO }))
        .toThrow('Invalid outputPath: must be a non-empty string');
    });

    it('should reject output path with invalid characters', () => {
      expect(() => new Logger({ outputPath: '/test/logs<>.txt', level: LogLevel.INFO }))
        .toThrow('Invalid outputPath: contains invalid characters');
      
      expect(() => new Logger({ outputPath: '/test/logs|pipe.txt', level: LogLevel.INFO }))
        .toThrow('Invalid outputPath: contains invalid characters');
      
      expect(() => new Logger({ outputPath: '/test/logs?.txt', level: LogLevel.INFO }))
        .toThrow('Invalid outputPath: contains invalid characters');
    });
  });

  describe('Max File Size Validation', () => {
    it('should accept valid max file sizes', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: 1024 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: 10 * 1024 * 1024 
      })).not.toThrow();
    });

    it('should reject zero max file size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: 0 
      })).toThrow('Invalid maxFileSize: 0. Must be greater than 0');
    });

    it('should reject negative max file size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: -1000 
      })).toThrow('Invalid maxFileSize: -1000. Must be greater than 0');
    });

    it('should reject non-numeric max file size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: 'large' as any 
      })).toThrow('Invalid maxFileSize: large. Must be a finite number');
    });

    it('should reject infinite max file size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: Infinity 
      })).toThrow('Invalid maxFileSize: Infinity. Must be a finite number');
    });

    it('should reject max file size exceeding 1GB', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        maxFileSize: 2 * 1024 * 1024 * 1024 
      })).toThrow('Invalid maxFileSize: 2147483648. Must be less than or equal to 1GB');
    });
  });

  describe('Buffer Size Validation', () => {
    it('should accept valid buffer sizes', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 1 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 100 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 10000 
      })).not.toThrow();
    });

    it('should reject zero buffer size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 0 
      })).toThrow('Invalid bufferSize: 0. Must be greater than 0');
    });

    it('should reject negative buffer size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: -10 
      })).toThrow('Invalid bufferSize: -10. Must be greater than 0');
    });

    it('should reject non-integer buffer size', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 10.5 
      })).toThrow('Invalid bufferSize: 10.5. Must be a finite integer');
    });

    it('should reject buffer size exceeding 10000', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        bufferSize: 20000 
      })).toThrow('Invalid bufferSize: 20000. Must be less than or equal to 10000');
    });
  });

  describe('Flush Interval Validation', () => {
    it('should accept valid flush intervals', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: 0 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: 5000 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: 3600000 
      })).not.toThrow();
    });

    it('should reject negative flush interval', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: -1000 
      })).toThrow('Invalid flushInterval: -1000. Must be non-negative');
    });

    it('should reject non-integer flush interval', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: 1000.5 
      })).toThrow('Invalid flushInterval: 1000.5. Must be a finite integer');
    });

    it('should reject flush interval exceeding 1 hour', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        flushInterval: 4000000 
      })).toThrow('Invalid flushInterval: 4000000. Must be less than or equal to 3600000 ms');
    });
  });

  describe('Rotation Interval Validation', () => {
    it('should accept valid rotation intervals', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        rotationInterval: 'hourly' 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        rotationInterval: 'daily' 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        rotationInterval: 'weekly' 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        rotationInterval: 'none' 
      })).not.toThrow();
    });

    it('should reject invalid rotation interval', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        rotationInterval: 'monthly' as any 
      })).toThrow('Invalid rotationInterval: monthly. Must be one of: hourly, daily, weekly, none');
    });
  });

  describe('Delimiter Validation', () => {
    it('should accept valid delimiters', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        delimiter: ',' 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        delimiter: '\t' 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        delimiter: '|' 
      })).not.toThrow();
    });

    it('should reject invalid delimiter', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        delimiter: ';' as any 
      })).toThrow('Invalid delimiter: ;. Must be one of: comma, tab, or pipe');
    });
  });

  describe('Omit Null Values Validation', () => {
    it('should accept boolean values', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        omitNullValues: true 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        omitNullValues: false 
      })).not.toThrow();
    });

    it('should reject non-boolean values', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        omitNullValues: 'yes' as any 
      })).toThrow('Invalid omitNullValues: yes. Must be a boolean');
    });
  });

  describe('Field Aliases Validation', () => {
    it('should accept valid field aliases object', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        fieldAliases: { timestamp: 't', message: 'm' } 
      })).not.toThrow();
      
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        fieldAliases: {} 
      })).not.toThrow();
    });

    it('should reject non-object field aliases', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        fieldAliases: 'aliases' as any 
      })).toThrow('Invalid fieldAliases: must be an object');
    });

    it('should reject null field aliases', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        fieldAliases: null as any 
      })).toThrow('Invalid fieldAliases: must be an object');
    });

    it('should reject array field aliases', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        fieldAliases: ['t', 'm'] as any 
      })).toThrow('Invalid fieldAliases: must be an object');
    });
  });

  describe('Error Handler Validation', () => {
    it('should accept function error handler', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        onError: (err) => console.error(err) 
      })).not.toThrow();
    });

    it('should reject non-function error handler', () => {
      expect(() => new Logger({ 
        outputPath: '/test/logs.txt', 
        level: LogLevel.INFO, 
        onError: 'handler' as any 
      })).toThrow('Invalid onError: must be a function');
    });
  });

  describe('Multiple Invalid Fields', () => {
    it('should report first validation error encountered', () => {
      expect(() => new Logger({ 
        outputPath: '', 
        level: 999 as LogLevel, 
        maxFileSize: -1000 
      })).toThrow(); // Should throw on first error
    });
  });
});
