import type { Transaction } from '../types'
import type { MonthlyCashFlow } from '../types/report'
import { formatMonth } from './contributions'

/**
 * Calculate monthly cash flow (income, outgoings, net, cumulative).
 *
 * @param transactions - All transactions
 * @param allMonths - All months to include
 * @returns Monthly cash flow data
 */
export function calculateMonthlyCashFlow(
  transactions: Transaction[],
  allMonths: string[]
): MonthlyCashFlow[] {
  // Group transactions by month
  const monthlyData = new Map<string, { income: number; outgoings: number }>()

  // Initialize all months with zeros
  for (const month of allMonths) {
    monthlyData.set(month, { income: 0, outgoings: 0 })
  }

  // Accumulate transactions
  for (const t of transactions) {
    const month = formatMonth(t.date)
    const data = monthlyData.get(month) || { income: 0, outgoings: 0 }

    if (t.amount > 0) {
      data.income += t.amount
    } else {
      data.outgoings += Math.abs(t.amount)
    }

    monthlyData.set(month, data)
  }

  // Calculate net and cumulative
  const results: MonthlyCashFlow[] = []
  let cumulativeBalance = 0

  for (const month of allMonths) {
    const data = monthlyData.get(month) || { income: 0, outgoings: 0 }
    const net = data.income - data.outgoings
    cumulativeBalance += net

    results.push({
      month,
      income: data.income,
      outgoings: data.outgoings,
      net,
      cumulativeBalance,
    })
  }

  return results
}

/**
 * Calculate total income, outgoings, and net balance.
 */
export function calculateTotals(transactions: Transaction[]): {
  totalIncome: number
  totalOutgoings: number
  netBalance: number
} {
  let totalIncome = 0
  let totalOutgoings = 0

  for (const t of transactions) {
    if (t.amount > 0) {
      totalIncome += t.amount
    } else {
      totalOutgoings += Math.abs(t.amount)
    }
  }

  return {
    totalIncome,
    totalOutgoings,
    netBalance: totalIncome - totalOutgoings,
  }
}

/**
 * Find the month with highest/lowest net flow.
 */
export function findExtremeMonths(cashFlow: MonthlyCashFlow[]): {
  highestNet: MonthlyCashFlow | null
  lowestNet: MonthlyCashFlow | null
  highestIncome: MonthlyCashFlow | null
  highestOutgoings: MonthlyCashFlow | null
} {
  if (cashFlow.length === 0) {
    return {
      highestNet: null,
      lowestNet: null,
      highestIncome: null,
      highestOutgoings: null,
    }
  }

  let highestNet = cashFlow[0]
  let lowestNet = cashFlow[0]
  let highestIncome = cashFlow[0]
  let highestOutgoings = cashFlow[0]

  for (const cf of cashFlow) {
    if (cf.net > highestNet.net) highestNet = cf
    if (cf.net < lowestNet.net) lowestNet = cf
    if (cf.income > highestIncome.income) highestIncome = cf
    if (cf.outgoings > highestOutgoings.outgoings) highestOutgoings = cf
  }

  return {
    highestNet,
    lowestNet,
    highestIncome,
    highestOutgoings,
  }
}

/**
 * Calculate average monthly cash flow.
 */
export function calculateAverages(cashFlow: MonthlyCashFlow[]): {
  averageIncome: number
  averageOutgoings: number
  averageNet: number
} {
  if (cashFlow.length === 0) {
    return { averageIncome: 0, averageOutgoings: 0, averageNet: 0 }
  }

  const totalIncome = cashFlow.reduce((sum, cf) => sum + cf.income, 0)
  const totalOutgoings = cashFlow.reduce((sum, cf) => sum + cf.outgoings, 0)
  const totalNet = cashFlow.reduce((sum, cf) => sum + cf.net, 0)

  return {
    averageIncome: totalIncome / cashFlow.length,
    averageOutgoings: totalOutgoings / cashFlow.length,
    averageNet: totalNet / cashFlow.length,
  }
}
