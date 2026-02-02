import type { Transaction } from '../types'
import type { CategoryMapping } from '../types/category'

/**
 * A suggested title for categorization, with stats.
 */
export interface TitleSuggestion {
  title: string             // The transaction title
  totalAmount: number       // Total spent (absolute value)
  transactionCount: number  // How many transactions
}

/**
 * Get unique expense titles ranked by total amount.
 * Used to suggest which titles should be categorized first.
 *
 * @param transactions - All transactions (filters to expenses internally)
 * @returns Array of title suggestions, sorted by total amount descending
 */
export function suggestCategories(transactions: Transaction[]): TitleSuggestion[] {
  // Filter to uncategorized expenses only
  const expenses = transactions.filter(t => t.amount < 0 && !t.category)

  // Group by title
  const titleMap = new Map<string, { total: number; count: number }>()

  for (const t of expenses) {
    const title = t.title.trim()
    if (!title) continue

    const existing = titleMap.get(title) || { total: 0, count: 0 }
    titleMap.set(title, {
      total: existing.total + Math.abs(t.amount),
      count: existing.count + 1,
    })
  }

  // Convert to array
  const suggestions: TitleSuggestion[] = []
  for (const [title, data] of titleMap) {
    suggestions.push({
      title,
      totalAmount: data.total,
      transactionCount: data.count,
    })
  }

  // Sort by total amount descending (biggest spends first)
  suggestions.sort((a, b) => b.totalAmount - a.totalAmount)

  return suggestions
}

/**
 * Check if a title matches a category mapping.
 */
function titleMatchesMapping(title: string, mapping: CategoryMapping): boolean {
  const normalizedTitle = title.toLowerCase()
  const normalizedPattern = mapping.pattern.toLowerCase()

  if (mapping.matchType === 'exact') {
    return normalizedTitle === normalizedPattern
  } else {
    return normalizedTitle.includes(normalizedPattern)
  }
}

/**
 * Apply category mappings to transactions.
 *
 * Matching rules:
 * - Only applies to expense transactions (negative amounts)
 * - Exact matches take precedence over contains matches
 * - First matching rule wins (for contains matches)
 *
 * @param transactions - All transactions
 * @param mappings - Category mappings to apply
 * @returns New array with category field populated where matches found
 */
export function applyCategories(
  transactions: Transaction[],
  mappings: CategoryMapping[]
): Transaction[] {
  // Separate exact and contains mappings for precedence
  const exactMappings = mappings.filter(m => m.matchType === 'exact')
  const containsMappings = mappings.filter(m => m.matchType === 'contains')

  return transactions.map(t => {
    // Only categorize expenses
    if (t.amount >= 0) return t

    // Already categorized? Skip
    if (t.category) return t

    const title = t.title.trim()

    // Try exact matches first
    for (const mapping of exactMappings) {
      if (titleMatchesMapping(title, mapping)) {
        return { ...t, category: mapping.category }
      }
    }

    // Then try contains matches
    for (const mapping of containsMappings) {
      if (titleMatchesMapping(title, mapping)) {
        return { ...t, category: mapping.category }
      }
    }

    // No match
    return t
  })
}

/**
 * Get autocomplete suggestions for category input.
 *
 * @param input - Current user input
 * @param existingCategories - Categories already created
 * @returns Matching category names, sorted alphabetically
 */
export function getAutocomplete(
  input: string,
  existingCategories: string[]
): string[] {
  if (!input.trim()) {
    // Return all categories when input is empty
    return [...existingCategories].sort()
  }

  const normalizedInput = input.toLowerCase().trim()

  return existingCategories
    .filter(cat => cat.toLowerCase().includes(normalizedInput))
    .sort()
}

/**
 * Get unique categories from a list of mappings.
 */
export function getUniqueCategories(mappings: CategoryMapping[]): string[] {
  const unique = new Set(mappings.map(m => m.category))
  return [...unique].sort()
}

/**
 * Create a new category mapping.
 */
export function createMapping(
  pattern: string,
  category: string,
  matchType: 'exact' | 'contains' = 'exact'
): CategoryMapping {
  return { pattern, category, matchType }
}

/**
 * Get categorization progress stats.
 */
export function getCategorizationProgress(transactions: Transaction[]): {
  totalExpenses: number
  categorized: number
  uncategorized: number
  categorizedAmount: number
  uncategorizedAmount: number
  percentComplete: number
} {
  const expenses = transactions.filter(t => t.amount < 0)
  const categorized = expenses.filter(t => t.category)
  const uncategorized = expenses.filter(t => !t.category)

  const categorizedAmount = categorized.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const uncategorizedAmount = uncategorized.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalAmount = categorizedAmount + uncategorizedAmount
  const percentComplete = totalAmount > 0
    ? Math.round((categorizedAmount / totalAmount) * 100)
    : 100

  return {
    totalExpenses: expenses.length,
    categorized: categorized.length,
    uncategorized: uncategorized.length,
    categorizedAmount,
    uncategorizedAmount,
    percentComplete,
  }
}

/**
 * Get transactions grouped by category.
 */
export function getTransactionsByCategory(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>()

  for (const t of transactions) {
    if (t.amount >= 0) continue // Only expenses

    const category = t.category || 'Uncategorized'
    const existing = grouped.get(category) || []
    existing.push(t)
    grouped.set(category, existing)
  }

  return grouped
}
