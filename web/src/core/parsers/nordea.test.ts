import { describe, it, expect } from 'vitest'
import { parseNordeaCSV, parseMultipleCSVs, CSVParseError } from './nordea'

// Sample CSV matching actual Nordea format
const VALID_CSV = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;-39,99;FI69 2000 4200 0420 42;;;Fat Lizard Otaniemi - 789;HELSINKI;654123;123,45;EUR;
2024/05/10;800,00;;FI69 2000 4200 0420 42;ALEX ROWAN NGUYEN;ALEX ROWAN NGUYEN;;;923,45;EUR;
2024/05/10;-64,39;FI69 2000 4200 0420 42;;;ALEPA VUOSAARI;HELSINKI;21354;859,06;EUR;
2024/05/13;-62,97;FI69 2000 4200 0420 42;;;LIDL HELSINKI HERTTONIEMI;HELSINKI;654123;796,09;EUR;`

describe('parseNordeaCSV', () => {
  it('parses valid CSV with multiple rows', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'test.csv')

    expect(transactions).toHaveLength(4)
  })

  it('assigns correct IDs with filename prefix', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'may2024.csv')

    expect(transactions[0].id).toBe('may2024.csv-0')
    expect(transactions[1].id).toBe('may2024.csv-1')
    expect(transactions[2].id).toBe('may2024.csv-2')
  })

  it('includes source filename on each transaction', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'statements/202405.csv')

    transactions.forEach(t => {
      expect(t.sourceFile).toBe('statements/202405.csv')
    })
  })

  it('parses dates correctly', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'test.csv')

    expect(transactions[0].date).toEqual(new Date(2024, 4, 1)) // May 1
    expect(transactions[1].date).toEqual(new Date(2024, 4, 10)) // May 10
  })

  it('handles semicolon separator', () => {
    // If it didn't handle semicolons, we'd get one "column" with all data
    const transactions = parseNordeaCSV(VALID_CSV, 'test.csv')

    expect(transactions[0].title).toBe('Fat Lizard Otaniemi - 789')
    expect(transactions[2].title).toBe('ALEPA VUOSAARI')
  })

  it('converts comma decimals to numbers', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'test.csv')

    expect(transactions[0].amount).toBe(-39.99)
    expect(transactions[1].amount).toBe(800)
    expect(transactions[2].amount).toBe(-64.39)
  })

  it('preserves reference numbers with leading zeros', () => {
    const csvWithLeadingZeros = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;-10,00;FI123;;;Test;MSG;00123456;100,00;EUR;`

    const transactions = parseNordeaCSV(csvWithLeadingZeros, 'test.csv')

    expect(transactions[0].referenceNumber).toBe('00123456')
    expect(typeof transactions[0].referenceNumber).toBe('string')
  })

  it('parses name field for income transactions', () => {
    const transactions = parseNordeaCSV(VALID_CSV, 'test.csv')

    // Income transaction (positive amount) has name
    expect(transactions[1].name).toBe('ALEX ROWAN NGUYEN')
    expect(transactions[1].amount).toBeGreaterThan(0)

    // Expense transactions typically have empty name
    expect(transactions[0].name).toBe('')
  })

  it('handles large numbers with thousand separators', () => {
    const csvWithLargeAmount = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;1.234,56;FI123;;Big Corp;Large Payment;;REF123;5.000,00;EUR;`

    const transactions = parseNordeaCSV(csvWithLargeAmount, 'test.csv')

    expect(transactions[0].amount).toBe(1234.56)
  })

  it('trims whitespace from title', () => {
    const csvWithWhitespace = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;-10,00;FI123;;;  Padded Title  ;MSG;REF;100,00;EUR;`

    const transactions = parseNordeaCSV(csvWithWhitespace, 'test.csv')

    expect(transactions[0].title).toBe('Padded Title')
  })

  it('throws CSVParseError on empty file', () => {
    expect(() => parseNordeaCSV('', 'empty.csv'))
      .toThrow(CSVParseError)

    expect(() => parseNordeaCSV('   ', 'whitespace.csv'))
      .toThrow(CSVParseError)
  })

  it('throws CSVParseError on wrong column format', () => {
    const wrongFormat = `Date,Amount,Description
2024-05-01,100,Test`

    expect(() => parseNordeaCSV(wrongFormat, 'wrong.csv'))
      .toThrow(CSVParseError)

    try {
      parseNordeaCSV(wrongFormat, 'wrong.csv')
    } catch (error) {
      expect(error).toBeInstanceOf(CSVParseError)
      expect((error as CSVParseError).message).toContain('Missing required columns')
    }
  })

  it('throws CSVParseError with filename context', () => {
    try {
      parseNordeaCSV('', 'my-file.csv')
    } catch (error) {
      expect(error).toBeInstanceOf(CSVParseError)
      expect((error as CSVParseError).filename).toBe('my-file.csv')
    }
  })

  it('throws CSVParseError on invalid date', () => {
    const invalidDate = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
invalid-date;-10,00;FI123;;;Test;MSG;REF;100,00;EUR;`

    expect(() => parseNordeaCSV(invalidDate, 'test.csv'))
      .toThrow(CSVParseError)
  })

  it('throws CSVParseError on invalid amount', () => {
    const invalidAmount = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;not-a-number;FI123;;;Test;MSG;REF;100,00;EUR;`

    expect(() => parseNordeaCSV(invalidAmount, 'test.csv'))
      .toThrow(CSVParseError)
  })

  it('skips rows with empty booking date', () => {
    const csvWithEmptyRow = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;-10,00;FI123;;;Test;MSG;REF;100,00;EUR;
;;;;;;;;;;`

    const transactions = parseNordeaCSV(csvWithEmptyRow, 'test.csv')

    expect(transactions).toHaveLength(1)
  })

  it('handles header-only CSV (no data rows)', () => {
    const headerOnly = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;`

    expect(() => parseNordeaCSV(headerOnly, 'test.csv'))
      .toThrow(CSVParseError)
  })
})

describe('parseMultipleCSVs', () => {
  const CSV_MAY = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/05/01;-50,00;FI123;;;May Purchase;MSG;REF1;100,00;EUR;
2024/05/15;-25,00;FI123;;;May Purchase 2;MSG;REF2;75,00;EUR;`

  const CSV_JUNE = `Booking date;Amount;Sender;Recipient;Name;Title;Message;Reference number;Balance;Currency;
2024/06/01;-30,00;FI123;;;June Purchase;MSG;REF3;45,00;EUR;
2024/06/10;500,00;;FI123;CONTRIBUTOR;CONTRIBUTOR;;REF4;545,00;EUR;`

  it('merges transactions from multiple files', () => {
    const transactions = parseMultipleCSVs([
      { filename: 'may.csv', content: CSV_MAY },
      { filename: 'june.csv', content: CSV_JUNE },
    ])

    expect(transactions).toHaveLength(4)
  })

  it('preserves source file on each transaction', () => {
    const transactions = parseMultipleCSVs([
      { filename: 'may.csv', content: CSV_MAY },
      { filename: 'june.csv', content: CSV_JUNE },
    ])

    const mayTransactions = transactions.filter(t => t.sourceFile === 'may.csv')
    const juneTransactions = transactions.filter(t => t.sourceFile === 'june.csv')

    expect(mayTransactions).toHaveLength(2)
    expect(juneTransactions).toHaveLength(2)
  })

  it('sorts transactions by date (oldest first)', () => {
    // Provide files in reverse order
    const transactions = parseMultipleCSVs([
      { filename: 'june.csv', content: CSV_JUNE },
      { filename: 'may.csv', content: CSV_MAY },
    ])

    // Should still be sorted by date
    expect(transactions[0].date).toEqual(new Date(2024, 4, 1))  // May 1
    expect(transactions[1].date).toEqual(new Date(2024, 4, 15)) // May 15
    expect(transactions[2].date).toEqual(new Date(2024, 5, 1))  // June 1
    expect(transactions[3].date).toEqual(new Date(2024, 5, 10)) // June 10
  })

  it('handles empty file list', () => {
    const transactions = parseMultipleCSVs([])
    expect(transactions).toHaveLength(0)
  })

  it('throws if any file is invalid', () => {
    expect(() => parseMultipleCSVs([
      { filename: 'good.csv', content: CSV_MAY },
      { filename: 'bad.csv', content: '' },
    ])).toThrow(CSVParseError)
  })
})
