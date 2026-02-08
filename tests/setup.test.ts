/**
 * Basic setup test to verify Jest and fast-check are working correctly
 */

import fc from 'fast-check';

describe('Project Setup', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });

  test('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });

  test('TypeScript types are working', () => {
    const obj: { name: string; age: number } = {
      name: 'test',
      age: 42,
    };
    expect(obj.name).toBe('test');
    expect(obj.age).toBe(42);
  });
});
