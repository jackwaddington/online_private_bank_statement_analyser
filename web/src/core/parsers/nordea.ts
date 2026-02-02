import Papa from 'papaparse'
import {
  RawNordeaRowSchema,
  parseEuropeanDecimal,
  parseNordeaDate,
  type Transaction,
  type RawNordeaRow,
} from '../types'

/**
 * Error thrown when CSV parsing fails.
 */
export class CSVParseError extends Error {
  constructor(
    message: string,
    public readonly filename: string,
    public readonly row?: number
  ) {
    super(message)
    this.name = 'CSVParseError'
  }
}

/**
 * Expected columns in a Nordea CSV file.
 */
const EXPECTED_COLUMNS = [
  'Booking date',
  'Amount',
  'Sender',
  'Recipient',
  'Name',
  'Title',
  'Message',
  'Reference number',
  'Balance',
  'Currency',
]

/**
 * Parse a Nordea bank statement CSV string into Transaction objects.
 *
 * @param csvString - The raw CSV content as a string
 * @param filename - The name of the source file (for tracking)
 * @returns Array of parsed Transaction objects
 * @throws CSVParseError if the CSV is invalid or has wrong format
 */
export function parseNordeaCSV(csvString: string, filename: string): Transaction[] {
  // Trim and check for empty
  const trimmed = csvString.trim()
  if (!trimmed) {
    throw new CSVParseError('CSV file is empty', filename)
  }

  // Parse with Papa Parse
  const result = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  })

  // Check for parse errors
  if (result.errors.length > 0) {
    const firstError = result.errors[0]
    throw new CSVParseError(
      `Parse error: ${firstError.message}`,
      filename,
      firstError.row
    )
  }

  // Check we got some data
  if (result.data.length === 0) {
    throw new CSVParseError('CSV file contains no data rows', filename)
  }

  // Validate columns (check first row has expected structure)
  const columns = result.meta.fields || []
  const missingColumns = EXPECTED_COLUMNS.filter(col => !columns.includes(col))
  if (missingColumns.length > 0) {
    throw new CSVParseError(
      `Missing required columns: ${missingColumns.join(', ')}`,
      filename
    )
  }

  // Transform each row to Transaction
  const transactions: Transaction[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]

    // Validate row shape
    const validation = RawNordeaRowSchema.safeParse(row)
    if (!validation.success) {
      throw new CSVParseError(
        `Invalid row data: ${validation.error.message}`,
        filename,
        i + 1 // 1-indexed for user display
      )
    }

    const rawRow: RawNordeaRow = validation.data

    // Skip rows with empty booking date (sometimes trailing rows)
    if (!rawRow['Booking date'].trim()) {
      continue
    }

    try {
      const transaction: Transaction = {
        id: `${filename}-${i}`,
        date: parseNordeaDate(rawRow['Booking date']),
        amount: parseEuropeanDecimal(rawRow['Amount']),
        title: rawRow['Title'].trim(),
        name: rawRow['Name'].trim(),
        referenceNumber: rawRow['Reference number'], // Keep as-is, may have leading zeros
        message: rawRow['Message'].trim(),
        sourceFile: filename,
      }

      transactions.push(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new CSVParseError(
        `Failed to parse row ${i + 1}: ${message}`,
        filename,
        i + 1
      )
    }
  }

  return transactions
}

/**
 * Parse multiple CSV files and merge into a single transaction array.
 *
 * @param files - Array of objects with filename and content
 * @returns Array of all transactions from all files
 * @throws CSVParseError if any file fails to parse
 */
export function parseMultipleCSVs(
  files: Array<{ filename: string; content: string }>
): Transaction[] {
  const allTransactions: Transaction[] = []

  for (const file of files) {
    const transactions = parseNordeaCSV(file.content, file.filename)
    allTransactions.push(...transactions)
  }

  // Sort by date (oldest first)
  allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())

  return allTransactions
}
