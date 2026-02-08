#!/usr/bin/env node

/**
 * AXON CLI Tool
 * Command-line interface for log extraction, counting, and export
 */

import { Command } from 'commander';
import { LogExtractor } from '../extractor/LogExtractor';
import { LogLevel } from '../logger/types';
import { TokenCounter } from '../utils/TokenCounter';
import * as fs from 'fs';

const program = new Command();

program
  .name('axon')
  .description('AXON logging framework CLI - Extract, count, and export logs')
  .version('1.0.0');

// Extract command
program
  .command('extract')
  .description('Extract logs from a file based on filters')
  .argument('<file>', 'Path to log file')
  .option('-s, --section <label>', 'Extract section by marker label')
  .option('-e, --end-section <label>', 'End section marker label')
  .option('-t, --time-range <start,end>', 'Extract by time range (ISO 8601 timestamps)')
  .option('-l, --level <level>', 'Extract by minimum log level (DEBUG, INFO, WARN, ERROR, FATAL)')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (file: string, options: any) => {
    try {
      const extractor = new LogExtractor(file);
      let result: string;

      if (options.section) {
        result = extractor.extractSection(options.section, options.endSection);
      } else if (options.timeRange) {
        const [start, end] = options.timeRange.split(',');
        result = extractor.extractTimeRange(new Date(start), new Date(end));
      } else if (options.level) {
        const levelMap: Record<string, LogLevel> = {
          'DEBUG': LogLevel.DEBUG,
          'INFO': LogLevel.INFO,
          'WARN': LogLevel.WARN,
          'ERROR': LogLevel.ERROR,
          'FATAL': LogLevel.FATAL
        };
        const level = levelMap[options.level.toUpperCase()];
        if (level === undefined) {
          console.error(`Invalid log level: ${options.level}`);
          process.exit(1);
        }
        result = extractor.extractByLevel(level);
      } else {
        console.error('Please specify a filter: --section, --time-range, or --level');
        process.exit(1);
      }

      if (options.output) {
        await fs.promises.writeFile(options.output, result, 'utf8');
        console.log(`Extracted logs written to ${options.output}`);
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Count command
program
  .command('count')
  .description('Count tokens in a log file or section')
  .argument('<file>', 'Path to log file')
  .option('-s, --section <label>', 'Count tokens in section')
  .option('-e, --end-section <label>', 'End section marker label')
  .action(async (file: string, options: any) => {
    try {
      let content: string;

      if (options.section) {
        const extractor = new LogExtractor(file);
        content = extractor.extractSection(options.section, options.endSection);
      } else {
        content = await fs.promises.readFile(file, 'utf8');
      }

      const counter = new TokenCounter();
      const tokenCount = counter.countTokens(content);
      
      console.log(`Token count: ${tokenCount}`);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export filtered logs to a new file')
  .argument('<source>', 'Source log file')
  .argument('<destination>', 'Destination file')
  .option('-s, --section <label>', 'Export section by marker label')
  .option('-e, --end-section <label>', 'End section marker label')
  .option('-t, --time-range <start,end>', 'Export by time range (ISO 8601 timestamps)')
  .option('-l, --level <level>', 'Export by minimum log level (DEBUG, INFO, WARN, ERROR, FATAL)')
  .action(async (source: string, destination: string, options: any) => {
    try {
      const extractor = new LogExtractor(source);
      let result: string;

      if (options.section) {
        result = extractor.extractSection(options.section, options.endSection);
      } else if (options.timeRange) {
        const [start, end] = options.timeRange.split(',');
        result = extractor.extractTimeRange(new Date(start), new Date(end));
      } else if (options.level) {
        const levelMap: Record<string, LogLevel> = {
          'DEBUG': LogLevel.DEBUG,
          'INFO': LogLevel.INFO,
          'WARN': LogLevel.WARN,
          'ERROR': LogLevel.ERROR,
          'FATAL': LogLevel.FATAL
        };
        const level = levelMap[options.level.toUpperCase()];
        if (level === undefined) {
          console.error(`Invalid log level: ${options.level}`);
          process.exit(1);
        }
        result = extractor.extractByLevel(level);
      } else {
        // Export entire file
        result = await fs.promises.readFile(source, 'utf8');
      }

      await extractor.exportSection(result, destination);
      console.log(`Logs exported to ${destination}`);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
