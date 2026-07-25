import { describe, it, expect } from 'vitest'
import {
  formatMonth,
  getAllMonthsInRange,
  calculateMonthlyContributions,
  calculateCumulativeContributions,
  calculateContributorSummaries,
  calculateEqualisation,
  calculateOtherIncome,
} from './contributions'
import type { Transaction } from '../types'

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-0',
    date: new Date('2024-05-10'),
    amount: 50000, // €500 in cents
    title: 'TEST',
    name: '',
    referenceNumber: '',
    message: '',
    sourceFile: 'test.csv',
    ...overrides,
  }
}

describe('formatMonth', () => {
  it('formats date as YYYY-MM', () => {
    expect(formatMonth(new Date('2024-05-15'))).toBe('2024-05')
    expect(formatMonth(new Date('2024-12-01'))).toBe('2024-12')
    expect(formatMonth(new Date('2024-01-31'))).toBe('2024-01')
  })
})

describe('getAllMonthsInRange', () => {
  it('generates all months between dates', () => {
    const months = getAllMonthsInRange(
      new Date('2024-01-15'),
      new Date('2024-04-10')
    )

    expect(months).toEqual(['2024-01', '2024-02', '2024-03', '2024-04'])
  })

  it('handles single month', () => {
    const months = getAllMonthsInRange(
      new Date('2024-05-01'),
      new Date('2024-05-31')
    )

    expect(months).toEqual(['2024-05'])
  })

  it('handles year boundary', () => {
    const months = getAllMonthsInRange(
      new Date('2023-11-01'),
      new Date('2024-02-28')
    )

    expect(months).toEqual(['2023-11', '2023-12', '2024-01', '2024-02'])
  })
})

describe('calculateMonthlyContributions', () => {
  it('calculates monthly totals per contributor', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 50000, contributor: 'Alex' }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: 30000, contributor: 'Alex' }),
      createTransaction({ id: 'c', date: new Date('2024-05-15'), amount: 40000, contributor: 'Jordan' }),
    ]

    const result = calculateMonthlyContributions(
      transactions,
      ['Alex', 'Jordan'],
      ['2024-05']
    )

    const alexMay = result.find(r => r.month === '2024-05' && r.contributor === 'Alex')
    const jordanMay = result.find(r => r.month === '2024-05' && r.contributor === 'Jordan')

    expect(alexMay?.amount).toBe(80000)
    expect(jordanMay?.amount).toBe(40000)
  })

  it('fills zero for months with no contributions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 50000, contributor: 'Alex' }),
    ]

    const result = calculateMonthlyContributions(
      transactions,
      ['Alex', 'Jordan'],
      ['2024-05', '2024-06']
    )

    const jordanMay = result.find(r => r.month === '2024-05' && r.contributor === 'Jordan')
    const alexJune = result.find(r => r.month === '2024-06' && r.contributor === 'Alex')

    expect(jordanMay?.amount).toBe(0)
    expect(alexJune?.amount).toBe(0)
  })

  it('excludes "Other" contributor', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 50000, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 100000, contributor: 'Other' }),
    ]

    const result = calculateMonthlyContributions(
      transactions,
      ['Alex'],
      ['2024-05']
    )

    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(50000)
  })
})

describe('calculateCumulativeContributions', () => {
  it('calculates cumulative correctly', () => {
    const monthly = [
      { month: '2024-05', contributor: 'Alex', amount: 50000 },
      { month: '2024-05', contributor: 'Jordan', amount: 40000 },
      { month: '2024-06', contributor: 'Alex', amount: 30000 },
      { month: '2024-06', contributor: 'Jordan', amount: 20000 },
    ]

    const result = calculateCumulativeContributions(monthly, ['Alex', 'Jordan'])

    const alexJune = result.find(r => r.month === '2024-06' && r.contributor === 'Alex')
    const jordanJune = result.find(r => r.month === '2024-06' && r.contributor === 'Jordan')

    expect(alexJune?.cumulative).toBe(80000) // 50000 + 30000
    expect(jordanJune?.cumulative).toBe(60000) // 40000 + 20000
  })
})

describe('calculateContributorSummaries', () => {
  it('calculates totals and averages', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 50000, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 30000, contributor: 'Alex' }),
      createTransaction({ id: 'c', amount: 40000, contributor: 'Jordan' }),
    ]

    const summaries = calculateContributorSummaries(transactions, ['Alex', 'Jordan'], 2)

    expect(summaries[0].name).toBe('Alex')
    expect(summaries[0].total).toBe(80000)
    expect(summaries[0].monthlyAverage).toBe(40000)
  })

  it('sorts by total descending', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 10000, contributor: 'Small' }),
      createTransaction({ id: 'b', amount: 100000, contributor: 'Big' }),
    ]

    const summaries = calculateContributorSummaries(transactions, ['Small', 'Big'], 1)

    expect(summaries[0].name).toBe('Big')
  })
})

describe('calculateEqualisation', () => {
  it('calculates equalisation amount', () => {
    const summaries = [
      { name: 'Alex', total: 100000, monthlyAverage: 50000 },
      { name: 'Jordan', total: 60000, monthlyAverage: 30000 },
    ]

    const result = calculateEqualisation(summaries)

    expect(result.difference).toBe(40000)
    expect(result.equalisationAmount).toBe(20000)
    expect(result.higherContributor).toBe('Alex')
    expect(result.lowerContributor).toBe('Jordan')
  })

  it('handles single contributor', () => {
    const summaries = [
      { name: 'Alex', total: 1000, monthlyAverage: 500 },
    ]

    const result = calculateEqualisation(summaries)

    expect(result.difference).toBe(0)
    expect(result.equalisationAmount).toBe(0)
  })
})

describe('calculateOtherIncome', () => {
  it('sums income from Other contributor', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 50000, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 10000, contributor: 'Other' }),
      createTransaction({ id: 'c', amount: 5000, contributor: 'Other' }),
    ]

    expect(calculateOtherIncome(transactions)).toBe(15000)
  })
})
