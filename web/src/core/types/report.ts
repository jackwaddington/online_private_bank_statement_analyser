import type { Transaction } from './transaction'

/**
 * Monthly contribution data for a single contributor.
 */
export interface MonthlyContribution {
  month: string           // Format: "YYYY-MM"
  contributor: string     // Contributor name
  amount: number          // Total contributed that month
}

/**
 * Cumulative contribution data for a single contributor.
 */
export interface CumulativeContribution {
  month: string           // Format: "YYYY-MM"
  contributor: string     // Contributor name
  cumulative: number      // Running total up to and including this month
}

/**
 * Monthly spending data for a single category.
 */
export interface MonthlySpending {
  month: string           // Format: "YYYY-MM"
  category: string        // Category name
  amount: number          // Total spent that month (absolute value)
  count: number           // Number of transactions
}

/**
 * Monthly cash flow summary.
 */
export interface MonthlyCashFlow {
  month: string           // Format: "YYYY-MM"
  income: number          // Total positive amounts
  outgoings: number       // Total negative amounts (as positive number)
  net: number             // income - outgoings
  cumulativeBalance: number // Running total of net
}

/**
 * Data quality information about the imported data.
 */
export interface DataQuality {
  dateRange: {
    start: Date
    end: Date
  }
  totalFiles: number
  totalTransactions: number
  incomeTransactions: number
  expenseTransactions: number
  duplicatesFound: number
  duplicatesRemoved: number
  missingWeeks: string[]    // Format: "YYYY-WW"
  missingMonths: string[]   // Format: "YYYY-MM"
}

/**
 * Contributor summary with totals.
 */
export interface ContributorSummary {
  name: string
  total: number
  monthlyAverage: number
}

/**
 * Complete report data structure.
 * Contains all calculated data ready for display.
 */
export interface ReportData {
  dataQuality: DataQuality

  contributions: {
    contributors: ContributorSummary[]
    monthly: MonthlyContribution[]
    cumulative: CumulativeContribution[]
    totalDifference: number           // Absolute difference between top two
    equalisationAmount: number        // totalDifference / 2
  }

  spending: {
    byCategory: Map<string, number>   // Category -> total amount
    monthly: MonthlySpending[]
    uncategorized: Transaction[]
    uncategorizedTotal: number
    uncategorizedCount: number
  }

  cashFlow: {
    monthly: MonthlyCashFlow[]
    totalIncome: number
    totalOutgoings: number
    netBalance: number
  }
}

/**
 * Duplicate group - transactions that appear in multiple files.
 */
export interface DuplicateGroup {
  transactions: Transaction[]         // All occurrences (2 or more)
  date: Date
  amount: number
  title: string
  referenceNumber: string
}
