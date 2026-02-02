import type { Transaction } from '../types'
import type { DuplicateGroup } from '../types/report'

/**
 * Create a unique key for a transaction based on deduplication criteria.
 * Transactions with the same key are potential duplicates.
 */
function getTransactionKey(t: Transaction): string {
  // Key: date (ISO) + amount + title + reference number
  const dateStr = t.date.toISOString().split('T')[0] // YYYY-MM-DD
  return `${dateStr}|${t.amount}|${t.title}|${t.referenceNumber}`
}

/**
 * Find duplicate transactions across different source files.
 *
 * A duplicate is defined as transactions with identical:
 * - Date
 * - Amount
 * - Title
 * - Reference number
 *
 * AND appearing in different source files (same transaction in same file is not a duplicate).
 *
 * @param transactions - All transactions to check
 * @returns Array of duplicate groups, each containing 2+ transactions
 */
export function findDuplicates(transactions: Transaction[]): DuplicateGroup[] {
  // Group transactions by their key
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const key = getTransactionKey(transaction)
    const existing = groups.get(key) || []
    existing.push(transaction)
    groups.set(key, existing)
  }

  // Filter to groups with multiple transactions from different files
  const duplicateGroups: DuplicateGroup[] = []

  for (const [, group] of groups) {
    if (group.length < 2) continue

    // Check if they're from different source files
    const uniqueFiles = new Set(group.map(t => t.sourceFile))
    if (uniqueFiles.size < 2) continue

    // This is a duplicate group
    duplicateGroups.push({
      transactions: group,
      date: group[0].date,
      amount: group[0].amount,
      title: group[0].title,
      referenceNumber: group[0].referenceNumber,
    })
  }

  // Sort by date for consistent display
  duplicateGroups.sort((a, b) => a.date.getTime() - b.date.getTime())

  return duplicateGroups
}

/**
 * Get all duplicate transactions (flattened from groups).
 * Useful for counting or displaying all duplicates.
 */
export function getAllDuplicateTransactions(groups: DuplicateGroup[]): Transaction[] {
  return groups.flatMap(g => g.transactions)
}

/**
 * Get transactions to remove (all but first occurrence in each group).
 * This is the default deduplication strategy: keep the first, remove the rest.
 */
export function getTransactionsToRemove(groups: DuplicateGroup[]): Transaction[] {
  return groups.flatMap(g => g.transactions.slice(1))
}

/**
 * Remove specific transactions from the array.
 *
 * @param transactions - Original transaction array
 * @param toRemove - Transactions to remove (matched by id)
 * @returns New array with specified transactions removed
 */
export function removeDuplicates(
  transactions: Transaction[],
  toRemove: Transaction[]
): Transaction[] {
  const removeIds = new Set(toRemove.map(t => t.id))
  return transactions.filter(t => !removeIds.has(t.id))
}

/**
 * Mark transactions as duplicates without removing them.
 * Useful for displaying duplicates to the user before they decide.
 *
 * @param transactions - All transactions
 * @param duplicateGroups - Groups of duplicates to mark
 * @returns New array with isDuplicate flag set on duplicates
 */
export function markDuplicates(
  transactions: Transaction[],
  duplicateGroups: DuplicateGroup[]
): Transaction[] {
  const duplicateIds = new Set(
    duplicateGroups.flatMap(g => g.transactions.map(t => t.id))
  )

  return transactions.map(t => ({
    ...t,
    isDuplicate: duplicateIds.has(t.id),
  }))
}

/**
 * Convenience function: find and remove duplicates in one step.
 * Keeps first occurrence, removes subsequent occurrences.
 *
 * @param transactions - All transactions
 * @returns Object with deduplicated transactions and info about what was removed
 */
export function deduplicateTransactions(transactions: Transaction[]): {
  transactions: Transaction[]
  duplicateGroups: DuplicateGroup[]
  removedCount: number
} {
  const duplicateGroups = findDuplicates(transactions)
  const toRemove = getTransactionsToRemove(duplicateGroups)
  const deduplicated = removeDuplicates(transactions, toRemove)

  return {
    transactions: deduplicated,
    duplicateGroups,
    removedCount: toRemove.length,
  }
}
