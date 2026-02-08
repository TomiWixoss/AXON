/**
 * Unit tests for TOONSerializer
 *
 * Tests configuration interface, validation, and basic functionality
 */

import { TOONSerializer, TOONSerializerConfig } from '../../src/serializer';

describe('TOONSerializer', () => {
  describe('Constructor and Configuration', () => {
    test('creates instance with default configuration', () => {
      const serializer = new TOONSerializer();
      const config = serializer.getConfig();

      expect(config.delimiter).toBe(',');
      expect(config.omitNullValues).toBe(true);
      expect(config.fieldAliases).toEqual({});
      expect(config.maxDepth).toBe(10);
    });

    test('creates instance with custom configuration', () => {
      const customConfig: Partial<TOONSerializerConfig> = {
        delimiter: '\t',
        omitNullValues: false,
        fieldAliases: { timestamp: 'ts', message: 'msg' },
        maxDepth: 5,
      };

      const serializer = new TOONSerializer(customConfig);
      const config = serializer.getConfig();

      expect(config.delimiter).toBe('\t');
      expect(config.omitNullValues).toBe(false);
      expect(config.fieldAliases).toEqual({ timestamp: 'ts', message: 'msg' });
      expect(config.maxDepth).toBe(5);
    });

    test('merges partial configuration with defaults', () => {
      const partialConfig: Partial<TOONSerializerConfig> = {
        delimiter: '|',
      };

      const serializer = new TOONSerializer(partialConfig);
      const config = serializer.getConfig();

      expect(config.delimiter).toBe('|');
      expect(config.omitNullValues).toBe(true); // default
      expect(config.fieldAliases).toEqual({}); // default
      expect(config.maxDepth).toBe(10); // default
    });

    test('returns immutable config copy', () => {
      const serializer = new TOONSerializer();
      const config1 = serializer.getConfig();
      const config2 = serializer.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same values
    });
  });

  describe('Configuration Validation', () => {
    test('throws error for invalid delimiter', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ delimiter: ';' as any });
      }).toThrow('Invalid delimiter');
    });

    test('throws error for invalid maxDepth (negative)', () => {
      expect(() => {
        new TOONSerializer({ maxDepth: -1 });
      }).toThrow('Invalid maxDepth');
    });

    test('throws error for invalid maxDepth (zero)', () => {
      expect(() => {
        new TOONSerializer({ maxDepth: 0 });
      }).toThrow('Invalid maxDepth');
    });

    test('throws error for invalid maxDepth (non-number)', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ maxDepth: 'invalid' as any });
      }).toThrow('Invalid maxDepth');
    });

    test('throws error for invalid omitNullValues', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ omitNullValues: 'true' as any });
      }).toThrow('Invalid omitNullValues');
    });

    test('throws error for invalid fieldAliases (null)', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ fieldAliases: null as any });
      }).toThrow('Invalid fieldAliases');
    });

    test('throws error for invalid fieldAliases (non-object)', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ fieldAliases: 'invalid' as any });
      }).toThrow('Invalid fieldAliases');
    });

    test('throws error for invalid alias value (non-string)', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        new TOONSerializer({ fieldAliases: { timestamp: 123 as any } });
      }).toThrow('Invalid alias for field "timestamp"');
    });

    test('accepts valid comma delimiter', () => {
      expect(() => {
        new TOONSerializer({ delimiter: ',' });
      }).not.toThrow();
    });

    test('accepts valid tab delimiter', () => {
      expect(() => {
        new TOONSerializer({ delimiter: '\t' });
      }).not.toThrow();
    });

    test('accepts valid pipe delimiter', () => {
      expect(() => {
        new TOONSerializer({ delimiter: '|' });
      }).not.toThrow();
    });

    test('accepts valid maxDepth', () => {
      expect(() => {
        new TOONSerializer({ maxDepth: 1 });
      }).not.toThrow();

      expect(() => {
        new TOONSerializer({ maxDepth: 100 });
      }).not.toThrow();
    });

    test('accepts empty fieldAliases', () => {
      expect(() => {
        new TOONSerializer({ fieldAliases: {} });
      }).not.toThrow();
    });

    test('accepts valid fieldAliases', () => {
      expect(() => {
        new TOONSerializer({
          fieldAliases: {
            timestamp: 'ts',
            message: 'msg',
            level: 'lvl',
          },
        });
      }).not.toThrow();
    });
  });

  describe('serialize method', () => {
    test('serialize method exists and returns string', () => {
      const serializer = new TOONSerializer();
      const result = serializer.serialize({ test: 'value' });

      expect(typeof result).toBe('string');
    });

    test('serialize stub returns placeholder', () => {
      const serializer = new TOONSerializer();
      const result = serializer.serialize({ test: 'value' });

      // This is a stub implementation, so it should return a placeholder
      expect(result).toBe('[Not yet implemented]');
    });
  });
});
