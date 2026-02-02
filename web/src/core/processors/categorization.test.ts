import { describe, it, expect } from 'vitest'
import {
  suggestCategories,
  applyCategories,
  getAutocomplete,
  getUniqueCategories,
  createMapping,
  getCategorizationProgress,
  getTransactionsByCategory,
} from './categorization'
import type { Transaction } from '../types'
import type { CategoryMapping } from '../types/category'

// Helper to create test transactions
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: -50, // Default to expense
    title: 'TEST STORE',
    name: '',
    referenceNumber: 'REF123',
    message: '',
    sourceFile: 'file1.csv',
    ...overrides,
  }
}

describe('suggestCategories', () => {
  it('suggests titles ranked by total amount', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, title: 'LIDL' }),
      createTransaction({ id: 'b', amount: -50, title: 'LIDL' }),  // Total: 150
      createTransaction({ id: 'c', amount: -200, title: 'NETFLIX' }), // Total: 200
    ]

    const suggestions = suggestCategories(transactions)

    expect(suggestions[0].title).toBe('NETFLIX')
    expect(suggestions[0].totalAmount).toBe(200)
    expect(suggestions[1].title).toBe('LIDL')
    expect(suggestions[1].totalAmount).toBe(150)
  })

  it('counts transactions per title', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -10, title: 'LIDL' }),
      createTransaction({ id: 'b', amount: -10, title: 'LIDL' }),
      createTransaction({ id: 'c', amount: -10, title: 'LIDL' }),
    ]

    const suggestions = suggestCategories(transactions)

    expect(suggestions[0].transactionCount).toBe(3)
  })

  it('only includes uncategorized expenses', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, title: 'UNCATEGORIZED' }),
      createTransaction({ id: 'b', amount: -100, title: 'CATEGORIZED', category: 'Groceries' }),
      createTransaction({ id: 'c', amount: 100, title: 'INCOME' }), // Positive - ignored
    ]

    const suggestions = suggestCategories(transactions)

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].title).toBe('UNCATEGORIZED')
  })

  it('handles empty transaction list', () => {
    const suggestions = suggestCategories([])
    expect(suggestions).toHaveLength(0)
  })

  it('handles all transactions already categorized', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, category: 'Groceries' }),
    ]

    const suggestions = suggestCategories(transactions)
    expect(suggestions).toHaveLength(0)
  })
})

describe('applyCategories', () => {
  it('applies exact match mappings', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL HELSINKI HERTTONIEMI' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL HELSINKI HERTTONIEMI', category: 'Groceries', matchType: 'exact' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Groceries')
  })

  it('applies contains match mappings', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL HELSINKI HERTTONIEMI' }),
      createTransaction({ id: 'b', title: 'LIDL ESPOO' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Groceries')
    expect(result[1].category).toBe('Groceries')
  })

  it('exact match takes precedence over contains', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL PREMIUM' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
      { pattern: 'LIDL PREMIUM', category: 'Premium Groceries', matchType: 'exact' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Premium Groceries')
  })

  it('is case insensitive', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'lidl helsinki' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Groceries')
  })

  it('leaves unmatched transactions uncategorized', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'UNKNOWN STORE' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBeUndefined()
  })

  it('does not recategorize already categorized transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL', category: 'Existing Category' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'New Category', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Existing Category')
  })

  it('does not categorize income transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, title: 'LIDL REFUND' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBeUndefined()
  })

  it('does not mutate original transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
    ]

    applyCategories(transactions, mappings)

    expect(transactions[0].category).toBeUndefined()
  })

  it('first contains match wins', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', title: 'LIDL FOOD' }),
    ]

    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
      { pattern: 'FOOD', category: 'Food', matchType: 'contains' },
    ]

    const result = applyCategories(transactions, mappings)

    expect(result[0].category).toBe('Groceries') // First match
  })
})

describe('getAutocomplete', () => {
  const categories = ['Groceries', 'Entertainment', 'Transport', 'Utilities']

  it('returns matching categories', () => {
    const results = getAutocomplete('gro', categories)
    expect(results).toEqual(['Groceries'])
  })

  it('is case insensitive', () => {
    const results = getAutocomplete('GRO', categories)
    expect(results).toEqual(['Groceries'])
  })

  it('matches anywhere in category name', () => {
    const results = getAutocomplete('ent', categories)
    expect(results).toContain('Entertainment')
  })

  it('returns all categories when input is empty', () => {
    const results = getAutocomplete('', categories)
    expect(results).toHaveLength(4)
  })

  it('returns sorted results', () => {
    const results = getAutocomplete('', ['Zebra', 'Apple', 'Mango'])
    expect(results).toEqual(['Apple', 'Mango', 'Zebra'])
  })

  it('returns empty array when no matches', () => {
    const results = getAutocomplete('xyz', categories)
    expect(results).toHaveLength(0)
  })

  it('handles whitespace in input', () => {
    const results = getAutocomplete('  gro  ', categories)
    expect(results).toEqual(['Groceries'])
  })
})

describe('getUniqueCategories', () => {
  it('returns unique category names', () => {
    const mappings: CategoryMapping[] = [
      { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
      { pattern: 'PRISMA', category: 'Groceries', matchType: 'contains' },
      { pattern: 'NETFLIX', category: 'Entertainment', matchType: 'contains' },
    ]

    const categories = getUniqueCategories(mappings)

    expect(categories).toHaveLength(2)
    expect(categories).toContain('Groceries')
    expect(categories).toContain('Entertainment')
  })

  it('returns sorted categories', () => {
    const mappings: CategoryMapping[] = [
      { pattern: 'Z', category: 'Zebra', matchType: 'exact' },
      { pattern: 'A', category: 'Apple', matchType: 'exact' },
    ]

    const categories = getUniqueCategories(mappings)

    expect(categories).toEqual(['Apple', 'Zebra'])
  })
})

describe('createMapping', () => {
  it('creates exact mapping by default', () => {
    const mapping = createMapping('LIDL', 'Groceries')

    expect(mapping.pattern).toBe('LIDL')
    expect(mapping.category).toBe('Groceries')
    expect(mapping.matchType).toBe('exact')
  })

  it('creates contains mapping when specified', () => {
    const mapping = createMapping('LIDL', 'Groceries', 'contains')

    expect(mapping.matchType).toBe('contains')
  })
})

describe('getCategorizationProgress', () => {
  it('calculates progress stats', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, category: 'Groceries' }),
      createTransaction({ id: 'b', amount: -100, category: 'Entertainment' }),
      createTransaction({ id: 'c', amount: -100 }), // Uncategorized
      createTransaction({ id: 'd', amount: 100 }), // Income - ignored
    ]

    const progress = getCategorizationProgress(transactions)

    expect(progress.totalExpenses).toBe(3)
    expect(progress.categorized).toBe(2)
    expect(progress.uncategorized).toBe(1)
    expect(progress.categorizedAmount).toBe(200)
    expect(progress.uncategorizedAmount).toBe(100)
    expect(progress.percentComplete).toBe(67) // 200/300 = 67%
  })

  it('handles no expenses', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100 }), // Income only
    ]

    const progress = getCategorizationProgress(transactions)

    expect(progress.totalExpenses).toBe(0)
    expect(progress.percentComplete).toBe(100) // Nothing to categorize
  })

  it('handles all categorized', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, category: 'Groceries' }),
    ]

    const progress = getCategorizationProgress(transactions)

    expect(progress.percentComplete).toBe(100)
  })
})

describe('getTransactionsByCategory', () => {
  it('groups expenses by category', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: -100, category: 'Groceries' }),
      createTransaction({ id: 'b', amount: -50, category: 'Groceries' }),
      createTransaction({ id: 'c', amount: -200, category: 'Entertainment' }),
      createTransaction({ id: 'd', amount: -75 }), // Uncategorized
    ]

    const grouped = getTransactionsByCategory(transactions)

    expect(grouped.get('Groceries')).toHaveLength(2)
    expect(grouped.get('Entertainment')).toHaveLength(1)
    expect(grouped.get('Uncategorized')).toHaveLength(1)
  })

  it('excludes income transactions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, category: 'Income' }),
    ]

    const grouped = getTransactionsByCategory(transactions)

    expect(grouped.size).toBe(0)
  })
})
