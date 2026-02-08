/**
 * Configuration loader for AXON Logger
 * Handles loading configuration from multiple sources with proper precedence
 */

import * as fs from 'fs';
import * as path from 'path';
import { LoggerConfig, LogLevel, ResolvedConfig, DEFAULT_CONFIG, detectEnvironment } from './types';

/**
 * Loads configuration from environment variables
 * Environment variables are prefixed with AXON_
 * @returns Partial configuration from environment variables
 */
export function loadFromEnvironment(): Partial<LoggerConfig> {
  const config: Partial<LoggerConfig> = {};

  // Load log level from AXON_LOG_LEVEL
  if (process.env.AXON_LOG_LEVEL) {
    const levelStr = process.env.AXON_LOG_LEVEL.toUpperCase();
    if (levelStr in LogLevel && isNaN(Number(levelStr))) {
      config.level = LogLevel[levelStr as keyof typeof LogLevel];
    }
  }

  // Load output path from AXON_OUTPUT_PATH
  if (process.env.AXON_OUTPUT_PATH) {
    config.outputPath = process.env.AXON_OUTPUT_PATH;
  }

  // Load max file size from AXON_MAX_FILE_SIZE
  if (process.env.AXON_MAX_FILE_SIZE) {
    const size = parseInt(process.env.AXON_MAX_FILE_SIZE, 10);
    if (!isNaN(size) && size > 0) {
      config.maxFileSize = size;
    }
  }

  // Load rotation interval from AXON_ROTATION_INTERVAL
  if (process.env.AXON_ROTATION_INTERVAL) {
    const interval = process.env.AXON_ROTATION_INTERVAL.toLowerCase();
    if (['hourly', 'daily', 'weekly', 'none'].includes(interval)) {
      config.rotationInterval = interval as 'hourly' | 'daily' | 'weekly' | 'none';
    }
  }

  // Load buffer size from AXON_BUFFER_SIZE
  if (process.env.AXON_BUFFER_SIZE) {
    const size = parseInt(process.env.AXON_BUFFER_SIZE, 10);
    if (!isNaN(size) && size > 0) {
      config.bufferSize = size;
    }
  }

  // Load flush interval from AXON_FLUSH_INTERVAL
  if (process.env.AXON_FLUSH_INTERVAL) {
    const interval = parseInt(process.env.AXON_FLUSH_INTERVAL, 10);
    if (!isNaN(interval) && interval >= 0) {
      config.flushInterval = interval;
    }
  }

  // Load delimiter from AXON_DELIMITER
  if (process.env.AXON_DELIMITER) {
    const delimiter = process.env.AXON_DELIMITER;
    if (delimiter === ',' || delimiter === '\t' || delimiter === '|' || delimiter === 'tab' || delimiter === 'pipe') {
      config.delimiter = delimiter === 'tab' ? '\t' : delimiter === 'pipe' ? '|' : delimiter as ',' | '\t' | '|';
    }
  }

  // Load omit null values from AXON_OMIT_NULL_VALUES
  if (process.env.AXON_OMIT_NULL_VALUES) {
    const value = process.env.AXON_OMIT_NULL_VALUES.toLowerCase();
    if (value === 'true' || value === 'false') {
      config.omitNullValues = value === 'true';
    }
  }

  return config;
}

/**
 * Loads configuration from a .axonrc.json file
 * Searches for the file in the current directory and parent directories
 * @param startDir - Directory to start searching from (defaults to current working directory)
 * @returns Partial configuration from file, or empty object if file not found
 */
export function loadFromFile(startDir?: string): Partial<LoggerConfig> {
  const searchDir = startDir || process.cwd();
  const configFileName = '.axonrc.json';

  try {
    // Search for config file in current directory and parent directories
    let currentDir = searchDir;
    let configPath: string | null = null;

    // Search up to 10 levels up
    for (let i = 0; i < 10; i++) {
      const candidatePath = path.join(currentDir, configFileName);
      if (fs.existsSync(candidatePath)) {
        configPath = candidatePath;
        break;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root directory
        break;
      }
      currentDir = parentDir;
    }

    if (!configPath) {
      return {};
    }

    // Read and parse the config file
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(fileContent);

    // Validate that it's an object
    if (typeof config !== 'object' || config === null) {
      console.warn(`AXON: Invalid config file at ${configPath}: must be a JSON object`);
      return {};
    }

    // Convert string log level to enum if present
    if (config.level && typeof config.level === 'string') {
      const levelStr = config.level.toUpperCase();
      if (levelStr in LogLevel && isNaN(Number(levelStr))) {
        config.level = LogLevel[levelStr as keyof typeof LogLevel];
      }
    }

    return config;
  } catch (error) {
    // Silently ignore file read/parse errors
    if (error instanceof Error && error.message.includes('JSON')) {
      console.warn(`AXON: Failed to parse config file: ${error.message}`);
    }
    return {};
  }
}

/**
 * Merges configuration from multiple sources with proper precedence
 * Precedence order (highest to lowest): constructor > environment > file > defaults
 * @param constructorConfig - Configuration passed to Logger constructor
 * @param startDir - Directory to start searching for config file (optional)
 * @returns Fully resolved configuration with all fields populated
 */
export function mergeConfigurations(
  constructorConfig: LoggerConfig,
  startDir?: string
): ResolvedConfig {
  // Load from all sources
  const fileConfig = loadFromFile(startDir);
  const envConfig = loadFromEnvironment();

  // Merge with precedence: constructor > env > file > defaults
  const merged: ResolvedConfig = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...envConfig,
    ...constructorConfig,
    // Handle nested objects specially - only merge if they are valid objects
    fieldAliases: (() => {
      // If constructor provides fieldAliases, use it (even if invalid - validation will catch it)
      if (constructorConfig.fieldAliases !== undefined) {
        // If it's a valid object, merge with defaults
        if (typeof constructorConfig.fieldAliases === 'object' && 
            constructorConfig.fieldAliases !== null && 
            !Array.isArray(constructorConfig.fieldAliases)) {
          return {
            ...DEFAULT_CONFIG.fieldAliases,
            ...(fileConfig.fieldAliases && typeof fileConfig.fieldAliases === 'object' ? fileConfig.fieldAliases : {}),
            ...(envConfig.fieldAliases && typeof envConfig.fieldAliases === 'object' ? envConfig.fieldAliases : {}),
            ...constructorConfig.fieldAliases
          };
        }
        // Return invalid value as-is for validation to catch
        return constructorConfig.fieldAliases as any;
      }
      // Otherwise merge from other sources
      return {
        ...DEFAULT_CONFIG.fieldAliases,
        ...(fileConfig.fieldAliases && typeof fileConfig.fieldAliases === 'object' ? fileConfig.fieldAliases : {}),
        ...(envConfig.fieldAliases && typeof envConfig.fieldAliases === 'object' ? envConfig.fieldAliases : {})
      };
    })(),
    // Ensure environment is always set
    environment: detectEnvironment()
  };

  return merged;
}
