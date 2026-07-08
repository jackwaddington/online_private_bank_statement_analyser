import styled from 'styled-components'
import { Section, CollapsibleHeader, SectionTitle, ToggleIcon, CollapsibleContent } from './styles'
import type { ContributorSummary } from '../../../core/types/report'

interface Props {
  contributors: ContributorSummary[]
  totalDifference: number
  equalisationAmount: number
  formatCurrency: (amount: number) => string
  isOpen: boolean
  onToggle: () => void
}

export function ContributionsSection({
  contributors,
  totalDifference,
  equalisationAmount,
  formatCurrency,
  isOpen,
  onToggle,
}: Props) {
  return (
    <Section>
      <CollapsibleHeader onClick={onToggle}>
        <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Contributions
        </SectionTitle>
        <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
      </CollapsibleHeader>
      {isOpen && (
        <CollapsibleContent>
          <ContributorCards>
            {contributors.map(contributor => (
              <ContributorCard key={contributor.name}>
                <ContributorName>{contributor.name}</ContributorName>
                <ContributorTotal>{formatCurrency(contributor.total)}</ContributorTotal>
                <ContributorAvg>
                  {formatCurrency(contributor.monthlyAverage)}/month avg
                </ContributorAvg>
              </ContributorCard>
            ))}
          </ContributorCards>

          {contributors.length === 2 && equalisationAmount > 0 && (
            <EqualisationBox>
              <EqualisationTitle>Equalisation</EqualisationTitle>
              <EqualisationText>Difference: {formatCurrency(totalDifference)}</EqualisationText>
              <EqualisationAmount>
                To equalise, <strong>{contributors[1].name}</strong> should pay{' '}
                <strong>{contributors[0].name}</strong>:{' '}
                <EqualisationValue>{formatCurrency(equalisationAmount)}</EqualisationValue>
              </EqualisationAmount>
            </EqualisationBox>
          )}
        </CollapsibleContent>
      )}
    </Section>
  )
}

const ContributorCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ContributorCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const ContributorName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ContributorTotal = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
`

const ContributorAvg = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const EqualisationBox = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const EqualisationTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const EqualisationText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const EqualisationAmount = styled.div`
  font-size: ${({ theme }) => theme.fontSize.base};
`

const EqualisationValue = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`
