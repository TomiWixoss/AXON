# Design Document: AXON

## Overview

AXON is a token-efficient logging framework for JavaScript/TypeScript that uses TOON (Token-Oriented Object Notation) format to minimize token usage in log files. The system consists of four primary components: the Logger API (user-facing interface), TOON Serializer (format conversion engine), File Manager (I/O and rotation), and TOON Parser (deserialization). The architecture prioritizes token efficiency, cross-platform compatibility, and AI-optimized output over human readability.

The framework achieves 30-60% token reduction compared to JSON through several techniques:
- Tabular structure for uniform arrays (schema declared once, data rows follow)
- Indentation-based nesting instead of braces
- Minimal quoting (only when necessary)
- Field aliasing and reference notation
- Omission of null/undefined values

AXON supports both Node.js and browser environments with automatic environment detection and appropriate storage mechanisms (file system vs localStorage/IndexedDB).

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Code                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Logger API                              │
│  - Log level methods (debug, info, warn, error, fatal)      │
│  - Configuration management                                  │
│  - Section marker insertion                                  │
│  - Metadata handling (global + per-entry)                    │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ▼                           ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   TOON Serializer      │   │     File Manager             │
│  - Object → TOON       │   │  - File I/O operations       │
│  - Tabular arrays      │   │  - Buffering & batching      │
│  - Minimal quoting     │   │  - File rotation/splitting   │
│  - Field aliasing      │   │  - Environment detection     │
│  - Reference notation  │   │  - Storage abstraction       │
└────────────┬───────────┘   └──────────┬───────────────────┘
             │                           │
             └───────────┬───────────────┘
                         ▼
              ┌─────────────────────┐
              │   Storage Layer     │
              │  - Node.js: fs      │
              │  - Browser: LS/IDB  │
              └─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Utility Components                        │
│  - TOON Parser (TOON → Object)                              │
│  - Log Extraction (section/time/level filtering)            │
│  - Token Counter                                             │
│  - CLI Tools                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Logging Flow**: Application → Logger.method() → Create LogEntry → Serialize to TOON → Buffer → File Manager → Write to storage
2. **Extraction Flow**: Log file → Parser → JavaScript objects → Filter/transform → Export
3. **Configuration Flow**: Config sources (constructor/env/file) → Merge with precedence → Validate → Apply to Logger

### Environment Detection

The system detects runtime environment on initialization:
- **Node.js**: Use `fs` module for file operations, support full file rotation
- **Browser**: Use localStorage for small logs, IndexedDB for larger logs, provide download functionality

## Components and Interfaces

### Logger Component

The Logger is the primary user-facing API.

```typescript
interface LoggerConfig {
  outputPath: string;              // File path (Node) or storage key (Browser)
  level: LogLevel;                 // Minimum level to log
  maxFileSize?: number;            // Bytes before rotation (default: 10MB)
  rotationInterval?: 'hourly' | 'daily' | 'weekly' | 'none';
  fieldAliases?: Record<string, string>;  // Map verbose names to short codes
  omitNullValues?: boolean;        // Default: true
  bufferSize?: number;             // Number of entries to buffer (default: 100)
  flushInterval?: number;          // Ms between auto-flushes (default: 5000)
  delimiter?: ',' | '\t' | '|';    // Field delimiter (default: ',')
  onError?: (error: Error) => void;
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

class Logger {
  constructor(config: LoggerConfig);
  
  // Logging methods
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  fatal(message: string, metadata?: Record<string, any>): void;
  
  // Section markers
  mark(label: string): void;
  
  // Metadata management
  setGlobalMetadata(metadata: Record<string, any>): void;
  clearGlobalMetadata(): void;
  
  // Control methods
  flush(): Promise<void>;
  close(): Promise<void>;
  
  // Configuration
  setLevel(level: LogLevel): void;
  updateConfig(partial: Partial<LoggerConfig>): void;
}
```

**Implementation Notes**:
- Logger maintains internal buffer of LogEntry objects
- Level filtering happens before serialization (performance optimization)
- Global metadata is merged with per-entry metadata (per-entry wins on conflicts)
- `flush()` forces immediate write of buffered entries
- `close()` flushes and releases file handles/storage connections

### TOON Serializer Component

Converts JavaScript objects to TOON format.

```typescript
interface TOONSerializerConfig {
  delimiter: ',' | '\t' | '|';
  omitNullValues: boolean;
  fieldAliases: Record<string, string>;
  maxDepth: number;  // Prevent infinite recursion
}

class TOONSerializer {
  constructor(config: TOONSerializerConfig);
  
  serialize(value: any): string;
  
  // Internal methods
  private serializeObject(obj: Record<string, any>, depth: number): string;
  private serializeArray(arr: any[], depth: number): string;
  private serializePrimitive(value: any): string;
  private detectUniformArray(arr: any[]): boolean;
  private serializeTabular(arr: any[]): string;
  private needsQuoting(str: string): boolean;
  private applyAliases(key: string): string;
}
```

**TOON Format Specification**:

1. **Primitives**:
   - Numbers: `42`, `3.14`, `-17`
   - Strings (no special chars): `hello`, `user_name`
   - Strings (with special chars): `"hello, world"`, `"line\nbreak"`
   - Booleans: `true`, `false`
   - Null: `null` (or omitted if `omitNullValues: true`)

2. **Objects**:
   ```
   name: John
   age: 30
   active: true
   ```

3. **Nested Objects** (indentation-based):
   ```
   user:
     name: John
     age: 30
     address:
       city: NYC
       zip: 10001
   ```

4. **Arrays (non-uniform)**:
   ```
   items[3]: apple, 42, true
   ```

5. **Arrays (uniform/tabular)**:
   ```
   users[3]{id,name,age}:
   1,Alice,28
   2,Bob,35
   3,Carol,42
   ```
   Schema format: `arrayName[length]{field1,field2,...}:`
   Then each row on new line with values in same order

6. **Section Markers**:
   ```
   === MARKER: label | timestamp ===
   ```

**Serialization Algorithm**:

```
function serialize(value, depth):
  if depth > maxDepth:
    return "[max depth exceeded]"
  
  if value is primitive:
    return serializePrimitive(value)
  
  if value is array:
    if detectUniformArray(value):
      return serializeTabular(value)
    else:
      return serializeNonUniformArray(value)
  
  if value is object:
    return serializeObject(value, depth)

function serializeTabular(arr):
  schema = extractSchema(arr[0])
  fields = schema.keys.map(applyAliases).join(delimiter)
  output = `[${arr.length}]{${fields}}:\n`
  
  for each item in arr:
    row = schema.keys.map(k => serializePrimitive(item[k])).join(delimiter)
    output += row + "\n"
  
  return output

function needsQuoting(str):
  return str contains delimiter OR newline OR quotes OR starts with number
```

### File Manager Component

Handles all I/O operations, buffering, and file rotation.

```typescript
interface FileManagerConfig {
  outputPath: string;
  maxFileSize: number;
  rotationInterval: 'hourly' | 'daily' | 'weekly' | 'none';
  bufferSize: number;
  flushInterval: number;
  environment: 'node' | 'browser';
}

class FileManager {
  constructor(config: FileManagerConfig);
  
  write(toonString: string): void;
  flush(): Promise<void>;
  close(): Promise<void>;
  
  private shouldRotate(): boolean;
  private rotate(): Promise<void>;
  private getRotatedFileName(): string;
  private writeToStorage(data: string): Promise<void>;
}
```

**File Rotation Strategy**:

1. **Size-based rotation**:
   - Track current file size
   - When size exceeds `maxFileSize`, create new file
   - File naming: `{baseName}-{timestamp}.txt` or `{baseName}-{sequence}.txt`

2. **Time-based rotation**:
   - Track file creation time
   - When interval elapsed, create new file
   - File naming includes date/time: `{baseName}-2024-01-15-14.txt` (hourly)

3. **Continuity markers**:
   - When rotating, write marker to old file: `=== CONTINUED IN: filename.txt ===`
   - Write marker to new file: `=== CONTINUED FROM: filename.txt ===`

**Browser Storage Strategy**:

- **Small logs** (< 5MB): Use localStorage with key-value pairs
  - Key format: `axon:{outputPath}:{timestamp}`
  - Value: TOON-formatted log entries
  
- **Large logs** (≥ 5MB): Use IndexedDB
  - Object store: `logs`
  - Index by timestamp for range queries
  - Each entry: `{id, timestamp, data}`

- **Download functionality**:
  ```typescript
  downloadLogs(): void {
    const blob = new Blob([logData], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'axon-logs.txt';
    a.click();
  }
  ```

### TOON Parser Component

Converts TOON format back to JavaScript objects.

```typescript
class TOONParser {
  parse(toonString: string): any;
  parseStream(stream: ReadableStream): AsyncIterator<any>;
  
  private parseObject(lines: string[], startIndex: number): {value: any, endIndex: number};
  private parseTabular(schemaLine: string, dataLines: string[]): any[];
  private parsePrimitive(token: string): any;
  private extractSchema(schemaLine: string): {name: string, length: number, fields: string[]};
}
```

**Parsing Algorithm**:

```
function parse(toonString):
  lines = toonString.split('\n')
  return parseValue(lines, 0).value

function parseValue(lines, index):
  line = lines[index].trim()
  
  if line matches tabular pattern (e.g., "users[3]{id,name}:"):
    schema = extractSchema(line)
    dataLines = lines[index+1 : index+1+schema.length]
    return {value: parseTabular(schema, dataLines), endIndex: index + schema.length + 1}
  
  if line contains ':':
    return parseObject(lines, index)
  
  return {value: parsePrimitive(line), endIndex: index + 1}

function parseTabular(schema, dataLines):
  result = []
  for each dataLine in dataLines:
    values = dataLine.split(delimiter)
    obj = {}
    for i, field in schema.fields:
      obj[field] = parsePrimitive(values[i])
    result.push(obj)
  return result
```

### Log Extraction Utilities

```typescript
class LogExtractor {
  constructor(logFilePath: string);
  
  // Extract by section markers
  extractSection(startMarker: string, endMarker?: string): string;
  
  // Extract by time range
  extractTimeRange(start: Date, end: Date): string;
  
  // Extract by log level
  extractByLevel(level: LogLevel): string;
  
  // Count tokens in extracted section
  countTokens(text: string): number;
  
  // Export to new file
  exportSection(section: string, outputPath: string): Promise<void>;
}
```

**Token Counting**:
- Use simple whitespace-based tokenization as approximation
- For more accuracy, integrate with tiktoken or similar library
- Formula: `tokens ≈ text.split(/\s+/).length * 1.3` (accounts for subword tokens)

## Data Models

### LogEntry

```typescript
interface LogEntry {
  ts: number;           // Unix timestamp (milliseconds)
  lvl: LogLevel;        // Log level (using short alias)
  msg: string;          // Log message
  meta?: Record<string, any>;  // Optional metadata
}
```

**TOON Representation**:
```
ts: 1705334400000
lvl: 2
msg: User login successful
meta:
  uid: 12345
  ip: 192.168.1.1
```

**Optimized TOON (with aliases)**:
```
t: 1705334400000
l: 2
m: User login successful
meta:
  u: 12345
  i: 192.168.1.1
```

### Configuration Model

```typescript
interface ResolvedConfig {
  outputPath: string;
  level: LogLevel;
  maxFileSize: number;
  rotationInterval: 'hourly' | 'daily' | 'weekly' | 'none';
  fieldAliases: Record<string, any>;
  omitNullValues: boolean;
  bufferSize: number;
  flushInterval: number;
  delimiter: ',' | '\t' | '|';
  onError: (error: Error) => void;
  environment: 'node' | 'browser';
}
```

**Configuration Precedence** (highest to lowest):
1. Constructor options
2. Environment variables (e.g., `AXON_LOG_LEVEL`, `AXON_OUTPUT_PATH`)
3. Configuration file (`.axonrc.json` in project root)
4. Default values

**Default Configuration**:
```typescript
const DEFAULT_CONFIG: ResolvedConfig = {
  outputPath: './logs/axon.txt',
  level: LogLevel.INFO,
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  rotationInterval: 'daily',
  fieldAliases: {
    timestamp: 'ts',
    level: 'lvl',
    message: 'msg',
    metadata: 'meta'
  },
  omitNullValues: true,
  bufferSize: 100,
  flushInterval: 5000,
  delimiter: ',',
  onError: (err) => console.error('AXON Error:', err),
  environment: detectEnvironment()
};
```

### Section Marker Model

```typescript
interface SectionMarker {
  type: 'marker';
  label: string;
  timestamp: number;
}
```

**TOON Representation**:
```
=== MARKER: authentication-flow | 1705334400000 ===
```

This format is:
- Easily searchable with regex: `/^=== MARKER: (.+) \| (\d+) ===$/`
- Visually distinctive for humans
- Minimal token usage (fixed overhead per marker)

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: TOON Serialization Round-Trip

*For any* valid JavaScript object (without circular references), serializing to TOON format and then parsing back should produce an equivalent object structure.

**Validates: Requirements 1.1, 13.1, 13.2, 13.4**

This is the fundamental correctness property for AXON. It ensures that TOON format is a faithful representation of JavaScript data and that no information is lost in the serialization/deserialization cycle.

### Property 2: Token Reduction vs JSON

*For any* JavaScript object, serializing to TOON format should produce output with 30-60% fewer tokens than equivalent JSON serialization.

**Validates: Requirements 1.6, 6.7**

This property validates the core value proposition of AXON. Token counting should use a consistent method (e.g., whitespace splitting with 1.3x multiplier for subword tokens).

### Property 3: Tabular Array Optimization

*For any* array containing uniform objects (same keys), the TOON serializer should use tabular format with schema declaration `[length]{fields}:` followed by data rows, eliminating redundant field names.

**Validates: Requirements 1.2, 1.7, 6.1**

This property ensures the key optimization for uniform arrays is applied correctly. Uniform detection should check that all array elements have the same set of keys.

### Property 4: Minimal Quoting

*For any* string value, the TOON serializer should omit quotation marks if and only if the string contains no delimiters, newlines, quotes, or starts with a number.

**Validates: Requirements 1.4, 1.5**

This property ensures optimal token usage for strings while maintaining correct parsing. The quoting logic must be conservative enough to prevent parsing ambiguity.

### Property 5: Indentation-Based Nesting

*For any* nested object structure, the TOON serializer should use indentation levels to represent nesting depth instead of curly braces or other delimiters.

**Validates: Requirements 1.3**

This property validates the indentation-based format that reduces token usage compared to brace-based formats.

### Property 6: Delimiter Configuration

*For any* configured delimiter (comma, tab, or pipe), the TOON serializer should consistently use that delimiter for field separation throughout the output.

**Validates: Requirements 1.8**

This property ensures delimiter configuration is respected and applied consistently.

### Property 7: Log Entry Structure

*For any* log method call with message and optional metadata, the created LogEntry should contain timestamp, level, message, and merged metadata (global + per-entry with per-entry precedence).

**Validates: Requirements 2.2, 2.3, 14.1, 14.2, 14.3, 14.4**

This property validates the complete log entry creation logic including metadata merging rules.

### Property 8: Log Level Filtering

*For any* configured log level threshold, only log entries at or above that level should be serialized and written to storage.

**Validates: Requirements 2.7, 11.3**

This property ensures filtering works correctly and that filtered entries skip serialization for performance.

### Property 9: File Write Persistence

*For any* log entry that passes level filtering, after calling flush(), the entry should be present in the output file in valid TOON format.

**Validates: Requirements 3.1**

This property validates the complete write pipeline from entry creation to file persistence.

### Property 10: Write Buffering

*For any* sequence of log entries created within the flush interval, they should be batched into a single write operation rather than individual writes.

**Validates: Requirements 3.5, 11.2**

This property validates the buffering optimization that reduces I/O operations.

### Property 11: Size-Based Rotation

*For any* configured maximum file size, when the current log file size exceeds that threshold, a new log file should be created with a timestamp or sequence number in the filename.

**Validates: Requirements 4.1, 4.3**

This property validates size-based rotation triggers and file naming conventions.

### Property 12: Time-Based Rotation

*For any* configured rotation interval (hourly, daily, weekly), when that time period elapses, a new log file should be created.

**Validates: Requirements 4.2, 4.3**

This property validates time-based rotation triggers.

### Property 13: Rotation Continuity

*For any* file rotation event, the old file should contain a "CONTINUED IN" marker and the new file should contain a "CONTINUED FROM" marker linking the two files.

**Validates: Requirements 4.4**

This property ensures log continuity is maintained across rotated files.

### Property 14: Atomic Entry Writing

*For any* log entry being written when rotation is triggered, the complete entry should appear in exactly one file (not split across files).

**Validates: Requirements 4.7**

This property validates atomicity of log entry writes during rotation.

### Property 15: Section Marker Format

*For any* section marker with label, the written marker should match the format `=== MARKER: {label} | {timestamp} ===` and be searchable with the regex `/^=== MARKER: (.+) \| (\d+) ===$/`.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

This property validates the section marker format is consistent and searchable.

### Property 16: Section Extraction

*For any* two section markers in a log file, the extraction utility should return all log entries between those markers in valid TOON format.

**Validates: Requirements 5.5, 12.1, 12.4**

This property validates the section extraction functionality.

### Property 17: Time Range Extraction

*For any* time range [start, end], the extraction utility should return all log entries with timestamps within that range.

**Validates: Requirements 12.2, 12.4**

This property validates time-based log filtering.

### Property 18: Level-Based Extraction

*For any* log level filter, the extraction utility should return only entries at or above that level.

**Validates: Requirements 12.3, 12.4**

This property validates level-based log filtering.

### Property 19: Field Aliasing

*For any* configured field alias mapping, the TOON serializer should replace verbose field names with their short aliases in the output.

**Validates: Requirements 6.3**

This property validates the field aliasing optimization feature.

### Property 20: Null Value Omission

*For any* object with null or undefined values, when `omitNullValues` is true, those fields should not appear in the TOON output.

**Validates: Requirements 6.5**

This property validates null value handling for token optimization.

### Property 21: Configuration Precedence

*For any* configuration setting specified in multiple sources (constructor, environment, file), the value from the highest precedence source (constructor > env > file > defaults) should be used.

**Validates: Requirements 7.4**

This property validates the configuration merging logic.

### Property 22: Configuration Validation

*For any* invalid configuration value, the Logger should throw a clear error message indicating which setting is invalid and why.

**Validates: Requirements 7.5**

This property validates configuration validation and error messaging.

### Property 23: Error Resilience

*For any* non-fatal error (write failure, serialization failure), the Logger should emit an error event, invoke the error callback if configured, and continue operating for subsequent log calls.

**Validates: Requirements 8.1, 8.2, 8.4, 8.6**

This property validates that errors don't crash the logger.

### Property 24: Circular Reference Handling

*For any* object with circular references, the TOON serializer should detect the cycle and either use a reference notation or fall back to a safe string representation without entering an infinite loop.

**Validates: Requirements 8.5**

This property validates circular reference detection and handling.

### Property 25: Parser Feature Completeness

*For any* TOON format feature (tabular arrays, nested objects, minimal quoting, indentation), the parser should correctly reconstruct the original data structure.

**Validates: Requirements 13.3**

This property validates that the parser handles all TOON format features.

### Property 26: Parser Error Messages

*For any* malformed TOON input, the parser should throw an error with a clear message indicating the line number and nature of the parsing error.

**Validates: Requirements 13.5**

This property validates parser error handling and messaging.

### Property 27: Token Counting Accuracy

*For any* text string, the token counter should return a count within 10% of the actual token count when processed by a standard LLM tokenizer (e.g., GPT-4's tokenizer).

**Validates: Requirements 12.5**

This property validates the token counting utility's accuracy.

### Property 28: Metadata Filtering

*For any* configured metadata filter (e.g., exclude fields matching pattern), sensitive fields should not appear in the serialized output.

**Validates: Requirements 14.6**

This property validates metadata filtering for security/privacy.

### Property 29: Export File Creation

*For any* extracted log section, calling the export function should create a new file containing exactly that section in valid TOON format.

**Validates: Requirements 12.6**

This property validates the export functionality.

## Error Handling

### Error Categories

1. **Fatal Errors** (stop logging):
   - Invalid configuration that prevents initialization
   - Unrecoverable storage errors (e.g., permissions)

2. **Non-Fatal Errors** (log and continue):
   - Temporary write failures (retry with exponential backoff)
   - Serialization failures for specific objects (use fallback)
   - Disk space warnings (emit warning, continue)

3. **Silent Errors** (handle internally):
   - Circular reference detection (use reference notation)
   - Invalid metadata types (convert to string)

### Error Handling Strategy

```typescript
class ErrorHandler {
  private retryCount: Map<string, number> = new Map();
  private maxRetries = 3;
  private baseDelay = 100; // ms
  
  async handleWriteError(error: Error, operation: () => Promise<void>): Promise<void> {
    const key = operation.toString();
    const retries = this.retryCount.get(key) || 0;
    
    if (retries < this.maxRetries) {
      this.retryCount.set(key, retries + 1);
      const delay = this.baseDelay * Math.pow(2, retries);
      await sleep(delay);
      return operation();
    } else {
      this.emitError(error);
      this.retryCount.delete(key);
    }
  }
  
  handleSerializationError(value: any, error: Error): string {
    this.emitError(error);
    return `[Serialization failed: ${error.message}]`;
  }
  
  handleCircularReference(path: string[]): string {
    return `[Circular: ${path.join('.')}]`;
  }
  
  private emitError(error: Error): void {
    if (this.config.onError) {
      this.config.onError(error);
    }
    console.error('AXON Error:', error);
  }
}
```

### Graceful Degradation

When errors occur, AXON degrades gracefully:

1. **Serialization failure** → Use `String(value)` or `[Object]`
2. **Write failure** → Buffer in memory, retry with backoff
3. **Disk full** → Emit warning, attempt rotation to new file
4. **Parser error** → Return partial results up to error point
5. **Invalid config** → Use defaults for invalid values, warn user

## Testing Strategy

### Dual Testing Approach

AXON requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Validate specific examples, edge cases, and integration points
- **Property tests**: Validate universal properties across randomized inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing

**Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property
- Tag format: `// Feature: axon, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';

// Feature: axon, Property 1: TOON Serialization Round-Trip
test('TOON round-trip preserves object structure', () => {
  fc.assert(
    fc.property(
      fc.object(), // Generate random objects
      (obj) => {
        const toon = serializer.serialize(obj);
        const parsed = parser.parse(toon);
        expect(parsed).toEqual(obj);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: axon, Property 2: Token Reduction vs JSON
test('TOON uses fewer tokens than JSON', () => {
  fc.assert(
    fc.property(
      fc.object(),
      (obj) => {
        const toonOutput = serializer.serialize(obj);
        const jsonOutput = JSON.stringify(obj);
        const toonTokens = countTokens(toonOutput);
        const jsonTokens = countTokens(jsonOutput);
        const reduction = (jsonTokens - toonTokens) / jsonTokens;
        expect(reduction).toBeGreaterThanOrEqual(0.30);
        expect(reduction).toBeLessThanOrEqual(0.60);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Specific TOON format examples (tabular arrays, nested objects)
- Edge cases (empty objects, null values, special characters)
- Error conditions (circular references, invalid config, write failures)
- Integration points (Logger → Serializer → FileManager)
- Environment-specific behavior (Node.js vs browser)

**Example Unit Tests**:

```typescript
describe('TOON Serializer', () => {
  test('serializes simple object', () => {
    const obj = { name: 'Alice', age: 30 };
    const toon = serializer.serialize(obj);
    expect(toon).toBe('name: Alice\nage: 30');
  });
  
  test('uses tabular format for uniform arrays', () => {
    const arr = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];
    const toon = serializer.serialize(arr);
    expect(toon).toContain('[2]{id,name}:');
    expect(toon).toContain('1,Alice');
    expect(toon).toContain('2,Bob');
  });
  
  test('handles circular references', () => {
    const obj: any = { name: 'Alice' };
    obj.self = obj;
    const toon = serializer.serialize(obj);
    expect(toon).toContain('[Circular');
  });
});

describe('File Manager', () => {
  test('rotates file when size exceeded', async () => {
    const manager = new FileManager({ maxFileSize: 1024, ...config });
    const largeEntry = 'x'.repeat(2000);
    await manager.write(largeEntry);
    const files = await fs.readdir(config.outputPath);
    expect(files.length).toBeGreaterThan(1);
  });
});
```

### Test Coverage Goals

- **Line coverage**: > 90%
- **Branch coverage**: > 85%
- **Property tests**: All 29 properties implemented
- **Unit tests**: All edge cases and error conditions covered

### Testing Tools

- **Test runner**: Jest or Vitest
- **Property testing**: fast-check
- **Mocking**: Jest mocks for file system operations
- **Browser testing**: Playwright or Puppeteer for browser environment tests
- **Performance testing**: Benchmark.js for token reduction validation

### Continuous Integration

All tests must pass before merging:
1. Unit tests (all environments)
2. Property tests (100+ iterations each)
3. TypeScript compilation (strict mode)
4. Linting (ESLint)
5. Browser compatibility tests
6. Performance benchmarks (token reduction validation)
