import type { Transaction } from '../types'
import type { MonthlySpending } from '../types/report'
import { formatMonth } from './contributions'

/**
 * Calculate monthly spending by category.
 *
 * @param transactions - Transactions with category field populated
 * @param allMonths - All months to include
 * @returns Monthly spending data sorted by month then category
 */
export function calculateMonthlySpending(
  transactions: Transaction[],
  allMonths: string[]
): MonthlySpending[] {
  // Filter to expenses only
  const expenses = transactions.filter(t => t.amount < 0)

  // Get all unique categories (including "Uncategorized" for those without)
  const categories = new Set<string>()
  for (const t of expenses) {
    categories.add(t.category || 'Uncategorized')
  }

  // Group by month and category
  const data = new Map<string, { amount: number; count: number }>()

  for (const t of expenses) {
    const month = formatMonth(t.date)
    const category = t.category || 'Uncategorized'
    const key = `${month}|${category}`

    const existing = data.get(key) || { amount: 0, count: 0 }
    data.set(key, {
      amount: existing.amount + Math.abs(t.amount),
      count: existing.count + 1,
    })
  }

  // Generate results for all month/category combinations
  const results: MonthlySpending[] = []

  for (const month of allMonths) {
    for (const category of categories) {
      const key = `${month}|${category}`
      const entry = data.get(key) || { amount: 0, count: 0 }

      results.push({
        month,
        category,
        amount: entry.amount,
        count: entry.count,
      })
    }
  }

  // Sort by month, then by amount descending within each month
  results.sort((a, b) => {
    if (a.month !== b.month) return a.month.localeCompare(b.month)
    return b.amount - a.amount
  })

  return results
}

/**
 * Calculate total spending per category (all time).
 */
export function calculateCategoryTotals(
  transactions: Transaction[]
): Map<string, number> {
  const totals = new Map<string, number>()

  for (const t of transactions) {
    if (t.amount >= 0) continue // Only expenses

    const category = t.category || 'Uncategorized'
    totals.set(category, (totals.get(category) || 0) + Math.abs(t.amount))
  }

  return totals
}

/**
 * Get uncategorized transactions.
 */
export function getUncategorizedTransactions(
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(t => t.amount < 0 && !t.category)
}

/**
 * Calculate uncategorized totals.
 */
export function calculateUncategorizedTotals(transactions: Transaction[]): {
  total: number
  count: number
  transactions: Transaction[]
} {
  const uncategorized = getUncategorizedTransactions(transactions)
  const total = uncategorized.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return {
    total,
    count: uncategorized.length,
    transactions: uncategorized,
  }
}

/**
 * Get spending statistics for a single category.
 */
export function getCategoryStats(
  monthlySpending: MonthlySpending[],
  category: string
): {
  total: number
  average: number
  highest: { month: string; amount: number }
  lowest: { month: string; amount: number }
  standardDeviation: number
} {
  const categoryData = monthlySpending.filter(s => s.category === category)

  if (categoryData.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: { month: '', amount: 0 },
      lowest: { month: '', amount: 0 },
      standardDeviation: 0,
    }
  }

  const amounts = categoryData.map(d => d.amount)
  const total = amounts.reduce((sum, a) => sum + a, 0)
  const average = total / amounts.length

  // Find highest and lowest
  let highest = categoryData[0]
  let lowest = categoryData[0]
  for (const d of categoryData) {
    if (d.amount > highest.amount) highest = d
    if (d.amount < lowest.amount) lowest = d
  }

  // Calculate standard deviation
  const squaredDiffs = amounts.map(a => Math.pow(a - average, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / amounts.length
  const standardDeviation = Math.sqrt(avgSquaredDiff)

  return {
    total,
    average,
    highest: { month: highest.month, amount: highest.amount },
    lowest: { month: lowest.month, amount: lowest.amount },
    standardDeviation,
  }
}
