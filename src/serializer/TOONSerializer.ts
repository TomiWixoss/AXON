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
  serialize(_value: any): string {
    // TODO: Implement serialization logic in subsequent tasks
    // This is a stub implementation for Task 2.1
    return '[Not yet implemented]';
  }

  /**
   * Gets the current configuration
   *
   * @returns A copy of the current configuration
   */
  getConfig(): Readonly<TOONSerializerConfig> {
    return { ...this.config };
  }
}
