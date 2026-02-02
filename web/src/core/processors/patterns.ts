import type { Transaction } from '../types'

/**
 * A common word/phrase found in transaction titles.
 */
export interface TitlePattern {
  pattern: string           // The word or phrase
  matchCount: number        // How many transactions match
  totalAmount: number       // Total amount of matching transactions
  exampleTitles: string[]   // Up to 3 example titles
}

/**
 * Words to ignore when extracting patterns (common, non-descriptive words).
 */
const STOP_WORDS = new Set([
  // Articles and prepositions
  'a', 'an', 'the', 'of', 'to', 'in', 'for', 'on', 'at', 'by', 'from', 'with',
  // Common transaction words
  'oy', 'ab', 'ltd', 'inc', 'co', 'fi', 'helsinki', 'espoo', 'vantaa',
  // Numbers and dates
  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
  // Nordea-specific
  'korttiosto', 'tilisiirto', 'maksu',
])

/**
 * Minimum word length to consider as a pattern.
 */
const MIN_WORD_LENGTH = 3

/**
 * Extract common words from expense transaction titles.
 * Returns patterns sorted by total amount (highest first).
 */
export function extractTitlePatterns(transactions: Transaction[]): TitlePattern[] {
  // Filter to uncategorized expenses only
  const expenses = transactions.filter(t => t.amount < 0 && !t.category)

  // Count word occurrences
  const wordCounts = new Map<string, { count: number; amount: number; titles: Set<string> }>()

  for (const t of expenses) {
    // Extract words from title
    const words = t.title
      .toLowerCase()
      .replace(/[^a-zäöåA-ZÄÖÅ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(w))

    // Count each unique word per transaction
    const uniqueWords = new Set(words)
    for (const word of uniqueWords) {
      const existing = wordCounts.get(word) || { count: 0, amount: 0, titles: new Set() }
      existing.count++
      existing.amount += Math.abs(t.amount)
      existing.titles.add(t.title)
      wordCounts.set(word, existing)
    }
  }

  // Convert to patterns, filter to those appearing in 2+ transactions
  const patterns: TitlePattern[] = []
  for (const [pattern, data] of wordCounts) {
    if (data.count >= 2) {
      patterns.push({
        pattern,
        matchCount: data.count,
        totalAmount: data.amount,
        exampleTitles: Array.from(data.titles).slice(0, 3),
      })
    }
  }

  // Sort by total amount descending
  patterns.sort((a, b) => b.totalAmount - a.totalAmount)

  return patterns.slice(0, 30) // Return top 30 patterns
}

/**
 * Find transactions whose title contains a pattern (case-insensitive).
 */
export function findMatchingTransactions(
  transactions: Transaction[],
  pattern: string
): Transaction[] {
  const lowerPattern = pattern.toLowerCase()
  return transactions.filter(t =>
    t.amount < 0 &&
    !t.category &&
    t.title.toLowerCase().includes(lowerPattern)
  )
}
