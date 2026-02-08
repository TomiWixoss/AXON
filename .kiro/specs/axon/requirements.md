# Requirements Document: AXON

## Introduction

AXON is a JavaScript/TypeScript logging framework designed to minimize token usage in log files through the use of TOON (Token-Oriented Object Notation) format. Unlike traditional logging frameworks that prioritize human readability, AXON optimizes log output for AI consumption, reducing token costs by 30-60% compared to JSON-based logging. The framework targets Node.js and browser environments, providing developers with a token-efficient logging solution that includes intelligent file rotation, section markers for context extraction, and a familiar logging API.

## Glossary

- **AXON**: The logging framework system
- **TOON**: Token-Oriented Object Notation, a compact serialization format designed for LLMs
- **Logger**: The primary interface for creating log entries
- **TOON_Serializer**: Component that converts JavaScript objects to TOON format
- **File_Manager**: Component that handles log file writing, rotation, and splitting
- **Section_Marker**: Special delimiter in log files that helps humans locate specific sections
- **Log_Entry**: A single log record containing timestamp, level, message, and optional metadata
- **Log_Level**: Severity classification (debug, info, warn, error, fatal)
- **Token**: A unit of text processed by language models
- **File_Rotation**: Process of creating new log files when size or time thresholds are reached

## Requirements

### Requirement 1: TOON Serialization

**User Story:** As a developer, I want log data serialized in TOON format, so that I can minimize token usage when sending logs to AI systems.

#### Acceptance Criteria

1. WHEN a JavaScript object is logged, THE TOON_Serializer SHALL convert it to TOON format
2. WHEN an array contains uniform objects, THE TOON_Serializer SHALL use tabular structure with schema declaration
3. WHEN nested objects are serialized, THE TOON_Serializer SHALL use indentation instead of curly braces
4. WHEN string values contain no special characters, THE TOON_Serializer SHALL omit quotation marks
5. WHEN string values contain delimiters or special characters, THE TOON_Serializer SHALL apply minimal quoting
6. THE TOON_Serializer SHALL achieve 30-60% token reduction compared to equivalent JSON output
7. WHEN serializing arrays, THE TOON_Serializer SHALL include explicit array length in the schema declaration
8. THE TOON_Serializer SHALL support comma, tab, and pipe delimiters for field separation

### Requirement 2: Logger API

**User Story:** As a developer, I want a familiar logging API, so that I can integrate AXON into my applications with minimal learning curve.

#### Acceptance Criteria

1. THE Logger SHALL provide methods for each log level: debug, info, warn, error, and fatal
2. WHEN a log method is called with a message, THE Logger SHALL create a Log_Entry with timestamp and level
3. WHEN a log method is called with metadata objects, THE Logger SHALL include them in the Log_Entry
4. THE Logger SHALL support both JavaScript and TypeScript environments
5. WHEN Logger is instantiated, THE Logger SHALL accept configuration options for output path and log level filtering
6. THE Logger SHALL support method chaining for configuration
7. WHEN a log level filter is set, THE Logger SHALL only process entries at or above that level

### Requirement 3: File Output Management

**User Story:** As a developer, I want logs written to .txt files, so that I can store and retrieve log data efficiently.

#### Acceptance Criteria

1. WHEN a Log_Entry is created, THE File_Manager SHALL write it to a .txt file in TOON format
2. THE File_Manager SHALL support configurable output directory paths
3. WHEN writing to files, THE File_Manager SHALL handle file system errors gracefully
4. THE File_Manager SHALL support both Node.js file system operations and browser-compatible alternatives
5. WHEN multiple log entries are created rapidly, THE File_Manager SHALL buffer writes to optimize performance
6. THE File_Manager SHALL flush buffered entries before process termination

### Requirement 4: File Rotation and Splitting

**User Story:** As a developer, I want automatic file rotation, so that individual log files do not become too large for AI context windows.

#### Acceptance Criteria

1. WHEN a log file reaches a configurable size threshold, THE File_Manager SHALL create a new log file
2. WHEN a configurable time period elapses, THE File_Manager SHALL create a new log file
3. THE File_Manager SHALL include timestamps or sequence numbers in rotated file names
4. WHEN creating a new log file, THE File_Manager SHALL maintain continuity markers between files
5. THE File_Manager SHALL support configurable maximum file size limits
6. THE File_Manager SHALL support configurable rotation intervals (hourly, daily, weekly)
7. WHEN file rotation occurs, THE File_Manager SHALL complete writing the current entry before switching files

### Requirement 5: Section Markers

**User Story:** As a developer, I want special markers in log files, so that I can easily extract specific sections to send to AI systems.

#### Acceptance Criteria

1. THE Logger SHALL support inserting Section_Markers with custom labels
2. WHEN a Section_Marker is inserted, THE Logger SHALL write a distinctive delimiter to the log file
3. THE Section_Marker SHALL include timestamp and label information
4. THE Section_Marker SHALL be easily identifiable through text search or pattern matching
5. WHEN extracting log sections, THE AXON SHALL provide utility functions to read between markers
6. THE Section_Marker format SHALL minimize token usage while remaining distinctive

### Requirement 6: Token Optimization

**User Story:** As a developer, I want minimal token usage in logs, so that I can reduce costs when processing logs with AI systems.

#### Acceptance Criteria

1. THE TOON_Serializer SHALL eliminate redundant field names in uniform arrays
2. THE TOON_Serializer SHALL use abbreviated timestamp formats when precision allows
3. THE Logger SHALL support field aliasing to replace verbose field names with short codes
4. WHEN logging repeated values, THE TOON_Serializer SHALL support reference notation
5. THE TOON_Serializer SHALL omit null or undefined values unless explicitly configured otherwise
6. THE Logger SHALL provide token counting utilities to measure log efficiency
7. WHEN comparing equivalent data, THE TOON_Serializer SHALL produce output with fewer tokens than JSON

### Requirement 7: Configuration Management

**User Story:** As a developer, I want flexible configuration options, so that I can customize AXON behavior for different environments.

#### Acceptance Criteria

1. THE Logger SHALL accept configuration through constructor options
2. THE Logger SHALL support configuration through environment variables
3. THE Logger SHALL support configuration through external configuration files
4. WHEN configuration conflicts exist, THE Logger SHALL apply a defined precedence order
5. THE Logger SHALL validate configuration values and provide clear error messages for invalid settings
6. THE Logger SHALL support runtime configuration updates for non-critical settings
7. THE Logger SHALL provide default configuration values for all optional settings

### Requirement 8: Error Handling

**User Story:** As a developer, I want robust error handling, so that logging failures do not crash my application.

#### Acceptance Criteria

1. WHEN file write operations fail, THE File_Manager SHALL emit error events without throwing exceptions
2. WHEN serialization fails, THE TOON_Serializer SHALL fall back to safe string representation
3. WHEN disk space is exhausted, THE File_Manager SHALL handle the error gracefully and notify the application
4. THE Logger SHALL provide error callback hooks for custom error handling
5. WHEN circular references are detected, THE TOON_Serializer SHALL handle them without infinite loops
6. THE Logger SHALL continue operating after non-fatal errors
7. WHEN critical errors occur, THE Logger SHALL log error details to stderr or console

### Requirement 9: TypeScript Support

**User Story:** As a TypeScript developer, I want full type definitions, so that I can benefit from type safety and IDE autocompletion.

#### Acceptance Criteria

1. THE AXON SHALL provide complete TypeScript type definitions for all public APIs
2. THE AXON SHALL export interfaces for configuration options
3. THE AXON SHALL export type definitions for Log_Entry structures
4. WHEN using TypeScript, THE AXON SHALL provide generic type parameters for metadata objects
5. THE AXON SHALL include JSDoc comments for all public methods and interfaces
6. THE AXON SHALL compile without TypeScript errors in strict mode

### Requirement 10: Browser Compatibility

**User Story:** As a web developer, I want AXON to work in browser environments, so that I can use consistent logging across Node.js and browser applications.

#### Acceptance Criteria

1. WHERE browser environment is detected, THE File_Manager SHALL use browser-compatible storage mechanisms
2. WHERE browser environment is detected, THE File_Manager SHALL support localStorage or IndexedDB for log persistence
3. WHERE browser environment is detected, THE Logger SHALL provide methods to download log files
4. THE AXON SHALL detect the runtime environment automatically
5. WHERE browser environment is detected, THE AXON SHALL provide fallback behavior for Node.js-specific features
6. THE AXON SHALL maintain consistent API across Node.js and browser environments

### Requirement 11: Performance Optimization

**User Story:** As a developer, I want minimal performance overhead, so that logging does not significantly impact application performance.

#### Acceptance Criteria

1. THE Logger SHALL use asynchronous I/O operations for file writes
2. THE Logger SHALL batch multiple log entries when possible to reduce I/O operations
3. WHEN log level filtering excludes an entry, THE Logger SHALL skip serialization entirely
4. THE TOON_Serializer SHALL reuse object pools to minimize garbage collection pressure
5. THE Logger SHALL provide synchronous logging options for critical error scenarios
6. WHEN benchmarked, THE AXON SHALL demonstrate comparable or better performance than popular JSON-based loggers

### Requirement 12: Log Extraction Utilities

**User Story:** As a developer, I want utilities to extract log sections, so that I can easily prepare log data for AI analysis.

#### Acceptance Criteria

1. THE AXON SHALL provide a function to extract logs between two Section_Markers
2. THE AXON SHALL provide a function to extract logs within a time range
3. THE AXON SHALL provide a function to filter logs by level
4. WHEN extracting logs, THE AXON SHALL return data in TOON format
5. THE AXON SHALL provide a function to count tokens in extracted log sections
6. THE AXON SHALL support exporting extracted sections to new files
7. THE AXON SHALL provide a CLI tool for log extraction operations

### Requirement 13: TOON Format Round-Trip

**User Story:** As a developer, I want to parse TOON-formatted logs back into JavaScript objects, so that I can programmatically analyze log data.

#### Acceptance Criteria

1. THE AXON SHALL provide a TOON parser that converts TOON format back to JavaScript objects
2. WHEN parsing TOON data, THE Parser SHALL reconstruct the original object structure
3. THE Parser SHALL handle all TOON format features including tabular arrays and nested objects
4. WHEN parsing and serializing the same object, THE AXON SHALL produce equivalent data structures
5. THE Parser SHALL provide clear error messages for malformed TOON input
6. THE Parser SHALL support streaming parsing for large log files

### Requirement 14: Metadata Handling

**User Story:** As a developer, I want to attach contextual metadata to log entries, so that I can include relevant information without verbose formatting.

#### Acceptance Criteria

1. WHEN logging, THE Logger SHALL accept arbitrary metadata objects
2. THE Logger SHALL support global metadata that applies to all log entries
3. THE Logger SHALL support per-entry metadata that applies to individual logs
4. WHEN both global and per-entry metadata exist, THE Logger SHALL merge them with per-entry taking precedence
5. THE TOON_Serializer SHALL optimize metadata serialization to minimize tokens
6. THE Logger SHALL support metadata filtering to exclude sensitive information

### Requirement 15: Documentation and Examples

**User Story:** As a developer, I want comprehensive documentation, so that I can quickly learn how to use AXON effectively.

#### Acceptance Criteria

1. THE AXON SHALL include a README with quick start examples
2. THE AXON SHALL provide API documentation for all public methods
3. THE AXON SHALL include example code for common use cases
4. THE AXON SHALL document the TOON format specification
5. THE AXON SHALL provide migration guides from popular logging frameworks
6. THE AXON SHALL include performance benchmarks comparing token usage with JSON
7. THE AXON SHALL document browser-specific considerations and limitations
