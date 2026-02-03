import styled from 'styled-components'
import { Button, FileDropZone } from '../common'
import { useFileUpload } from '../../hooks'
import { useAppState } from '../../context'

// Import sample data - Vite handles these as raw strings
import sample202405 from '../../assets/sample-data/202405.csv?raw'
import sample202406 from '../../assets/sample-data/202406.csv?raw'
import sample202407 from '../../assets/sample-data/202407.csv?raw'
import sample202408 from '../../assets/sample-data/202408.csv?raw'
import sample202409 from '../../assets/sample-data/202409.csv?raw'
import sample202410 from '../../assets/sample-data/202410.csv?raw'

const sampleData = [
  { content: sample202405, name: '202405.csv' },
  { content: sample202406, name: '202406.csv' },
  { content: sample202407, name: '202407.csv' },
  { content: sample202408, name: '202408.csv' },
  { content: sample202409, name: '202409.csv' },
  { content: sample202410, name: '202410.csv' },
]

export function LandingScreen() {
  const { isLoading, error } = useAppState()
  const { processFiles } = useFileUpload()

  const handleFilesSelected = (files: File[]) => {
    processFiles(files)
  }

  const handleUseSampleData = () => {
    // Create File objects from all sample data (6 months)
    const sampleFiles = sampleData.map(
      ({ content, name }) => new File([content], name, { type: 'text/csv' })
    )
    processFiles(sampleFiles)
  }

  return (
    <Container>
      <Hero>
        <Title>Joint Account Analyser</Title>
        <Subtitle>
          Analyse your shared finances with complete privacy.
          Your data never leaves your browser.
        </Subtitle>
      </Hero>

      {error && (
        <ErrorBanner role="alert">
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{error}</ErrorText>
        </ErrorBanner>
      )}

      <UploadSection>
        <SectionTitle>Upload Bank Statements</SectionTitle>
        <SectionDescription>
          Upload your Nordea CSV exports to start analysing.
          You can also include a previous groupings file to reuse your categories.
        </SectionDescription>
        <FileDropZone
          onFilesSelected={handleFilesSelected}
          disabled={isLoading}
        />
      </UploadSection>

      <Divider>
        <DividerLine />
        <DividerText>or</DividerText>
        <DividerLine />
      </Divider>

      <SampleSection>
        <SectionTitle>Try with Sample Data</SectionTitle>
        <SectionDescription>
          See how it works with example data before uploading your own.
        </SectionDescription>
        <Button
          $variant="outline"
          $size="lg"
          onClick={handleUseSampleData}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Use Sample Data'}
        </Button>
      </SampleSection>

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
  max-width: 700px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Hero = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
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

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.errorLight};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ErrorIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSize.lg};
`

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.error};
`

const UploadSection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SampleSection = styled.section`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`

const SectionDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`

const DividerText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
  text-transform: uppercase;
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
