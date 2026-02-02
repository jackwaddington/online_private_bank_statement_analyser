import styled from 'styled-components'
import { Button } from '../common'
import { useApp } from '../../context'
import { getTransactionsToRemove, removeDuplicates } from '../../core/processors'

export function DedupScreen() {
  const { state, dispatch } = useApp()
  const { transactions, duplicateGroups } = state

  const toRemove = getTransactionsToRemove(duplicateGroups)
  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.transactions.length, 0)

  const handleRemoveDuplicates = () => {
    const deduplicated = removeDuplicates(transactions, toRemove)
    dispatch({
      type: 'DUPLICATES_RESOLVED',
      transactions: deduplicated,
      removedCount: toRemove.length,
    })
  }

  const handleKeepAll = () => {
    dispatch({
      type: 'DUPLICATES_RESOLVED',
      transactions,
      removedCount: 0,
    })
  }

  const formatCurrency = (amount: number) => {
    return `€${Math.abs(amount).toLocaleString('en', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IE')
  }

  return (
    <Container>
      <Header>
        <Title>Review Duplicates</Title>
        <Description>
          We found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} ({totalDuplicates} transactions total).
          These appear in multiple uploaded files.
        </Description>
      </Header>

      <Summary>
        <SummaryItem>
          <SummaryLabel>Duplicate groups</SummaryLabel>
          <SummaryValue>{duplicateGroups.length}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>Will be removed</SummaryLabel>
          <SummaryValue $highlight>{toRemove.length}</SummaryValue>
        </SummaryItem>
      </Summary>

      <DuplicateList>
        {duplicateGroups.slice(0, 10).map((group, idx) => (
          <DuplicateCard key={idx}>
            <DuplicateHeader>
              <DuplicateDate>{formatDate(group.date)}</DuplicateDate>
              <DuplicateAmount $isIncome={group.amount > 0}>
                {group.amount > 0 ? '+' : '-'}{formatCurrency(group.amount)}
              </DuplicateAmount>
            </DuplicateHeader>
            <DuplicateTitle>{group.title}</DuplicateTitle>
            <DuplicateFiles>
              Found in {group.transactions.length} files:{' '}
              {[...new Set(group.transactions.map(t => t.sourceFile))].join(', ')}
            </DuplicateFiles>
          </DuplicateCard>
        ))}
        {duplicateGroups.length > 10 && (
          <MoreItems>...and {duplicateGroups.length - 10} more groups</MoreItems>
        )}
      </DuplicateList>

      <Actions>
        <Button $size="lg" onClick={handleRemoveDuplicates}>
          Remove {toRemove.length} Duplicate{toRemove.length !== 1 ? 's' : ''}
        </Button>
        <Button $variant="secondary" onClick={handleKeepAll}>
          Keep All
        </Button>
      </Actions>

      <HelpText>
        Removing duplicates keeps one copy of each transaction and removes the rest.
      </HelpText>
    </Container>
  )
}

const Container = styled.main`
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Summary = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SummaryItem = styled.div`
  text-align: center;
`

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const SummaryValue = styled.div<{ $highlight?: boolean }>`
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ $highlight, theme }) => $highlight ? theme.colors.warning : theme.colors.text};
`

const DuplicateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-height: 400px;
  overflow-y: auto;
`

const DuplicateCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
`

const DuplicateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const DuplicateDate = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DuplicateAmount = styled.div<{ $isIncome: boolean }>`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ $isIncome, theme }) => $isIncome ? theme.colors.success : theme.colors.error};
`

const DuplicateTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`

const DuplicateFiles = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

const MoreItems = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const HelpText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.md};
`
