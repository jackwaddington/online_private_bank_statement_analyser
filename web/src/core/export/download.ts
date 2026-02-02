import JSZip from 'jszip'
import type { Transaction, CategoryMapping } from '../types'
import type { ReportData } from '../types/report'

/**
 * Generate a CSV string from transactions.
 */
function transactionsToCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Title', 'Amount', 'Category', 'Contributor', 'Reference']
  const rows = transactions.map(t => [
    t.date.toISOString().split('T')[0],
    `"${t.title.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.category || '',
    t.contributor || '',
    t.referenceNumber,
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Generate a summary CSV from report data.
 */
function summaryToCSV(report: ReportData): string {
  const lines: string[] = []

  // Date range
  lines.push('Report Summary')
  lines.push(`Date Range,${report.dataQuality.dateRange.start.toISOString().split('T')[0]} to ${report.dataQuality.dateRange.end.toISOString().split('T')[0]}`)
  lines.push(`Total Transactions,${report.dataQuality.totalTransactions}`)
  lines.push(`Duplicates Removed,${report.dataQuality.duplicatesRemoved}`)
  lines.push('')

  // Cash flow
  lines.push('Cash Flow')
  lines.push(`Total Income,${report.cashFlow.totalIncome.toFixed(2)}`)
  lines.push(`Total Outgoings,${report.cashFlow.totalOutgoings.toFixed(2)}`)
  lines.push(`Net Balance,${report.cashFlow.netBalance.toFixed(2)}`)
  lines.push('')

  // Contributions
  if (report.contributions.contributors.length > 0) {
    lines.push('Contributions')
    lines.push('Contributor,Total,Monthly Average')
    for (const c of report.contributions.contributors) {
      lines.push(`${c.name},${c.total.toFixed(2)},${c.monthlyAverage.toFixed(2)}`)
    }
    lines.push(`Equalisation Amount,${report.contributions.equalisationAmount.toFixed(2)}`)
    lines.push('')
  }

  // Spending by category
  lines.push('Spending by Category')
  lines.push('Category,Amount')
  const sortedCategories = Array.from(report.spending.byCategory.entries())
    .sort((a, b) => b[1] - a[1])
  for (const [category, amount] of sortedCategories) {
    lines.push(`${category},${amount.toFixed(2)}`)
  }
  lines.push('')

  // Uncategorized
  if (report.spending.uncategorizedCount > 0) {
    lines.push('Uncategorized')
    lines.push(`Count,${report.spending.uncategorizedCount}`)
    lines.push(`Total,${report.spending.uncategorizedTotal.toFixed(2)}`)
  }

  return lines.join('\n')
}

/**
 * Generate monthly cash flow CSV.
 */
function monthlyCashFlowToCSV(report: ReportData): string {
  const headers = ['Month', 'Income', 'Outgoings', 'Net', 'Cumulative Balance']
  const rows = report.cashFlow.monthly.map(m => [
    m.month,
    m.income.toFixed(2),
    m.outgoings.toFixed(2),
    m.net.toFixed(2),
    m.cumulativeBalance.toFixed(2),
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
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
 * Create and download a ZIP file with all report data.
 */
export async function downloadReportZIP(
  transactions: Transaction[],
  mappings: CategoryMapping[],
  report: ReportData,
  contributors: string[]
): Promise<void> {
  const zip = new JSZip()

  // Add files to ZIP
  zip.file('summary.csv', summaryToCSV(report))
  zip.file('transactions.csv', transactionsToCSV(transactions))
  zip.file('monthly_cashflow.csv', monthlyCashFlowToCSV(report))
  zip.file('groupings.json', mappingsToJSON(mappings, contributors))

  // Add metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    dateRange: {
      start: report.dataQuality.dateRange.start.toISOString(),
      end: report.dataQuality.dateRange.end.toISOString(),
    },
    contributors,
    transactionCount: transactions.length,
    categoryCount: mappings.length,
  }
  zip.file('metadata.json', JSON.stringify(metadata, null, 2))

  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' })

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bank-analysis-${new Date().toISOString().split('T')[0]}.zip`
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
