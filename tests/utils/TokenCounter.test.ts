import { TokenCounter } from '../../src/utils/TokenCounter';

describe('TokenCounter', () => {
  let counter: TokenCounter;

  beforeEach(() => {
    counter = new TokenCounter();
  });

  describe('countTokens', () => {
    test('counts tokens in simple text', () => {
      const text = 'Hello world';
      const count = counter.countTokens(text);
      // 2 words * 1.3 = 2.6, rounded to 3
      expect(count).toBe(3);
    });

    test('handles empty string', () => {
      const count = counter.countTokens('');
      expect(count).toBe(0);
    });

    test('handles whitespace-only string', () => {
      const count = counter.countTokens('   \n\t  ');
      expect(count).toBe(0);
    });

    test('handles single word', () => {
      const text = 'Hello';
      const count = counter.countTokens(text);
      // 1 word * 1.3 = 1.3, rounded to 1
      expect(count).toBe(1);
    });

    test('handles multiple spaces between words', () => {
      const text = 'Hello    world    test';
      const count = counter.countTokens(text);
      // 3 words * 1.3 = 3.9, rounded to 4
      expect(count).toBe(4);
    });

    test('handles newlines and tabs', () => {
      const text = 'Hello\nworld\ttest';
      const count = counter.countTokens(text);
      // 3 words * 1.3 = 3.9, rounded to 4
      expect(count).toBe(4);
    });

    test('handles mixed whitespace', () => {
      const text = '  Hello  \n  world  \t  test  ';
      const count = counter.countTokens(text);
      // 3 words * 1.3 = 3.9, rounded to 4
      expect(count).toBe(4);
    });

    test('counts tokens in longer text', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const count = counter.countTokens(text);
      // 9 words * 1.3 = 11.7, rounded to 12
      expect(count).toBe(12);
    });

    test('handles text with punctuation', () => {
      const text = 'Hello, world! How are you?';
      const count = counter.countTokens(text);
      // 5 words * 1.3 = 6.5, rounded to 7
      // Note: punctuation is attached to words in whitespace splitting
      expect(count).toBe(7);
    });

    test('handles TOON-formatted text', () => {
      const toonText = `name: Alice
age: 30
active: true`;
      const count = counter.countTokens(toonText);
      // 6 words * 1.3 = 7.8, rounded to 8
      expect(count).toBe(8);
    });

    test('handles JSON-formatted text', () => {
      const jsonText = '{"name":"Alice","age":30,"active":true}';
      const count = counter.countTokens(jsonText);
      // 1 word (no spaces) * 1.3 = 1.3, rounded to 1
      expect(count).toBe(1);
    });

    test('handles tabular TOON format', () => {
      const toonText = `users[2]{id,name,age}:
1,Alice,28
2,Bob,35`;
      const count = counter.countTokens(toonText);
      // 3 lines with words: "users[2]{id,name,age}:", "1,Alice,28", "2,Bob,35"
      // 3 words * 1.3 = 3.9, rounded to 4
      expect(count).toBe(4);
    });

    test('applies 1.3x multiplier correctly', () => {
      // Test with exactly 10 words to verify multiplier
      const text = 'one two three four five six seven eight nine ten';
      const count = counter.countTokens(text);
      // 10 words * 1.3 = 13
      expect(count).toBe(13);
    });

    test('rounds to nearest integer', () => {
      // Test rounding behavior
      const text1 = 'a b'; // 2 * 1.3 = 2.6 -> 3
      expect(counter.countTokens(text1)).toBe(3);

      const text2 = 'a'; // 1 * 1.3 = 1.3 -> 1
      expect(counter.countTokens(text2)).toBe(1);

      const text3 = 'a b c d'; // 4 * 1.3 = 5.2 -> 5
      expect(counter.countTokens(text3)).toBe(5);
    });
  });
});
