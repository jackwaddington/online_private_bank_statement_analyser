import styled from 'styled-components'

interface Props {
  uncategorizedCount: number
}

export function DoneCard({ uncategorizedCount }: Props) {
  return (
    <Card>
      <DoneIcon>✓</DoneIcon>
      <DoneTitle>All done!</DoneTitle>
      <DoneDescription>
        You've reviewed all unique expense titles.
        {uncategorizedCount > 0 && (
          <> {uncategorizedCount} transactions remain uncategorized.</>
        )}
      </DoneDescription>
    </Card>
  )
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.successLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DoneIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const DoneTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const DoneDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`
