import { describe, it, expect } from 'vitest'
import {
  findDuplicates,
  removeDuplicates,
  getTransactionsToRemove,
  markDuplicates,
  deduplicateTransactions,
} from './deduplication'
import type { Transaction } from '../types'

// Helper to create test transactions
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: -50,
    title: 'TEST STORE',
    name: '',
    referenceNumber: 'REF123',
    message: '',
    sourceFile: 'file1.csv',
    ...overrides,
  }
}

describe('findDuplicates', () => {
  it('finds duplicates across different source files', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'may.csv' }),
      createTransaction({ id: 'b', sourceFile: 'june.csv' }), // Same transaction, different file
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
  })

  it('does not flag same transaction in same file as duplicate', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'may.csv' }),
      createTransaction({ id: 'b', sourceFile: 'may.csv' }), // Same file
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('groups all occurrences of a duplicate together', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'file1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'file2.csv' }),
      createTransaction({ id: 'c', sourceFile: 'file3.csv' }), // Same transaction in 3 files
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(3)
  })

  it('handles no duplicates gracefully', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'STORE A' }),
      createTransaction({ id: 'b', title: 'STORE B' }),
      createTransaction({ id: 'c', title: 'STORE C' }),
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('handles empty transaction list', () => {
    const groups = findDuplicates([])

    expect(groups).toHaveLength(0)
  })

  it('distinguishes transactions by date', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', date: new Date('2024-05-11'), sourceFile: 'f2.csv' }), // Different date
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('distinguishes transactions by amount', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -50, sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', amount: -51, sourceFile: 'f2.csv' }), // Different amount
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('distinguishes transactions by title', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'STORE A', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', title: 'STORE B', sourceFile: 'f2.csv' }), // Different title
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('distinguishes transactions by reference number', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', referenceNumber: 'REF1', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', referenceNumber: 'REF2', sourceFile: 'f2.csv' }), // Different ref
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(0)
  })

  it('finds multiple duplicate groups', () => {
    const transactions: Transaction[] = [
      // Group 1: STORE A
      createTransaction({ id: 'a1', title: 'STORE A', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'a2', title: 'STORE A', sourceFile: 'f2.csv' }),
      // Group 2: STORE B
      createTransaction({ id: 'b1', title: 'STORE B', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b2', title: 'STORE B', sourceFile: 'f2.csv' }),
      // Not a duplicate
      createTransaction({ id: 'c1', title: 'STORE C', sourceFile: 'f1.csv' }),
    ]

    const groups = findDuplicates(transactions)

    expect(groups).toHaveLength(2)
  })

  it('sorts duplicate groups by date', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'b1', date: new Date('2024-06-01'), title: 'JUNE', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b2', date: new Date('2024-06-01'), title: 'JUNE', sourceFile: 'f2.csv' }),
      createTransaction({ id: 'a1', date: new Date('2024-05-01'), title: 'MAY', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'a2', date: new Date('2024-05-01'), title: 'MAY', sourceFile: 'f2.csv' }),
    ]

    const groups = findDuplicates(transactions)

    expect(groups[0].title).toBe('MAY')
    expect(groups[1].title).toBe('JUNE')
  })
})

describe('getTransactionsToRemove', () => {
  it('returns all but first occurrence', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }),
      createTransaction({ id: 'c', sourceFile: 'f3.csv' }),
    ]

    const groups = findDuplicates(transactions)
    const toRemove = getTransactionsToRemove(groups)

    expect(toRemove).toHaveLength(2)
    expect(toRemove.map(t => t.id)).toContain('b')
    expect(toRemove.map(t => t.id)).toContain('c')
    expect(toRemove.map(t => t.id)).not.toContain('a')
  })
})

describe('removeDuplicates', () => {
  it('removes specified transactions by id', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a' }),
      createTransaction({ id: 'b' }),
      createTransaction({ id: 'c' }),
    ]

    const toRemove = [transactions[1]] // Remove 'b'
    const result = removeDuplicates(transactions, toRemove)

    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toEqual(['a', 'c'])
  })

  it('keeps first occurrence when removing duplicates', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }),
    ]

    const groups = findDuplicates(transactions)
    const toRemove = getTransactionsToRemove(groups)
    const result = removeDuplicates(transactions, toRemove)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a') // First occurrence kept
  })

  it('handles empty toRemove list', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a' }),
      createTransaction({ id: 'b' }),
    ]

    const result = removeDuplicates(transactions, [])

    expect(result).toHaveLength(2)
  })
})

describe('markDuplicates', () => {
  it('sets isDuplicate flag on duplicate transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }), // Duplicate
      createTransaction({ id: 'c', title: 'OTHER', sourceFile: 'f1.csv' }), // Not duplicate
    ]

    const groups = findDuplicates(transactions)
    const marked = markDuplicates(transactions, groups)

    expect(marked.find(t => t.id === 'a')?.isDuplicate).toBe(true)
    expect(marked.find(t => t.id === 'b')?.isDuplicate).toBe(true)
    expect(marked.find(t => t.id === 'c')?.isDuplicate).toBe(false)
  })

  it('does not mutate original transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }),
    ]

    const groups = findDuplicates(transactions)
    markDuplicates(transactions, groups)

    expect(transactions[0].isDuplicate).toBeUndefined()
  })
})

describe('deduplicateTransactions', () => {
  it('removes duplicates and returns info', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }),
      createTransaction({ id: 'c', title: 'OTHER' }),
    ]

    const result = deduplicateTransactions(transactions)

    expect(result.transactions).toHaveLength(2)
    expect(result.duplicateGroups).toHaveLength(1)
    expect(result.removedCount).toBe(1)
  })

  it('handles all transactions being duplicates', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', sourceFile: 'f1.csv' }),
      createTransaction({ id: 'b', sourceFile: 'f2.csv' }),
      createTransaction({ id: 'c', sourceFile: 'f3.csv' }),
    ]

    const result = deduplicateTransactions(transactions)

    expect(result.transactions).toHaveLength(1) // Only first kept
    expect(result.removedCount).toBe(2)
  })

  it('handles no duplicates', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'A' }),
      createTransaction({ id: 'b', title: 'B' }),
      createTransaction({ id: 'c', title: 'C' }),
    ]

    const result = deduplicateTransactions(transactions)

    expect(result.transactions).toHaveLength(3)
    expect(result.duplicateGroups).toHaveLength(0)
    expect(result.removedCount).toBe(0)
  })
})
