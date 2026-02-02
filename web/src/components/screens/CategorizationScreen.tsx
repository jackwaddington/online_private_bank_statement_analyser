import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { Button, AutocompleteInput } from '../common'
import { useApp } from '../../context'
import {
  suggestCategories,
  applyCategories,
  getUniqueCategories,
  createMapping,
  getCategorizationProgress,
} from '../../core/processors'
import { calculateDataQuality } from '../../core/calculations'
import { getAllMonthsInRange } from '../../core/calculations/contributions'
import {
  calculateMonthlyContributions,
  calculateCumulativeContributions,
  calculateContributorSummaries,
  calculateEqualisation,
} from '../../core/calculations/contributions'
import { calculateMonthlySpending, calculateUncategorizedTotals } from '../../core/calculations/spending'
import { calculateMonthlyCashFlow, calculateTotals } from '../../core/calculations/cashflow'
import type { ReportData } from '../../core/types/report'

export function CategorizationScreen() {
  const { state, dispatch } = useApp()
  const { transactions, categoryMappings, selectedContributors, duplicatesRemoved } = state

  const [inputValue, setInputValue] = useState('')
  const [skippedTitles, setSkippedTitles] = useState<Set<string>>(new Set())

  // Get uncategorized titles sorted by amount, excluding skipped ones
  const suggestions = useMemo(
    () => suggestCategories(transactions).filter(s => !skippedTitles.has(s.title)),
    [transactions, skippedTitles]
  )

  // Get existing category names for autocomplete
  const existingCategories = useMemo(
    () => getUniqueCategories(categoryMappings),
    [categoryMappings]
  )

  // Current item to categorize (always first non-skipped item)
  const currentItem = suggestions[0]

  // Progress stats
  const progress = useMemo(
    () => getCategorizationProgress(transactions),
    [transactions]
  )

  const handleAssign = (category: string) => {
    if (!currentItem || !category.trim()) return

    // Create mapping and add to state
    const mapping = createMapping(currentItem.title, category.trim(), 'exact')
    dispatch({ type: 'CATEGORY_ADDED', mapping })

    // Apply the new mapping to transactions
    const updated = applyCategories(transactions, [...categoryMappings, mapping])
    dispatch({ type: 'CATEGORIES_APPLIED', transactions: updated })

    // Clear input - don't increment index since suggestions list shrinks automatically
    setInputValue('')
  }

  const handleSkip = () => {
    if (!currentItem) return
    setInputValue('')
    setSkippedTitles(prev => new Set([...prev, currentItem.title]))
  }

  const handleFinish = () => {
    // Generate report data
    const dateRange = {
      start: transactions[0]?.date || new Date(),
      end: transactions[transactions.length - 1]?.date || new Date(),
    }

    const allMonths = getAllMonthsInRange(dateRange.start, dateRange.end)

    // Contributions
    const monthlyContributions = calculateMonthlyContributions(
      transactions,
      selectedContributors,
      allMonths
    )
    const cumulativeContributions = calculateCumulativeContributions(
      monthlyContributions,
      selectedContributors
    )
    const contributorSummaries = calculateContributorSummaries(
      transactions,
      selectedContributors,
      allMonths.length
    )
    const equalisation = calculateEqualisation(contributorSummaries)

    // Spending
    const monthlySpending = calculateMonthlySpending(transactions, allMonths)
    const uncategorized = calculateUncategorizedTotals(transactions)

    // Category totals
    const categoryTotals = new Map<string, number>()
    for (const item of monthlySpending) {
      const current = categoryTotals.get(item.category) || 0
      categoryTotals.set(item.category, current + item.amount)
    }

    // Cash flow
    const monthlyCashFlow = calculateMonthlyCashFlow(transactions, allMonths)
    const totals = calculateTotals(transactions)

    // Data quality
    const dataQuality = calculateDataQuality(transactions, duplicatesRemoved)

    const reportData: ReportData = {
      dataQuality,
      contributions: {
        contributors: contributorSummaries,
        monthly: monthlyContributions,
        cumulative: cumulativeContributions,
        totalDifference: equalisation.difference,
        equalisationAmount: equalisation.equalisationAmount,
      },
      spending: {
        byCategory: categoryTotals,
        monthly: monthlySpending,
        uncategorized: uncategorized.transactions,
        uncategorizedTotal: uncategorized.total,
        uncategorizedCount: uncategorized.count,
      },
      cashFlow: {
        monthly: monthlyCashFlow,
        totalIncome: totals.totalIncome,
        totalOutgoings: totals.totalOutgoings,
        netBalance: totals.netBalance,
      },
    }

    dispatch({ type: 'REPORT_GENERATED', data: reportData })
  }

  const isDone = suggestions.length === 0

  return (
    <Container>
      <Header>
        <Title>Categorize Spending</Title>
        <Description>
          Assign categories to your expenses. Type a category name or select from suggestions.
        </Description>
      </Header>

      <ProgressBars>
        <ProgressSection>
          <ProgressHeader>
            <ProgressLabel>By value</ProgressLabel>
            <ProgressPercent>{progress.percentComplete}%</ProgressPercent>
          </ProgressHeader>
          <ProgressBar>
            <ProgressFill $percent={progress.percentComplete} />
          </ProgressBar>
          <ProgressDetail>
            €{progress.categorizedAmount.toLocaleString('en', { minimumFractionDigits: 0 })} of €{(progress.categorizedAmount + progress.uncategorizedAmount).toLocaleString('en', { minimumFractionDigits: 0 })}
          </ProgressDetail>
        </ProgressSection>
        <ProgressSection>
          <ProgressHeader>
            <ProgressLabel>By count</ProgressLabel>
            <ProgressPercent>
              {progress.totalExpenses > 0
                ? Math.round((progress.categorized / progress.totalExpenses) * 100)
                : 100}%
            </ProgressPercent>
          </ProgressHeader>
          <ProgressBar>
            <ProgressFill $percent={progress.totalExpenses > 0 ? (progress.categorized / progress.totalExpenses) * 100 : 100} />
          </ProgressBar>
          <ProgressDetail>
            {progress.categorized} of {progress.totalExpenses} transactions
          </ProgressDetail>
        </ProgressSection>
      </ProgressBars>

      {!isDone && currentItem ? (
        <CategoryCard>
          <ItemTitle>{currentItem.title}</ItemTitle>
          <ItemStats>
            {currentItem.transactionCount} transactions •
            €{currentItem.totalAmount.toLocaleString('en', { minimumFractionDigits: 2 })} total
          </ItemStats>

          <InputRow>
            <AutocompleteInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleAssign}
              suggestions={existingCategories}
              placeholder="Type category name..."
              autoFocus
            />
            <InputHint>Tab to autocomplete • Enter to assign</InputHint>
          </InputRow>

          <ButtonRow>
            <Button $variant="secondary" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              onClick={() => handleAssign(inputValue)}
              disabled={!inputValue.trim()}
            >
              Assign
            </Button>
          </ButtonRow>

          <ItemCount>
            {suggestions.length} unique title{suggestions.length !== 1 ? 's' : ''} remaining
          </ItemCount>
        </CategoryCard>
      ) : (
        <DoneCard>
          <DoneIcon>✓</DoneIcon>
          <DoneTitle>All done!</DoneTitle>
          <DoneDescription>
            You've reviewed all unique expense titles.
            {progress.uncategorized > 0 && (
              <> {progress.uncategorized} transactions remain uncategorized.</>
            )}
          </DoneDescription>
        </DoneCard>
      )}

      <Actions>
        <Button $size="lg" onClick={handleFinish}>
          {isDone ? 'View Report' : 'Skip to Report'}
        </Button>
      </Actions>

      {existingCategories.length > 0 && (
        <CategoriesUsed>
          <CategoriesTitle>Categories used:</CategoriesTitle>
          <CategoryTags>
            {existingCategories.map(cat => (
              <CategoryTag key={cat}>{cat}</CategoryTag>
            ))}
          </CategoryTags>
        </CategoriesUsed>
      )}
    </Container>
  )
}

const Container = styled.main`
  max-width: 500px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ProgressBars = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ProgressSection = styled.div``

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const ProgressLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ProgressPercent = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
`

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ theme }) => theme.colors.success};
  transition: width ${({ theme }) => theme.transitions.normal};
`

const ProgressDetail = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const CategoryCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ItemTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`

const ItemStats = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const InputRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const InputHint = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  > button {
    flex: 1;
  }
`

const ItemCount = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const DoneCard = styled.div`
  background: ${({ theme }) => theme.colors.successLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DoneIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const DoneTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const DoneDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
`

const CategoriesUsed = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const CategoriesTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const CategoryTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const CategoryTag = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.xs};
`
