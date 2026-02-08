/**
 * Integration tests for Logger with Serializer and FileManager
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../src/logger/Logger';
import { LogLevel } from '../../src/logger/types';

describe('Logger Integration', () => {
  const testDir = path.join(__dirname, 'test-integration-logs');
  const testFile = path.join(testDir, 'integration.txt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (fs.existsSync(testDir)) {
      const cleanupDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            cleanupDir(filePath);
            fs.rmdirSync(filePath);
          } else {
            fs.unlinkSync(filePath);
          }
        }
      };
      
      cleanupDir(testDir);
      fs.rmdirSync(testDir);
    }
  });

  it('should log entries and write to file', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO
    });

    logger.info('Test message 1');
    logger.warn('Test message 2');
    logger.error('Test message 3');

    await logger.flush();
    await logger.close();

    expect(fs.existsSync(testFile)).toBe(true);
    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('Test message 1');
    expect(content).toContain('Test message 2');
    expect(content).toContain('Test message 3');
  });

  it('should serialize log entries in TOON format', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO
    });

    logger.info('Message with metadata', { userId: 123, action: 'login' });

    await logger.flush();
    await logger.close();

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('userId');
    expect(content).toContain('123');
    expect(content).toContain('action');
    expect(content).toContain('login');
  });

  it('should write section markers', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO
    });

    logger.mark('test-section');
    logger.info('Message in section');

    await logger.flush();
    await logger.close();

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('=== MARKER: test-section');
    expect(content).toContain('Message in section');
  });

  it('should filter logs by level', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.WARN
    });

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');

    await logger.flush();
    await logger.close();

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).not.toContain('Debug message');
    expect(content).not.toContain('Info message');
    expect(content).toContain('Warn message');
    expect(content).toContain('Error message');
  });

  it('should handle global metadata', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO
    });

    logger.setGlobalMetadata({ appVersion: '1.0.0', environment: 'test' });
    logger.info('Message with global metadata');

    await logger.flush();
    await logger.close();

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('appVersion');
    expect(content).toContain('1.0.0');
    expect(content).toContain('environment');
    expect(content).toContain('test');
  });

  it('should merge global and per-entry metadata', async () => {
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO
    });

    logger.setGlobalMetadata({ global: 'value' });
    logger.info('Message', { local: 'data' });

    await logger.flush();
    await logger.close();

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('global');
    expect(content).toContain('value');
    expect(content).toContain('local');
    expect(content).toContain('data');
  });

  it('should handle errors gracefully', async () => {
    const errorCallback = jest.fn();
    
    const logger = new Logger({
      outputPath: testFile,
      level: LogLevel.INFO,
      onError: errorCallback
    });

    // Log with circular reference
    const obj: any = { name: 'test' };
    obj.self = obj;
    
    logger.info('Message with circular ref', obj);

    await logger.flush();
    await logger.close();

    // Should still create the file
    expect(fs.existsSync(testFile)).toBe(true);
  });
});
