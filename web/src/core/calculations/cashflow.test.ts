import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyCashFlow,
  calculateTotals,
  findExtremeMonths,
  calculateAverages,
} from './cashflow'
import type { Transaction } from '../types'

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: 10000, // €100 in cents
    title: 'TEST',
    name: '',
    referenceNumber: '',
    message: '',
    sourceFile: 'test.csv',
    ...overrides,
  }
}

describe('calculateMonthlyCashFlow', () => {
  it('calculates monthly income (sum of positives)', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 50000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: 30000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].income).toBe(80000)
  })

  it('calculates monthly outgoings (sum of negatives, absolute)', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: -10000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -5000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].outgoings).toBe(15000)
  })

  it('calculates net flow', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 100000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -40000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].net).toBe(60000) // 100000 - 40000
  })

  it('calculates cumulative balance', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 100000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -40000 }),
      createTransaction({ id: 'c', date: new Date('2024-06-10'), amount: 50000 }),
      createTransaction({ id: 'd', date: new Date('2024-06-20'), amount: -20000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05', '2024-06'])

    expect(result[0].cumulativeBalance).toBe(60000)  // May: 100000 - 40000
    expect(result[1].cumulativeBalance).toBe(90000)  // June: 60000 + (50000 - 20000)
  })

  it('fills zero for months with no transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 50000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05', '2024-06'])

    expect(result[1].income).toBe(0)
    expect(result[1].outgoings).toBe(0)
    expect(result[1].net).toBe(0)
  })

  it('handles negative cumulative balance', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 10000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -50000 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].net).toBe(-40000)
    expect(result[0].cumulativeBalance).toBe(-40000)
  })
})

describe('calculateTotals', () => {
  it('calculates total income, outgoings, and net', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100000 }),
      createTransaction({ id: 'b', amount: 50000 }),
      createTransaction({ id: 'c', amount: -30000 }),
      createTransaction({ id: 'd', amount: -20000 }),
    ]

    const result = calculateTotals(transactions)

    expect(result.totalIncome).toBe(150000)
    expect(result.totalOutgoings).toBe(50000)
    expect(result.netBalance).toBe(100000)
  })

  it('handles empty transactions', () => {
    const result = calculateTotals([])

    expect(result.totalIncome).toBe(0)
    expect(result.totalOutgoings).toBe(0)
    expect(result.netBalance).toBe(0)
  })
})

describe('findExtremeMonths', () => {
  it('finds highest and lowest net months', () => {
    const cashFlow = [
      { month: '2024-05', income: 100000, outgoings: 20000, net: 80000, cumulativeBalance: 80000 },
      { month: '2024-06', income: 50000, outgoings: 70000, net: -20000, cumulativeBalance: 60000 },
      { month: '2024-07', income: 60000, outgoings: 40000, net: 20000, cumulativeBalance: 80000 },
    ]

    const result = findExtremeMonths(cashFlow)

    expect(result.highestNet?.month).toBe('2024-05')
    expect(result.lowestNet?.month).toBe('2024-06')
  })

  it('finds highest income and outgoings months', () => {
    const cashFlow = [
      { month: '2024-05', income: 100000, outgoings: 20000, net: 80000, cumulativeBalance: 80000 },
      { month: '2024-06', income: 50000, outgoings: 90000, net: -40000, cumulativeBalance: 40000 },
    ]

    const result = findExtremeMonths(cashFlow)

    expect(result.highestIncome?.month).toBe('2024-05')
    expect(result.highestOutgoings?.month).toBe('2024-06')
  })

  it('handles empty array', () => {
    const result = findExtremeMonths([])

    expect(result.highestNet).toBeNull()
    expect(result.lowestNet).toBeNull()
  })
})

describe('calculateAverages', () => {
  it('calculates average income, outgoings, and net', () => {
    const cashFlow = [
      { month: '2024-05', income: 100000, outgoings: 40000, net: 60000, cumulativeBalance: 60000 },
      { month: '2024-06', income: 80000, outgoings: 60000, net: 20000, cumulativeBalance: 80000 },
    ]

    const result = calculateAverages(cashFlow)

    expect(result.averageIncome).toBe(90000)
    expect(result.averageOutgoings).toBe(50000)
    expect(result.averageNet).toBe(40000)
  })

  it('handles empty array', () => {
    const result = calculateAverages([])

    expect(result.averageIncome).toBe(0)
    expect(result.averageOutgoings).toBe(0)
    expect(result.averageNet).toBe(0)
  })
})
