import styled from 'styled-components'
import { CashFlowChart } from '../../charts'
import {
  Section,
  CollapsibleHeader,
  SectionTitle,
  ToggleIcon,
  CollapsibleContent,
  ChartWrapper,
} from './styles'
import type { MonthlyCashFlow } from '../../../core/types/report'

interface Props {
  monthly: MonthlyCashFlow[]
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
}

export function MonthlyCashFlowSection({ monthly, formatCurrency, isOpen, onToggle }: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Monthly Cash Flow
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          <ChartWrapper>
            <CashFlowChart data={monthly} />
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
              {monthly.map(month => (
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
  )
}

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
