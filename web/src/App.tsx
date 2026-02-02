import { ThemeProvider } from 'styled-components'
import { AppProvider, useAppState } from './context'
import { theme, GlobalStyle } from './styles'
import { StepIndicator } from './components/common'
import { LandingScreen, DedupScreen, ContributorsScreen, CategorizationScreen, ReportScreen } from './components/screens'
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
        return <DedupScreen />
      case 'contributors':
        return <ContributorsScreen />
      case 'categorize':
        return <CategorizationScreen />
      case 'report':
        return <ReportScreen />
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

export default App
