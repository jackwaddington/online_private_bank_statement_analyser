import { describe, it, expect } from 'vitest'
import {
  RawNordeaRowSchema,
  TransactionSchema,
  parseEuropeanDecimal,
  parseNordeaDate,
  type Transaction,
} from './transaction'

describe('RawNordeaRowSchema', () => {
  it('accepts valid Nordea CSV row', () => {
    const validRow = {
      'Booking date': '2024/05/10',
      'Amount': '-64,39',
      'Sender': 'FI69 2000 4200 0420 42',
      'Recipient': '',
      'Name': '',
      'Title': 'ALEPA VUOSAARI',
      'Message': 'HELSINKI',
      'Reference number': '21354',
      'Balance': '123,45',
      'Currency': 'EUR',
    }

    const result = RawNordeaRowSchema.safeParse(validRow)
    expect(result.success).toBe(true)
  })

  it('accepts row with empty optional fields', () => {
    const row = {
      'Booking date': '2024/05/01',
      'Amount': '800,00',
      'Sender': '',
      'Recipient': 'FI69 2000 4200 0420 42',
      'Name': 'ALEX ROWAN NGUYEN',
      'Title': 'ALEX ROWAN NGUYEN',
      'Message': '',
      'Reference number': '',
      'Balance': '923,45',
      'Currency': 'EUR',
    }

    const result = RawNordeaRowSchema.safeParse(row)
    expect(result.success).toBe(true)
  })

  it('rejects row with missing required field', () => {
    const invalidRow = {
      'Booking date': '2024/05/10',
      // Missing 'Amount'
      'Sender': '',
      'Recipient': '',
      'Name': '',
      'Title': 'TEST',
      'Message': '',
      'Reference number': '',
      'Balance': '',
      'Currency': 'EUR',
    }

    const result = RawNordeaRowSchema.safeParse(invalidRow)
    expect(result.success).toBe(false)
  })
})

describe('parseEuropeanDecimal', () => {
  it('parses simple decimal with comma', () => {
    expect(parseEuropeanDecimal('45,99')).toBe(45.99)
  })

  it('parses negative number', () => {
    expect(parseEuropeanDecimal('-45,99')).toBe(-45.99)
  })

  it('parses number with thousand separator', () => {
    expect(parseEuropeanDecimal('1.234,56')).toBe(1234.56)
  })

  it('parses large number with multiple thousand separators', () => {
    expect(parseEuropeanDecimal('1.234.567,89')).toBe(1234567.89)
  })

  it('parses whole number without decimal', () => {
    expect(parseEuropeanDecimal('800,00')).toBe(800)
  })

  it('parses zero', () => {
    expect(parseEuropeanDecimal('0,00')).toBe(0)
  })

  it('throws on invalid format', () => {
    expect(() => parseEuropeanDecimal('invalid')).toThrow('Invalid number format')
  })

  it('throws on empty string', () => {
    expect(() => parseEuropeanDecimal('')).toThrow('Invalid number format')
  })
})

describe('parseNordeaDate', () => {
  it('parses standard date format YYYY/MM/DD', () => {
    const date = parseNordeaDate('2024/05/10')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(4) // 0-indexed, so May = 4
    expect(date.getDate()).toBe(10)
  })

  it('parses date with single-digit month and day', () => {
    const date = parseNordeaDate('2024/5/1')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(4)
    expect(date.getDate()).toBe(1)
  })

  it('parses end of year date', () => {
    const date = parseNordeaDate('2024/12/31')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(11) // December = 11
    expect(date.getDate()).toBe(31)
  })

  it('throws on invalid format', () => {
    expect(() => parseNordeaDate('2024-05-10')).toThrow('Invalid date format')
  })

  it('throws on incomplete date', () => {
    expect(() => parseNordeaDate('2024/05')).toThrow('Invalid date format')
  })
})

describe('TransactionSchema', () => {
  it('validates a complete transaction', () => {
    const transaction: Transaction = {
      id: 'file1-0',
      date: new Date('2024-05-10'),
      amount: -64.39,
      title: 'ALEPA VUOSAARI',
      name: '',
      referenceNumber: '21354',
      message: 'HELSINKI',
      sourceFile: 'file1.csv',
    }

    const result = TransactionSchema.safeParse(transaction)
    expect(result.success).toBe(true)
  })

  it('validates transaction with optional fields', () => {
    const transaction: Transaction = {
      id: 'file1-1',
      date: new Date('2024-05-10'),
      amount: 800,
      title: 'ALEX ROWAN NGUYEN',
      name: 'ALEX ROWAN NGUYEN',
      referenceNumber: '',
      message: '',
      sourceFile: 'file1.csv',
      category: 'Income',
      contributor: 'Alex',
      isDuplicate: false,
    }

    const result = TransactionSchema.safeParse(transaction)
    expect(result.success).toBe(true)
  })

  it('rejects transaction with empty id', () => {
    const transaction = {
      id: '',
      date: new Date('2024-05-10'),
      amount: -64.39,
      title: 'TEST',
      name: '',
      referenceNumber: '',
      message: '',
      sourceFile: 'file1.csv',
    }

    const result = TransactionSchema.safeParse(transaction)
    expect(result.success).toBe(false)
  })

  it('rejects transaction with invalid date', () => {
    const transaction = {
      id: 'file1-0',
      date: 'not a date', // Should be Date object
      amount: -64.39,
      title: 'TEST',
      name: '',
      referenceNumber: '',
      message: '',
      sourceFile: 'file1.csv',
    }

    const result = TransactionSchema.safeParse(transaction)
    expect(result.success).toBe(false)
  })
})
