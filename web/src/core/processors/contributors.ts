import type { Transaction } from '../types'

/**
 * Represents a potential contributor found in income transactions.
 */
export interface Contributor {
  name: string          // The extracted/normalized name
  total: number         // Total amount contributed
  transactionCount: number
}

/**
 * Extract a name from a transaction title.
 * Matches the R logic: extract first alphabetic word, lowercase.
 *
 * Examples:
 * - "ALEX ROWAN NGUYEN" -> "alex"
 * - "John Smith Transfer" -> "john"
 * - "123 PAYMENT" -> "payment"
 */
export function extractNameFromTitle(title: string): string {
  // Match first sequence of letters (case insensitive)
  const match = title.toLowerCase().match(/[a-z]+/)
  return match ? match[0] : ''
}

/**
 * Normalize a contributor name for display.
 * Capitalizes first letter.
 */
export function normalizeName(name: string): string {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

/**
 * Find the top contributors from income transactions.
 *
 * This analyzes all positive-amount transactions, extracts names from titles,
 * and returns the top N by total contribution amount.
 *
 * @param transactions - All transactions (will filter to income only)
 * @param count - Number of top contributors to return (default: 2)
 * @returns Array of contributors sorted by total amount (highest first)
 */
export function findTopContributors(
  transactions: Transaction[],
  count: number = 2
): Contributor[] {
  // Filter to income only (positive amounts)
  const incomeTransactions = transactions.filter(t => t.amount > 0)

  // Group by extracted name
  const contributorMap = new Map<string, { total: number; count: number }>()

  for (const t of incomeTransactions) {
    // Try to use the Name field first (often populated for income)
    // Fall back to extracting from Title
    const rawName = t.name.trim() || t.title.trim()
    const extractedName = extractNameFromTitle(rawName)

    if (!extractedName) continue

    const existing = contributorMap.get(extractedName) || { total: 0, count: 0 }
    contributorMap.set(extractedName, {
      total: existing.total + t.amount,
      count: existing.count + 1,
    })
  }

  // Convert to array and sort by total (descending)
  const contributors: Contributor[] = []
  for (const [name, data] of contributorMap) {
    contributors.push({
      name: normalizeName(name),
      total: data.total,
      transactionCount: data.count,
    })
  }

  contributors.sort((a, b) => b.total - a.total)

  // Return top N
  return contributors.slice(0, count)
}

/**
 * Get all unique contributor names found in income transactions.
 * Useful for showing the user all options to choose from.
 */
export function findAllContributors(transactions: Transaction[]): Contributor[] {
  return findTopContributors(transactions, Infinity)
}

/**
 * Tag transactions with their contributor name.
 *
 * For income transactions:
 * - If name matches a selected contributor, tag with that contributor
 * - Otherwise tag as "Other"
 *
 * For expense transactions:
 * - Leave contributor undefined
 *
 * @param transactions - All transactions
 * @param selectedNames - Names of contributors to track (case-insensitive)
 * @returns New array with contributor field populated on income transactions
 */
export function tagContributions(
  transactions: Transaction[],
  selectedNames: string[]
): Transaction[] {
  // Normalize selected names for case-insensitive matching
  const normalizedSelected = new Set(
    selectedNames.map(n => n.toLowerCase())
  )

  return transactions.map(t => {
    // Only tag income transactions
    if (t.amount <= 0) {
      return t
    }

    // Extract name from transaction
    const rawName = t.name.trim() || t.title.trim()
    const extractedName = extractNameFromTitle(rawName)

    // Check if it matches a selected contributor
    if (extractedName && normalizedSelected.has(extractedName.toLowerCase())) {
      return {
        ...t,
        contributor: normalizeName(extractedName),
      }
    }

    // Otherwise mark as Other
    return {
      ...t,
      contributor: 'Other',
    }
  })
}

/**
 * Get income transactions grouped by contributor.
 */
export function getTransactionsByContributor(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>()

  for (const t of transactions) {
    if (t.amount <= 0 || !t.contributor) continue

    const existing = grouped.get(t.contributor) || []
    existing.push(t)
    grouped.set(t.contributor, existing)
  }

  return grouped
}
