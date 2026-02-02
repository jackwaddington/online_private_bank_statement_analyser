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
    amount: 100,
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
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: 300 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].income).toBe(800)
  })

  it('calculates monthly outgoings (sum of negatives, absolute)', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: -100 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -50 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].outgoings).toBe(150)
  })

  it('calculates net flow', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 1000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -400 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].net).toBe(600) // 1000 - 400
  })

  it('calculates cumulative balance', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 1000 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -400 }),
      createTransaction({ id: 'c', date: new Date('2024-06-10'), amount: 500 }),
      createTransaction({ id: 'd', date: new Date('2024-06-20'), amount: -200 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05', '2024-06'])

    expect(result[0].cumulativeBalance).toBe(600)  // May: 1000 - 400
    expect(result[1].cumulativeBalance).toBe(900)  // June: 600 + (500 - 200)
  })

  it('fills zero for months with no transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05', '2024-06'])

    expect(result[1].income).toBe(0)
    expect(result[1].outgoings).toBe(0)
    expect(result[1].net).toBe(0)
  })

  it('handles negative cumulative balance', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 100 }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -500 }),
    ]

    const result = calculateMonthlyCashFlow(transactions, ['2024-05'])

    expect(result[0].net).toBe(-400)
    expect(result[0].cumulativeBalance).toBe(-400)
  })
})

describe('calculateTotals', () => {
  it('calculates total income, outgoings, and net', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 1000 }),
      createTransaction({ id: 'b', amount: 500 }),
      createTransaction({ id: 'c', amount: -300 }),
      createTransaction({ id: 'd', amount: -200 }),
    ]

    const result = calculateTotals(transactions)

    expect(result.totalIncome).toBe(1500)
    expect(result.totalOutgoings).toBe(500)
    expect(result.netBalance).toBe(1000)
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
      { month: '2024-05', income: 1000, outgoings: 200, net: 800, cumulativeBalance: 800 },
      { month: '2024-06', income: 500, outgoings: 700, net: -200, cumulativeBalance: 600 },
      { month: '2024-07', income: 600, outgoings: 400, net: 200, cumulativeBalance: 800 },
    ]

    const result = findExtremeMonths(cashFlow)

    expect(result.highestNet?.month).toBe('2024-05')
    expect(result.lowestNet?.month).toBe('2024-06')
  })

  it('finds highest income and outgoings months', () => {
    const cashFlow = [
      { month: '2024-05', income: 1000, outgoings: 200, net: 800, cumulativeBalance: 800 },
      { month: '2024-06', income: 500, outgoings: 900, net: -400, cumulativeBalance: 400 },
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
      { month: '2024-05', income: 1000, outgoings: 400, net: 600, cumulativeBalance: 600 },
      { month: '2024-06', income: 800, outgoings: 600, net: 200, cumulativeBalance: 800 },
    ]

    const result = calculateAverages(cashFlow)

    expect(result.averageIncome).toBe(900)
    expect(result.averageOutgoings).toBe(500)
    expect(result.averageNet).toBe(400)
  })

  it('handles empty array', () => {
    const result = calculateAverages([])

    expect(result.averageIncome).toBe(0)
    expect(result.averageOutgoings).toBe(0)
    expect(result.averageNet).toBe(0)
  })
})
