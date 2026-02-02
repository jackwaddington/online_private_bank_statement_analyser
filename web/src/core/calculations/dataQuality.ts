import type { Transaction } from '../types'
import type { DataQuality } from '../types/report'
import { formatMonth, getAllMonthsInRange } from './contributions'

/**
 * Format a date as ISO week: "YYYY-WW"
 */
export function formatWeek(date: Date): string {
  // Get ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Generate all weeks between start and end dates.
 */
export function getAllWeeksInRange(start: Date, end: Date): string[] {
  const weeks = new Set<string>()
  const current = new Date(start)

  while (current <= end) {
    weeks.add(formatWeek(current))
    current.setDate(current.getDate() + 1)
  }

  return [...weeks].sort()
}

/**
 * Find missing weeks (weeks with no transactions).
 */
export function findMissingWeeks(
  transactions: Transaction[],
  allWeeks: string[]
): string[] {
  const weeksWithData = new Set(transactions.map(t => formatWeek(t.date)))
  return allWeeks.filter(week => !weeksWithData.has(week))
}

/**
 * Find missing months (months with no transactions).
 */
export function findMissingMonths(
  transactions: Transaction[],
  allMonths: string[]
): string[] {
  const monthsWithData = new Set(transactions.map(t => formatMonth(t.date)))
  return allMonths.filter(month => !monthsWithData.has(month))
}

/**
 * Get the date range of transactions.
 */
export function getDateRange(transactions: Transaction[]): { start: Date; end: Date } | null {
  if (transactions.length === 0) return null

  let start = transactions[0].date
  let end = transactions[0].date

  for (const t of transactions) {
    if (t.date < start) start = t.date
    if (t.date > end) end = t.date
  }

  return { start, end }
}

/**
 * Count unique source files.
 */
export function countSourceFiles(transactions: Transaction[]): number {
  return new Set(transactions.map(t => t.sourceFile)).size
}

/**
 * Calculate complete data quality metrics.
 */
export function calculateDataQuality(
  transactions: Transaction[],
  duplicatesRemoved: number = 0
): DataQuality {
  const dateRange = getDateRange(transactions)

  if (!dateRange) {
    return {
      dateRange: { start: new Date(), end: new Date() },
      totalFiles: 0,
      totalTransactions: 0,
      incomeTransactions: 0,
      expenseTransactions: 0,
      duplicatesFound: 0,
      duplicatesRemoved,
      missingWeeks: [],
      missingMonths: [],
    }
  }

  const allMonths = getAllMonthsInRange(dateRange.start, dateRange.end)
  const allWeeks = getAllWeeksInRange(dateRange.start, dateRange.end)

  const incomeTransactions = transactions.filter(t => t.amount > 0).length
  const expenseTransactions = transactions.filter(t => t.amount < 0).length

  return {
    dateRange,
    totalFiles: countSourceFiles(transactions),
    totalTransactions: transactions.length,
    incomeTransactions,
    expenseTransactions,
    duplicatesFound: duplicatesRemoved, // We track what was removed
    duplicatesRemoved,
    missingWeeks: findMissingWeeks(transactions, allWeeks),
    missingMonths: findMissingMonths(transactions, allMonths),
  }
}

/**
 * Get transaction counts by month.
 */
export function getTransactionCountsByMonth(
  transactions: Transaction[]
): Map<string, { income: number; expense: number }> {
  const counts = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const month = formatMonth(t.date)
    const existing = counts.get(month) || { income: 0, expense: 0 }

    if (t.amount > 0) {
      existing.income++
    } else {
      existing.expense++
    }

    counts.set(month, existing)
  }

  return counts
}
