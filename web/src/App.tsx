import { ThemeProvider } from 'styled-components'
import { AppProvider, useAppState } from './context'
import { theme, GlobalStyle } from './styles'
import { StepIndicator } from './components/common'
import { LandingScreen } from './components/screens'
import styled from 'styled-components'

/**
 * Main application content with step-based rendering.
 */
function AppContent() {
  const { step } = useAppState()

  // Render the appropriate screen based on current step
  const renderScreen = () => {
    switch (step) {
      case 'landing':
        return <LandingScreen />
      case 'dedup':
        return <PlaceholderScreen title="Review Duplicates" />
      case 'contributors':
        return <PlaceholderScreen title="Select Contributors" />
      case 'categorize':
        return <PlaceholderScreen title="Categorize Spending" />
      case 'report':
        return <PlaceholderScreen title="Your Report" />
      default:
        return <LandingScreen />
    }
  }

  return (
    <AppContainer>
      {step !== 'landing' && <StepIndicator currentStep={step} />}
      {renderScreen()}
    </AppContainer>
  )
}

/**
 * Placeholder screen for steps not yet implemented.
 */
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <PlaceholderContainer>
      <h2>{title}</h2>
      <p>This screen is coming soon.</p>
    </PlaceholderContainer>
  )
}

/**
 * Root application component with providers.
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  )
}

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`

const PlaceholderContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export default App
