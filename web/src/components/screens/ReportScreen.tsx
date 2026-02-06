import { useState } from 'react'
import styled from 'styled-components'
import { Button } from '../common'
import { SpendingChart, CashFlowChart, CategoryDetailChart } from '../charts'
import { useApp } from '../../context'
import { downloadReportZIP } from '../../core/export'

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleStartOver = () => {
    dispatch({ type: 'RESET' })
  }

  const handleDownload = async () => {
    if (!reportData) return
    setIsDownloading(true)
    try {
      await downloadReportZIP(transactions, categoryMappings, reportData, selectedContributors)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Sort categories by amount descending
  const sortedCategories = Array.from(spending.byCategory.entries())
    .sort((a, b) => b[1] - a[1])

  const hasWarnings = dataQuality.missingWeeks.length > 0 ||
    dataQuality.missingMonths.length > 0 ||
    spending.uncategorizedCount > 0

  return (
    <Container>
      <Header>
        <Title>Your Financial Report</Title>
        <DateRange>
          {formatDate(dataQuality.dateRange.start)} — {formatDate(dataQuality.dateRange.end)}
        </DateRange>
      </Header>

      {/* Data Quality Section */}
      <Section>
        <CollapsibleHeader onClick={() => setShowDataOverview(!showDataOverview)}>
          <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Data Overview
          </SectionTitle>
          <ToggleIcon>{showDataOverview ? '−' : '+'}</ToggleIcon>
        </CollapsibleHeader>
        {showDataOverview && (
        <CollapsibleContent>
        <StatsGrid>
          <StatCard>
            <StatValue>{dataQuality.totalFiles}</StatValue>
            <StatLabel>Documents</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{dataQuality.totalTransactions}</StatValue>
            <StatLabel>Total Transactions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{dataQuality.incomeTransactions}</StatValue>
            <StatLabel>Income</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{dataQuality.expenseTransactions}</StatValue>
            <StatLabel>Expenses</StatLabel>
          </StatCard>
          {dataQuality.duplicatesRemoved > 0 && (
            <StatCard>
              <StatValue>{dataQuality.duplicatesRemoved}</StatValue>
              <StatLabel>Duplicates Removed</StatLabel>
            </StatCard>
          )}
        </StatsGrid>

        {hasWarnings && (
          <WarningsBox>
            <WarningsTitle>Warnings</WarningsTitle>
            {dataQuality.missingMonths.length > 0 && (
              <Warning>
                Missing data for {dataQuality.missingMonths.length} month(s): {dataQuality.missingMonths.join(', ')}
              </Warning>
            )}
            {dataQuality.missingWeeks.length > 0 && (
              <Warning>
                Missing data for {dataQuality.missingWeeks.length} week(s):{' '}
                {dataQuality.missingWeeks
                  .map(w => {
                    // w is "YYYY-WW" format, convert to "Week WW/YYYY"
                    const [year, week] = w.split('-')
                    return `Week ${week}/${year}`
                  })
                  .join(', ')}
              </Warning>
            )}
            {spending.uncategorizedCount > 0 && (
              <Warning>
                {spending.uncategorizedCount} transactions ({formatCurrency(spending.uncategorizedTotal)}) remain uncategorized
              </Warning>
            )}
          </WarningsBox>
        )}
        </CollapsibleContent>
        )}
      </Section>

      {/* Contributions Section */}
      {contributions.contributors.length > 0 && (
        <Section>
          <CollapsibleHeader onClick={() => setShowContributions(!showContributions)}>
            <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Contributions
            </SectionTitle>
            <ToggleIcon>{showContributions ? '−' : '+'}</ToggleIcon>
          </CollapsibleHeader>
          {showContributions && (
          <CollapsibleContent>
          <ContributorCards>
            {contributions.contributors.map(contributor => (
              <ContributorCard key={contributor.name}>
                <ContributorName>{contributor.name}</ContributorName>
                <ContributorTotal>{formatCurrency(contributor.total)}</ContributorTotal>
                <ContributorAvg>
                  {formatCurrency(contributor.monthlyAverage)}/month avg
                </ContributorAvg>
              </ContributorCard>
            ))}
          </ContributorCards>

          {contributions.contributors.length === 2 && contributions.equalisationAmount > 0 && (
            <EqualisationBox>
              <EqualisationTitle>Equalisation</EqualisationTitle>
              <EqualisationText>
                Difference: {formatCurrency(contributions.totalDifference)}
              </EqualisationText>
              <EqualisationAmount>
                To equalise, <strong>{contributions.contributors[1].name}</strong> should pay{' '}
                <strong>{contributions.contributors[0].name}</strong>:{' '}
                <EqualisationValue>{formatCurrency(contributions.equalisationAmount)}</EqualisationValue>
              </EqualisationAmount>
            </EqualisationBox>
          )}
          </CollapsibleContent>
          )}
        </Section>
      )}

      {/* Cash Flow Summary */}
      <Section>
        <CollapsibleHeader onClick={() => setShowCashFlow(!showCashFlow)}>
          <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Cash Flow Summary
          </SectionTitle>
          <ToggleIcon>{showCashFlow ? '−' : '+'}</ToggleIcon>
        </CollapsibleHeader>
        {showCashFlow && (
        <CollapsibleContent>
        <CashFlowGrid>
          <CashFlowCard $type="income">
            <CashFlowLabel>Total Income</CashFlowLabel>
            <CashFlowValue>{formatCurrency(cashFlow.totalIncome)}</CashFlowValue>
          </CashFlowCard>
          <CashFlowCard $type="expense">
            <CashFlowLabel>Total Outgoings</CashFlowLabel>
            <CashFlowValue>{formatCurrency(cashFlow.totalOutgoings)}</CashFlowValue>
          </CashFlowCard>
          <CashFlowCard $type={cashFlow.netBalance >= 0 ? 'positive' : 'negative'}>
            <CashFlowLabel>Net Balance</CashFlowLabel>
            <CashFlowValue>{formatCurrency(cashFlow.netBalance)}</CashFlowValue>
          </CashFlowCard>
        </CashFlowGrid>
        </CollapsibleContent>
        )}
      </Section>

      {/* Spending by Category */}
      {sortedCategories.length > 0 && (
        <Section>
          <CollapsibleHeader onClick={() => setShowSpendingByCategory(!showSpendingByCategory)}>
            <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Spending by Category
            </SectionTitle>
            <ToggleIcon>{showSpendingByCategory ? '−' : '+'}</ToggleIcon>
          </CollapsibleHeader>
          {showSpendingByCategory && (
          <CollapsibleContent>
          <ChartWrapper>
            <SpendingChart data={spending.byCategory} />
          </ChartWrapper>
          <CategoryTable>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map(([category, amount]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{formatCurrency(amount)}</td>
                  <td>{((amount / cashFlow.totalOutgoings) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total Categorized</strong></td>
                <td><strong>{formatCurrency(sortedCategories.reduce((sum, [, amt]) => sum + amt, 0))}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </CategoryTable>
          </CollapsibleContent>
          )}
        </Section>
      )}

      {/* Monthly Cash Flow */}
      {cashFlow.monthly.length > 0 && (
        <Section>
          <CollapsibleHeader onClick={() => setShowMonthlyCashFlow(!showMonthlyCashFlow)}>
            <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Monthly Cash Flow
            </SectionTitle>
            <ToggleIcon>{showMonthlyCashFlow ? '−' : '+'}</ToggleIcon>
          </CollapsibleHeader>
          {showMonthlyCashFlow && (
          <CollapsibleContent>
          <ChartWrapper>
            <CashFlowChart data={cashFlow.monthly} />
          </ChartWrapper>
          <MonthlyTable>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Outgoings</th>
                <th>Net</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.monthly.map(month => (
                <tr key={month.month}>
                  <td>{month.month}</td>
                  <td className="income">{formatCurrency(month.income)}</td>
                  <td className="expense">{formatCurrency(month.outgoings)}</td>
                  <td className={month.net >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(month.net)}
                  </td>
                  <td className={month.cumulativeBalance >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(month.cumulativeBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </MonthlyTable>
          </CollapsibleContent>
          )}
        </Section>
      )}

      {/* Category Details (Collapsible) */}
      {sortedCategories.length > 0 && spending.monthly.length > 0 && (
        <Section>
          <CollapsibleHeader onClick={() => setShowCategoryDetails(!showCategoryDetails)}>
            <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Category Details (Last 12 Months)
            </SectionTitle>
            <ToggleIcon>{showCategoryDetails ? '−' : '+'}</ToggleIcon>
          </CollapsibleHeader>
          {showCategoryDetails && (
            <CollapsibleContent>
              {sortedCategories.map(([category]) => (
                <CategoryDetailChart
                  key={category}
                  category={category}
                  monthlySpending={spending.monthly}
                />
              ))}
            </CollapsibleContent>
          )}
        </Section>
      )}

      {/* Uncategorized Transactions */}
      {spending.uncategorized.length > 0 && (
        <Section>
          <CollapsibleHeader onClick={() => setShowUncategorized(!showUncategorized)}>
            <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Uncategorized Transactions
            </SectionTitle>
            <ToggleIcon>{showUncategorized ? '−' : '+'}</ToggleIcon>
          </CollapsibleHeader>
          {showUncategorized && (
          <CollapsibleContent>
          <UncategorizedInfo>
            {spending.uncategorizedCount} transactions totaling {formatCurrency(spending.uncategorizedTotal)}
          </UncategorizedInfo>
          <UncategorizedList>
            {spending.uncategorized.slice(0, 20).map((tx, idx) => (
              <UncategorizedItem key={`${tx.date.toISOString()}-${tx.amount}-${idx}`}>
                <UncategorizedDate>
                  {new Date(tx.date).toLocaleDateString('en-IE')}
                </UncategorizedDate>
                <UncategorizedTitle>{tx.title}</UncategorizedTitle>
                <UncategorizedAmount>
                  {formatCurrency(Math.abs(tx.amount))}
                </UncategorizedAmount>
              </UncategorizedItem>
            ))}
            {spending.uncategorized.length > 20 && (
              <MoreItems>
                ...and {spending.uncategorized.length - 20} more
              </MoreItems>
            )}
          </UncategorizedList>
          </CollapsibleContent>
          )}
        </Section>
      )}

      {/* Actions */}
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

const Container = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textSecondary};

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`

const Header = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const DateRange = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.lg};
`

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`

const ChartWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const WarningsBox = styled.div`
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
`

const WarningsTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.warning};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Warning = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  &:last-child {
    margin-bottom: 0;
  }
`

const ContributorCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ContributorCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const ContributorName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ContributorTotal = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
`

const ContributorAvg = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const EqualisationBox = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const EqualisationTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const EqualisationText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const EqualisationAmount = styled.div`
  font-size: ${({ theme }) => theme.fontSize.base};
`

const EqualisationValue = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`

const CashFlowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const CashFlowCard = styled.div<{ $type: 'income' | 'expense' | 'positive' | 'negative' }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  border-left: 4px solid ${({ $type, theme }) => {
    switch ($type) {
      case 'income':
      case 'positive':
        return theme.colors.success
      case 'expense':
      case 'negative':
        return theme.colors.error
      default:
        return theme.colors.border
    }
  }};
`

const CashFlowLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const CashFlowValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`

const CategoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;

  th, td {
    padding: ${({ theme }) => theme.spacing.md};
    text-align: left;
  }

  th {
    background: ${({ theme }) => theme.colors.background};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    font-size: ${({ theme }) => theme.fontSize.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  td:nth-child(2), td:nth-child(3),
  th:nth-child(2), th:nth-child(3) {
    text-align: right;
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  tfoot {
    border-top: 2px solid ${({ theme }) => theme.colors.border};
  }
`

const MonthlyTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSize.sm};

  th, td {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    text-align: right;
  }

  th:first-child, td:first-child {
    text-align: left;
  }

  th {
    background: ${({ theme }) => theme.colors.background};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .income {
    color: ${({ theme }) => theme.colors.success};
  }

  .expense {
    color: ${({ theme }) => theme.colors.error};
  }

  .positive {
    color: ${({ theme }) => theme.colors.success};
  }

  .negative {
    color: ${({ theme }) => theme.colors.error};
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`

const UncategorizedInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const UncategorizedList = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
`

const UncategorizedItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`

const UncategorizedDate = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  width: 100px;
  flex-shrink: 0;
`

const UncategorizedTitle = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const UncategorizedAmount = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.error};
  margin-left: ${({ theme }) => theme.spacing.md};
`

const MoreItems = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const CollapsibleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};

  &:hover {
    opacity: 0.8;
  }
`

const ToggleIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  width: 24px;
  text-align: center;
`

const CollapsibleContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`
