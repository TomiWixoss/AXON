# AXON API Documentation

## Table of Contents
- [Logger](#logger)
- [Configuration](#configuration)
- [Log Levels](#log-levels)
- [Serialization](#serialization)
- [File Management](#file-management)
- [Log Extraction](#log-extraction)
- [CLI Tools](#cli-tools)

## Logger

### Creating a Logger

```typescript
import { Logger, LogLevel } from 'axon';

const logger = new Logger({
  outputPath: './logs/app.txt',
  level: LogLevel.INFO,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  rotationInterval: 'daily',
  bufferSize: 100,
  flushInterval: 5000
});
```

### Logging Methods

```typescript
// Log at different levels
logger.debug('Debug message', { userId: 123 });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.fatal('Fatal error');

// Synchronous logging (bypasses buffering)
await logger.fatalSync('Critical error');
await logger.errorSync('Important error');
```

### Global Metadata

```typescript
// Set global metadata included in all logs
logger.setGlobalMetadata({ appName: 'my-app', version: '1.0.0' });

// Clear global metadata
logger.clearGlobalMetadata();
```

### Section Markers

```typescript
// Add section markers for log organization
logger.mark('authentication-flow');
logger.info('User logged in');
logger.mark('end-authentication');
```

### Flushing and Closing

```typescript
// Flush buffered entries immediately
await logger.flush();

// Close logger and release resources
await logger.close();
```

## Configuration

### Configuration Options

```typescript
interface LoggerConfig {
  outputPath: string;              // File path for logs
  level: LogLevel;                 // Minimum log level
  maxFileSize?: number;            // Max file size before rotation (bytes)
  rotationInterval?: 'hourly' | 'daily' | 'weekly' | 'none';
  fieldAliases?: Record<string, string>;  // Field name aliases
  omitNullValues?: boolean;        // Omit null/undefined values
  bufferSize?: number;             // Number of entries to buffer
  flushInterval?: number;          // Auto-flush interval (ms)
  delimiter?: ',' | '\t' | '|';    // Field delimiter
  onError?: (error: Error) => void;  // Error callback
  metadataFilter?: MetadataFilter;   // Filter sensitive metadata
}
```

### Configuration Sources

Configuration is loaded from multiple sources with precedence:
1. Constructor options (highest priority)
2. Environment variables
3. `.axonrc.json` file
4. Default values (lowest priority)

### Environment Variables

```bash
AXON_LOG_LEVEL=INFO
AXON_OUTPUT_PATH=./logs/app.txt
AXON_MAX_FILE_SIZE=10485760
AXON_ROTATION_INTERVAL=daily
AXON_BUFFER_SIZE=100
AXON_FLUSH_INTERVAL=5000
AXON_DELIMITER=,
AXON_OMIT_NULL_VALUES=true
```

### Runtime Configuration Updates

```typescript
// Update log level at runtime
logger.setLevel(LogLevel.DEBUG);

// Update multiple settings
logger.updateConfig({
  bufferSize: 200,
  flushInterval: 10000
});
```

## Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}
```

Logs are filtered based on the configured level. Only logs at or above the configured level are processed.

## Serialization

### TOON Serializer

```typescript
import { TOONSerializer } from 'axon';

const serializer = new TOONSerializer({
  delimiter: ',',
  omitNullValues: true,
  fieldAliases: { timestamp: 'ts', message: 'msg' },
  maxDepth: 10
});

const toon = serializer.serialize({ name: 'Alice', age: 30 });
```

### TOON Parser

```typescript
import { TOONParser } from 'axon';

const parser = new TOONParser();
const obj = parser.parse('name: Alice, age: 30');
```

### Streaming Parser

```typescript
import { StreamingParser } from 'axon';
import * as fs from 'fs';

const parser = new StreamingParser();
const stream = fs.createReadStream('./logs/app.txt');

for await (const entry of parser.parseStream(stream)) {
  console.log(entry);
}
```

## File Management

### Node.js File Manager

```typescript
import { FileManager } from 'axon';

const fileManager = new FileManager({
  outputPath: './logs/app.txt',
  maxFileSize: 10 * 1024 * 1024,
  rotationInterval: 'daily',
  bufferSize: 100,
  flushInterval: 5000,
  environment: 'node',
  onError: (err) => console.error(err)
});

fileManager.write('log entry');
await fileManager.flush();
await fileManager.close();
```

### Browser File Manager

```typescript
import { BrowserFileManager } from 'axon';

const fileManager = new BrowserFileManager({
  outputPath: 'app-logs',
  maxFileSize: 5 * 1024 * 1024,
  rotationInterval: 'none',
  bufferSize: 50,
  flushInterval: 3000,
  environment: 'browser',
  onError: (err) => console.error(err)
});

// Download logs
fileManager.downloadLogs();
```

## Log Extraction

### LogExtractor

```typescript
import { LogExtractor, LogLevel } from 'axon';

const extractor = new LogExtractor('./logs/app.txt');

// Extract by section
const section = extractor.extractSection('auth-flow', 'end-auth');

// Extract by time range
const timeRange = extractor.extractTimeRange(
  new Date('2024-01-01'),
  new Date('2024-01-02')
);

// Extract by log level
const errors = extractor.extractByLevel(LogLevel.ERROR);

// Export to file
await extractor.exportSection(errors, './logs/errors.txt');
```

## CLI Tools

### Extract Command

```bash
# Extract by section
axon extract logs/app.txt --section auth-flow --end-section end-auth

# Extract by time range
axon extract logs/app.txt --time-range "2024-01-01T00:00:00Z,2024-01-02T00:00:00Z"

# Extract by log level
axon extract logs/app.txt --level ERROR

# Output to file
axon extract logs/app.txt --level ERROR --output errors.txt
```

### Count Command

```bash
# Count tokens in entire file
axon count logs/app.txt

# Count tokens in section
axon count logs/app.txt --section auth-flow
```

### Export Command

```bash
# Export filtered logs
axon export logs/app.txt filtered.txt --level ERROR

# Export section
axon export logs/app.txt section.txt --section auth-flow
```

## Metadata Filtering

Filter sensitive metadata fields before serialization:

```typescript
const logger = new Logger({
  outputPath: './logs/app.txt',
  level: LogLevel.INFO,
  metadataFilter: {
    fieldNames: ['password', 'apiKey'],
    fieldPatterns: ['.*secret.*', '.*token.*']
  }
});

// These fields will be filtered out
logger.info('User login', {
  username: 'alice',
  password: 'secret123',  // Filtered
  apiKey: 'key123'        // Filtered
});
```

## Token Counting

```typescript
import { TokenCounter } from 'axon';

const counter = new TokenCounter();
const tokenCount = counter.countTokens(logContent);
console.log(`Token count: ${tokenCount}`);
```
