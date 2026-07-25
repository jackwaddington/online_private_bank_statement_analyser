import styled from 'styled-components'
import { Section, CollapsibleHeader, SectionTitle, ToggleIcon, CollapsibleContent } from './styles'
import type { DataQuality } from '../../../core/types/report'

interface Props {
  dataQuality: DataQuality
  uncategorizedCount: number
  uncategorizedTotal: number
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
}

export function DataOverviewSection({
  dataQuality,
  uncategorizedCount,
  uncategorizedTotal,
  formatCurrency,
  isOpen,
  onToggle,
}: Props) {
  const hasWarnings =
    dataQuality.missingWeeks.length > 0 ||
    dataQuality.missingMonths.length > 0 ||
    uncategorizedCount > 0

  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Data Overview
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
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
                  Missing data for {dataQuality.missingMonths.length} month(s):{' '}
                  {dataQuality.missingMonths.join(', ')}
                </Warning>
              )}
              {dataQuality.missingWeeks.length > 0 && (
                <Warning>
                  Missing data for {dataQuality.missingWeeks.length} week(s):{' '}
                  {dataQuality.missingWeeks
                    .map(w => {
                      const [year, week] = w.split('-')
                      return `Week ${week}/${year}`
                    })
                    .join(', ')}
                </Warning>
              )}
              {uncategorizedCount > 0 && (
                <Warning>
                  {uncategorizedCount} transactions ({formatCurrency(uncategorizedTotal)}) remain
                  uncategorized
                </Warning>
              )}
            </WarningsBox>
          )}
        </CollapsibleContent>
      )}
    </Section>
  )
}

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
