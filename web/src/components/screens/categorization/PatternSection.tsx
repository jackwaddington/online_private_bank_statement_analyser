import styled from 'styled-components'
import { Button, AutocompleteInput } from '../../common'
import { findMatchingTransactions } from '../../../core/processors'
import type { Transaction } from '../../../core/types/transaction'

interface TitlePattern {
  pattern: string
  matchCount: number
  totalAmount: number
}

interface Props {
  patterns: TitlePattern[]
  transactions: Transaction[]
  existingCategories: string[]
  isOpen: boolean
  onToggle: () => void
  selectedPattern: string | null
  patternInput: string
  onSelectPattern: (pattern: string | null) => void
  onPatternInputChange: (value: string) => void
  onPatternAssign: (category: string) => void
}

export function PatternSection({
  patterns,
  transactions,
  existingCategories,
  isOpen,
  onToggle,
  selectedPattern,
  patternInput,
  onSelectPattern,
  onPatternInputChange,
  onPatternAssign,
}: Props) {
  return (
    <PatternSectionWrapper>
      <PatternHeader onClick={onToggle}>
        <PatternTitle>Quick Categorize by Keyword</PatternTitle>
        <PatternToggle>{isOpen ? '▼' : '▶'}</PatternToggle>
      </PatternHeader>
      {isOpen && (
        <PatternContent>
          <PatternHint>Click a keyword to categorize all matching transactions at once</PatternHint>
          <PatternList>
            {patterns.slice(0, 12).map(p => (
              <PatternChip
                key={p.pattern}
                $selected={selectedPattern === p.pattern}
                onClick={() => onSelectPattern(selectedPattern === p.pattern ? null : p.pattern)}
              >
                <PatternWord>{p.pattern}</PatternWord>
                <PatternInfo>
                  {p.matchCount} txns • €
                  {p.totalAmount.toLocaleString('en', { minimumFractionDigits: 0 })}
                </PatternInfo>
              </PatternChip>
            ))}
          </PatternList>
          {selectedPattern && (
            <PatternAssign>
              <PatternMatch>
                Matches {findMatchingTransactions(transactions, selectedPattern).length} transactions
              </PatternMatch>
              <PatternInputRow>
                <AutocompleteInput
                  value={patternInput}
                  onChange={onPatternInputChange}
                  onSubmit={onPatternAssign}
                  suggestions={existingCategories}
                  placeholder={`Category for "${selectedPattern}"...`}
                />
              </PatternInputRow>
              <PatternButtons>
                <Button $variant="secondary" onClick={() => onSelectPattern(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => onPatternAssign(patternInput)}
                  disabled={!patternInput.trim()}
                >
                  Apply to All
                </Button>
              </PatternButtons>
            </PatternAssign>
          )}
        </PatternContent>
      )}
    </PatternSectionWrapper>
  )
}

const PatternSectionWrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
`

const PatternHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`

const PatternTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  font-size: ${({ theme }) => theme.fontSize.sm};
`

const PatternToggle = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

const PatternContent = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.md};
`

const PatternHint = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PatternList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const PatternChip = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primaryLight : theme.colors.background};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const PatternWord = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  font-size: ${({ theme }) => theme.fontSize.sm};
`

const PatternInfo = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

const PatternAssign = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`

const PatternMatch = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PatternInputRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PatternButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`
