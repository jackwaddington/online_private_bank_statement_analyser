import { useState } from 'react'
import { Button } from '../common'
import { useApp } from '../../context'
import { downloadReportZIP } from '../../core/export'
import {
  Container,
  EmptyState,
  Header,
  Title,
  DateRange,
  Actions,
} from './report/styles'
import { DataOverviewSection } from './report/DataOverviewSection'
import { ContributionsSection } from './report/ContributionsSection'
import { CashFlowSummarySection } from './report/CashFlowSummarySection'
import { SpendingByCategorySection } from './report/SpendingByCategorySection'
import { MonthlyCashFlowSection } from './report/MonthlyCashFlowSection'
import { CategoryDetailsSection } from './report/CategoryDetailsSection'
import { UncategorizedSection } from './report/UncategorizedSection'

export function ReportScreen() {
  const { state, dispatch } = useApp()
  const { reportData, transactions, categoryMappings, selectedContributors } = state
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDataOverview, setShowDataOverview] = useState(false)
  const [showContributions, setShowContributions] = useState(false)
  const [showCashFlow, setShowCashFlow] = useState(false)
  const [showSpendingByCategory, setShowSpendingByCategory] = useState(false)
  const [showMonthlyCashFlow, setShowMonthlyCashFlow] = useState(false)
  const [showCategoryDetails, setShowCategoryDetails] = useState(false)
  const [showUncategorized, setShowUncategorized] = useState(false)

  if (!reportData) {
    return (
      <Container>
        <EmptyState>
          <h2>No Report Data</h2>
          <p>Please complete the categorization step first.</p>
          <Button onClick={() => dispatch({ type: 'GO_TO_STEP', step: 'categorize' })}>
            Go to Categorization
          </Button>
        </EmptyState>
      </Container>
    )
  }

  const { dataQuality, contributions, spending, cashFlow } = reportData

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const formatCurrency = (amount: number) =>
    `€${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleStartOver = () => dispatch({ type: 'RESET' })

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadReportZIP(transactions, categoryMappings, reportData, selectedContributors)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const sortedCategories = Array.from(spending.byCategory.entries()).sort((a, b) => b[1] - a[1])

  return (
    <Container>
      <Header>
        <Title>Your Financial Report</Title>
        <DateRange>
          {formatDate(dataQuality.dateRange.start)} — {formatDate(dataQuality.dateRange.end)}
        </DateRange>
      </Header>

      <DataOverviewSection
        dataQuality={dataQuality}
        uncategorizedCount={spending.uncategorizedCount}
        uncategorizedTotal={spending.uncategorizedTotal}
        formatCurrency={formatCurrency}
        isOpen={showDataOverview}
        onToggle={() => setShowDataOverview(v => !v)}
      />

      {contributions.contributors.length > 0 && (
        <ContributionsSection
          contributors={contributions.contributors}
          totalDifference={contributions.totalDifference}
          equalisationAmount={contributions.equalisationAmount}
          formatCurrency={formatCurrency}
          isOpen={showContributions}
          onToggle={() => setShowContributions(v => !v)}
        />
      )}

      <CashFlowSummarySection
        totalIncome={cashFlow.totalIncome}
        totalOutgoings={cashFlow.totalOutgoings}
        netBalance={cashFlow.netBalance}
        formatCurrency={formatCurrency}
        isOpen={showCashFlow}
        onToggle={() => setShowCashFlow(v => !v)}
      />

      {sortedCategories.length > 0 && (
        <SpendingByCategorySection
          sortedCategories={sortedCategories}
          byCategory={spending.byCategory}
          totalOutgoings={cashFlow.totalOutgoings}
          formatCurrency={formatCurrency}
          isOpen={showSpendingByCategory}
          onToggle={() => setShowSpendingByCategory(v => !v)}
        />
      )}

      {cashFlow.monthly.length > 0 && (
        <MonthlyCashFlowSection
          monthly={cashFlow.monthly}
          formatCurrency={formatCurrency}
          isOpen={showMonthlyCashFlow}
          onToggle={() => setShowMonthlyCashFlow(v => !v)}
        />
      )}

      {sortedCategories.length > 0 && spending.monthly.length > 0 && (
        <CategoryDetailsSection
          sortedCategories={sortedCategories}
          monthlySpending={spending.monthly}
          isOpen={showCategoryDetails}
          onToggle={() => setShowCategoryDetails(v => !v)}
        />
      )}

      {spending.uncategorized.length > 0 && (
        <UncategorizedSection
          uncategorized={spending.uncategorized}
          uncategorizedCount={spending.uncategorizedCount}
          uncategorizedTotal={spending.uncategorizedTotal}
          formatCurrency={formatCurrency}
          isOpen={showUncategorized}
          onToggle={() => setShowUncategorized(v => !v)}
        />
      )}

      <Actions>
        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? 'Downloading...' : 'Download Report (ZIP)'}
        </Button>
        <Button $variant="secondary" onClick={handleStartOver}>
          Start Over
        </Button>
      </Actions>
    </Container>
  )
}
