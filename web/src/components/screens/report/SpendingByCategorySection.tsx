import styled from 'styled-components'
import { SpendingChart } from '../../charts'
import {
  Section,
  CollapsibleHeader,
  SectionTitle,
  ToggleIcon,
  CollapsibleContent,
  ChartWrapper,
} from './styles'

interface Props {
  sortedCategories: [string, number][]
  totalOutgoings: number
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
  byCategory: Map<string, number>
}

export function SpendingByCategorySection({
  sortedCategories,
  totalOutgoings,
  formatCurrency,
  isOpen,
  onToggle,
  byCategory,
}: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Spending by Category
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          <ChartWrapper>
            <SpendingChart data={byCategory} />
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
                  <td>{((amount / totalOutgoings) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <strong>Total Categorized</strong>
                </td>
                <td>
                  <strong>
                    {formatCurrency(sortedCategories.reduce((sum, [, amt]) => sum + amt, 0))}
                  </strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </CategoryTable>
        </CollapsibleContent>
      )}
    </Section>
  )
}

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
