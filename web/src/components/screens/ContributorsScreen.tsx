import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { Button } from '../common'
import { useApp } from '../../context'
import { findTopContributors, tagContributions } from '../../core/processors'

export function ContributorsScreen() {
  const { state, dispatch } = useApp()
  const { transactions } = state

  // Find all contributors from income transactions
  const allContributors = useMemo(
    () => findTopContributors(transactions, 10),
    [transactions]
  )

  // Default to top 2 selected
  const [selected, setSelected] = useState<Set<string>>(() => {
    const top2 = allContributors.slice(0, 2).map(c => c.name)
    return new Set(top2)
  })

  const handleToggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const handleContinue = () => {
    const selectedNames = Array.from(selected)

    // Update selected contributors in state
    dispatch({ type: 'CONTRIBUTORS_SELECTED', names: selectedNames })

    // Tag transactions with contributor info
    const tagged = tagContributions(transactions, selectedNames)
    dispatch({ type: 'TRANSACTIONS_TAGGED', transactions: tagged })
  }

  const selectedTotal = allContributors
    .filter(c => selected.has(c.name))
    .reduce((sum, c) => sum + c.total, 0)

  const otherTotal = allContributors
    .filter(c => !selected.has(c.name))
    .reduce((sum, c) => sum + c.total, 0)

  return (
    <Container>
      <Header>
        <Title>Select Contributors</Title>
        <Description>
          These are the people contributing to this account.
          Select who to track individually - others will be grouped as "Other Income".
        </Description>
      </Header>

      <ContributorList role="group" aria-label="Contributors">
        {allContributors.map(contributor => (
          <ContributorCard
            key={contributor.name}
            $selected={selected.has(contributor.name)}
            onClick={() => handleToggle(contributor.name)}
            role="checkbox"
            aria-checked={selected.has(contributor.name)}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleToggle(contributor.name)
              }
            }}
          >
            <Checkbox $checked={selected.has(contributor.name)}>
              {selected.has(contributor.name) && '✓'}
            </Checkbox>
            <ContributorInfo>
              <ContributorName>{contributor.name}</ContributorName>
              <ContributorStats>
                {contributor.transactionCount} transactions
              </ContributorStats>
            </ContributorInfo>
            <ContributorTotal>
              €{contributor.total.toLocaleString('en', { minimumFractionDigits: 2 })}
            </ContributorTotal>
          </ContributorCard>
        ))}
      </ContributorList>

      {allContributors.length === 0 && (
        <EmptyState>
          No income transactions found. Make sure your CSV contains positive amounts.
        </EmptyState>
      )}

      <Summary>
        <SummaryRow>
          <SummaryLabel>Selected contributors:</SummaryLabel>
          <SummaryValue>
            €{selectedTotal.toLocaleString('en', { minimumFractionDigits: 2 })}
          </SummaryValue>
        </SummaryRow>
        {otherTotal > 0 && (
          <SummaryRow $muted>
            <SummaryLabel>Other income:</SummaryLabel>
            <SummaryValue>
              €{otherTotal.toLocaleString('en', { minimumFractionDigits: 2 })}
            </SummaryValue>
          </SummaryRow>
        )}
      </Summary>

      <Actions>
        <Button
          $size="lg"
          onClick={handleContinue}
          disabled={selected.size === 0}
        >
          Continue to Categories
        </Button>
        {selected.size === 0 && (
          <HelpText>Select at least one contributor to continue</HelpText>
        )}
      </Actions>
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

const ContributorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ContributorCard = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primaryLight : theme.colors.surface};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

const Checkbox = styled.div<{ $checked: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 2px solid ${({ $checked, theme }) =>
    $checked ? theme.colors.primary : theme.colors.borderDark};
  background: ${({ $checked, theme }) =>
    $checked ? theme.colors.primary : 'transparent'};
  color: ${({ theme }) => theme.colors.textInverse};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  flex-shrink: 0;
`

const ContributorInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ContributorName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`

const ContributorStats = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ContributorTotal = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.success};
  white-space: nowrap;
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Summary = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SummaryRow = styled.div<{ $muted?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.textMuted : theme.colors.text};
`

const SummaryLabel = styled.span``

const SummaryValue = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const HelpText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`
