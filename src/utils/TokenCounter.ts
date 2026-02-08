/**
 * TokenCounter - Utility for counting tokens in text
 * 
 * Provides token counting functionality for measuring log efficiency.
 * Uses whitespace-based tokenization with a 1.3x multiplier to approximate
 * subword tokenization used by language models.
 * 
 * **Validates: Requirements 6.6, 12.5**
 */
export class TokenCounter {
  /**
   * Count tokens in the given text
   * 
   * Uses a simple whitespace-based tokenization as an approximation,
   * with a 1.3x multiplier to account for subword tokens that LLMs use.
   * 
   * Formula: tokens ≈ text.split(/\s+/).length * 1.3
   * 
   * @param text - The text to count tokens in
   * @returns The approximate number of tokens
   * 
   * @example
   * ```typescript
   * const counter = new TokenCounter();
   * const count = counter.countTokens("Hello world");
   * // Returns approximately 2.6 (2 words * 1.3)
   * ```
   */
  countTokens(text: string): number {
    // Handle empty or whitespace-only strings
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Split by whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    // Apply 1.3x multiplier to account for subword tokenization
    return Math.round(words.length * 1.3);
  }
}
