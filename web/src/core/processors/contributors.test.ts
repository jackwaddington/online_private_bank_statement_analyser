import { describe, it, expect } from 'vitest'
import {
  extractNameFromTitle,
  normalizeName,
  findTopContributors,
  findAllContributors,
  tagContributions,
  getTransactionsByContributor,
} from './contributors'
import type { Transaction } from '../types'

// Helper to create test transactions
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: 100, // Default to income
    title: 'TEST PERSON',
    name: '',
    referenceNumber: 'REF123',
    message: '',
    sourceFile: 'file1.csv',
    ...overrides,
  }
}

describe('extractNameFromTitle', () => {
  it('extracts first word from title', () => {
    expect(extractNameFromTitle('ALEX ROWAN NGUYEN')).toBe('alex')
  })

  it('is case insensitive', () => {
    expect(extractNameFromTitle('John Smith')).toBe('john')
    expect(extractNameFromTitle('JOHN SMITH')).toBe('john')
    expect(extractNameFromTitle('john smith')).toBe('john')
  })

  it('skips leading numbers', () => {
    expect(extractNameFromTitle('123 PAYMENT FROM ALEX')).toBe('payment')
  })

  it('handles empty string', () => {
    expect(extractNameFromTitle('')).toBe('')
  })

  it('handles string with no letters', () => {
    expect(extractNameFromTitle('12345')).toBe('')
  })

  it('handles special characters', () => {
    expect(extractNameFromTitle('ALEX-SMITH')).toBe('alex')
  })
})

describe('normalizeName', () => {
  it('capitalizes first letter', () => {
    expect(normalizeName('alex')).toBe('Alex')
  })

  it('lowercases rest of name', () => {
    expect(normalizeName('ALEX')).toBe('Alex')
  })

  it('handles empty string', () => {
    expect(normalizeName('')).toBe('')
  })

  it('handles single character', () => {
    expect(normalizeName('a')).toBe('A')
  })
})

describe('findTopContributors', () => {
  it('finds top N contributors by total amount', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'ALEX' }),
      createTransaction({ id: 'b', amount: 300, name: 'JORDAN' }),
      createTransaction({ id: 'c', amount: 200, name: 'ALEX' }), // Alex total: 700
      createTransaction({ id: 'd', amount: 100, name: 'SAM' }),
    ]

    const top2 = findTopContributors(transactions, 2)

    expect(top2).toHaveLength(2)
    expect(top2[0].name).toBe('Alex')
    expect(top2[0].total).toBe(700)
    expect(top2[1].name).toBe('Jordan')
    expect(top2[1].total).toBe(300)
  })

  it('only considers positive amounts (income)', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'ALEX' }),
      createTransaction({ id: 'b', amount: -200, name: 'ALEX' }), // Expense - ignored
      createTransaction({ id: 'c', amount: 300, name: 'JORDAN' }),
    ]

    const contributors = findTopContributors(transactions, 10)

    expect(contributors.find(c => c.name === 'Alex')?.total).toBe(500) // Not 300
  })

  it('extracts name from title when Name field is empty', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: '', title: 'ALEX ROWAN NGUYEN' }),
    ]

    const contributors = findTopContributors(transactions, 2)

    expect(contributors[0].name).toBe('Alex')
  })

  it('prefers Name field over Title when available', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'JORDAN SMITH', title: 'ALEX PAYMENT' }),
    ]

    const contributors = findTopContributors(transactions, 2)

    expect(contributors[0].name).toBe('Jordan')
  })

  it('counts transactions per contributor', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, name: 'ALEX' }),
      createTransaction({ id: 'b', amount: 100, name: 'ALEX' }),
      createTransaction({ id: 'c', amount: 100, name: 'ALEX' }),
      createTransaction({ id: 'd', amount: 500, name: 'JORDAN' }),
    ]

    const contributors = findTopContributors(transactions, 10)

    expect(contributors.find(c => c.name === 'Alex')?.transactionCount).toBe(3)
    expect(contributors.find(c => c.name === 'Jordan')?.transactionCount).toBe(1)
  })

  it('handles empty transaction list', () => {
    const contributors = findTopContributors([], 2)
    expect(contributors).toHaveLength(0)
  })

  it('handles no income transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100 }), // All expenses
      createTransaction({ id: 'b', amount: -200 }),
    ]

    const contributors = findTopContributors(transactions, 2)
    expect(contributors).toHaveLength(0)
  })

  it('defaults to top 2 contributors', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, name: 'A' }),
      createTransaction({ id: 'b', amount: 100, name: 'B' }),
      createTransaction({ id: 'c', amount: 100, name: 'C' }),
    ]

    const contributors = findTopContributors(transactions)

    expect(contributors).toHaveLength(2)
  })
})

describe('findAllContributors', () => {
  it('returns all contributors', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, name: 'A' }),
      createTransaction({ id: 'b', amount: 100, name: 'B' }),
      createTransaction({ id: 'c', amount: 100, name: 'C' }),
      createTransaction({ id: 'd', amount: 100, name: 'D' }),
    ]

    const contributors = findAllContributors(transactions)

    expect(contributors).toHaveLength(4)
  })
})

describe('tagContributions', () => {
  it('tags income with matching contributor name', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'ALEX' }),
      createTransaction({ id: 'b', amount: 300, name: 'JORDAN' }),
    ]

    const tagged = tagContributions(transactions, ['Alex', 'Jordan'])

    expect(tagged[0].contributor).toBe('Alex')
    expect(tagged[1].contributor).toBe('Jordan')
  })

  it('tags unselected contributors as Other', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'ALEX' }),
      createTransaction({ id: 'b', amount: 300, name: 'JORDAN' }),
      createTransaction({ id: 'c', amount: 100, name: 'SAM' }),
    ]

    const tagged = tagContributions(transactions, ['Alex']) // Only Alex selected

    expect(tagged[0].contributor).toBe('Alex')
    expect(tagged[1].contributor).toBe('Other')
    expect(tagged[2].contributor).toBe('Other')
  })

  it('is case insensitive for matching', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'alex' }),
      createTransaction({ id: 'b', amount: 300, name: 'ALEX' }),
    ]

    const tagged = tagContributions(transactions, ['ALEX'])

    expect(tagged[0].contributor).toBe('Alex')
    expect(tagged[1].contributor).toBe('Alex')
  })

  it('does not tag expense transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, title: 'ALEX STORE' }),
    ]

    const tagged = tagContributions(transactions, ['Alex'])

    expect(tagged[0].contributor).toBeUndefined()
  })

  it('does not mutate original transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, name: 'ALEX' }),
    ]

    tagContributions(transactions, ['Alex'])

    expect(transactions[0].contributor).toBeUndefined()
  })
})

describe('getTransactionsByContributor', () => {
  it('groups tagged transactions by contributor', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 300, contributor: 'Alex' }),
      createTransaction({ id: 'c', amount: 200, contributor: 'Jordan' }),
      createTransaction({ id: 'd', amount: -100 }), // Expense, no contributor
    ]

    const grouped = getTransactionsByContributor(transactions)

    expect(grouped.get('Alex')).toHaveLength(2)
    expect(grouped.get('Jordan')).toHaveLength(1)
    expect(grouped.has('Other')).toBe(false) // No 'Other' in this test
  })

  it('excludes expense transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, contributor: 'Alex' }), // Expense
    ]

    const grouped = getTransactionsByContributor(transactions)

    expect(grouped.size).toBe(0)
  })
})
