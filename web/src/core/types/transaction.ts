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
  amount: number                  // Parsed from "Amount" (positive = income, negative = expense)
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
 * Parse European decimal format (comma as decimal separator).
 * "1.234,56" -> 1234.56
 * "-45,99" -> -45.99
 */
export function parseEuropeanDecimal(value: string): number {
  // Remove thousand separators (dots), replace decimal comma with dot
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  if (isNaN(parsed)) {
    throw new Error(`Invalid number format: "${value}"`)
  }
  return parsed
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
