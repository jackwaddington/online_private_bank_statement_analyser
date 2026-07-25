import styled from 'styled-components'
import { Section, CollapsibleHeader, SectionTitle, ToggleIcon, CollapsibleContent } from './styles'
import type { Transaction } from '../../../core/types/transaction'

interface Props {
  uncategorized: Transaction[]
  uncategorizedCount: number
  uncategorizedTotal: number
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
}

export function UncategorizedSection({
  uncategorized,
  uncategorizedCount,
  uncategorizedTotal,
  formatCurrency,
  isOpen,
  onToggle,
}: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Uncategorized Transactions
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          <UncategorizedInfo>
            {uncategorizedCount} transactions totaling {formatCurrency(uncategorizedTotal)}
          </UncategorizedInfo>
          <UncategorizedList>
            {uncategorized.slice(0, 20).map((tx, idx) => (
              <UncategorizedItem key={`${tx.date.toISOString()}-${tx.amount}-${idx}`}>
                <UncategorizedDate>
                  {new Date(tx.date).toLocaleDateString('en-IE')}
                </UncategorizedDate>
                <UncategorizedTitle>{tx.title}</UncategorizedTitle>
                <UncategorizedAmount>{formatCurrency(Math.abs(tx.amount))}</UncategorizedAmount>
              </UncategorizedItem>
            ))}
            {uncategorized.length > 20 && (
              <MoreItems>...and {uncategorized.length - 20} more</MoreItems>
            )}
          </UncategorizedList>
        </CollapsibleContent>
      )}
    </Section>
  )
}

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
