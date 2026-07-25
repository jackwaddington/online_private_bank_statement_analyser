import styled from 'styled-components'
import { formatAmount } from '../../../core/types/transaction'

interface ProgressStats {
  percentComplete: number
  categorizedAmount: number
  uncategorizedAmount: number
  categorized: number
  totalExpenses: number
}

interface Props {
  progress: ProgressStats
}

export function CategorizationProgress({ progress }: Props) {
  const countPercent =
    progress.totalExpenses > 0
      ? Math.round((progress.categorized / progress.totalExpenses) * 100)
      : 100
  const countFill =
    progress.totalExpenses > 0
      ? (progress.categorized / progress.totalExpenses) * 100
      : 100

  return (
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
          €{formatAmount(progress.categorizedAmount)} of €{formatAmount(progress.categorizedAmount + progress.uncategorizedAmount)}
        </ProgressDetail>
      </ProgressSection>
      <ProgressSection>
        <ProgressHeader>
          <ProgressLabel>By count</ProgressLabel>
          <ProgressPercent>{countPercent}%</ProgressPercent>
        </ProgressHeader>
        <ProgressBar>
          <ProgressFill $percent={countFill} />
        </ProgressBar>
        <ProgressDetail>
          {progress.categorized} of {progress.totalExpenses} transactions
        </ProgressDetail>
      </ProgressSection>
    </ProgressBars>
  )
}

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
`
