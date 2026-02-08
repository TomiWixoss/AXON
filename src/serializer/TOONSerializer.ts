/**
 * TOON Serializer - Converts JavaScript objects to TOON format
 *
 * TOON (Token-Oriented Object Notation) is a compact serialization format
 * designed to minimize token usage for AI/LLM consumption.
 *
 * Validates: Requirements 1.1, 1.8
 */

/**
 * Configuration interface for TOONSerializer
 */
export interface TOONSerializerConfig {
  /**
   * Field delimiter to use for separating values
   * @default ','
   */
  delimiter: ',' | '\t' | '|';

  /**
   * Whether to omit null and undefined values from output
   * @default true
   */
  omitNullValues: boolean;

  /**
   * Map of verbose field names to short aliases for token optimization
   * @example { 'timestamp': 'ts', 'message': 'msg' }
   */
  fieldAliases: Record<string, string>;

  /**
   * Maximum nesting depth to prevent infinite recursion
   * @default 10
   */
  maxDepth: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: TOONSerializerConfig = {
  delimiter: ',',
  omitNullValues: true,
  fieldAliases: {},
  maxDepth: 10,
};

/**
 * TOONSerializer class - Converts JavaScript values to TOON format
 *
 * Features:
 * - Tabular structure for uniform arrays (schema declared once)
 * - Indentation-based nesting instead of braces
 * - Minimal quoting (only when necessary)
 * - Field aliasing for token reduction
 * - Configurable delimiters (comma, tab, pipe)
 */
export class TOONSerializer {
  private config: TOONSerializerConfig;

  /**
   * Creates a new TOONSerializer instance
   *
   * @param config - Configuration options (partial, merged with defaults)
   * @throws {Error} If configuration is invalid
   */
  constructor(config: Partial<TOONSerializerConfig> = {}) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validates the configuration
   *
   * @throws {Error} If configuration is invalid
   */
  private validateConfig(): void {
    const { delimiter, maxDepth, omitNullValues, fieldAliases } = this.config;

    // Validate delimiter
    if (delimiter !== ',' && delimiter !== '\t' && delimiter !== '|') {
      throw new Error(`Invalid delimiter: "${String(delimiter)}". Must be one of: ',', '\\t', '|'`);
    }

    // Validate maxDepth
    if (typeof maxDepth !== 'number' || maxDepth < 1) {
      throw new Error(`Invalid maxDepth: ${String(maxDepth)}. Must be a positive number.`);
    }

    // Validate omitNullValues
    if (typeof omitNullValues !== 'boolean') {
      throw new Error(`Invalid omitNullValues: ${String(omitNullValues)}. Must be a boolean.`);
    }

    // Validate fieldAliases
    if (typeof fieldAliases !== 'object' || fieldAliases === null) {
      throw new Error(`Invalid fieldAliases: ${String(fieldAliases)}. Must be an object.`);
    }

    // Validate that fieldAliases values are strings
    for (const [key, value] of Object.entries(fieldAliases)) {
      if (typeof value !== 'string') {
        throw new Error(
          `Invalid alias for field "${key}": ${String(value)}. Alias must be a string.`
        );
      }
    }
  }

  /**
   * Serializes a JavaScript value to TOON format
   *
   * @param value - The value to serialize
   * @returns TOON-formatted string representation
   *
   * @example
   * const serializer = new TOONSerializer();
   * serializer.serialize({ name: 'Alice', age: 30 });
   * // Returns: "name: Alice\nage: 30"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize(value: any): string {
    // Create a new WeakSet to track visited objects for circular reference detection
    const visited = new WeakSet<object>();
    const path: string[] = [];
    return this.serializeValue(value, 0, visited, path);
  }

  /**
   * Internal method to serialize any value with depth tracking
   *
   * @param value - The value to serialize
   * @param depth - Current nesting depth
   * @param visited - WeakSet tracking visited objects for circular reference detection
   * @param path - Array tracking the current path for circular reference reporting
   * @returns TOON-formatted string representation
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeValue(value: any, depth: number, visited: WeakSet<object>, path: string[]): string {
    // Handle primitives FIRST - including strings
    // This must come before any typeof checks to prevent strings being treated as objects
    if (value === null || value === undefined) {
      return this.serializePrimitive(value);
    }
    
    if (typeof value === 'string') {
      return this.serializePrimitive(value);
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return this.serializePrimitive(value);
    }

    // Handle arrays before general object check
    if (Array.isArray(value)) {
      // Check for circular references
      if (visited.has(value)) {
        return `[Circular: ${path.join('.') || 'root'}]`;
      }
      visited.add(value);
      
      // Check max depth
      if (depth > this.config.maxDepth) {
        visited.delete(value);
        return '[max depth exceeded]';
      }
      
      const result = this.serializeArray(value, depth, visited, path);
      visited.delete(value);
      return result;
    }

    // Handle objects (but not null, arrays, or primitives)
    if (typeof value === 'object' && value !== null) {
      // Check for circular references
      if (visited.has(value)) {
        return `[Circular: ${path.join('.') || 'root'}]`;
      }
      visited.add(value);
      
      // Check max depth
      if (depth > this.config.maxDepth) {
        visited.delete(value);
        return '[max depth exceeded]';
      }
      
      const result = this.serializeObject(value, depth, visited, path);
      visited.delete(value);
      return result;
    }

    // Fallback for other types (functions, symbols, etc.)
    return '[Object]';
  }

  /**
   * Serializes primitive values (numbers, booleans, null, undefined, strings)
   *
   * Validates: Requirements 1.4, 1.5
   *
   * @param value - The primitive value to serialize
   * @returns TOON-formatted string representation
   *
   * @example
   * serializePrimitive(42) // "42"
   * serializePrimitive(true) // "true"
   * serializePrimitive("hello") // "hello"
   * serializePrimitive("hello, world") // '"hello, world"'
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializePrimitive(value: any): string {
    // Handle null
    if (value === null) {
      return this.config.omitNullValues ? '' : 'null';
    }

    // Handle undefined
    if (value === undefined) {
      return this.config.omitNullValues ? '' : 'undefined';
    }

    // Handle numbers (including NaN and Infinity)
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return 'NaN';
      }
      if (value === Infinity) {
        return 'Infinity';
      }
      if (value === -Infinity) {
        return '-Infinity';
      }
      return String(value);
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return String(value);
    }

    // Handle strings
    if (typeof value === 'string') {
      // Apply minimal quoting - only quote if necessary
      if (this.needsQuoting(value)) {
        // Escape special characters in the string
        const escaped = value
          .replace(/\\/g, '\\\\')  // Backslash must be first
          .replace(/"/g, '\\"')     // Escape quotes
          .replace(/\n/g, '\\n')    // Escape newlines
          .replace(/\r/g, '\\r')    // Escape carriage returns
          .replace(/\t/g, '\\t');   // Escape tabs
        return `"${escaped}"`;
      }
      return value;
    }

    // For non-primitive types, return a placeholder for now
    // (will be implemented in subsequent tasks)
    return '[Object]';
  }

  /**
   * Determines if a string needs to be quoted in TOON format
   *
   * Validates: Requirements 1.4, 1.5
   *
   * A string needs quoting if it:
   * - Contains the configured delimiter
   * - Contains newline characters
   * - Contains quote characters
   * - Starts with a digit (to avoid confusion with numbers)
   * - Is empty
   * - Contains leading or trailing whitespace
   * - Contains special TOON syntax characters (: [ ] { })
   *
   * @param str - The string to check
   * @returns true if the string needs quoting, false otherwise
   *
   * @example
   * needsQuoting("hello") // false
   * needsQuoting("hello, world") // true (contains comma)
   * needsQuoting("123abc") // true (starts with digit)
   */
  private needsQuoting(str: string): boolean {
    // Empty strings need quoting
    if (str.length === 0) {
      return true;
    }

    // Check for leading or trailing whitespace
    if (str !== str.trim()) {
      return true;
    }

    // Check if starts with a digit (could be confused with numbers)
    if (/^\d/.test(str)) {
      return true;
    }

    // Check for delimiter
    if (str.includes(this.config.delimiter)) {
      return true;
    }

    // Check for newlines
    if (str.includes('\n') || str.includes('\r')) {
      return true;
    }

    // Check for quotes
    if (str.includes('"') || str.includes("'")) {
      return true;
    }

    // Check for special TOON syntax characters
    if (str.includes(':') || str.includes('[') || str.includes(']') || 
        str.includes('{') || str.includes('}')) {
      return true;
    }

    // Check for reserved keywords that could cause confusion
    const reservedKeywords = ['null', 'undefined', 'true', 'false', 'NaN', 'Infinity', '-Infinity'];
    if (reservedKeywords.includes(str)) {
      return true;
    }

    // No quoting needed
    return false;
  }

  /**
   * Gets the current configuration
   *
   * @returns A copy of the current configuration
   */
  getConfig(): Readonly<TOONSerializerConfig> {
    return { ...this.config };
  }

  /**
   * Serializes an object to TOON format with indentation-based nesting
   *
   * Validates: Requirements 1.1, 1.3, 6.3, 6.5
   *
   * @param obj - The object to serialize
   * @param depth - Current nesting depth
   * @param visited - WeakSet tracking visited objects for circular reference detection
   * @param path - Array tracking the current path for circular reference reporting
   * @returns TOON-formatted string representation
   *
   * @example
   * serializeObject({ name: 'Alice', age: 30 }, 0)
   * // Returns: "name: Alice\nage: 30"
   *
   * serializeObject({ user: { name: 'Alice', age: 30 } }, 0)
   * // Returns: "user:\n  name: Alice\n  age: 30"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeObject(obj: Record<string, any>, depth: number, visited: WeakSet<object>, path: string[]): string {
    const lines: string[] = [];
    const indent = '  '.repeat(depth); // 2 spaces per level

    // Get object keys
    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];

      // Handle null/undefined value omission
      if ((value === null || value === undefined) && this.config.omitNullValues) {
        continue; // Skip this field
      }

      // Apply field aliasing
      const aliasedKey = this.applyAliases(key);

      // Add current key to path for circular reference tracking
      path.push(aliasedKey);

      // Serialize the value (passing depth + 1 for nested values)
      const serializedValue = this.serializeValue(value, depth + 1, visited, path);

      // Remove key from path after serialization
      path.pop();

      // Skip if value is empty (e.g., omitted null)
      if (serializedValue === '') {
        continue;
      }

      // Check if value is a nested object (multi-line)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - use indentation
        lines.push(`${indent}${aliasedKey}:`);
        // Add the nested object's lines with additional indentation
        const nestedLines = serializedValue.split('\n').filter(line => line.length > 0);
        lines.push(...nestedLines);
      } else {
        // Simple value - key: value format
        lines.push(`${indent}${aliasedKey}: ${serializedValue}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Applies field aliasing to a key name
   *
   * Validates: Requirements 6.3
   *
   * @param key - The original field name
   * @returns The aliased field name if an alias exists, otherwise the original key
   *
   * @example
   * // With config.fieldAliases = { 'timestamp': 'ts', 'message': 'msg' }
   * applyAliases('timestamp') // "ts"
   * applyAliases('other') // "other"
   */
  private applyAliases(key: string): string {
    return this.config.fieldAliases[key] || key;
  }

  /**
   * Serializes an array to TOON format
   *
   * Validates: Requirements 1.2, 1.7, 6.1
   *
   * @param arr - The array to serialize
   * @param depth - Current nesting depth
   * @param visited - WeakSet tracking visited objects for circular reference detection
   * @param path - Array tracking the current path for circular reference reporting
   * @returns TOON-formatted string representation
   *
   * @example
   * // Uniform array (tabular format):
   * serializeArray([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}], 0)
   * // Returns: "[2]{id,name}:\n1,Alice\n2,Bob"
   *
   * // Non-uniform array:
   * serializeArray(['apple', 42, true], 0)
   * // Returns: "[3]: apple, 42, true"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeArray(arr: any[], depth: number, visited: WeakSet<object>, path: string[]): string {
    // Handle empty arrays
    if (arr.length === 0) {
      return '[0]: ';
    }

    // Check if array contains uniform objects
    if (this.detectUniformArray(arr)) {
      return this.serializeTabular(arr, visited, path);
    } else {
      return this.serializeNonUniformArray(arr, depth, visited, path);
    }
  }

  /**
   * Detects if an array contains uniform objects (all objects with same keys)
   *
   * Validates: Requirements 1.2, 6.1
   *
   * @param arr - The array to check
   * @returns true if array contains uniform objects, false otherwise
   *
   * @example
   * detectUniformArray([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]) // true
   * detectUniformArray([{id: 1}, {id: 2, name: 'Bob'}]) // false
   * detectUniformArray(['apple', 'banana']) // false
   * detectUniformArray([]) // false
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private detectUniformArray(arr: any[]): boolean {
    // Empty arrays are not uniform
    if (arr.length === 0) {
      return false;
    }

    // All elements must be objects (not arrays, not primitives)
    const allObjects = arr.every(
      item => typeof item === 'object' && item !== null && !Array.isArray(item)
    );

    if (!allObjects) {
      return false;
    }

    // Get keys from first object
    const firstKeys = Object.keys(arr[0]).sort();

    // Check if all objects have the same keys
    return arr.every(item => {
      const itemKeys = Object.keys(item).sort();
      return (
        itemKeys.length === firstKeys.length &&
        itemKeys.every((key, index) => key === firstKeys[index])
      );
    });
  }

  /**
   * Serializes a uniform array in tabular format
   *
   * Validates: Requirements 1.2, 1.7, 6.1
   *
   * Format: [length]{field1,field2,...}:
   *         value1,value2,...
   *         value1,value2,...
   *
   * @param arr - The uniform array to serialize
   * @param visited - WeakSet tracking visited objects for circular reference detection
   * @param path - Array tracking the current path for circular reference reporting
   * @returns TOON-formatted tabular string
   *
   * @example
   * serializeTabular([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}])
   * // Returns: "[2]{id,name}:\n1,Alice\n2,Bob"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeTabular(arr: any[], visited: WeakSet<object>, path: string[]): string {
    if (arr.length === 0) {
      return '[0]: ';
    }

    // Get schema from first object
    const firstObj = arr[0];
    const keys = Object.keys(firstObj);

    // Apply field aliasing to keys
    const aliasedKeys = keys.map(key => this.applyAliases(key));

    // Build schema declaration: [length]{field1,field2,...}:
    const schemaLine = `[${arr.length}]{${aliasedKeys.join(this.config.delimiter)}}:`;

    // Build data rows
    const dataRows: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const values = keys.map(key => {
        const value = item[key];
        // For tabular arrays, we need to check if values are objects/arrays
        // If they are, we need to use serializeValue to detect circular references
        if (typeof value === 'object' && value !== null) {
          // Add path tracking for nested objects in tabular format
          path.push(`[${i}].${this.applyAliases(key)}`);
          const result = this.serializeValue(value, 1, visited, path);
          path.pop();
          return result;
        }
        // For primitives, use serializePrimitive directly
        return this.serializePrimitive(value);
      });
      dataRows.push(values.join(this.config.delimiter));
    }

    // Combine schema and data
    return schemaLine + '\n' + dataRows.join('\n');
  }

  /**
   * Serializes a non-uniform array (mixed types or non-objects)
   *
   * Validates: Requirements 1.7
   *
   * Format: [length]: value1, value2, value3
   *
   * @param arr - The non-uniform array to serialize
   * @param depth - Current nesting depth
   * @param visited - WeakSet tracking visited objects for circular reference detection
   * @param path - Array tracking the current path for circular reference reporting
   * @returns TOON-formatted string
   *
   * @example
   * serializeNonUniformArray(['apple', 42, true], 0)
   * // Returns: "[3]: apple, 42, true"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeNonUniformArray(arr: any[], depth: number, visited: WeakSet<object>, path: string[]): string {
    // Serialize each element
    const serializedValues = arr.map((item, index) => {
      // Add array index to path
      path.push(`[${index}]`);
      const result = this.serializeValue(item, depth + 1, visited, path);
      path.pop();
      return result;
    });

    // Format: [length]: value1, value2, value3
    return `[${arr.length}]: ${serializedValues.join(', ')}`;
  }
}
