/**
 * Tests for ConfigLoader
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  loadFromEnvironment, 
  loadFromFile, 
  mergeConfigurations 
} from '../../src/logger/ConfigLoader';
import { LogLevel, LoggerConfig } from '../../src/logger/types';

describe('ConfigLoader', () => {
  describe('loadFromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment before each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('should load log level from AXON_LOG_LEVEL', () => {
      process.env.AXON_LOG_LEVEL = 'DEBUG';
      const config = loadFromEnvironment();
      expect(config.level).toBe(LogLevel.DEBUG);
    });

    it('should load output path from AXON_OUTPUT_PATH', () => {
      process.env.AXON_OUTPUT_PATH = '/custom/path/logs.txt';
      const config = loadFromEnvironment();
      expect(config.outputPath).toBe('/custom/path/logs.txt');
    });

    it('should load max file size from AXON_MAX_FILE_SIZE', () => {
      process.env.AXON_MAX_FILE_SIZE = '5242880';
      const config = loadFromEnvironment();
      expect(config.maxFileSize).toBe(5242880);
    });

    it('should load rotation interval from AXON_ROTATION_INTERVAL', () => {
      process.env.AXON_ROTATION_INTERVAL = 'hourly';
      const config = loadFromEnvironment();
      expect(config.rotationInterval).toBe('hourly');
    });

    it('should load buffer size from AXON_BUFFER_SIZE', () => {
      process.env.AXON_BUFFER_SIZE = '50';
      const config = loadFromEnvironment();
      expect(config.bufferSize).toBe(50);
    });

    it('should load flush interval from AXON_FLUSH_INTERVAL', () => {
      process.env.AXON_FLUSH_INTERVAL = '3000';
      const config = loadFromEnvironment();
      expect(config.flushInterval).toBe(3000);
    });

    it('should load delimiter from AXON_DELIMITER', () => {
      process.env.AXON_DELIMITER = '|';
      const config = loadFromEnvironment();
      expect(config.delimiter).toBe('|');
    });

    it('should handle tab delimiter alias', () => {
      process.env.AXON_DELIMITER = 'tab';
      const config = loadFromEnvironment();
      expect(config.delimiter).toBe('\t');
    });

    it('should handle pipe delimiter alias', () => {
      process.env.AXON_DELIMITER = 'pipe';
      const config = loadFromEnvironment();
      expect(config.delimiter).toBe('|');
    });

    it('should load omit null values from AXON_OMIT_NULL_VALUES', () => {
      process.env.AXON_OMIT_NULL_VALUES = 'false';
      const config = loadFromEnvironment();
      expect(config.omitNullValues).toBe(false);
    });

    it('should ignore invalid log level', () => {
      process.env.AXON_LOG_LEVEL = 'INVALID';
      const config = loadFromEnvironment();
      expect(config.level).toBeUndefined();
    });

    it('should ignore invalid max file size', () => {
      process.env.AXON_MAX_FILE_SIZE = 'not-a-number';
      const config = loadFromEnvironment();
      expect(config.maxFileSize).toBeUndefined();
    });

    it('should ignore negative max file size', () => {
      process.env.AXON_MAX_FILE_SIZE = '-100';
      const config = loadFromEnvironment();
      expect(config.maxFileSize).toBeUndefined();
    });

    it('should return empty config when no environment variables set', () => {
      const config = loadFromEnvironment();
      expect(Object.keys(config).length).toBe(0);
    });

    it('should handle case-insensitive log level', () => {
      process.env.AXON_LOG_LEVEL = 'error';
      const config = loadFromEnvironment();
      expect(config.level).toBe(LogLevel.ERROR);
    });
  });

  describe('loadFromFile', () => {
    const testDir = path.join(__dirname, 'test-config');
    const configPath = path.join(testDir, '.axonrc.json');

    beforeEach(() => {
      // Create test directory
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up test files
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
    });

    it('should load configuration from .axonrc.json', () => {
      const testConfig = {
        outputPath: '/test/logs.txt',
        level: 'WARN',
        maxFileSize: 1048576
      };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      const config = loadFromFile(testDir);
      expect(config.outputPath).toBe('/test/logs.txt');
      expect(config.level).toBe(LogLevel.WARN);
      expect(config.maxFileSize).toBe(1048576);
    });

    it('should return empty config when file not found', () => {
      const config = loadFromFile(testDir);
      expect(Object.keys(config).length).toBe(0);
    });

    it('should handle invalid JSON gracefully', () => {
      fs.writeFileSync(configPath, 'not valid json');
      const config = loadFromFile(testDir);
      expect(Object.keys(config).length).toBe(0);
    });

    it('should handle non-object JSON gracefully', () => {
      fs.writeFileSync(configPath, '"string value"');
      const config = loadFromFile(testDir);
      expect(Object.keys(config).length).toBe(0);
    });

    it('should search parent directories for config file', () => {
      const subDir = path.join(testDir, 'sub', 'nested');
      fs.mkdirSync(subDir, { recursive: true });
      
      const testConfig = { outputPath: '/parent/logs.txt' };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      const config = loadFromFile(subDir);
      expect(config.outputPath).toBe('/parent/logs.txt');

      // Clean up
      fs.rmdirSync(path.join(testDir, 'sub', 'nested'));
      fs.rmdirSync(path.join(testDir, 'sub'));
    });

    it('should convert string log level to enum', () => {
      const testConfig = { level: 'fatal' };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      const config = loadFromFile(testDir);
      expect(config.level).toBe(LogLevel.FATAL);
    });
  });

  describe('mergeConfigurations', () => {
    const originalEnv = process.env;
    const testDir = path.join(__dirname, 'test-merge');
    const configPath = path.join(testDir, '.axonrc.json');

    beforeEach(() => {
      process.env = { ...originalEnv };
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      process.env = originalEnv;
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
    });

    it('should apply precedence: constructor > env > file > defaults', () => {
      // Set up file config
      fs.writeFileSync(configPath, JSON.stringify({
        outputPath: '/file/logs.txt',
        level: 'DEBUG',
        maxFileSize: 1000000
      }));

      // Set up env config
      process.env.AXON_OUTPUT_PATH = '/env/logs.txt';
      process.env.AXON_LEVEL = 'INFO';

      // Constructor config
      const constructorConfig: LoggerConfig = {
        outputPath: '/constructor/logs.txt',
        level: LogLevel.WARN
      };

      const merged = mergeConfigurations(constructorConfig, testDir);

      // Constructor wins for outputPath and level
      expect(merged.outputPath).toBe('/constructor/logs.txt');
      expect(merged.level).toBe(LogLevel.WARN);
      
      // File config wins for maxFileSize (not overridden)
      expect(merged.maxFileSize).toBe(1000000);
    });

    it('should merge field aliases from all sources', () => {
      // Set up file config
      fs.writeFileSync(configPath, JSON.stringify({
        fieldAliases: {
          timestamp: 't',
          custom1: 'c1'
        }
      }));

      // Constructor config
      const constructorConfig: LoggerConfig = {
        outputPath: '/test/logs.txt',
        level: LogLevel.INFO,
        fieldAliases: {
          message: 'm',
          custom2: 'c2'
        }
      };

      const merged = mergeConfigurations(constructorConfig, testDir);

      // Should have aliases from defaults, file, and constructor
      expect(merged.fieldAliases.timestamp).toBe('t'); // from file
      expect(merged.fieldAliases.message).toBe('m'); // from constructor
      expect(merged.fieldAliases.custom1).toBe('c1'); // from file
      expect(merged.fieldAliases.custom2).toBe('c2'); // from constructor
    });

    it('should always set environment field', () => {
      const constructorConfig: LoggerConfig = {
        outputPath: '/test/logs.txt',
        level: LogLevel.INFO
      };

      const merged = mergeConfigurations(constructorConfig);
      expect(merged.environment).toBeDefined();
      expect(['node', 'browser']).toContain(merged.environment);
    });

    it('should use defaults when no overrides provided', () => {
      const constructorConfig: LoggerConfig = {
        outputPath: '/test/logs.txt',
        level: LogLevel.INFO
      };

      const merged = mergeConfigurations(constructorConfig);
      
      // Should have default values
      expect(merged.bufferSize).toBe(100);
      expect(merged.flushInterval).toBe(5000);
      expect(merged.delimiter).toBe(',');
      expect(merged.omitNullValues).toBe(true);
    });
  });
});
