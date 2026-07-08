import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { Button } from '../common'
import { useApp } from '../../context'
import {
  suggestCategories,
  applyCategories,
  getUniqueCategories,
  createMapping,
  getCategorizationProgress,
  extractTitlePatterns,
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
import { CategorizationProgress } from './categorization/CategorizationProgress'
import { PatternSection } from './categorization/PatternSection'
import { CategoryCard } from './categorization/CategoryCard'
import { DoneCard } from './categorization/DoneCard'
import { CategoriesUsed } from './categorization/CategoriesUsed'

export function CategorizationScreen() {
  const { state, dispatch } = useApp()
  const { transactions, categoryMappings, selectedContributors, duplicatesRemoved } = state

  const [inputValue, setInputValue] = useState('')
  const [skippedTitles, setSkippedTitles] = useState<Set<string>>(new Set())
  const [showPatterns, setShowPatterns] = useState(true)
  const [patternInput, setPatternInput] = useState('')
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)

  const patterns = useMemo(() => extractTitlePatterns(transactions), [transactions])

  const suggestions = useMemo(
    () => suggestCategories(transactions).filter(s => !skippedTitles.has(s.title)),
    [transactions, skippedTitles]
  )

  const existingCategories = useMemo(
    () => getUniqueCategories(categoryMappings),
    [categoryMappings]
  )

  const currentItem = suggestions[0]

  const progress = useMemo(() => getCategorizationProgress(transactions), [transactions])

  const handleAssign = (category: string) => {
    if (!currentItem || !category.trim()) return
    const mapping = createMapping(currentItem.title, category.trim(), 'exact')
    dispatch({ type: 'CATEGORY_ADDED', mapping })
    const updated = applyCategories(transactions, [...categoryMappings, mapping])
    dispatch({ type: 'CATEGORIES_APPLIED', transactions: updated })
    setInputValue('')
  }

  const handleSkip = () => {
    if (!currentItem) return
    setInputValue('')
    setSkippedTitles(prev => new Set([...prev, currentItem.title]))
  }

  const handlePatternAssign = (category: string) => {
    if (!selectedPattern || !category.trim()) return
    const mapping = createMapping(selectedPattern, category.trim(), 'contains')
    dispatch({ type: 'CATEGORY_ADDED', mapping })
    const updated = applyCategories(transactions, [...categoryMappings, mapping])
    dispatch({ type: 'CATEGORIES_APPLIED', transactions: updated })
    setPatternInput('')
    setSelectedPattern(null)
  }

  const handleFinish = () => {
    const dateRange = {
      start: transactions[0]?.date || new Date(),
      end: transactions[transactions.length - 1]?.date || new Date(),
    }

    const allMonths = getAllMonthsInRange(dateRange.start, dateRange.end)

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

    const monthlySpending = calculateMonthlySpending(transactions, allMonths)
    const uncategorized = calculateUncategorizedTotals(transactions)

    const categoryTotals = new Map<string, number>()
    for (const item of monthlySpending) {
      const current = categoryTotals.get(item.category) || 0
      categoryTotals.set(item.category, current + item.amount)
    }

    const monthlyCashFlow = calculateMonthlyCashFlow(transactions, allMonths)
    const totals = calculateTotals(transactions)
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

      <CategorizationProgress progress={progress} />

      {patterns.length > 0 && !isDone && (
        <PatternSection
          patterns={patterns}
          transactions={transactions}
          existingCategories={existingCategories}
          isOpen={showPatterns}
          onToggle={() => setShowPatterns(v => !v)}
          selectedPattern={selectedPattern}
          patternInput={patternInput}
          onSelectPattern={setSelectedPattern}
          onPatternInputChange={setPatternInput}
          onPatternAssign={handlePatternAssign}
        />
      )}

      {!isDone && currentItem ? (
        <CategoryCard
          currentItem={currentItem}
          remainingCount={suggestions.length}
          inputValue={inputValue}
          existingCategories={existingCategories}
          onInputChange={setInputValue}
          onAssign={handleAssign}
          onSkip={handleSkip}
        />
      ) : (
        <DoneCard uncategorizedCount={progress.uncategorized} />
      )}

      <Actions>
        <Button $size="lg" onClick={handleFinish}>
          {isDone ? 'View Report' : 'Skip to Report'}
        </Button>
      </Actions>

      {existingCategories.length > 0 && <CategoriesUsed categories={existingCategories} />}
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

const Actions = styled.div`
  display: flex;
  justify-content: center;
`
