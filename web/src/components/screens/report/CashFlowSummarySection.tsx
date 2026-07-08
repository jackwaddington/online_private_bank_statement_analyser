import styled from 'styled-components'
import { Section, CollapsibleHeader, SectionTitle, ToggleIcon, CollapsibleContent } from './styles'

interface Props {
  totalIncome: number
  totalOutgoings: number
  netBalance: number
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
}

export function CashFlowSummarySection({
  totalIncome,
  totalOutgoings,
  netBalance,
  formatCurrency,
  isOpen,
  onToggle,
}: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Cash Flow Summary
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          <CashFlowGrid>
            <CashFlowCard $type="income">
              <CashFlowLabel>Total Income</CashFlowLabel>
              <CashFlowValue>{formatCurrency(totalIncome)}</CashFlowValue>
            </CashFlowCard>
            <CashFlowCard $type="expense">
              <CashFlowLabel>Total Outgoings</CashFlowLabel>
              <CashFlowValue>{formatCurrency(totalOutgoings)}</CashFlowValue>
            </CashFlowCard>
            <CashFlowCard $type={netBalance >= 0 ? 'positive' : 'negative'}>
              <CashFlowLabel>Net Balance</CashFlowLabel>
              <CashFlowValue>{formatCurrency(netBalance)}</CashFlowValue>
            </CashFlowCard>
          </CashFlowGrid>
        </CollapsibleContent>
      )}
    </Section>
  )
}

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
