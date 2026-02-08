# AXON Logger - Browser Compatibility Guide

## Overview

AXON Logger version 1.0.1+ is fully compatible with browser environments (React, Next.js, Vue, Angular, etc.). The framework automatically detects the environment and uses appropriate storage mechanisms.

## What's Changed in v1.0.1

✅ **Fixed**: Conditional imports for Node.js-only modules (`fs`, `path`)  
✅ **Fixed**: Browser bundlers (webpack, Vite, etc.) no longer throw "Can't resolve 'fs'" errors  
✅ **Added**: Automatic environment detection  
✅ **Added**: Browser-specific storage using localStorage/IndexedDB  

## Browser vs Node.js Differences

| Feature | Node.js | Browser |
|---------|---------|---------|
| **File Writing** | ✅ Writes to disk | ✅ Writes to localStorage/IndexedDB |
| **File Rotation** | ✅ Size & time-based | ✅ Size-based only |
| **Log Extraction** | ✅ CLI tools available | ❌ Not available (use `getBuffer()`) |
| **Config File** | ✅ `.axonrc.json` support | ❌ Not available |
| **Environment Variables** | ✅ `process.env` support | ❌ Not available |
| **Download Logs** | ✅ Direct file access | ✅ Via `downloadLogs()` method |

## Installation

```bash
npm install axon-logger
```

## Browser Usage

### Basic Setup

```typescript
import { Logger, LogLevel } from 'axon-logger';

// Create logger - automatically uses browser storage
const logger = new Logger({
  outputPath: 'app-logs',  // Storage key (not a file path)
  level: LogLevel.INFO
});

// Use normally
logger.info('User logged in', { userId: 123 });
logger.error('API call failed', { endpoint: '/api/users' });

// Flush when needed
await logger.flush();
```

### React Example

```typescript
import { useEffect, useRef } from 'react';
import { Logger, LogLevel } from 'axon-logger';

function App() {
  const loggerRef = useRef<Logger | null>(null);

  useEffect(() => {
    // Initialize logger once
    loggerRef.current = new Logger({
      outputPath: 'react-app-logs',
      level: LogLevel.INFO
    });

    // Cleanup on unmount
    return () => {
      loggerRef.current?.flush();
      loggerRef.current?.close();
    };
  }, []);

  const handleClick = () => {
    loggerRef.current?.info('Button clicked', {
      timestamp: Date.now(),
      component: 'App'
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Next.js Example (Client Component)

```typescript
'use client';

import { useEffect } from 'react';
import { Logger, LogLevel } from 'axon-logger';

// Create logger outside component to persist across renders
const logger = new Logger({
  outputPath: 'nextjs-app-logs',
  level: LogLevel.INFO
});

export default function GameEngine() {
  useEffect(() => {
    logger.info('Component mounted');

    return () => {
      logger.info('Component unmounted');
      logger.flush();
    };
  }, []);

  const handleAction = async () => {
    logger.info('User action', { action: 'play' });
  };

  return (
    <div>
      <button onClick={handleAction}>Play Game</button>
    </div>
  );
}
```

### Next.js Example (Server Component)

```typescript
// app/api/logs/route.ts
import { Logger, LogLevel } from 'axon-logger';

// Server-side logger writes to disk
const logger = new Logger({
  outputPath: './logs/api.txt',
  level: LogLevel.INFO
});

export async function POST(request: Request) {
  const body = await request.json();
  
  logger.info('API request received', {
    endpoint: '/api/logs',
    body
  });

  return Response.json({ success: true });
}
```

### Vue 3 Example

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { Logger, LogLevel } from 'axon-logger';

const logger = new Logger({
  outputPath: 'vue-app-logs',
  level: LogLevel.INFO
});

onMounted(() => {
  logger.info('Component mounted');
});

onUnmounted(() => {
  logger.flush();
  logger.close();
});

const handleClick = () => {
  logger.info('Button clicked');
};
</script>

<template>
  <button @click="handleClick">Click Me</button>
</template>
```

### Angular Example

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Logger, LogLevel } from 'axon-logger';

@Component({
  selector: 'app-root',
  template: '<button (click)="handleClick()">Click Me</button>'
})
export class AppComponent implements OnInit, OnDestroy {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({
      outputPath: 'angular-app-logs',
      level: LogLevel.INFO
    });
  }

  ngOnInit() {
    this.logger.info('Component initialized');
  }

  ngOnDestroy() {
    this.logger.flush();
    this.logger.close();
  }

  handleClick() {
    this.logger.info('Button clicked');
  }
}
```

## Browser-Specific Features

### Download Logs

```typescript
import { Logger, LogLevel } from 'axon-logger';

const logger = new Logger({
  outputPath: 'app-logs',
  level: LogLevel.INFO
});

// Log some events
logger.info('Event 1');
logger.info('Event 2');

// Download logs as file
const fileManager = logger.getFileManager();
if ('downloadLogs' in fileManager) {
  await fileManager.downloadLogs();
  // Downloads a file named "app-logs-{timestamp}.txt"
}
```

### Get Logs from Memory

```typescript
// Get buffered logs (before flush)
const buffer = logger.getBuffer();
console.log('Buffered logs:', buffer);

// Send logs to server
const sendLogsToServer = async () => {
  const logs = logger.getBuffer();
  await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logs)
  });
};
```

### Clear Browser Storage

```typescript
// Clear logs from localStorage/IndexedDB
const fileManager = logger.getFileManager();
if ('clearStorage' in fileManager) {
  await fileManager.clearStorage();
}
```

## Configuration for Browser

```typescript
const logger = new Logger({
  outputPath: 'app-logs',           // Storage key name
  level: LogLevel.INFO,             // Log level
  maxFileSize: 5 * 1024 * 1024,    // 5MB limit (browser storage)
  bufferSize: 50,                   // Smaller buffer for browser
  flushInterval: 3000,              // Flush every 3 seconds
  omitNullValues: true,             // Reduce storage size
  fieldAliases: {                   // Shorten field names
    timestamp: 't',
    level: 'l',
    message: 'm'
  }
});
```

## Storage Limits

Browser storage has limits:

- **localStorage**: ~5-10MB per domain
- **IndexedDB**: ~50MB+ per domain (varies by browser)

AXON automatically uses the best available storage:
1. IndexedDB (preferred, larger capacity)
2. localStorage (fallback)

## Troubleshooting

### Issue: "Can't resolve 'fs'" error in Next.js

**Solution**: Update to axon-logger v1.0.1+

If still seeing errors, add to `next.config.ts`:

```typescript
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

### Issue: Logs not persisting across page reloads

**Solution**: Call `await logger.flush()` before page unload:

```typescript
useEffect(() => {
  const handleBeforeUnload = async () => {
    await logger.flush();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);
```

### Issue: Storage quota exceeded

**Solution**: Reduce buffer size or implement log rotation:

```typescript
const logger = new Logger({
  outputPath: 'app-logs',
  maxFileSize: 2 * 1024 * 1024,  // 2MB limit
  bufferSize: 20,                 // Smaller buffer
  flushInterval: 1000             // Flush more frequently
});
```

### Issue: LogExtractor not working in browser

**Expected behavior**: `LogExtractor` is Node.js only. In browser, use:

```typescript
// Instead of LogExtractor, use getBuffer()
const logs = logger.getBuffer();

// Filter logs in memory
const errorLogs = logs.filter(entry => 
  typeof entry === 'object' && entry.lvl >= LogLevel.ERROR
);
```

## Performance Tips

1. **Use appropriate log levels**: Avoid DEBUG in production
2. **Increase flush interval**: Reduce storage writes
3. **Use field aliases**: Reduce storage size
4. **Omit null values**: Save space
5. **Implement log rotation**: Clear old logs periodically

```typescript
const logger = new Logger({
  outputPath: 'app-logs',
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  flushInterval: 5000,
  omitNullValues: true,
  fieldAliases: {
    timestamp: 't',
    level: 'l',
    message: 'm',
    userId: 'uid'
  }
});
```

## Sending Logs to Server

For production apps, send logs to a backend:

```typescript
import { Logger, LogLevel } from 'axon-logger';

const logger = new Logger({
  outputPath: 'app-logs',
  level: LogLevel.INFO,
  flushInterval: 10000  // Flush every 10 seconds
});

// Send logs to server periodically
setInterval(async () => {
  const logs = logger.getBuffer();
  
  if (logs.length > 0) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs)
      });
      
      // Clear buffer after successful send
      logger.clearBuffer();
    } catch (error) {
      console.error('Failed to send logs:', error);
    }
  }
}, 30000); // Every 30 seconds
```

## Migration from v1.0.0 to v1.0.1

No breaking changes! Just update:

```bash
npm update axon-logger
```

If you were using webpack fallbacks, you can remove them:

```typescript
// next.config.ts - CAN BE REMOVED in v1.0.1+
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,  // ← No longer needed
        path: false // ← No longer needed
      };
    }
    return config;
  },
};
```

## Browser Support

AXON Logger works in all modern browsers:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## TypeScript Support

Full TypeScript definitions included:

```typescript
import { Logger, LogLevel, LogEntry, LoggerConfig } from 'axon-logger';

const config: LoggerConfig = {
  outputPath: 'app-logs',
  level: LogLevel.INFO
};

const logger = new Logger(config);
```

## Examples Repository

See full examples at:
- React: [examples/react](examples/react)
- Next.js: [examples/nextjs](examples/nextjs)
- Vue: [examples/vue](examples/vue)
- Angular: [examples/angular](examples/angular)

## Support

- **NPM**: https://www.npmjs.com/package/axon-logger
- **Issues**: Report via npm package page
- **Version**: 1.0.1+

## License

MIT License - Free for commercial and personal use.
