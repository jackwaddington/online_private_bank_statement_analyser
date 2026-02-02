import { describe, it, expect } from 'vitest'
import {
  formatWeek,
  getAllWeeksInRange,
  findMissingWeeks,
  findMissingMonths,
  getDateRange,
  countSourceFiles,
  calculateDataQuality,
  getTransactionCountsByMonth,
} from './dataQuality'
import type { Transaction } from '../types'

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: -100,
    title: 'TEST',
    name: '',
    referenceNumber: '',
    message: '',
    sourceFile: 'test.csv',
    ...overrides,
  }
}

describe('formatWeek', () => {
  it('formats date as ISO week', () => {
    // Week 20 of 2024
    const result = formatWeek(new Date('2024-05-15'))
    expect(result).toMatch(/2024-W\d{2}/)
  })
})

describe('getAllWeeksInRange', () => {
  it('generates all weeks in range', () => {
    const weeks = getAllWeeksInRange(
      new Date('2024-05-01'),
      new Date('2024-05-31')
    )

    // May 2024 spans weeks 18-22 approximately
    expect(weeks.length).toBeGreaterThan(0)
    expect(weeks[0]).toMatch(/2024-W\d{2}/)
  })
})

describe('findMissingWeeks', () => {
  it('finds weeks with no transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-01') }),
      // Gap here
      createTransaction({ id: 'b', date: new Date('2024-05-20') }),
    ]

    const allWeeks = getAllWeeksInRange(
      new Date('2024-05-01'),
      new Date('2024-05-31')
    )

    const missing = findMissingWeeks(transactions, allWeeks)

    // Should have some missing weeks
    expect(missing.length).toBeGreaterThan(0)
  })
})

describe('findMissingMonths', () => {
  it('finds months with no transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10') }),
      // June missing
      createTransaction({ id: 'b', date: new Date('2024-07-10') }),
    ]

    const allMonths = ['2024-05', '2024-06', '2024-07']
    const missing = findMissingMonths(transactions, allMonths)

    expect(missing).toEqual(['2024-06'])
  })
})

describe('getDateRange', () => {
  it('returns start and end dates', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-15') }),
      createTransaction({ id: 'b', date: new Date('2024-03-01') }),
      createTransaction({ id: 'c', date: new Date('2024-07-20') }),
    ]

    const range = getDateRange(transactions)

    expect(range?.start).toEqual(new Date('2024-03-01'))
    expect(range?.end).toEqual(new Date('2024-07-20'))
  })

  it('returns null for empty transactions', () => {
    const range = getDateRange([])
    expect(range).toBeNull()
  })
})

describe('countSourceFiles', () => {
  it('counts unique source files', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'file1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'file1.csv' }),
      createTransaction({ id: 'c', sourceFile: 'file2.csv' }),
    ]

    expect(countSourceFiles(transactions)).toBe(2)
  })
})

describe('calculateDataQuality', () => {
  it('calculates complete data quality metrics', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500, sourceFile: 'may.csv' }),
      createTransaction({ id: 'b', date: new Date('2024-05-15'), amount: -100, sourceFile: 'may.csv' }),
      createTransaction({ id: 'c', date: new Date('2024-06-10'), amount: -200, sourceFile: 'june.csv' }),
    ]

    const quality = calculateDataQuality(transactions, 2)

    expect(quality.totalFiles).toBe(2)
    expect(quality.totalTransactions).toBe(3)
    expect(quality.incomeTransactions).toBe(1)
    expect(quality.expenseTransactions).toBe(2)
    expect(quality.duplicatesRemoved).toBe(2)
  })

  it('handles empty transactions', () => {
    const quality = calculateDataQuality([])

    expect(quality.totalTransactions).toBe(0)
    expect(quality.missingWeeks).toHaveLength(0)
  })
})

describe('getTransactionCountsByMonth', () => {
  it('counts income and expense transactions per month', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500 }),
      createTransaction({ id: 'b', date: new Date('2024-05-15'), amount: -100 }),
      createTransaction({ id: 'c', date: new Date('2024-05-20'), amount: -50 }),
    ]

    const counts = getTransactionCountsByMonth(transactions)

    expect(counts.get('2024-05')?.income).toBe(1)
    expect(counts.get('2024-05')?.expense).toBe(2)
  })
})
