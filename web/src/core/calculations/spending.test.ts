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
    amount: -100,
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
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: -100, category: 'Groceries' }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: -50, category: 'Groceries' }),
      createTransaction({ id: 'c', date: new Date('2024-05-15'), amount: -30, category: 'Entertainment' }),
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    const groceries = result.find(r => r.month === '2024-05' && r.category === 'Groceries')
    const entertainment = result.find(r => r.month === '2024-05' && r.category === 'Entertainment')

    expect(groceries?.amount).toBe(150)
    expect(groceries?.count).toBe(2)
    expect(entertainment?.amount).toBe(30)
    expect(entertainment?.count).toBe(1)
  })

  it('groups uncategorized as "Uncategorized"', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100 }), // No category
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    const uncategorized = result.find(r => r.category === 'Uncategorized')
    expect(uncategorized?.amount).toBe(100)
  })

  it('ignores income transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, category: 'Refund' }), // Positive
    ]

    const result = calculateMonthlySpending(transactions, ['2024-05'])

    expect(result).toHaveLength(0)
  })
})

describe('calculateCategoryTotals', () => {
  it('calculates all-time totals per category', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, category: 'Groceries' }),
      createTransaction({ id: 'b', amount: -200, category: 'Groceries' }),
      createTransaction({ id: 'c', amount: -50, category: 'Entertainment' }),
    ]

    const totals = calculateCategoryTotals(transactions)

    expect(totals.get('Groceries')).toBe(300)
    expect(totals.get('Entertainment')).toBe(50)
  })
})

describe('getUncategorizedTransactions', () => {
  it('returns only uncategorized expenses', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100 }), // Uncategorized
      createTransaction({ id: 'b', amount: -50, category: 'Groceries' }), // Categorized
      createTransaction({ id: 'c', amount: 500 }), // Income
    ]

    const result = getUncategorizedTransactions(transactions)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })
})

describe('calculateUncategorizedTotals', () => {
  it('calculates total and count', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100 }),
      createTransaction({ id: 'b', amount: -50 }),
      createTransaction({ id: 'c', amount: -75, category: 'Categorized' }),
    ]

    const result = calculateUncategorizedTotals(transactions)

    expect(result.total).toBe(150)
    expect(result.count).toBe(2)
    expect(result.transactions).toHaveLength(2)
  })
})

describe('getCategoryStats', () => {
  it('calculates category statistics', () => {
    const monthlySpending = [
      { month: '2024-05', category: 'Groceries', amount: 100, count: 5 },
      { month: '2024-06', category: 'Groceries', amount: 200, count: 8 },
      { month: '2024-07', category: 'Groceries', amount: 150, count: 6 },
    ]

    const stats = getCategoryStats(monthlySpending, 'Groceries')

    expect(stats.total).toBe(450)
    expect(stats.average).toBe(150)
    expect(stats.highest.month).toBe('2024-06')
    expect(stats.highest.amount).toBe(200)
    expect(stats.lowest.month).toBe('2024-05')
    expect(stats.lowest.amount).toBe(100)
  })

  it('handles category not found', () => {
    const stats = getCategoryStats([], 'Unknown')

    expect(stats.total).toBe(0)
    expect(stats.average).toBe(0)
  })
})
