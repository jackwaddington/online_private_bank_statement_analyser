import styled from 'styled-components'
import { Button, AutocompleteInput } from '../../common'

interface SuggestionItem {
  title: string
  transactionCount: number
  totalAmount: number
}

interface Props {
  currentItem: SuggestionItem
  remainingCount: number
  inputValue: string
  existingCategories: string[]
  onInputChange: (value: string) => void
  onAssign: (category: string) => void
  onSkip: () => void
}

export function CategoryCard({
  currentItem,
  remainingCount,
  inputValue,
  existingCategories,
  onInputChange,
  onAssign,
  onSkip,
}: Props) {
  return (
    <Card>
      <ItemTitle>{currentItem.title}</ItemTitle>
      <ItemStats>
        {currentItem.transactionCount} transactions •€
        {currentItem.totalAmount.toLocaleString('en', { minimumFractionDigits: 2 })} total
      </ItemStats>

      <InputRow>
        <AutocompleteInput
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onAssign}
          suggestions={existingCategories}
          placeholder="Type category name..."
          autoFocus
        />
        <InputHint>Tab to autocomplete • Enter to assign</InputHint>
      </InputRow>

      <ButtonRow>
        <Button $variant="secondary" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={() => onAssign(inputValue)} disabled={!inputValue.trim()}>
          Assign
        </Button>
      </ButtonRow>

      <ItemCount>
        {remainingCount} unique title{remainingCount !== 1 ? 's' : ''} remaining
      </ItemCount>
    </Card>
  )
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ItemTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`

const ItemStats = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const InputRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const InputHint = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  > button {
    flex: 1;
  }
`

const ItemCount = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.md};
`
