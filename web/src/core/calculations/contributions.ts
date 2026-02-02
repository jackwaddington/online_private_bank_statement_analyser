import type { Transaction } from '../types'
import type {
  MonthlyContribution,
  CumulativeContribution,
  ContributorSummary,
} from '../types/report'

/**
 * Format a date as YYYY-MM for monthly grouping.
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Generate all months between start and end (inclusive).
 */
export function getAllMonthsInRange(start: Date, end: Date): string[] {
  const months: string[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (current <= endMonth) {
    months.push(formatMonth(current))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

/**
 * Calculate monthly contributions per contributor.
 * Fills in zero for months with no contributions.
 *
 * @param transactions - Transactions with contributor field populated
 * @param contributors - List of contributor names to track
 * @param allMonths - All months to include (for zero-filling)
 */
export function calculateMonthlyContributions(
  transactions: Transaction[],
  contributors: string[],
  allMonths: string[]
): MonthlyContribution[] {
  // Filter to income with known contributors (exclude "Other")
  const contributorSet = new Set(contributors.map(c => c.toLowerCase()))
  const incomeTransactions = transactions.filter(
    t => t.amount > 0 && t.contributor && contributorSet.has(t.contributor.toLowerCase())
  )

  // Group by month and contributor
  const totals = new Map<string, number>() // key: "YYYY-MM|contributor"

  for (const t of incomeTransactions) {
    const month = formatMonth(t.date)
    const key = `${month}|${t.contributor}`
    totals.set(key, (totals.get(key) || 0) + t.amount)
  }

  // Generate results for all month/contributor combinations
  const results: MonthlyContribution[] = []

  for (const month of allMonths) {
    for (const contributor of contributors) {
      const key = `${month}|${contributor}`
      results.push({
        month,
        contributor,
        amount: totals.get(key) || 0,
      })
    }
  }

  return results
}

/**
 * Calculate cumulative contributions over time.
 */
export function calculateCumulativeContributions(
  monthlyContributions: MonthlyContribution[],
  contributors: string[]
): CumulativeContribution[] {
  const results: CumulativeContribution[] = []
  const runningTotals = new Map<string, number>()

  // Initialize running totals
  for (const contributor of contributors) {
    runningTotals.set(contributor, 0)
  }

  // Get unique months in order
  const months = [...new Set(monthlyContributions.map(c => c.month))].sort()

  for (const month of months) {
    for (const contributor of contributors) {
      // Find this month's contribution
      const monthData = monthlyContributions.find(
        c => c.month === month && c.contributor === contributor
      )
      const amount = monthData?.amount || 0

      // Update running total
      const newTotal = (runningTotals.get(contributor) || 0) + amount
      runningTotals.set(contributor, newTotal)

      results.push({
        month,
        contributor,
        cumulative: newTotal,
      })
    }
  }

  return results
}

/**
 * Calculate contribution summaries with totals and averages.
 */
export function calculateContributorSummaries(
  transactions: Transaction[],
  contributors: string[],
  monthCount: number
): ContributorSummary[] {
  const summaries: ContributorSummary[] = []

  for (const contributor of contributors) {
    const contributorTransactions = transactions.filter(
      t => t.amount > 0 && t.contributor?.toLowerCase() === contributor.toLowerCase()
    )

    const total = contributorTransactions.reduce((sum, t) => sum + t.amount, 0)
    const monthlyAverage = monthCount > 0 ? total / monthCount : 0

    summaries.push({
      name: contributor,
      total,
      monthlyAverage,
    })
  }

  // Sort by total descending
  summaries.sort((a, b) => b.total - a.total)

  return summaries
}

/**
 * Calculate the equalisation amount.
 * This is half the difference between the two highest contributors.
 */
export function calculateEqualisation(summaries: ContributorSummary[]): {
  difference: number
  equalisationAmount: number
  higherContributor: string
  lowerContributor: string
} {
  if (summaries.length < 2) {
    return {
      difference: 0,
      equalisationAmount: 0,
      higherContributor: summaries[0]?.name || '',
      lowerContributor: '',
    }
  }

  const [first, second] = summaries
  const difference = Math.abs(first.total - second.total)

  return {
    difference,
    equalisationAmount: difference / 2,
    higherContributor: first.total >= second.total ? first.name : second.name,
    lowerContributor: first.total >= second.total ? second.name : first.name,
  }
}

/**
 * Get total "Other" income (contributions from non-selected sources).
 */
export function calculateOtherIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.amount > 0 && t.contributor === 'Other')
    .reduce((sum, t) => sum + t.amount, 0)
}
