import styled from 'styled-components'
import { Button } from '../common'

export function LandingScreen() {
  return (
    <Container>
      <Hero>
        <Title>Joint Account Analyser</Title>
        <Subtitle>
          Analyse your shared finances with complete privacy.
          Your data never leaves your browser.
        </Subtitle>
      </Hero>

      <Actions>
        <ActionCard>
          <ActionTitle>Upload Bank Statements</ActionTitle>
          <ActionDescription>
            Upload your Nordea CSV exports to start analysing.
            You can also upload a previous groupings file.
          </ActionDescription>
          <Button $size="lg" disabled>
            Select Files (Coming Soon)
          </Button>
        </ActionCard>

        <ActionCard>
          <ActionTitle>Try with Sample Data</ActionTitle>
          <ActionDescription>
            See how it works with example data before uploading your own.
          </ActionDescription>
          <Button $variant="outline" $size="lg" disabled>
            Use Sample Data (Coming Soon)
          </Button>
        </ActionCard>
      </Actions>

      <PrivacyNote>
        <PrivacyIcon>🔒</PrivacyIcon>
        <PrivacyText>
          <strong>Privacy by design:</strong> All processing happens in your browser.
          We never see, store, or transmit your financial data.
        </PrivacyText>
      </PrivacyNote>
    </Container>
  )
}

const Container = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Hero = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 500px;
  margin: 0 auto;
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const ActionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

const ActionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ActionDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const PrivacyNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.successLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
`

const PrivacyIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxl};
`

const PrivacyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`
