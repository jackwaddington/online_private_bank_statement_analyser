import { z } from 'zod'

/**
 * Raw row as it comes from Nordea CSV (before transformation).
 * Column names match the CSV header exactly.
 */
export const RawNordeaRowSchema = z.object({
  'Booking date': z.string(),
  'Amount': z.string(), // Comes as string with comma decimal: "1.234,56" or "-45,99"
  'Sender': z.string(),
  'Recipient': z.string(),
  'Name': z.string(),
  'Title': z.string(),
  'Message': z.string(),
  'Reference number': z.string(),
  'Balance': z.string(),
  'Currency': z.string(),
})

export type RawNordeaRow = z.infer<typeof RawNordeaRowSchema>

/**
 * Normalized transaction after parsing and transformation.
 * This is the shape we work with throughout the app.
 */
export interface Transaction {
  id: string                      // Generated unique ID (sourceFile + index)
  date: Date                      // Parsed from "Booking date"
  amount: number                  // Parsed from "Amount" in integer cents (positive = income, negative = expense)
  title: string                   // From "Title" - the payee/description
  name: string                    // From "Name" - often the contributor name for income
  referenceNumber: string         // From "Reference number" - kept as string for leading zeros
  message: string                 // From "Message"
  sourceFile: string              // Which CSV file this came from

  // Added during processing (optional until assigned)
  category?: string               // User-assigned spending category
  contributor?: string            // Identified contributor name (for income)
  isDuplicate?: boolean           // Flagged during deduplication
}

/**
 * Zod schema for validating a Transaction object.
 * Used after transformation to ensure our normalized data is correct.
 */
export const TransactionSchema = z.object({
  id: z.string().min(1),
  date: z.date(),
  amount: z.number(),
  title: z.string(),
  name: z.string(),
  referenceNumber: z.string(),
  message: z.string(),
  sourceFile: z.string().min(1),
  category: z.string().optional(),
  contributor: z.string().optional(),
  isDuplicate: z.boolean().optional(),
})

/**
 * Parse European decimal format (comma as decimal separator) into integer cents.
 * Parses the string directly (splits on comma) to avoid floating-point error.
 * "1.234,56" -> 123456
 * "-45,99"   -> -4599
 * "800,00"   -> 80000
 */
export function parseEuropeanDecimal(value: string): number {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error(`Invalid number format: "${value}"`)
  }

  const negative = trimmed.startsWith('-')
  const abs = negative ? trimmed.slice(1) : trimmed

  // Remove thousand separators (dots)
  const withoutThousands = abs.replace(/\./g, '')

  // Split on decimal comma
  const parts = withoutThousands.split(',')
  if (parts.length > 2) {
    throw new Error(`Invalid number format: "${value}"`)
  }

  const intPart = parts[0]
  const decPart = parts.length === 2 ? parts[1] : '00'

  if (intPart === '' && (parts.length === 1 || decPart === '')) {
    throw new Error(`Invalid number format: "${value}"`)
  }

  const intVal = intPart === '' ? 0 : parseInt(intPart, 10)
  const decVal = parseInt(decPart.padEnd(2, '0').slice(0, 2), 10)

  if (isNaN(intVal) || isNaN(decVal)) {
    throw new Error(`Invalid number format: "${value}"`)
  }

  const cents = intVal * 100 + decVal
  return negative ? -cents : cents
}

/**
 * Format integer cents as a display string with two decimal places.
 * 123456 -> "1234.56"
 * -4599  -> "-45.99"
 */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Format a Date as a local YYYY-MM-DD string (uses local time components,
 * not UTC, so a date parsed as local midnight always returns the correct day).
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse Nordea date format: "YYYY/MM/DD" or "YYYY/M/D"
 */
export function parseNordeaDate(value: string): Date {
  const parts = value.split('/')
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: "${value}"`)
  }
  const [year, month, day] = parts.map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: "${value}"`)
  }
  return date
}
