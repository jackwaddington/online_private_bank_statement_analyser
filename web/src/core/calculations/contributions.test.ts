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
    amount: 500,
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
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500, contributor: 'Alex' }),
      createTransaction({ id: 'b', date: new Date('2024-05-20'), amount: 300, contributor: 'Alex' }),
      createTransaction({ id: 'c', date: new Date('2024-05-15'), amount: 400, contributor: 'Jordan' }),
    ]

    const result = calculateMonthlyContributions(
      transactions,
      ['Alex', 'Jordan'],
      ['2024-05']
    )

    const alexMay = result.find(r => r.month === '2024-05' && r.contributor === 'Alex')
    const jordanMay = result.find(r => r.month === '2024-05' && r.contributor === 'Jordan')

    expect(alexMay?.amount).toBe(800)
    expect(jordanMay?.amount).toBe(400)
  })

  it('fills zero for months with no contributions', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', date: new Date('2024-05-10'), amount: 500, contributor: 'Alex' }),
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
      createTransaction({ id: 'a', amount: 500, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 1000, contributor: 'Other' }),
    ]

    const result = calculateMonthlyContributions(
      transactions,
      ['Alex'],
      ['2024-05']
    )

    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(500)
  })
})

describe('calculateCumulativeContributions', () => {
  it('calculates cumulative correctly', () => {
    const monthly = [
      { month: '2024-05', contributor: 'Alex', amount: 500 },
      { month: '2024-05', contributor: 'Jordan', amount: 400 },
      { month: '2024-06', contributor: 'Alex', amount: 300 },
      { month: '2024-06', contributor: 'Jordan', amount: 200 },
    ]

    const result = calculateCumulativeContributions(monthly, ['Alex', 'Jordan'])

    const alexJune = result.find(r => r.month === '2024-06' && r.contributor === 'Alex')
    const jordanJune = result.find(r => r.month === '2024-06' && r.contributor === 'Jordan')

    expect(alexJune?.cumulative).toBe(800) // 500 + 300
    expect(jordanJune?.cumulative).toBe(600) // 400 + 200
  })
})

describe('calculateContributorSummaries', () => {
  it('calculates totals and averages', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 500, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 300, contributor: 'Alex' }),
      createTransaction({ id: 'c', amount: 400, contributor: 'Jordan' }),
    ]

    const summaries = calculateContributorSummaries(transactions, ['Alex', 'Jordan'], 2)

    expect(summaries[0].name).toBe('Alex')
    expect(summaries[0].total).toBe(800)
    expect(summaries[0].monthlyAverage).toBe(400)
  })

  it('sorts by total descending', () => {
    const transactions: Transaction[] = [
      createTransaction({ id: 'a', amount: 100, contributor: 'Small' }),
      createTransaction({ id: 'b', amount: 1000, contributor: 'Big' }),
    ]

    const summaries = calculateContributorSummaries(transactions, ['Small', 'Big'], 1)

    expect(summaries[0].name).toBe('Big')
  })
})

describe('calculateEqualisation', () => {
  it('calculates equalisation amount', () => {
    const summaries = [
      { name: 'Alex', total: 1000, monthlyAverage: 500 },
      { name: 'Jordan', total: 600, monthlyAverage: 300 },
    ]

    const result = calculateEqualisation(summaries)

    expect(result.difference).toBe(400)
    expect(result.equalisationAmount).toBe(200)
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
      createTransaction({ id: 'a', amount: 500, contributor: 'Alex' }),
      createTransaction({ id: 'b', amount: 100, contributor: 'Other' }),
      createTransaction({ id: 'c', amount: 50, contributor: 'Other' }),
    ]

    expect(calculateOtherIncome(transactions)).toBe(150)
  })
})
