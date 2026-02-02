import styled from 'styled-components'
import type { AppStep } from '../../context/types'

interface Step {
  id: AppStep
  label: string
}

const STEPS: Step[] = [
  { id: 'landing', label: 'Upload' },
  { id: 'dedup', label: 'Duplicates' },
  { id: 'contributors', label: 'Contributors' },
  { id: 'categorize', label: 'Categories' },
  { id: 'report', label: 'Report' },
]

interface StepIndicatorProps {
  currentStep: AppStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <Container role="navigation" aria-label="Progress">
      <StepList>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <StepItem key={step.id}>
              <StepCircle
                $completed={isCompleted}
                $current={isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <CheckIcon aria-hidden="true">✓</CheckIcon>
                ) : (
                  <span>{index + 1}</span>
                )}
              </StepCircle>
              <StepLabel $muted={isUpcoming}>{step.label}</StepLabel>
              {index < STEPS.length - 1 && (
                <Connector $completed={isCompleted} aria-hidden="true" />
              )}
            </StepItem>
          )
        })}
      </StepList>
      <ScreenReaderStatus>
        Step {currentIndex + 1} of {STEPS.length}: {STEPS[currentIndex]?.label}
      </ScreenReaderStatus>
    </Container>
  )
}

const Container = styled.nav`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const StepList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const StepItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const StepCircle = styled.div<{ $completed: boolean; $current: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $completed, $current, theme }) => {
    if ($completed) {
      return `
        background: ${theme.colors.success};
        color: ${theme.colors.textInverse};
      `
    }
    if ($current) {
      return `
        background: ${theme.colors.primary};
        color: ${theme.colors.textInverse};
      `
    }
    return `
      background: ${theme.colors.border};
      color: ${theme.colors.textMuted};
    `
  }}
`

const CheckIcon = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
`

const StepLabel = styled.span<{ $muted: boolean }>`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.textMuted : theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`

const Connector = styled.div<{ $completed: boolean }>`
  width: 2rem;
  height: 2px;
  background: ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.border};
  transition: background ${({ theme }) => theme.transitions.normal};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 1rem;
  }
`

const ScreenReaderStatus = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`
