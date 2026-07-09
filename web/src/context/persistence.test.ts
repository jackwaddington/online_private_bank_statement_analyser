import { describe, it, expect, beforeEach } from 'vitest'
import {
  serializeState,
  deserializeState,
  loadState,
  saveState,
  clearState,
  hasSavedSession,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from './persistence'
import { initialState } from './types'
import type { AppState } from './types'
import type { Transaction } from '../core/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  date: new Date('2024-03-15T00:00:00.000Z'),
  amount: -42.5,
  title: 'Coffee shop',
  name: 'Alice',
  referenceNumber: '00001',
  message: '',
  sourceFile: 'bank-march.csv',
  category: 'Food',
  contributor: 'Alice',
  ...overrides,
})

const stateWithData: AppState = {
  ...initialState,
  step: 'categorize',
  rawTransactions: [makeTransaction({ id: 'raw-1' })],
  transactions: [makeTransaction({ id: 'tx-1' }), makeTransaction({ id: 'tx-2', date: new Date('2024-04-01T00:00:00.000Z'), amount: 500, title: 'Salary' })],
  duplicateGroups: [
    {
      transactions: [makeTransaction({ id: 'dup-1' }), makeTransaction({ id: 'dup-2' })],
      date: new Date('2024-03-10T00:00:00.000Z'),
      amount: -10,
      title: 'Duplicate',
      referenceNumber: '99999',
    },
  ],
  duplicatesRemoved: 1,
  selectedContributors: ['Alice', 'Bob'],
  categoryMappings: [{ pattern: 'coffee', category: 'Food', matchType: 'contains' as const }],
  reportData: null,
}

// ─── Round-trip tests ─────────────────────────────────────────────────────────

describe('serializeState / deserializeState round-trip', () => {
  it('survives a round-trip with initialState', () => {
    const json = serializeState(initialState)
    const restored = deserializeState(json)
    expect(restored).not.toBeNull()
    expect(restored!.step).toBe('landing')
    expect(restored!.transactions).toHaveLength(0)
  })

  it('preserves Transaction.date as a real Date object', () => {
    const json = serializeState(stateWithData)
    const restored = deserializeState(json)!
    const tx = restored.transactions[0]
    expect(tx.date).toBeInstanceOf(Date)
    expect(tx.date.getTime()).toBe(new Date('2024-03-15T00:00:00.000Z').getTime())
  })

  it('preserves rawTransactions dates', () => {
    const json = serializeState(stateWithData)
    const restored = deserializeState(json)!
    expect(restored.rawTransactions[0].date).toBeInstanceOf(Date)
  })

  it('preserves duplicateGroup dates', () => {
    const json = serializeState(stateWithData)
    const restored = deserializeState(json)!
    const group = restored.duplicateGroups[0]
    expect(group.date).toBeInstanceOf(Date)
    expect(group.date.getTime()).toBe(new Date('2024-03-10T00:00:00.000Z').getTime())
    expect(group.transactions[0].date).toBeInstanceOf(Date)
  })

  it('preserves all scalar fields', () => {
    const json = serializeState(stateWithData)
    const restored = deserializeState(json)!
    expect(restored.step).toBe('categorize')
    expect(restored.duplicatesRemoved).toBe(1)
    expect(restored.selectedContributors).toEqual(['Alice', 'Bob'])
    expect(restored.categoryMappings).toEqual([{ pattern: 'coffee', category: 'Food', matchType: 'contains' }])
  })

  it('preserves reportData with Map and Date when present', () => {
    const stateWithReport: AppState = {
      ...stateWithData,
      step: 'report',
      reportData: {
        dataQuality: {
          dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
          totalFiles: 2,
          totalTransactions: 10,
          incomeTransactions: 5,
          expenseTransactions: 5,
          duplicatesFound: 1,
          duplicatesRemoved: 1,
          missingWeeks: [],
          missingMonths: [],
        },
        contributions: {
          contributors: [],
          monthly: [],
          cumulative: [],
          totalDifference: 0,
          equalisationAmount: 0,
        },
        spending: {
          byCategory: new Map([['Food', 100], ['Transport', 50]]),
          monthly: [],
          uncategorized: [makeTransaction({ id: 'uncat-1' })],
          uncategorizedTotal: 42.5,
          uncategorizedCount: 1,
        },
        cashFlow: {
          monthly: [],
          totalIncome: 500,
          totalOutgoings: 150,
          netBalance: 350,
        },
      },
    }

    const json = serializeState(stateWithReport)
    const restored = deserializeState(json)!

    // ReportData dates
    expect(restored.reportData!.dataQuality.dateRange.start).toBeInstanceOf(Date)
    expect(restored.reportData!.dataQuality.dateRange.end).toBeInstanceOf(Date)

    // Map revived
    expect(restored.reportData!.spending.byCategory).toBeInstanceOf(Map)
    expect(restored.reportData!.spending.byCategory.get('Food')).toBe(100)
    expect(restored.reportData!.spending.byCategory.get('Transport')).toBe(50)

    // Uncategorized transaction date revived
    expect(restored.reportData!.spending.uncategorized[0].date).toBeInstanceOf(Date)
  })

  it('embeds the schema version', () => {
    const json = serializeState(initialState)
    const blob = JSON.parse(json)
    expect(blob.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('embeds a savedAt timestamp', () => {
    const before = Date.now()
    const json = serializeState(initialState)
    const after = Date.now()
    const blob = JSON.parse(json)
    const ts = new Date(blob.savedAt).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

describe('deserializeState — error handling', () => {
  it('returns null for invalid JSON', () => {
    expect(deserializeState('not json')).toBeNull()
  })

  it('returns null for wrong schema version', () => {
    const json = serializeState(initialState)
    const blob = JSON.parse(json)
    blob.schemaVersion = 999
    expect(deserializeState(JSON.stringify(blob))).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(deserializeState('')).toBeNull()
  })
})

// ─── localStorage helpers ─────────────────────────────────────────────────────

describe('loadState / saveState / clearState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is saved', () => {
    expect(loadState()).toBeNull()
  })

  it('round-trips through localStorage', () => {
    saveState(stateWithData)
    const restored = loadState()!
    expect(restored.step).toBe('categorize')
    expect(restored.transactions[0].date).toBeInstanceOf(Date)
  })

  it('clearState removes the key', () => {
    saveState(stateWithData)
    clearState()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(loadState()).toBeNull()
  })

  it('returns null when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json}')
    expect(loadState()).toBeNull()
  })
})

describe('hasSavedSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns false when nothing is saved', () => {
    expect(hasSavedSession()).toBe(false)
  })

  it('returns false when saved state is on landing step', () => {
    saveState(initialState) // step === 'landing'
    expect(hasSavedSession()).toBe(false)
  })

  it('returns true when saved state is past landing', () => {
    saveState(stateWithData) // step === 'categorize'
    expect(hasSavedSession()).toBe(true)
  })
})
