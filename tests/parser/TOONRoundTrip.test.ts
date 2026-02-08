/**
 * Round-trip tests for TOON Serializer and Parser
 *
 * Tests that serializing and then parsing produces equivalent data structures.
 * Validates: Requirements 1.1, 13.1, 13.2, 13.4
 */

import { TOONSerializer } from '../../src/serializer/TOONSerializer';
import { TOONParser } from '../../src/parser/TOONParser';

describe('TOON Round-Trip', () => {
  let serializer: TOONSerializer;
  let parser: TOONParser;

  beforeEach(() => {
    serializer = new TOONSerializer();
    parser = new TOONParser();
  });

  describe('primitives', () => {
    test('round-trips numbers', () => {
      const values = [42, -17, 3.14, 0, NaN, Infinity, -Infinity];

      for (const value of values) {
        const toon = serializer.serialize(value);
        const parsed = parser.parse(toon);

        if (Number.isNaN(value)) {
          expect(parsed).toBeNaN();
        } else {
          expect(parsed).toBe(value);
        }
      }

      // Special case for -0 (JavaScript quirk: -0 === 0 but Object.is(-0, 0) is false)
      const negZeroToon = serializer.serialize(-0);
      const negZeroParsed = parser.parse(negZeroToon);
      expect(negZeroParsed).toBe(0); // -0 serializes as "0" and parses back as 0
    });

    test('round-trips booleans', () => {
      const values = [true, false];

      for (const value of values) {
        const toon = serializer.serialize(value);
        const parsed = parser.parse(toon);
        expect(parsed).toBe(value);
      }
    });

    test('round-trips null', () => {
      // With omitNullValues: false
      const serializerWithNull = new TOONSerializer({ omitNullValues: false });
      const toon = serializerWithNull.serialize(null);
      const parsed = parser.parse(toon);
      expect(parsed).toBe(null);
    });

    test('round-trips strings', () => {
      const values = [
        'hello',
        'user_name',
        'hello, world',
        'line\nbreak',
        'tab\there',
        'quote"here',
        'back\\slash',
        'http://example.com',
        '123abc',
        '',
      ];

      for (const value of values) {
        const toon = serializer.serialize(value);
        const parsed = parser.parse(toon);
        expect(parsed).toBe(value);
      }
    });
  });

  describe('simple objects', () => {
    test('round-trips simple object', () => {
      const obj = {
        name: 'Alice',
        age: 30,
        active: true,
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips object with various types', () => {
      const obj = {
        name: 'Alice',
        age: 30,
        score: 3.14,
        active: true,
        inactive: false,
        count: 0,
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips object with quoted strings', () => {
      const obj = {
        name: 'Alice Smith',
        message: 'Hello, world',
        url: 'http://example.com',
        multiline: 'line\nbreak',
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });
  });

  describe('nested objects', () => {
    test('round-trips nested object', () => {
      const obj = {
        user: {
          name: 'Alice',
          age: 30,
        },
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips deeply nested object', () => {
      const obj = {
        user: {
          name: 'Alice',
          address: {
            city: 'NYC',
            zip: 10001,
          },
        },
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips object with multiple nested objects', () => {
      const obj = {
        user: {
          name: 'Alice',
          age: 30,
        },
        config: {
          theme: 'dark',
          lang: 'en',
        },
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });
  });

  describe('arrays', () => {
    test('round-trips empty array', () => {
      const arr: any[] = [];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });

    test('round-trips non-uniform array', () => {
      const arr = ['apple', 42, true];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });

    test('round-trips non-uniform array with quoted strings', () => {
      const arr = ['hello, world', 'line\nbreak', 'tab\there'];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });
  });

  describe('tabular arrays', () => {
    test('round-trips simple tabular array', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });

    test('round-trips tabular array with various types', () => {
      const arr = [
        { id: 1, name: 'Alice', age: 28, active: true },
        { id: 2, name: 'Bob', age: 35, active: false },
        { id: 3, name: 'Carol', age: 42, active: true },
      ];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });

    test('round-trips tabular array with quoted strings', () => {
      const arr = [
        { id: 1, name: 'Alice', message: 'Hello, world' },
        { id: 2, name: 'Bob', message: 'Line\nbreak' },
      ];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });

    test('round-trips empty tabular array', () => {
      const arr: any[] = [];

      const toon = serializer.serialize(arr);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(arr);
    });
  });

  describe('complex structures', () => {
    test('round-trips object with nested arrays', () => {
      const obj = {
        name: 'Project',
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips complex nested structure', () => {
      const obj = {
        project: {
          name: 'AXON',
          version: '0.1.0',
          config: {
            logLevel: 'info',
            maxSize: 1024,
          },
        },
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
        ],
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });
  });

  describe('field aliasing', () => {
    test('round-trips with field aliases', () => {
      const serializerWithAliases = new TOONSerializer({
        fieldAliases: {
          timestamp: 'ts',
          message: 'msg',
          level: 'lvl',
        },
      });

      const obj = {
        timestamp: 1705334400000,
        level: 'info',
        message: 'User login',
      };

      const toon = serializerWithAliases.serialize(obj);
      const parsed = parser.parse(toon);

      // Parser should return with aliased keys
      expect(parsed).toEqual({
        ts: 1705334400000,
        lvl: 'info',
        msg: 'User login',
      });
    });
  });

  describe('special cases', () => {
    test('round-trips object with numeric string keys', () => {
      const obj = {
        name: 'Alice',
        age: 30,
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });

    test('round-trips object with special characters in values', () => {
      const obj = {
        url: 'http://example.com:8080/path?query=value',
        json: '{"key": "value"}',
        regex: '/[a-z]+/i',
      };

      const toon = serializer.serialize(obj);
      const parsed = parser.parse(toon);

      expect(parsed).toEqual(obj);
    });
  });
});
