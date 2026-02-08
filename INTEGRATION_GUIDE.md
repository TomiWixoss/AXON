# AXON Logger - Integration Guide for AI Assistants

This guide helps AI assistants integrate AXON logging framework into existing projects.

## Overview

AXON is a token-efficient logging framework using TOON (Token-Oriented Object Notation) format. It reduces log token usage by 30-60% compared to JSON, making it ideal for AI/LLM applications.

**NPM Package**: `axon-logger`  
**Version**: 1.0.0  
**Repository**: https://www.npmjs.com/package/axon-logger

## Quick Integration Steps

### 1. Installation

```bash
npm install axon-logger
```

### 2. Basic Setup

```typescript
import { Logger, LogLevel } from 'axon-logger';

// Create logger instance
const logger = new Logger({
  outputPath: './logs/app.txt',
  level: LogLevel.INFO
});

// Use in your application
logger.info('Application started');
logger.error('Error occurred', { code: 500, message: 'Internal error' });

// Cleanup when done
await logger.flush();
await logger.close();
```

### 3. Configuration Options

```typescript
const logger = new Logger({
  outputPath: './logs/app.txt',           // Required: log file path
  level: LogLevel.INFO,                   // Required: minimum log level
  maxFileSize: 10 * 1024 * 1024,         // Optional: 10MB rotation
  rotationInterval: 'daily',              // Optional: 'hourly' | 'daily' | 'weekly' | 'none'
  bufferSize: 100,                        // Optional: buffer 100 entries
  flushInterval: 5000,                    // Optional: auto-flush every 5s
  delimiter: ',',                         // Optional: ',' | '\t' | '|'
  omitNullValues: true,                   // Optional: skip null/undefined
  fieldAliases: {                         // Optional: shorten field names
    timestamp: 't',
    level: 'l',
    message: 'm'
  },
  onError: (error) => console.error(error) // Optional: error handler
});
```

## Common Integration Patterns

### Pattern 1: Express.js Middleware

```typescript
import express from 'express';
import { Logger, LogLevel } from 'axon-logger';

const app = express();
const logger = new Logger({
  outputPath: './logs/api.txt',
  level: LogLevel.INFO
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Error logging middleware
app.use((err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await logger.flush();
  await logger.close();
  process.exit(0);
});
```

### Pattern 2: Global Logger Singleton

```typescript
// logger.ts
import { Logger, LogLevel } from 'axon-logger';

class AppLogger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!AppLogger.instance) {
      AppLogger.instance = new Logger({
        outputPath: './logs/app.txt',
        level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
        maxFileSize: 10 * 1024 * 1024,
        rotationInterval: 'daily'
      });
    }
    return AppLogger.instance;
  }

  static async cleanup() {
    if (AppLogger.instance) {
      await AppLogger.instance.flush();
      await AppLogger.instance.close();
    }
  }
}

export const logger = AppLogger.getInstance();
export const cleanupLogger = AppLogger.cleanup;

// Usage in other files
import { logger } from './logger';
logger.info('Using global logger');
```

### Pattern 3: Section-Based Logging

```typescript
import { Logger, LogLevel } from 'axon-logger';

const logger = new Logger({
  outputPath: './logs/workflow.txt',
  level: LogLevel.INFO
});

async function processOrder(orderId: string) {
  logger.mark(`order-${orderId}-start`);
  
  logger.info('Validating order', { orderId });
  // ... validation logic
  
  logger.info('Processing payment', { orderId });
  // ... payment logic
  
  logger.info('Sending confirmation', { orderId });
  // ... email logic
  
  logger.mark(`order-${orderId}-complete`);
}

// Later, extract specific order logs using CLI:
// axon extract logs/workflow.txt --section order-123-start --end-section order-123-complete
```

### Pattern 4: Environment-Based Configuration

```typescript
import { Logger, LogLevel } from 'axon-logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = new Logger({
  outputPath: isProduction ? './logs/production.txt' : './logs/dev.txt',
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  maxFileSize: isProduction ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
  rotationInterval: isProduction ? 'daily' : 'none',
  fieldAliases: isProduction ? {
    timestamp: 't',
    level: 'l',
    message: 'm'
  } : undefined, // Full field names in dev for readability
  onError: (error) => {
    if (isDevelopment) {
      console.error('Logger error:', error);
    }
    // In production, might want to send to error tracking service
  }
});
```

### Pattern 5: Browser Usage

```typescript
import { Logger, LogLevel } from 'axon-logger';

// Browser automatically uses localStorage/IndexedDB
const logger = new Logger({
  outputPath: 'app-logs',  // Storage key name
  level: LogLevel.INFO,
  maxFileSize: 5 * 1024 * 1024  // 5MB limit for browser
});

// Log user interactions
document.addEventListener('click', (e) => {
  logger.debug('User click', {
    target: (e.target as HTMLElement).tagName,
    x: e.clientX,
    y: e.clientY
  });
});

// Download logs for debugging
const downloadLogs = async () => {
  const fileManager = logger.getFileManager();
  if ('downloadLogs' in fileManager) {
    await fileManager.downloadLogs();
  }
};
```

## Environment Variables

Configure AXON using environment variables (optional):

```bash
# .env file
AXON_LOG_LEVEL=INFO
AXON_OUTPUT_PATH=./logs/app.txt
AXON_MAX_FILE_SIZE=10485760
AXON_ROTATION_INTERVAL=daily
AXON_BUFFER_SIZE=100
AXON_FLUSH_INTERVAL=5000
AXON_DELIMITER=,
AXON_OMIT_NULL_VALUES=true
```

## Configuration File

Create `.axonrc.json` in project root (optional):

```json
{
  "outputPath": "./logs/app.txt",
  "level": "INFO",
  "maxFileSize": 10485760,
  "rotationInterval": "daily",
  "bufferSize": 100,
  "flushInterval": 5000,
  "fieldAliases": {
    "timestamp": "t",
    "level": "l",
    "message": "m"
  }
}
```

**Configuration precedence**: Constructor options > Environment variables > Config file > Defaults

## Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,  // Detailed debugging information
  INFO = 1,   // General informational messages
  WARN = 2,   // Warning messages
  ERROR = 3,  // Error messages
  FATAL = 4   // Critical errors
}
```

## Advanced Features

### Global Metadata

Add metadata to all log entries:

```typescript
logger.setGlobalMetadata({
  appVersion: '1.0.0',
  environment: 'production',
  serverName: 'web-01'
});

logger.info('Request processed'); // Includes global metadata
```

### Runtime Configuration Updates

Update settings without recreating logger:

```typescript
// Change log level at runtime
logger.setLevel(LogLevel.DEBUG);

// Update multiple settings
logger.updateConfig({
  bufferSize: 200,
  flushInterval: 10000
});
```

### Synchronous Logging

For critical errors that need immediate write:

```typescript
await logger.fatalSync('Critical system failure', { reason: 'Out of memory' });
await logger.errorSync('Database connection lost');
```

### Log Extraction (CLI)

Extract specific logs using the CLI tool:

```bash
# Extract by section
axon extract logs/app.txt --section auth-flow --end-section auth-complete

# Extract by time range
axon extract logs/app.txt --time-range "2024-01-01T00:00:00Z,2024-01-02T00:00:00Z"

# Extract by log level
axon extract logs/app.txt --level ERROR --output errors.txt

# Count tokens
axon count logs/app.txt
```

## TOON Format Examples

AXON uses TOON format for efficient serialization:

### Simple Object
```
timestamp: 1705334400000, level: INFO, message: User logged in, userId: 123
```

### Nested Object
```
timestamp: 1705334400000, level: ERROR, message: Database error, error:
  code: 500
  message: Connection timeout
  details:
    host: localhost
    port: 5432
```

### Array (Tabular)
```
users[3]{id,name,age}:
1,Alice,28
2,Bob,35
3,Carol,42
```

### Section Marker
```
=== MARKER: authentication-flow | 1705334400000 ===
```

## Migration from Other Loggers

### From Winston

```typescript
// Before (Winston)
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// After (AXON)
import { Logger, LogLevel } from 'axon-logger';
const logger = new Logger({
  outputPath: './logs/app.txt',
  level: LogLevel.INFO
});
```

### From Pino

```typescript
// Before (Pino)
import pino from 'pino';
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: { destination: './app.log' }
  }
});

// After (AXON)
import { Logger, LogLevel } from 'axon-logger';
const logger = new Logger({
  outputPath: './logs/app.txt',
  level: LogLevel.INFO
});
```

## Best Practices

1. **Always flush and close on shutdown**:
```typescript
process.on('SIGTERM', async () => {
  await logger.flush();
  await logger.close();
  process.exit(0);
});
```

2. **Use appropriate log levels**:
   - DEBUG: Detailed debugging (disable in production)
   - INFO: General application flow
   - WARN: Potential issues
   - ERROR: Errors that need attention
   - FATAL: Critical failures

3. **Use section markers for workflows**:
```typescript
logger.mark('payment-processing-start');
// ... payment logic
logger.mark('payment-processing-end');
```

4. **Add context with metadata**:
```typescript
logger.error('Payment failed', {
  userId: user.id,
  amount: payment.amount,
  reason: error.message
});
```

5. **Use field aliases in production** to reduce token usage:
```typescript
fieldAliases: {
  timestamp: 't',
  level: 'l',
  message: 'm',
  userId: 'uid',
  requestId: 'rid'
}
```

## Troubleshooting

### Issue: Logs not appearing
- Check `outputPath` is writable
- Ensure `level` allows your log messages
- Call `await logger.flush()` to force write

### Issue: High memory usage
- Reduce `bufferSize` (default: 100)
- Reduce `flushInterval` for more frequent writes
- Enable file rotation with `maxFileSize`

### Issue: Performance impact
- Increase `bufferSize` to reduce I/O
- Increase `flushInterval` for less frequent writes
- Use appropriate log level (avoid DEBUG in production)

## TypeScript Support

AXON includes full TypeScript definitions:

```typescript
import { Logger, LogLevel, LoggerConfig, LogEntry } from 'axon-logger';

const config: LoggerConfig = {
  outputPath: './logs/app.txt',
  level: LogLevel.INFO
};

const logger = new Logger(config);
```

## Performance Characteristics

- **Token Reduction**: 30-60% fewer tokens vs JSON
- **Throughput**: ~80,000+ logs/second (buffered)
- **Memory**: ~1-2MB per 1000 buffered entries
- **Latency**: <1ms per log call (buffered), ~10-50ms (flushed)

## Support & Resources

- **NPM Package**: https://www.npmjs.com/package/axon-logger
- **Documentation**: See `docs/API.md` in package
- **Issues**: Report via npm package page

## License

MIT License - Free for commercial and personal use.
