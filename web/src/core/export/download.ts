import JSZip from 'jszip'
import type { Transaction, CategoryMapping } from '../types'
import type { ReportData } from '../types/report'

/**
 * Format a number to European decimal format (comma as decimal separator).
 * 1234.56 -> "1.234,56"
 * -45.99 -> "-45,99"
 */
function formatEuropeanDecimal(value: number): string {
  const isNegative = value < 0
  const absValue = Math.abs(value)
  const [intPart, decPart = '00'] = absValue.toFixed(2).split('.')

  // Add thousand separators (dots)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${isNegative ? '-' : ''}${formattedInt},${decPart}`
}

/**
 * Format a Date to Nordea format: "YYYY/MM/DD"
 */
function formatNordeaDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * Get YYYYMM string from a date.
 */
function getYearMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}${month}`
}

/**
 * Generate a Nordea-format CSV string from transactions.
 * Uses semicolon delimiter and European decimal format.
 */
function transactionsToNordeaCSV(transactions: Transaction[]): string {
  const headers = [
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

  const rows = transactions.map(t => [
    formatNordeaDate(t.date),
    formatEuropeanDecimal(t.amount),
    '', // Sender - not stored
    '', // Recipient - not stored
    t.name,
    t.title,
    t.message,
    t.referenceNumber,
    '', // Balance - not stored
    'EUR',
  ])

  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
}

/**
 * Group transactions by month (YYYYMM).
 */
function groupTransactionsByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()

  for (const t of transactions) {
    const ym = getYearMonth(t.date)
    const existing = groups.get(ym) || []
    existing.push(t)
    groups.set(ym, existing)
  }

  return groups
}


/**
 * Generate category mappings JSON in GroupingsFile format.
 * This format can be re-imported on the landing screen.
 */
function mappingsToJSON(mappings: CategoryMapping[], contributors: string[]): string {
  const groupingsFile = {
    version: 1,
    contributors,
    categories: mappings,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  }

  return JSON.stringify(groupingsFile, null, 2)
}

/**
 * Create and download a ZIP file with clean Nordea-format CSVs (one per month) and groupings.
 */
export async function downloadReportZIP(
  transactions: Transaction[],
  mappings: CategoryMapping[],
  report: ReportData,
  contributors: string[]
): Promise<void> {
  const zip = new JSZip()

  // Group transactions by month and add as Nordea-format CSVs
  const monthlyGroups = groupTransactionsByMonth(transactions)
  const sortedMonths = Array.from(monthlyGroups.keys()).sort()

  for (const ym of sortedMonths) {
    const monthTransactions = monthlyGroups.get(ym)!
    // Sort by date within month
    monthTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())
    zip.file(`${ym}-transactions.csv`, transactionsToNordeaCSV(monthTransactions))
  }

  // Add groupings file for re-import
  zip.file('groupings.json', mappingsToJSON(mappings, contributors))

  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' })

  // Use end month from data range for ZIP filename
  const endYM = getYearMonth(report.dataQuality.dateRange.end)

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${endYM}-bank-export.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse a groupings.json file into CategoryMapping array.
 */
export function parseGroupingsFile(json: string): CategoryMapping[] {
  const groupings = JSON.parse(json) as Record<string, { exact?: string[]; contains?: string[] }>
  const mappings: CategoryMapping[] = []

  for (const [category, rules] of Object.entries(groupings)) {
    if (rules.exact) {
      for (const pattern of rules.exact) {
        mappings.push({ pattern, category, matchType: 'exact' })
      }
    }
    if (rules.contains) {
      for (const pattern of rules.contains) {
        mappings.push({ pattern, category, matchType: 'contains' })
      }
    }
  }

  return mappings
}
