# Implementation Plan: AXON

## Overview

This implementation plan breaks down the AXON logging framework into discrete, incremental tasks. The approach follows a bottom-up strategy: build core components first (TOON Serializer, Parser), then the Logger API, then File Manager, and finally utilities and CLI tools. Each major component includes property-based tests to validate correctness properties from the design document.

The implementation uses TypeScript for type safety and compiles to JavaScript for broad compatibility. Testing uses Jest as the test runner and fast-check for property-based testing.

## Tasks

- [x] 1. Project setup and core infrastructure
  - Initialize npm/yarn project with TypeScript configuration
  - Set up Jest with TypeScript support
  - Install fast-check for property-based testing
  - Configure ESLint and Prettier
  - Create directory structure: `src/`, `src/serializer/`, `src/parser/`, `src/logger/`, `src/file-manager/`, `src/utils/`, `tests/`
  - Set up build scripts for Node.js and browser bundles
  - _Requirements: 2.4, 9.6_

- [ ] 2. Implement TOON Serializer core
  - [x] 2.1 Create TOONSerializer class with configuration interface
    - Define `TOONSerializerConfig` interface
    - Implement constructor with config validation
    - Create `serialize(value: any): string` method stub
    - _Requirements: 1.1, 1.8_
  
  - [-] 2.2 Implement primitive serialization
    - Handle numbers, booleans, null/undefined
    - Implement string quoting logic (minimal quoting)
    - Create `needsQuoting(str: string): boolean` helper
    - Create `serializePrimitive(value: any): string` method
    - _Requirements: 1.4, 1.5_
  
  - [~] 2.3 Implement object serialization
    - Create `serializeObject(obj: Record<string, any>, depth: number): string` method
    - Use indentation for nesting (2 spaces per level)
    - Apply field aliasing from config
    - Handle null value omission based on config
    - Add max depth protection against circular references
    - _Requirements: 1.1, 1.3, 6.3, 6.5_
  
  - [~] 2.4 Implement array serialization
    - Create `detectUniformArray(arr: any[]): boolean` helper
    - Implement `serializeTabular(arr: any[]): string` for uniform arrays
    - Implement `serializeNonUniformArray(arr: any[]): string` for mixed arrays
    - Include array length in schema declaration
    - _Requirements: 1.2, 1.7, 6.1_
  
  - [~] 2.5 Implement circular reference detection
    - Track object references during serialization using WeakSet
    - Return `[Circular: path]` notation when cycle detected
    - _Requirements: 8.5_
  
  - [ ]* 2.6 Write property test for minimal quoting
    - **Property 4: Minimal Quoting**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ]* 2.7 Write property test for indentation-based nesting
    - **Property 5: Indentation-Based Nesting**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.8 Write property test for delimiter configuration
    - **Property 6: Delimiter Configuration**
    - **Validates: Requirements 1.8**
  
  - [ ]* 2.9 Write property test for tabular array optimization
    - **Property 3: Tabular Array Optimization**
    - **Validates: Requirements 1.2, 1.7, 6.1**
  
  - [ ]* 2.10 Write property test for field aliasing
    - **Property 19: Field Aliasing**
    - **Validates: Requirements 6.3**
  
  - [ ]* 2.11 Write property test for null value omission
    - **Property 20: Null Value Omission**
    - **Validates: Requirements 6.5**
  
  - [ ]* 2.12 Write property test for circular reference handling
    - **Property 24: Circular Reference Handling**
    - **Validates: Requirements 8.5**
  
  - [ ]* 2.13 Write unit tests for serializer edge cases
    - Test empty objects and arrays
    - Test special characters in strings
    - Test deeply nested structures
    - Test objects with numeric keys
    - _Requirements: 1.1, 1.4, 1.5_

- [ ] 3. Implement TOON Parser
  - [~] 3.1 Create TOONParser class
    - Implement `parse(toonString: string): any` method
    - Create `parseValue(lines: string[], index: number)` helper
    - Create `parsePrimitive(token: string): any` helper
    - _Requirements: 13.1_
  
  - [~] 3.2 Implement object parsing
    - Create `parseObject(lines: string[], startIndex: number)` method
    - Handle indentation-based nesting
    - Reconstruct nested object structures
    - _Requirements: 13.2, 13.3_
  
  - [~] 3.3 Implement tabular array parsing
    - Create `extractSchema(schemaLine: string)` helper
    - Create `parseTabular(schema, dataLines: string[])` method
    - Parse schema declaration `[length]{fields}:`
    - Reconstruct objects from data rows
    - _Requirements: 13.2, 13.3_
  
  - [~] 3.4 Implement error handling with clear messages
    - Add line number tracking during parsing
    - Throw descriptive errors for malformed input
    - Include context in error messages
    - _Requirements: 13.5_
  
  - [ ]* 3.5 Write property test for TOON round-trip
    - **Property 1: TOON Serialization Round-Trip**
    - **Validates: Requirements 1.1, 13.1, 13.2, 13.4**
  
  - [ ]* 3.6 Write property test for parser feature completeness
    - **Property 25: Parser Feature Completeness**
    - **Validates: Requirements 13.3**
  
  - [ ]* 3.7 Write property test for parser error messages
    - **Property 26: Parser Error Messages**
    - **Validates: Requirements 13.5**
  
  - [ ]* 3.8 Write unit tests for parser edge cases
    - Test malformed TOON input
    - Test empty input
    - Test input with only whitespace
    - Test various delimiter types
    - _Requirements: 13.5_

- [ ] 4. Implement token counting utility
  - [~] 4.1 Create TokenCounter class
    - Implement `countTokens(text: string): number` method
    - Use whitespace-based tokenization with 1.3x multiplier
    - _Requirements: 6.6, 12.5_
  
  - [ ]* 4.2 Write property test for token reduction vs JSON
    - **Property 2: Token Reduction vs JSON**
    - **Validates: Requirements 1.6, 6.7**
  
  - [ ]* 4.3 Write property test for token counting accuracy
    - **Property 27: Token Counting Accuracy**
    - **Validates: Requirements 12.5**

- [~] 5. Checkpoint - Core serialization complete
  - Ensure all serializer and parser tests pass
  - Verify round-trip property holds for various object types
  - Ask the user if questions arise

- [ ] 6. Implement Logger core
  - [~] 6.1 Create LogLevel enum and LogEntry interface
    - Define `LogLevel` enum (DEBUG, INFO, WARN, ERROR, FATAL)
    - Define `LogEntry` interface with ts, lvl, msg, meta fields
    - _Requirements: 2.1, 2.2_
  
  - [~] 6.2 Create LoggerConfig interface with defaults
    - Define `LoggerConfig` interface with all configuration options
    - Create `DEFAULT_CONFIG` constant
    - Implement environment detection (`detectEnvironment()`)
    - _Requirements: 2.5, 7.7, 10.4_
  
  - [~] 6.3 Implement Logger class constructor
    - Accept configuration options
    - Merge with defaults
    - Validate configuration values
    - Initialize internal state (buffer, global metadata)
    - _Requirements: 2.5, 7.1, 7.5_
  
  - [~] 6.4 Implement log level methods
    - Create `debug()`, `info()`, `warn()`, `error()`, `fatal()` methods
    - Each method creates LogEntry with timestamp and level
    - Apply log level filtering
    - Merge global and per-entry metadata
    - Add entry to buffer
    - _Requirements: 2.1, 2.2, 2.3, 2.7_
  
  - [~] 6.5 Implement metadata management
    - Create `setGlobalMetadata(metadata: Record<string, any>)` method
    - Create `clearGlobalMetadata()` method
    - Implement metadata merging logic (per-entry wins)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [~] 6.6 Implement section markers
    - Create `mark(label: string)` method
    - Generate marker in format `=== MARKER: {label} | {timestamp} ===`
    - Add marker to buffer
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 6.7 Write property test for log entry structure
    - **Property 7: Log Entry Structure**
    - **Validates: Requirements 2.2, 2.3, 14.1, 14.2, 14.3, 14.4**
  
  - [ ]* 6.8 Write property test for log level filtering
    - **Property 8: Log Level Filtering**
    - **Validates: Requirements 2.7, 11.3**
  
  - [ ]* 6.9 Write property test for section marker format
    - **Property 15: Section Marker Format**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ]* 6.10 Write unit tests for logger API
    - Test each log level method
    - Test method chaining
    - Test metadata merging edge cases
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 7. Implement configuration management
  - [~] 7.1 Implement configuration loading from multiple sources
    - Load from environment variables (e.g., `AXON_LOG_LEVEL`)
    - Load from config file (`.axonrc.json`)
    - Merge with constructor options
    - Apply precedence order: constructor > env > file > defaults
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [~] 7.2 Implement configuration validation
    - Validate log level values
    - Validate file paths
    - Validate numeric ranges (buffer size, file size)
    - Throw clear errors for invalid values
    - _Requirements: 7.5_
  
  - [~] 7.3 Implement runtime configuration updates
    - Create `updateConfig(partial: Partial<LoggerConfig>)` method
    - Create `setLevel(level: LogLevel)` method
    - Validate updates before applying
    - _Requirements: 7.6_
  
  - [ ]* 7.4 Write property test for configuration precedence
    - **Property 21: Configuration Precedence**
    - **Validates: Requirements 7.4**
  
  - [ ]* 7.5 Write property test for configuration validation
    - **Property 22: Configuration Validation**
    - **Validates: Requirements 7.5**
  
  - [ ]* 7.6 Write unit tests for configuration edge cases
    - Test missing config file
    - Test invalid JSON in config file
    - Test partial configuration
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 8. Implement File Manager for Node.js
  - [~] 8.1 Create FileManagerConfig interface
    - Define configuration for file operations
    - Include output path, max file size, rotation settings
    - _Requirements: 3.2, 4.5, 4.6_
  
  - [~] 8.2 Create FileManager class for Node.js
    - Implement constructor with config
    - Initialize file handle and buffer
    - Track current file size and creation time
    - _Requirements: 3.1, 3.2_
  
  - [~] 8.3 Implement buffered write operations
    - Create `write(toonString: string): void` method
    - Add to internal buffer
    - Auto-flush when buffer size reached or interval elapsed
    - Use async I/O for actual writes
    - _Requirements: 3.5, 11.1, 11.2_
  
  - [~] 8.4 Implement flush and close methods
    - Create `flush(): Promise<void>` method to write buffer immediately
    - Create `close(): Promise<void>` method to flush and release handles
    - _Requirements: 3.6_
  
  - [~] 8.5 Implement size-based file rotation
    - Check file size before each write
    - Create new file when threshold exceeded
    - Generate filename with timestamp or sequence number
    - Write continuity markers to both files
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [~] 8.6 Implement time-based file rotation
    - Track file creation time
    - Check if rotation interval elapsed
    - Create new file when interval passed
    - Write continuity markers
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [~] 8.7 Implement error handling with retry logic
    - Catch file write errors
    - Retry with exponential backoff (max 3 retries)
    - Emit error events without throwing
    - Continue operating after non-fatal errors
    - _Requirements: 3.3, 8.1, 8.6_
  
  - [ ]* 8.8 Write property test for file write persistence
    - **Property 9: File Write Persistence**
    - **Validates: Requirements 3.1**
  
  - [ ]* 8.9 Write property test for write buffering
    - **Property 10: Write Buffering**
    - **Validates: Requirements 3.5, 11.2**
  
  - [ ]* 8.10 Write property test for size-based rotation
    - **Property 11: Size-Based Rotation**
    - **Validates: Requirements 4.1, 4.3**
  
  - [ ]* 8.11 Write property test for time-based rotation
    - **Property 12: Time-Based Rotation**
    - **Validates: Requirements 4.2, 4.3**
  
  - [ ]* 8.12 Write property test for rotation continuity
    - **Property 13: Rotation Continuity**
    - **Validates: Requirements 4.4**
  
  - [ ]* 8.13 Write property test for atomic entry writing
    - **Property 14: Atomic Entry Writing**
    - **Validates: Requirements 4.7**
  
  - [ ]* 8.14 Write property test for error resilience
    - **Property 23: Error Resilience**
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.6**
  
  - [ ]* 8.15 Write unit tests for file manager edge cases
    - Test disk full scenario
    - Test permission errors
    - Test concurrent writes
    - Test rotation during write
    - _Requirements: 3.3, 4.7, 8.3_

- [ ] 9. Implement File Manager for browser
  - [~] 9.1 Create BrowserFileManager class
    - Detect storage mechanism (localStorage vs IndexedDB)
    - Implement same interface as Node.js FileManager
    - Use storage keys with timestamp for organization
    - _Requirements: 10.1, 10.2, 10.6_
  
  - [~] 9.2 Implement localStorage backend
    - Use for logs < 5MB
    - Key format: `axon:{outputPath}:{timestamp}`
    - Handle quota exceeded errors
    - _Requirements: 10.2_
  
  - [~] 9.3 Implement IndexedDB backend
    - Use for logs ≥ 5MB
    - Create object store with timestamp index
    - Support range queries for extraction
    - _Requirements: 10.2_
  
  - [~] 9.4 Implement download functionality
    - Create `downloadLogs(): void` method
    - Generate Blob from log data
    - Trigger browser download
    - _Requirements: 10.3_
  
  - [ ]* 9.5 Write unit tests for browser file manager
    - Test localStorage operations
    - Test IndexedDB operations
    - Test download functionality
    - Test quota exceeded handling
    - _Requirements: 10.1, 10.2, 10.3_

- [~] 10. Checkpoint - Core logging complete
  - Ensure all logger and file manager tests pass
  - Test in both Node.js and browser environments
  - Verify file rotation works correctly
  - Ask the user if questions arise

- [ ] 11. Integrate Logger with FileManager and Serializer
  - [~] 11.1 Wire Logger to use TOONSerializer
    - Inject serializer instance into Logger
    - Serialize log entries before writing
    - Handle serialization errors gracefully
    - _Requirements: 1.1, 8.2_
  
  - [~] 11.2 Wire Logger to use FileManager
    - Inject file manager instance into Logger
    - Pass serialized entries to file manager
    - Implement auto-flush timer
    - Call flush on close
    - _Requirements: 3.1, 3.6_
  
  - [~] 11.3 Implement error callback system
    - Add error event emitter to Logger
    - Invoke `onError` callback from config
    - Log critical errors to stderr/console
    - _Requirements: 8.4, 8.7_
  
  - [ ]* 11.4 Write integration tests for complete logging pipeline
    - Test Logger → Serializer → FileManager flow
    - Test error propagation
    - Test flush and close behavior
    - _Requirements: 2.1, 3.1, 8.6_

- [ ] 12. Implement log extraction utilities
  - [~] 12.1 Create LogExtractor class
    - Accept log file path in constructor
    - Load and parse log file
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [~] 12.2 Implement section-based extraction
    - Create `extractSection(startMarker: string, endMarker?: string): string` method
    - Search for marker patterns using regex
    - Return TOON-formatted section
    - _Requirements: 5.5, 12.1_
  
  - [~] 12.3 Implement time-based extraction
    - Create `extractTimeRange(start: Date, end: Date): string` method
    - Parse timestamps from log entries
    - Filter entries within range
    - Return TOON-formatted results
    - _Requirements: 12.2_
  
  - [~] 12.4 Implement level-based extraction
    - Create `extractByLevel(level: LogLevel): string` method
    - Parse log levels from entries
    - Filter entries at or above level
    - Return TOON-formatted results
    - _Requirements: 12.3_
  
  - [~] 12.5 Implement export functionality
    - Create `exportSection(section: string, outputPath: string): Promise<void>` method
    - Write section to new file
    - Preserve TOON format
    - _Requirements: 12.6_
  
  - [ ]* 12.6 Write property test for section extraction
    - **Property 16: Section Extraction**
    - **Validates: Requirements 5.5, 12.1, 12.4**
  
  - [ ]* 12.7 Write property test for time range extraction
    - **Property 17: Time Range Extraction**
    - **Validates: Requirements 12.2, 12.4**
  
  - [ ]* 12.8 Write property test for level-based extraction
    - **Property 18: Level-Based Extraction**
    - **Validates: Requirements 12.3, 12.4**
  
  - [ ]* 12.9 Write property test for export file creation
    - **Property 29: Export File Creation**
    - **Validates: Requirements 12.6**
  
  - [ ]* 12.10 Write unit tests for extraction edge cases
    - Test extraction with no matching entries
    - Test extraction with malformed markers
    - Test extraction from rotated files
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 13. Implement metadata filtering
  - [~] 13.1 Add metadata filter configuration
    - Add `metadataFilter` option to LoggerConfig
    - Support field name patterns (regex)
    - Support field value filters
    - _Requirements: 14.6_
  
  - [~] 13.2 Implement filter application
    - Apply filters before serialization
    - Remove matching fields from metadata
    - Preserve non-sensitive fields
    - _Requirements: 14.6_
  
  - [ ]* 13.3 Write property test for metadata filtering
    - **Property 28: Metadata Filtering**
    - **Validates: Requirements 14.6**
  
  - [ ]* 13.4 Write unit tests for filter patterns
    - Test regex patterns
    - Test exact field name matches
    - Test nested field filtering
    - _Requirements: 14.6_

- [ ] 14. Implement CLI tool
  - [~] 14.1 Create CLI entry point
    - Set up commander.js for CLI parsing
    - Define commands: extract, count, export
    - Add help text and examples
    - _Requirements: 12.7_
  
  - [~] 14.2 Implement extract command
    - Support `--section`, `--time-range`, `--level` flags
    - Output to stdout or file
    - Use LogExtractor internally
    - _Requirements: 12.1, 12.2, 12.3, 12.7_
  
  - [~] 14.3 Implement count command
    - Accept log file or section
    - Output token count
    - Use TokenCounter internally
    - _Requirements: 6.6, 12.5, 12.7_
  
  - [~] 14.4 Implement export command
    - Accept source and destination paths
    - Support same filters as extract
    - Write to new file
    - _Requirements: 12.6, 12.7_
  
  - [ ]* 14.5 Write integration tests for CLI
    - Test each command with various flags
    - Test error handling for invalid inputs
    - Test output formatting
    - _Requirements: 12.7_

- [ ] 15. Implement streaming parser
  - [~] 15.1 Create streaming parser interface
    - Implement `parseStream(stream: ReadableStream): AsyncIterator<any>` method
    - Process log entries incrementally
    - Yield parsed entries one at a time
    - _Requirements: 13.6_
  
  - [ ]* 15.2 Write unit tests for streaming parser
    - Test with large log files
    - Test with incomplete entries at chunk boundaries
    - Test memory usage stays constant
    - _Requirements: 13.6_

- [ ] 16. TypeScript type definitions and exports
  - [~] 16.1 Create comprehensive type definitions
    - Export all interfaces (LoggerConfig, LogEntry, TOONSerializerConfig, etc.)
    - Add generic type parameters for metadata
    - Include JSDoc comments for all public APIs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [~] 16.2 Create main export file
    - Export Logger, TOONSerializer, TOONParser, LogExtractor
    - Export all interfaces and enums
    - Export utility functions
    - _Requirements: 9.1_
  
  - [ ]* 16.3 Verify TypeScript compilation in strict mode
    - Run `tsc --strict` and ensure no errors
    - Test type inference works correctly
    - Test generic type parameters
    - _Requirements: 9.6_

- [ ] 17. Browser bundle and compatibility
  - [~] 17.1 Create browser build configuration
    - Set up webpack or rollup for browser bundle
    - Configure polyfills for Node.js APIs
    - Create separate bundles for Node.js and browser
    - _Requirements: 10.6_
  
  - [~] 17.2 Test browser compatibility
    - Test in Chrome, Firefox, Safari
    - Test localStorage and IndexedDB backends
    - Test download functionality
    - Verify consistent API across environments
    - _Requirements: 10.4, 10.5, 10.6_
  
  - [ ]* 17.3 Write browser-specific integration tests
    - Use Playwright or Puppeteer
    - Test complete logging flow in browser
    - Test storage quota handling
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 18. Performance optimization
  - [~] 18.1 Implement object pooling for serializer
    - Reuse string builders and buffers
    - Pool frequently allocated objects
    - _Requirements: 11.4_
  
  - [~] 18.2 Add synchronous logging option
    - Create `logSync()` methods for critical errors
    - Bypass buffering for sync logs
    - Write immediately to storage
    - _Requirements: 11.5_
  
  - [ ]* 18.3 Run performance benchmarks
    - Compare AXON vs Winston, Pino, Bunyan
    - Measure token reduction (verify 30-60%)
    - Measure throughput (logs/second)
    - Measure memory usage
    - _Requirements: 1.6, 11.6_

- [~] 19. Final checkpoint - Complete system test
  - Run all unit tests and property tests
  - Verify all 29 properties pass with 100+ iterations
  - Test in both Node.js and browser environments
  - Run performance benchmarks
  - Ensure TypeScript compiles without errors
  - Ask the user if questions arise

- [ ] 20. Documentation
  - [~] 20.1 Write README with quick start guide
    - Installation instructions
    - Basic usage examples
    - Configuration options overview
    - Link to full documentation
    - _Requirements: 15.1_
  
  - [~] 20.2 Write API documentation
    - Document all public classes and methods
    - Include code examples for each API
    - Document configuration options in detail
    - _Requirements: 15.2_
  
  - [~] 20.3 Write TOON format specification
    - Document format rules and syntax
    - Provide examples of each format feature
    - Explain token optimization techniques
    - _Requirements: 15.4_
  
  - [~] 20.4 Write migration guides
    - Create guides for Winston, Pino, Bunyan users
    - Show equivalent AXON code for common patterns
    - Highlight differences and benefits
    - _Requirements: 15.5_
  
  - [~] 20.5 Document browser-specific considerations
    - Explain storage mechanisms
    - Document quota limits
    - Provide troubleshooting tips
    - _Requirements: 15.7_
  
  - [~] 20.6 Create example projects
    - Node.js Express API example
    - Browser web app example
    - CLI tool example
    - _Requirements: 15.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each property test must run minimum 100 iterations
- Property tests should be tagged with comments: `// Feature: axon, Property {N}: {description}`
- All tests must pass before moving to next major section
- Checkpoints provide opportunities to validate progress and ask questions
- Browser testing requires Playwright or Puppeteer setup
- Performance benchmarks should be run on consistent hardware for valid comparisons
