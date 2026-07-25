import { describe, it, expect } from 'vitest'
import {
  calculateMonthlySpending,
  calculateCategoryTotals,
  getUncategorizedTransactions,
  calculateUncategorizedTotals,
  getCategoryStats,
} from './spending'
import type { Transaction } from '../types'

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: -10000, // -€100 in cents
    title: 'TEST',
    name: '',
    referenceNumber: '',
    message: '',
    sourceFile: 'test.csv',
    ...overrides,
  }
}

describe('calculateMonthlySpending', () => {
  it('calculates monthly totals by category', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: -10000, category: 'Groceries' }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -5000, category: 'Groceries' }),
      createTransaction({ id: 'c', date: new Date('2024-05-15'), amount: -3000, category: 'Entertainment' }),
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    const groceries = result.find(r => r.month === '2024-05' && r.category === 'Groceries')
    const entertainment = result.find(r => r.month === '2024-05' && r.category === 'Entertainment')

    expect(groceries?.amount).toBe(15000)
    expect(groceries?.count).toBe(2)
    expect(entertainment?.amount).toBe(3000)
    expect(entertainment?.count).toBe(1)
  })

  it('groups uncategorized as "Uncategorized"', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -10000 }), // No category
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    const uncategorized = result.find(r => r.category === 'Uncategorized')
    expect(uncategorized?.amount).toBe(10000)
  })

  it('ignores income transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 50000, category: 'Refund' }), // Positive
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    expect(result).toHaveLength(0)
  })
})

describe('calculateCategoryTotals', () => {
  it('calculates all-time totals per category', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -10000, category: 'Groceries' }),
      createTransaction({ id: 'b', amount: -20000, category: 'Groceries' }),
      createTransaction({ id: 'c', amount: -5000, category: 'Entertainment' }),
    ]

    const totals = calculateCategoryTotals(transactions)

    expect(totals.get('Groceries')).toBe(30000)
    expect(totals.get('Entertainment')).toBe(5000)
  })
})

describe('getUncategorizedTransactions', () => {
  it('returns only uncategorized expenses', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -10000 }), // Uncategorized
      createTransaction({ id: 'b', amount: -5000, category: 'Groceries' }), // Categorized
      createTransaction({ id: 'c', amount: 50000 }), // Income
    ]

    const result = getUncategorizedTransactions(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })
})

describe('calculateUncategorizedTotals', () => {
  it('calculates total and count', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -10000 }),
      createTransaction({ id: 'b', amount: -5000 }),
      createTransaction({ id: 'c', amount: -7500, category: 'Categorized' }),
    ]

    const result = calculateUncategorizedTotals(transactions)

    expect(result.total).toBe(15000)
    expect(result.count).toBe(2)
    expect(result.transactions).toHaveLength(2)
  })
})

describe('getCategoryStats', () => {
  it('calculates category statistics', () => {
    const monthlySpending = [
      { month: '2024-05', category: 'Groceries', amount: 10000, count: 5 },
      { month: '2024-06', category: 'Groceries', amount: 20000, count: 8 },
      { month: '2024-07', category: 'Groceries', amount: 15000, count: 6 },
    ]

    const stats = getCategoryStats(monthlySpending, 'Groceries')

    expect(stats.total).toBe(45000)
    expect(stats.average).toBe(15000)
    expect(stats.highest.month).toBe('2024-06')
    expect(stats.highest.amount).toBe(20000)
    expect(stats.lowest.month).toBe('2024-05')
    expect(stats.lowest.amount).toBe(10000)
  })

  it('handles category not found', () => {
    const stats = getCategoryStats([], 'Unknown')

    expect(stats.total).toBe(0)
    expect(stats.average).toBe(0)
  })
})
