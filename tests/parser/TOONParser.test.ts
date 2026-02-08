/**
 * Unit tests for TOONParser
 *
 * Tests the parsing of TOON format back to JavaScript objects.
 */

import { TOONParser } from '../../src/parser/TOONParser';

describe('TOONParser', () => {
  let parser: TOONParser;

  beforeEach(() => {
    parser = new TOONParser();
  });

  describe('parse() - basic functionality', () => {
    test('parses empty string to undefined', () => {
      expect(parser.parse('')).toBeUndefined();
      expect(parser.parse('   ')).toBeUndefined();
    });

    test('parses simple primitive values', () => {
      expect(parser.parse('42')).toBe(42);
      expect(parser.parse('3.14')).toBe(3.14);
      expect(parser.parse('true')).toBe(true);
      expect(parser.parse('false')).toBe(false);
      expect(parser.parse('null')).toBe(null);
      expect(parser.parse('undefined')).toBeUndefined();
    });

    test('parses special number values', () => {
      expect(parser.parse('NaN')).toBeNaN();
      expect(parser.parse('Infinity')).toBe(Infinity);
      expect(parser.parse('-Infinity')).toBe(-Infinity);
    });

    test('parses unquoted strings', () => {
      expect(parser.parse('hello')).toBe('hello');
      expect(parser.parse('user_name')).toBe('user_name');
    });

    test('parses quoted strings', () => {
      expect(parser.parse('"hello, world"')).toBe('hello, world');
      expect(parser.parse('"line\\nbreak"')).toBe('line\nbreak');
      expect(parser.parse('"tab\\there"')).toBe('tab\there');
      expect(parser.parse('"quote\\"here"')).toBe('quote"here');
      expect(parser.parse('"back\\\\slash"')).toBe('back\\slash');
    });
  });

  describe('parsePrimitive() - helper method', () => {
    test('handles all primitive types correctly', () => {
      // Access private method through any cast for testing
      const parsePrimitive = (parser as any).parsePrimitive.bind(parser);

      expect(parsePrimitive('42')).toBe(42);
      expect(parsePrimitive('-17')).toBe(-17);
      expect(parsePrimitive('3.14')).toBe(3.14);
      expect(parsePrimitive('true')).toBe(true);
      expect(parsePrimitive('false')).toBe(false);
      expect(parsePrimitive('null')).toBe(null);
      expect(parsePrimitive('undefined')).toBeUndefined();
      expect(parsePrimitive('NaN')).toBeNaN();
      expect(parsePrimitive('Infinity')).toBe(Infinity);
      expect(parsePrimitive('-Infinity')).toBe(-Infinity);
      expect(parsePrimitive('hello')).toBe('hello');
      expect(parsePrimitive('"quoted"')).toBe('quoted');
      expect(parsePrimitive('')).toBeUndefined();
    });
  });

  describe('parseValue() - helper method', () => {
    test('parses simple values from lines', () => {
      const parseValue = (parser as any).parseValue.bind(parser);

      const result1 = parseValue(['42'], 0);
      expect(result1.value).toBe(42);
      expect(result1.endIndex).toBe(1);

      const result2 = parseValue(['hello'], 0);
      expect(result2.value).toBe('hello');
      expect(result2.endIndex).toBe(1);
    });

    test('skips empty lines', () => {
      const parseValue = (parser as any).parseValue.bind(parser);

      const result = parseValue(['', '  ', '42'], 0);
      expect(result.value).toBe(42);
      expect(result.endIndex).toBe(3);
    });

    test('handles end of lines', () => {
      const parseValue = (parser as any).parseValue.bind(parser);

      const result = parseValue(['42'], 1);
      expect(result.value).toBeUndefined();
      expect(result.endIndex).toBe(1);
    });
  });

  describe('parse() - simple objects', () => {
    test('parses simple object with primitive values', () => {
      const toon = 'name: Alice\nage: 30\nactive: true';
      const result = parser.parse(toon);

      expect(result).toEqual({
        name: 'Alice',
        age: 30,
        active: true,
      });
    });

    test('parses object with quoted string values', () => {
      const toon = 'name: "Alice Smith"\nmessage: "Hello, world"';
      const result = parser.parse(toon);

      expect(result).toEqual({
        name: 'Alice Smith',
        message: 'Hello, world',
      });
    });

    test('parses object with null and undefined values', () => {
      const toon = 'name: Alice\nmiddle: null\nsuffix: undefined';
      const result = parser.parse(toon);

      expect(result).toEqual({
        name: 'Alice',
        middle: null,
        suffix: undefined,
      });
    });
  });

  describe('parse() - nested objects', () => {
    test('parses nested object with indentation', () => {
      const toon = 'user:\n  name: Alice\n  age: 30';
      const result = parser.parse(toon);

      expect(result).toEqual({
        user: {
          name: 'Alice',
          age: 30,
        },
      });
    });

    test('parses deeply nested objects', () => {
      const toon = 'user:\n  name: Alice\n  address:\n    city: NYC\n    zip: 10001';
      const result = parser.parse(toon);

      expect(result).toEqual({
        user: {
          name: 'Alice',
          address: {
            city: 'NYC',
            zip: 10001,
          },
        },
      });
    });

    test('parses object with multiple nested objects', () => {
      const toon = 'user:\n  name: Alice\n  age: 30\nconfig:\n  theme: dark\n  lang: en';
      const result = parser.parse(toon);

      expect(result).toEqual({
        user: {
          name: 'Alice',
          age: 30,
        },
        config: {
          theme: 'dark',
          lang: 'en',
        },
      });
    });
  });

  describe('parse() - arrays', () => {
    test('parses empty array', () => {
      const toon = '[0]: ';
      const result = parser.parse(toon);

      expect(result).toEqual([]);
    });

    test('parses non-uniform array with primitives', () => {
      const toon = '[3]: apple, 42, true';
      const result = parser.parse(toon);

      expect(result).toEqual(['apple', 42, true]);
    });

    test('parses non-uniform array with quoted strings', () => {
      const toon = '[2]: "hello, world", "line\\nbreak"';
      const result = parser.parse(toon);

      expect(result).toEqual(['hello, world', 'line\nbreak']);
    });
  });

  describe('parse() - tabular arrays', () => {
    test('parses simple tabular array', () => {
      const toon = '[2]{id,name}:\n1,Alice\n2,Bob';
      const result = parser.parse(toon);

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });

    test('parses tabular array with various types', () => {
      const toon = '[3]{id,name,age,active}:\n1,Alice,28,true\n2,Bob,35,false\n3,Carol,42,true';
      const result = parser.parse(toon);

      expect(result).toEqual([
        { id: 1, name: 'Alice', age: 28, active: true },
        { id: 2, name: 'Bob', age: 35, active: false },
        { id: 3, name: 'Carol', age: 42, active: true },
      ]);
    });

    test('parses tabular array with quoted strings', () => {
      const toon = '[2]{id,name,message}:\n1,Alice,"Hello, world"\n2,Bob,"Line\\nbreak"';
      const result = parser.parse(toon);

      expect(result).toEqual([
        { id: 1, name: 'Alice', message: 'Hello, world' },
        { id: 2, name: 'Bob', message: 'Line\nbreak' },
      ]);
    });

    test('parses empty tabular array', () => {
      const toon = '[0]{id,name}:';
      const result = parser.parse(toon);

      expect(result).toEqual([]);
    });
  });

  describe('parseTabular() - helper method', () => {
    test('parses tabular data correctly', () => {
      const parseTabular = (parser as any).parseTabular.bind(parser);

      const fields = ['id', 'name', 'age'];
      const dataLines = ['1,Alice,28', '2,Bob,35'];

      const result = parseTabular(fields, dataLines);

      expect(result).toEqual([
        { id: 1, name: 'Alice', age: 28 },
        { id: 2, name: 'Bob', age: 35 },
      ]);
    });

    test('handles empty data lines', () => {
      const parseTabular = (parser as any).parseTabular.bind(parser);

      const fields = ['id', 'name'];
      const dataLines: string[] = [];

      const result = parseTabular(fields, dataLines);

      expect(result).toEqual([]);
    });

    test('handles data lines with quoted values', () => {
      const parseTabular = (parser as any).parseTabular.bind(parser);

      const fields = ['id', 'message'];
      const dataLines = ['1,"Hello, world"', '2,"Line\\nbreak"'];

      const result = parseTabular(fields, dataLines);

      expect(result).toEqual([
        { id: 1, message: 'Hello, world' },
        { id: 2, message: 'Line\nbreak' },
      ]);
    });
  });

  describe('edge cases', () => {
    test('handles lines with only whitespace', () => {
      const toon = 'name: Alice\n\n  \nage: 30';
      const result = parser.parse(toon);

      expect(result).toEqual({
        name: 'Alice',
        age: 30,
      });
    });

    test('handles values with colons in quoted strings', () => {
      const toon = 'url: "http://example.com"';
      const result = parser.parse(toon);

      expect(result).toEqual({
        url: 'http://example.com',
      });
    });

    test('handles empty object values', () => {
      const toon = 'name: Alice\nmiddle: \nlast: Smith';
      const result = parser.parse(toon);

      expect(result).toEqual({
        name: 'Alice',
        middle: undefined,
        last: 'Smith',
      });
    });
  });
});
