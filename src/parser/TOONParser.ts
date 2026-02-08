/**
 * TOON Parser - Converts TOON format back to JavaScript objects
 *
 * TOON (Token-Oriented Object Notation) is a compact serialization format
 * designed to minimize token usage for AI/LLM consumption.
 *
 * Validates: Requirements 13.1
 */

/**
 * TOONParser class - Converts TOON format strings back to JavaScript values
 *
 * Features:
 * - Parses tabular arrays with schema declarations
 * - Handles indentation-based nested objects
 * - Supports minimal quoting (quoted and unquoted strings)
 * - Reconstructs original object structures
 */
export class TOONParser {
  /**
   * Parses a TOON-formatted string into a JavaScript value
   *
   * @param toonString - The TOON-formatted string to parse
   * @returns The parsed JavaScript value
   * @throws {Error} If the TOON string is malformed
   *
   * @example
   * const parser = new TOONParser();
   * parser.parse("name: Alice\nage: 30");
   * // Returns: { name: 'Alice', age: 30 }
   *
   * @example
   * parser.parse("[2]{id,name}:\n1,Alice\n2,Bob");
   * // Returns: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(toonString: string): any {
    // Handle empty input
    if (!toonString || toonString.trim().length === 0) {
      return undefined;
    }

    // Split into lines for processing
    const lines = toonString.split('\n');

    // Parse starting from the first line
    const result = this.parseValue(lines, 0);

    return result.value;
  }

  /**
   * Internal method to parse a value from lines starting at a given index
   *
   * This method determines the type of value (primitive, object, array) and
   * delegates to the appropriate parsing method.
   *
   * @param lines - Array of lines from the TOON string
   * @param index - Starting line index
   * @returns Object containing the parsed value and the next line index to process
   *
   * @example
   * parseValue(['name: Alice', 'age: 30'], 0)
   * // Returns: { value: { name: 'Alice', age: 30 }, endIndex: 2 }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseValue(lines: string[], index: number): { value: any; endIndex: number } {
    // Skip empty lines
    while (index < lines.length && lines[index].trim().length === 0) {
      index++;
    }

    // Check if we've reached the end
    if (index >= lines.length) {
      return { value: undefined, endIndex: index };
    }

    const line = lines[index].trim();

    // Check for tabular array pattern: [length]{fields}:
    const tabularMatch = line.match(/^\[(\d+)\]\{([^}]+)\}:$/);
    if (tabularMatch) {
      // This is a tabular array
      const length = parseInt(tabularMatch[1], 10);
      const fields = tabularMatch[2].split(',').map(f => f.trim());

      // Extract data lines
      const dataLines = lines.slice(index + 1, index + 1 + length);

      // Parse the tabular array
      const value = this.parseTabular(fields, dataLines);

      return { value, endIndex: index + 1 + length };
    }

    // Check for non-uniform array pattern: [length]: values
    const nonUniformMatch = line.match(/^\[(\d+)\]:\s*(.*)$/);
    if (nonUniformMatch) {
      const length = parseInt(nonUniformMatch[1], 10);
      const valuesStr = nonUniformMatch[2];

      // Handle empty array
      if (length === 0 || valuesStr.trim().length === 0) {
        return { value: [], endIndex: index + 1 };
      }

      // Parse comma-separated values, respecting quotes
      const values = this.splitDataLine(valuesStr, ',').map(v => this.parsePrimitive(v));

      return { value: values, endIndex: index + 1 };
    }

    // Check if this line contains a colon (key: value or nested object)
    if (line.includes(':')) {
      // Check if the entire line is a quoted string (not an object)
      // Quoted strings can contain colons
      if (line.startsWith('"') && line.endsWith('"')) {
        // This is a quoted string, not an object
        const value = this.parsePrimitive(line);
        return { value, endIndex: index + 1 };
      }

      // This could be an object or a simple key-value pair
      // We need to look ahead to determine if it's a nested object
      return this.parseObject(lines, index);
    }

    // Otherwise, treat as a primitive value
    const value = this.parsePrimitive(line);
    return { value, endIndex: index + 1 };
  }

  /**
   * Parses an object from lines starting at a given index
   *
   * Handles both simple key-value pairs and nested objects with indentation.
   *
   * @param lines - Array of lines from the TOON string
   * @param startIndex - Starting line index
   * @returns Object containing the parsed object and the next line index to process
   *
   * @example
   * parseObject(['name: Alice', 'age: 30'], 0)
   * // Returns: { value: { name: 'Alice', age: 30 }, endIndex: 2 }
   *
   * @example
   * parseObject(['user:', '  name: Alice', '  age: 30'], 0)
   * // Returns: { value: { user: { name: 'Alice', age: 30 } }, endIndex: 3 }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseObject(lines: string[], startIndex: number): { value: any; endIndex: number } {
    const result: Record<string, any> = {};
    let currentIndex = startIndex;

    // Get the base indentation level from the first line
    const baseIndent = this.getIndentLevel(lines[currentIndex]);

    while (currentIndex < lines.length) {
      const line = lines[currentIndex];

      // Skip empty lines
      if (line.trim().length === 0) {
        currentIndex++;
        continue;
      }

      const currentIndent = this.getIndentLevel(line);

      // If indentation is less than base, we've finished this object
      if (currentIndent < baseIndent) {
        break;
      }

      // If indentation is greater than base + 1 level, skip (it's part of a nested structure)
      if (currentIndent > baseIndent) {
        currentIndex++;
        continue;
      }

      const trimmedLine = line.trim();

      // Check for key: value pattern
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) {
        // No colon found, skip this line
        currentIndex++;
        continue;
      }

      const key = trimmedLine.substring(0, colonIndex).trim();
      const valueStr = trimmedLine.substring(colonIndex + 1).trim();

      // Check if valueStr is a tabular array schema
      const tabularMatch = valueStr.match(/^\[(\d+)\]\{([^}]+)\}:$/);
      if (tabularMatch) {
        // Parse the tabular array inline
        const length = parseInt(tabularMatch[1], 10);
        const fields = tabularMatch[2].split(',').map(f => f.trim());
        const dataLines = lines.slice(currentIndex + 1, currentIndex + 1 + length);
        result[key] = this.parseTabular(fields, dataLines);
        currentIndex = currentIndex + 1 + length;
        continue;
      }

      // Check if this is a nested object (value is empty and next line is indented)
      if (valueStr.length === 0) {
        // Look ahead to see if next line is more indented or is a tabular array
        if (currentIndex + 1 < lines.length) {
          const nextLine = lines[currentIndex + 1];
          const nextIndent = this.getIndentLevel(nextLine);
          const nextTrimmed = nextLine.trim();

          // Check if next line is a tabular array
          const tabularMatch = nextTrimmed.match(/^\[(\d+)\]\{([^}]+)\}:$/);
          if (tabularMatch) {
            // Parse the tabular array
            const length = parseInt(tabularMatch[1], 10);
            const fields = tabularMatch[2].split(',').map(f => f.trim());
            const dataLines = lines.slice(currentIndex + 2, currentIndex + 2 + length);
            result[key] = this.parseTabular(fields, dataLines);
            currentIndex = currentIndex + 2 + length;
            continue;
          }

          if (nextIndent > currentIndent) {
            // This is a nested object
            const nestedResult = this.parseObject(lines, currentIndex + 1);
            result[key] = nestedResult.value;
            currentIndex = nestedResult.endIndex;
            continue;
          }
        }

        // Empty value
        result[key] = undefined;
        currentIndex++;
      } else {
        // Simple value
        result[key] = this.parsePrimitive(valueStr);
        currentIndex++;
      }
    }

    return { value: result, endIndex: currentIndex };
  }

  /**
   * Parses a tabular array from schema and data lines
   *
   * @param fields - Array of field names from the schema
   * @param dataLines - Array of data lines (one per array element)
   * @returns Array of objects reconstructed from the tabular data
   *
   * @example
   * parseTabular(['id', 'name'], ['1,Alice', '2,Bob'])
   * // Returns: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseTabular(fields: string[], dataLines: string[]): any[] {
    const result: any[] = [];

    for (const dataLine of dataLines) {
      // Skip empty lines
      if (dataLine.trim().length === 0) {
        continue;
      }

      // Split by comma (default delimiter)
      // TODO: Support other delimiters (tab, pipe) in future iterations
      const values = this.splitDataLine(dataLine, ',');

      // Create object from fields and values
      const obj: Record<string, any> = {};
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const value = i < values.length ? values[i] : undefined;
        obj[field] = this.parsePrimitive(value || '');
      }

      result.push(obj);
    }

    return result;
  }

  /**
   * Splits a data line by delimiter, respecting quoted strings
   *
   * @param line - The data line to split
   * @param delimiter - The delimiter character
   * @returns Array of values
   */
  private splitDataLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        // Handle escaped characters
        if (char === 'n') {
          current += '\n';
        } else if (char === 'r') {
          current += '\r';
        } else if (char === 't') {
          current += '\t';
        } else if (char === '\\') {
          current += '\\';
        } else if (char === '"') {
          current += '"';
        } else {
          current += char;
        }
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    // Add the last value
    values.push(current.trim());

    return values;
  }

  /**
   * Parses a primitive value from a token string
   *
   * Handles numbers, booleans, null, undefined, and strings (quoted and unquoted).
   *
   * @param token - The token string to parse
   * @returns The parsed primitive value
   *
   * @example
   * parsePrimitive('42') // 42
   * parsePrimitive('true') // true
   * parsePrimitive('null') // null
   * parsePrimitive('"hello, world"') // 'hello, world'
   * parsePrimitive('hello') // 'hello'
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parsePrimitive(token: string): any {
    // Handle empty token
    if (token.length === 0) {
      return undefined;
    }

    // Handle quoted strings
    if (token.startsWith('"') && token.endsWith('"')) {
      // Remove quotes and unescape
      const content = token.slice(1, -1);
      return content
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    // Handle null
    if (token === 'null') {
      return null;
    }

    // Handle undefined
    if (token === 'undefined') {
      return undefined;
    }

    // Handle booleans
    if (token === 'true') {
      return true;
    }
    if (token === 'false') {
      return false;
    }

    // Handle special number values
    if (token === 'NaN') {
      return NaN;
    }
    if (token === 'Infinity') {
      return Infinity;
    }
    if (token === '-Infinity') {
      return -Infinity;
    }

    // Try to parse as number
    const num = Number(token);
    if (!isNaN(num) && token.trim() !== '') {
      return num;
    }

    // Otherwise, treat as unquoted string
    return token;
  }

  /**
   * Gets the indentation level of a line (number of leading spaces / 2)
   *
   * @param line - The line to check
   * @returns The indentation level (0 for no indentation, 1 for 2 spaces, etc.)
   */
  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    if (!match) {
      return 0;
    }
    const spaces = match[1].length;
    return Math.floor(spaces / 2);
  }
}
