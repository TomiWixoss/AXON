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

    // Primitive serialization tests will be added in subsequent tasks
    // For now, serialize only handles primitives
  });

  describe('Primitive Serialization (Task 2.2)', () => {
    let serializer: TOONSerializer;

    beforeEach(() => {
      serializer = new TOONSerializer();
    });

    describe('Numbers', () => {
      test('serializes positive integers', () => {
        expect(serializer.serialize(42)).toBe('42');
        expect(serializer.serialize(0)).toBe('0');
        expect(serializer.serialize(999999)).toBe('999999');
      });

      test('serializes negative integers', () => {
        expect(serializer.serialize(-42)).toBe('-42');
        expect(serializer.serialize(-1)).toBe('-1');
      });

      test('serializes floating point numbers', () => {
        expect(serializer.serialize(3.14)).toBe('3.14');
        expect(serializer.serialize(-2.5)).toBe('-2.5');
        expect(serializer.serialize(0.001)).toBe('0.001');
      });

      test('serializes special numeric values', () => {
        expect(serializer.serialize(NaN)).toBe('NaN');
        expect(serializer.serialize(Infinity)).toBe('Infinity');
        expect(serializer.serialize(-Infinity)).toBe('-Infinity');
      });

      test('serializes scientific notation', () => {
        expect(serializer.serialize(1e10)).toBe('10000000000');
        expect(serializer.serialize(1.5e-5)).toBe('0.000015');
      });
    });

    describe('Booleans', () => {
      test('serializes true', () => {
        expect(serializer.serialize(true)).toBe('true');
      });

      test('serializes false', () => {
        expect(serializer.serialize(false)).toBe('false');
      });
    });

    describe('Null and Undefined', () => {
      test('serializes null with omitNullValues=true (default)', () => {
        const serializer = new TOONSerializer({ omitNullValues: true });
        expect(serializer.serialize(null)).toBe('');
      });

      test('serializes null with omitNullValues=false', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        expect(serializer.serialize(null)).toBe('null');
      });

      test('serializes undefined with omitNullValues=true (default)', () => {
        const serializer = new TOONSerializer({ omitNullValues: true });
        expect(serializer.serialize(undefined)).toBe('');
      });

      test('serializes undefined with omitNullValues=false', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        expect(serializer.serialize(undefined)).toBe('undefined');
      });
    });

    describe('Strings - No Quoting Needed', () => {
      test('serializes simple strings without quotes', () => {
        expect(serializer.serialize('hello')).toBe('hello');
        expect(serializer.serialize('world')).toBe('world');
        expect(serializer.serialize('user_name')).toBe('user_name');
      });

      test('serializes strings with underscores and hyphens', () => {
        expect(serializer.serialize('hello_world')).toBe('hello_world');
        expect(serializer.serialize('hello-world')).toBe('hello-world');
      });

      test('serializes strings with letters and numbers (not starting with digit)', () => {
        expect(serializer.serialize('user123')).toBe('user123');
        expect(serializer.serialize('abc123def')).toBe('abc123def');
      });
    });

    describe('Strings - Quoting Required', () => {
      test('quotes empty strings', () => {
        expect(serializer.serialize('')).toBe('""');
      });

      test('quotes strings with leading whitespace', () => {
        expect(serializer.serialize(' hello')).toBe('" hello"');
        expect(serializer.serialize('\thello')).toBe('"\\thello"');
      });

      test('quotes strings with trailing whitespace', () => {
        expect(serializer.serialize('hello ')).toBe('"hello "');
        expect(serializer.serialize('hello\t')).toBe('"hello\\t"');
      });

      test('quotes strings starting with digits', () => {
        expect(serializer.serialize('123abc')).toBe('"123abc"');
        expect(serializer.serialize('42')).toBe('"42"');
        expect(serializer.serialize('3.14')).toBe('"3.14"');
      });

      test('quotes strings containing delimiter (comma by default)', () => {
        expect(serializer.serialize('hello, world')).toBe('"hello, world"');
        expect(serializer.serialize('a,b,c')).toBe('"a,b,c"');
      });

      test('quotes strings containing delimiter (tab)', () => {
        const tabSerializer = new TOONSerializer({ delimiter: '\t' });
        expect(tabSerializer.serialize('hello\tworld')).toBe('"hello\\tworld"');
      });

      test('quotes strings containing delimiter (pipe)', () => {
        const pipeSerializer = new TOONSerializer({ delimiter: '|' });
        expect(pipeSerializer.serialize('hello|world')).toBe('"hello|world"');
      });

      test('quotes strings containing newlines', () => {
        expect(serializer.serialize('hello\nworld')).toBe('"hello\\nworld"');
        expect(serializer.serialize('line1\r\nline2')).toBe('"line1\\r\\nline2"');
      });

      test('quotes strings containing quote characters', () => {
        expect(serializer.serialize('hello "world"')).toBe('"hello \\"world\\""');
        expect(serializer.serialize("it's")).toBe('"it\'s"');
      });

      test('quotes strings containing TOON special characters', () => {
        expect(serializer.serialize('key: value')).toBe('"key: value"');
        expect(serializer.serialize('array[0]')).toBe('"array[0]"');
        expect(serializer.serialize('obj{key}')).toBe('"obj{key}"');
      });

      test('quotes reserved keywords', () => {
        expect(serializer.serialize('null')).toBe('"null"');
        expect(serializer.serialize('undefined')).toBe('"undefined"');
        expect(serializer.serialize('true')).toBe('"true"');
        expect(serializer.serialize('false')).toBe('"false"');
        expect(serializer.serialize('NaN')).toBe('"NaN"');
        expect(serializer.serialize('Infinity')).toBe('"Infinity"');
        expect(serializer.serialize('-Infinity')).toBe('"-Infinity"');
      });

      test('escapes backslashes in quoted strings', () => {
        expect(serializer.serialize('C:\\path\\to\\file')).toBe('"C:\\\\path\\\\to\\\\file"');
      });

      test('escapes both quotes and backslashes', () => {
        expect(serializer.serialize('say "hello\\"')).toBe('"say \\"hello\\\\\\""');
      });
    });

    describe('Edge Cases', () => {
      test('handles very long strings', () => {
        const longString = 'a'.repeat(10000);
        expect(serializer.serialize(longString)).toBe(longString);
      });

      test('handles strings with mixed special characters', () => {
        expect(serializer.serialize('hello, "world"\n{test}')).toBe('"hello, \\"world\\"\\n{test}"');
      });

      test('handles zero', () => {
        expect(serializer.serialize(0)).toBe('0');
        expect(serializer.serialize(-0)).toBe('0');
      });

      test('handles very small numbers', () => {
        expect(serializer.serialize(Number.MIN_VALUE)).toBe(String(Number.MIN_VALUE));
      });

      test('handles very large numbers', () => {
        expect(serializer.serialize(Number.MAX_VALUE)).toBe(String(Number.MAX_VALUE));
      });
    });
  });

  describe('Object Serialization (Task 2.3)', () => {
    let serializer: TOONSerializer;

    beforeEach(() => {
      serializer = new TOONSerializer();
    });

    describe('Simple Objects', () => {
      test('serializes simple object with string and number', () => {
        const obj = { name: 'Alice', age: 30 };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nage: 30');
      });

      test('serializes object with boolean values', () => {
        const obj = { active: true, verified: false };
        const result = serializer.serialize(obj);
        expect(result).toBe('active: true\nverified: false');
      });

      test('serializes empty object', () => {
        const obj = {};
        const result = serializer.serialize(obj);
        expect(result).toBe('');
      });

      test('serializes object with single property', () => {
        const obj = { name: 'Alice' };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice');
      });

      test('serializes object with multiple property types', () => {
        const obj = { name: 'Alice', age: 30, active: true };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nage: 30\nactive: true');
      });
    });

    describe('Nested Objects', () => {
      test('serializes nested object with indentation', () => {
        const obj = {
          user: {
            name: 'Alice',
            age: 30
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  name: Alice\n  age: 30');
      });

      test('serializes deeply nested objects', () => {
        const obj = {
          user: {
            profile: {
              name: 'Alice',
              age: 30
            }
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  profile:\n    name: Alice\n    age: 30');
      });

      test('serializes object with mixed nested and flat properties', () => {
        const obj = {
          id: 123,
          user: {
            name: 'Alice',
            age: 30
          },
          active: true
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('id: 123\nuser:\n  name: Alice\n  age: 30\nactive: true');
      });

      test('serializes multiple nested objects', () => {
        const obj = {
          user: {
            name: 'Alice'
          },
          settings: {
            theme: 'dark'
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  name: Alice\nsettings:\n  theme: dark');
      });
    });

    describe('Null Value Omission', () => {
      test('omits null values when omitNullValues=true (default)', () => {
        const obj = { name: 'Alice', age: null, active: true };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nactive: true');
      });

      test('omits undefined values when omitNullValues=true (default)', () => {
        const obj = { name: 'Alice', age: undefined, active: true };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nactive: true');
      });

      test('includes null values when omitNullValues=false', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        const obj = { name: 'Alice', age: null, active: true };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nage: null\nactive: true');
      });

      test('includes undefined values when omitNullValues=false', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        const obj = { name: 'Alice', age: undefined, active: true };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nage: undefined\nactive: true');
      });

      test('omits null values in nested objects', () => {
        const obj = {
          user: {
            name: 'Alice',
            age: null,
            email: 'alice@example.com'
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  name: Alice\n  email: alice@example.com');
      });
    });

    describe('Field Aliasing', () => {
      test('applies field aliases to top-level properties', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { timestamp: 'ts', message: 'msg' }
        });
        const obj = { timestamp: 1234567890, message: 'Hello' };
        const result = serializer.serialize(obj);
        expect(result).toBe('ts: 1234567890\nmsg: Hello');
      });

      test('applies field aliases to nested properties', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { timestamp: 'ts', message: 'msg', name: 'n' }
        });
        const obj = {
          timestamp: 1234567890,
          user: {
            name: 'Alice'
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('ts: 1234567890\nuser:\n  n: Alice');
      });

      test('leaves unaliased fields unchanged', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { timestamp: 'ts' }
        });
        const obj = { timestamp: 1234567890, message: 'Hello' };
        const result = serializer.serialize(obj);
        expect(result).toBe('ts: 1234567890\nmessage: Hello');
      });

      test('handles empty fieldAliases', () => {
        const serializer = new TOONSerializer({ fieldAliases: {} });
        const obj = { name: 'Alice', age: 30 };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: Alice\nage: 30');
      });
    });

    describe('Max Depth Protection', () => {
      test('stops at maxDepth and returns placeholder', () => {
        const serializer = new TOONSerializer({ maxDepth: 2 });
        const obj = {
          level1: {
            level2: {
              level3: {
                level4: 'too deep'
              }
            }
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('[max depth exceeded]');
      });

      test('serializes up to maxDepth correctly', () => {
        const serializer = new TOONSerializer({ maxDepth: 2 });
        const obj = {
          level1: {
            level2: {
              name: 'Alice'
            }
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('level1:\n  level2:\n    name: Alice');
      });

      test('handles maxDepth=1', () => {
        const serializer = new TOONSerializer({ maxDepth: 1 });
        const obj = {
          user: {
            name: 'Alice'
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  name: Alice');
      });

      test('exceeds maxDepth=1 with deeper nesting', () => {
        const serializer = new TOONSerializer({ maxDepth: 1 });
        const obj = {
          user: {
            profile: {
              name: 'Alice'
            }
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('[max depth exceeded]');
      });
    });

    describe('Special Characters in Keys and Values', () => {
      test('handles keys with special characters', () => {
        const obj = { 'user-name': 'Alice', 'user_id': 123 };
        const result = serializer.serialize(obj);
        expect(result).toBe('user-name: Alice\nuser_id: 123');
      });

      test('handles values requiring quotes', () => {
        const obj = { name: 'Alice, Bob', message: 'Hello\nWorld' };
        const result = serializer.serialize(obj);
        expect(result).toBe('name: "Alice, Bob"\nmessage: "Hello\\nWorld"');
      });

      test('handles nested objects with quoted values', () => {
        const obj = {
          user: {
            name: 'Alice, Bob',
            bio: 'Hello: World'
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toBe('user:\n  name: "Alice, Bob"\n  bio: "Hello: World"');
      });
    });

    describe('Edge Cases', () => {
      test('handles object with all null values (omitNullValues=true)', () => {
        const obj = { a: null, b: null, c: null };
        const result = serializer.serialize(obj);
        expect(result).toBe('');
      });

      test('handles object with numeric keys', () => {
        const obj = { '0': 'zero', '1': 'one', '2': 'two' };
        const result = serializer.serialize(obj);
        expect(result).toBe('0: zero\n1: one\n2: two');
      });

      test('handles object with empty string key', () => {
        const obj = { '': 'empty key', name: 'Alice' };
        const result = serializer.serialize(obj);
        expect(result).toContain('name: Alice');
      });

      test('handles object with many properties', () => {
        const obj: Record<string, number> = {};
        for (let i = 0; i < 100; i++) {
          obj[`key${i}`] = i;
        }
        const result = serializer.serialize(obj);
        const lines = result.split('\n');
        expect(lines.length).toBe(100);
      });
    });
  });

  describe('Array Serialization (Task 2.4)', () => {
    let serializer: TOONSerializer;

    beforeEach(() => {
      serializer = new TOONSerializer();
    });

    describe('Empty Arrays', () => {
      test('serializes empty array', () => {
        const arr: any[] = [];
        const result = serializer.serialize(arr);
        expect(result).toBe('[0]: ');
      });
    });

    describe('Non-Uniform Arrays (Mixed Types)', () => {
      test('serializes array of primitives', () => {
        const arr = ['apple', 42, true];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: apple, 42, true');
      });

      test('serializes array of strings', () => {
        const arr = ['apple', 'banana', 'cherry'];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: apple, banana, cherry');
      });

      test('serializes array of numbers', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = serializer.serialize(arr);
        expect(result).toBe('[5]: 1, 2, 3, 4, 5');
      });

      test('serializes array with null values', () => {
        const arr = ['apple', null, 'cherry'];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: apple, , cherry');
      });

      test('serializes array with quoted strings', () => {
        const arr = ['hello, world', 'simple', '123abc'];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: "hello, world", simple, "123abc"');
      });

      test('serializes single element array', () => {
        const arr = ['single'];
        const result = serializer.serialize(arr);
        expect(result).toBe('[1]: single');
      });

      test('serializes array with mixed types including nested objects', () => {
        const arr = ['text', 42, { name: 'Alice' }];
        const result = serializer.serialize(arr);
        // Nested objects in non-uniform arrays are serialized inline
        expect(result).toContain('[3]:');
        expect(result).toContain('text');
        expect(result).toContain('42');
      });
    });

    describe('Uniform Arrays (Tabular Format)', () => {
      test('serializes uniform array of objects', () => {
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id,name}:\n1,Alice\n2,Bob');
      });

      test('serializes uniform array with single object', () => {
        const arr = [{ id: 1, name: 'Alice' }];
        const result = serializer.serialize(arr);
        expect(result).toBe('[1]{id,name}:\n1,Alice');
      });

      test('serializes uniform array with multiple fields', () => {
        const arr = [
          { id: 1, name: 'Alice', age: 30, active: true },
          { id: 2, name: 'Bob', age: 25, active: false }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id,name,age,active}:\n1,Alice,30,true\n2,Bob,25,false');
      });

      test('serializes uniform array with numeric values', () => {
        const arr = [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 5, y: 6 }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]{x,y}:\n1,2\n3,4\n5,6');
      });

      test('serializes uniform array with quoted string values', () => {
        const arr = [
          { id: 1, name: 'Alice, Smith' },
          { id: 2, name: 'Bob Jones' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id,name}:\n1,"Alice, Smith"\n2,Bob Jones');
      });

      test('serializes uniform array with null values (omitNullValues=false)', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: null }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id,name}:\n1,Alice\n2,null');
      });

      test('serializes uniform array with empty string values', () => {
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: '' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id,name}:\n1,Alice\n2,""');
      });

      test('includes array length in schema declaration', () => {
        const arr = [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 }
        ];
        const result = serializer.serialize(arr);
        expect(result).toContain('[5]{id}:');
      });
    });

    describe('Uniform Array Detection', () => {
      test('detects uniform array of objects with same keys', () => {
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toContain('{id,name}:');
      });

      test('detects non-uniform array with different keys', () => {
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, email: 'bob@example.com' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toContain('[2]:');
        expect(result).not.toContain('{');
      });

      test('detects non-uniform array with different number of keys', () => {
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2 }
        ];
        const result = serializer.serialize(arr);
        expect(result).toContain('[2]:');
        expect(result).not.toContain('{');
      });

      test('treats array of primitives as non-uniform', () => {
        const arr = [1, 2, 3];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: 1, 2, 3');
      });

      test('treats array with mixed objects and primitives as non-uniform', () => {
        const arr = [{ id: 1 }, 'text', 42];
        const result = serializer.serialize(arr);
        expect(result).toContain('[3]:');
        expect(result).not.toContain('{');
      });

      test('treats array containing arrays as non-uniform', () => {
        const arr = [[1, 2], [3, 4]];
        const result = serializer.serialize(arr);
        expect(result).toContain('[2]:');
        expect(result).not.toContain('{id');
      });

      test('treats array with null as non-uniform', () => {
        const arr = [{ id: 1 }, null, { id: 2 }];
        const result = serializer.serialize(arr);
        expect(result).toContain('[3]:');
        expect(result).not.toContain('{');
      });
    });

    describe('Field Aliasing in Arrays', () => {
      test('applies field aliases to tabular array schema', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { timestamp: 'ts', message: 'msg' }
        });
        const arr = [
          { timestamp: 1000, message: 'Hello' },
          { timestamp: 2000, message: 'World' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{ts,msg}:\n1000,Hello\n2000,World');
      });

      test('applies partial field aliases', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { id: 'i' }
        });
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{i,name}:\n1,Alice\n2,Bob');
      });
    });

    describe('Delimiter Configuration in Arrays', () => {
      test('uses tab delimiter in tabular arrays', () => {
        const serializer = new TOONSerializer({ delimiter: '\t' });
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id\tname}:\n1\tAlice\n2\tBob');
      });

      test('uses pipe delimiter in tabular arrays', () => {
        const serializer = new TOONSerializer({ delimiter: '|' });
        const arr = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{id|name}:\n1|Alice\n2|Bob');
      });

      test('uses comma delimiter in non-uniform arrays (default)', () => {
        const arr = [1, 2, 3];
        const result = serializer.serialize(arr);
        expect(result).toBe('[3]: 1, 2, 3');
      });
    });

    describe('Nested Arrays', () => {
      test('serializes array within object', () => {
        const obj = {
          name: 'Alice',
          scores: [90, 85, 95]
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('name: Alice');
        expect(result).toContain('scores: [3]: 90, 85, 95');
      });

      test('serializes uniform array within object', () => {
        const obj = {
          name: 'Alice',
          items: [
            { id: 1, value: 'a' },
            { id: 2, value: 'b' }
          ]
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('name: Alice');
        expect(result).toContain('items: [2]{id,value}:');
      });

      test('serializes nested arrays', () => {
        const arr = [[1, 2], [3, 4], [5, 6]];
        const result = serializer.serialize(arr);
        expect(result).toContain('[3]:');
      });
    });

    describe('Edge Cases', () => {
      test('handles large uniform array', () => {
        const arr = [];
        for (let i = 0; i < 100; i++) {
          arr.push({ id: i, value: `item${i}` });
        }
        const result = serializer.serialize(arr);
        expect(result).toContain('[100]{id,value}:');
        const lines = result.split('\n');
        expect(lines.length).toBe(101); // 1 schema line + 100 data lines
      });

      test('handles uniform array with special characters in values', () => {
        const arr = [
          { id: 1, desc: 'Hello, World' },
          { id: 2, desc: 'Line\nBreak' }
        ];
        const result = serializer.serialize(arr);
        expect(result).toContain('"Hello, World"');
        expect(result).toContain('"Line\\nBreak"');
      });

      test('handles uniform array with boolean and number mix', () => {
        const arr = [
          { active: true, count: 5 },
          { active: false, count: 0 }
        ];
        const result = serializer.serialize(arr);
        expect(result).toBe('[2]{active,count}:\ntrue,5\nfalse,0');
      });

      test('handles array with objects having keys in different order', () => {
        const arr = [
          { name: 'Alice', id: 1 },
          { id: 2, name: 'Bob' }
        ];
        const result = serializer.serialize(arr);
        // Should still be detected as uniform (keys are sorted for comparison)
        expect(result).toContain('{');
      });

      test('handles very long array length', () => {
        const arr = new Array(10000).fill(0).map((_, i) => i);
        const result = serializer.serialize(arr);
        expect(result).toContain('[10000]:');
      });
    });
  });

  describe('Circular Reference Detection (Task 2.5)', () => {
    let serializer: TOONSerializer;

    beforeEach(() => {
      serializer = new TOONSerializer();
    });

    describe('Simple Circular References', () => {
      test('detects self-referencing object', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice' };
        obj.self = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: Alice');
      });

      test('detects circular reference with path', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', data: {} };
        obj.data.parent = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: Alice');
      });

      test('detects circular reference in nested object', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {
          level1: {
            level2: {
              name: 'test'
            }
          }
        };
        obj.level1.level2.back = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: test');
      });

      test('shows correct path in circular reference notation', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', child: {} };
        obj.child.parent = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular: child.parent]');
      });

      test('detects circular reference at root level', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Root' };
        obj.circular = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular: circular]');
      });
    });

    describe('Circular References in Arrays', () => {
      test('detects circular reference in array element', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', items: [] };
        obj.items.push(obj);
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: Alice');
      });

      test('detects circular reference in non-uniform array', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice' };
        const arr = ['text', 42, obj];
        obj.arr = arr;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
      });

      test('shows correct path for circular reference in array', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', list: [] };
        obj.list.push(obj);
        const result = serializer.serialize(obj);
        // When serializing a tabular array, the circular reference is detected
        // when trying to serialize the 'list' field of the object at index 0
        expect(result).toContain('[Circular: list.[0].list]');
      });

      test('detects self-referencing array', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = [1, 2, 3];
        arr.push(arr);
        const result = serializer.serialize(arr);
        expect(result).toContain('[Circular:');
      });
    });

    describe('Complex Circular References', () => {
      test('detects circular reference in deeply nested structure', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {
          a: {
            b: {
              c: {
                d: {}
              }
            }
          }
        };
        obj.a.b.c.d.root = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
      });

      test('detects multiple circular references', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Root' };
        const child1: any = { name: 'Child1' };
        const child2: any = { name: 'Child2' };
        
        obj.child1 = child1;
        obj.child2 = child2;
        child1.parent = obj;
        child2.parent = obj;
        
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: Root');
      });

      test('detects circular reference with intermediate objects', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = { name: 'A' };
        const b: any = { name: 'B' };
        const c: any = { name: 'C' };
        
        a.next = b;
        b.next = c;
        c.next = a; // Creates cycle: a -> b -> c -> a
        
        const result = serializer.serialize(a);
        expect(result).toContain('[Circular:');
      });

      test('handles circular reference with field aliasing', () => {
        const serializer = new TOONSerializer({
          fieldAliases: { parent: 'p', child: 'c' }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', child: {} };
        obj.child.parent = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('c.p]'); // Should use aliased names in path
      });
    });

    describe('Non-Circular Shared References', () => {
      test('allows same object in different branches (not circular)', () => {
        const shared = { value: 42 };
        const obj = {
          branch1: shared,
          branch2: shared
        };
        const result = serializer.serialize(obj);
        // Should serialize successfully without circular reference error
        expect(result).toContain('value: 42');
        expect(result).not.toContain('[Circular:');
      });

      test('allows same object at different depths', () => {
        const shared = { id: 123 };
        const obj = {
          top: shared,
          nested: {
            bottom: shared
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('id: 123');
        expect(result).not.toContain('[Circular:');
      });

      test('allows same array in different branches', () => {
        const sharedArray = [1, 2, 3];
        const obj = {
          first: sharedArray,
          second: sharedArray
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('[3]: 1, 2, 3');
        expect(result).not.toContain('[Circular:');
      });
    });

    describe('Circular References with Max Depth', () => {
      test('detects circular reference before hitting max depth', () => {
        const serializer = new TOONSerializer({ maxDepth: 10 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice' };
        obj.self = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).not.toContain('[max depth exceeded]');
      });

      test('circular reference takes precedence over max depth', () => {
        const serializer = new TOONSerializer({ maxDepth: 2 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { level1: { level2: {} } };
        obj.level1.level2.circular = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
      });

      test('max depth still applies to non-circular deep structures', () => {
        const serializer = new TOONSerializer({ maxDepth: 2 });
        const obj = {
          level1: {
            level2: {
              level3: {
                level4: 'too deep'
              }
            }
          }
        };
        const result = serializer.serialize(obj);
        expect(result).toContain('[max depth exceeded]');
        expect(result).not.toContain('[Circular:');
      });
    });

    describe('Edge Cases', () => {
      test('handles empty object with circular reference', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {};
        obj.self = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
      });

      test('handles circular reference with null values', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', value: null };
        obj.circular = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('name: Alice');
      });

      test('handles circular reference with omitNullValues=false', () => {
        const serializer = new TOONSerializer({ omitNullValues: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Alice', value: null };
        obj.circular = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('value: null');
      });

      test('handles immediate circular reference (first property)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {};
        obj.circular = obj;
        obj.name = 'Alice';
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
      });

      test('handles circular reference in object with many properties', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {
          prop1: 'value1',
          prop2: 'value2',
          prop3: 'value3',
          prop4: 'value4',
          prop5: 'value5'
        };
        obj.circular = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('prop1: value1');
      });
    });

    describe('Circular Reference Path Accuracy', () => {
      test('shows root path for direct self-reference', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { name: 'Root' };
        obj.self = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular: self]');
      });

      test('shows nested path for deep circular reference', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { a: { b: { c: {} } } };
        obj.a.b.c.back = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular: a.b.c.back]');
      });

      test('shows array index in path', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { items: [null, null, null] };
        obj.items[1] = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular: items.[1]]');
      });

      test('shows mixed object and array path', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { data: { list: [{ nested: {} }] } };
        obj.data.list[0].nested.root = obj;
        const result = serializer.serialize(obj);
        expect(result).toContain('[Circular:');
        expect(result).toContain('data.list.[0]');
      });
    });
  });
});
