import { useReducer, useEffect, useState, type ReactNode } from 'react'
import { type AppState, type AppAction, initialState } from './types'
import { AppContext } from './useAppHooks'
import { loadState, saveState, clearState, hasSavedSession } from './persistence'
import styled from 'styled-components'

/**
 * Reducer function for application state.
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false }

    case 'FILES_LOADED':
      return {
        ...state,
        rawTransactions: action.transactions,
        transactions: action.transactions,
        isLoading: false,
        error: null,
      }

    case 'GROUPINGS_LOADED':
      return {
        ...state,
        selectedContributors: action.contributors,
        categoryMappings: action.categories,
      }

    case 'DUPLICATES_FOUND':
      return {
        ...state,
        duplicateGroups: action.groups,
        step: action.groups.length > 0 ? 'dedup' : 'contributors',
      }

    case 'DUPLICATES_RESOLVED':
      return {
        ...state,
        transactions: action.transactions,
        duplicatesRemoved: action.removedCount,
        step: 'contributors',
      }

    case 'CONTRIBUTORS_SELECTED':
      return {
        ...state,
        selectedContributors: action.names,
      }

    case 'TRANSACTIONS_TAGGED':
      return {
        ...state,
        transactions: action.transactions,
        step: 'categorize',
      }

    case 'CATEGORY_ADDED':
      return {
        ...state,
        categoryMappings: [...state.categoryMappings, action.mapping],
      }

    case 'CATEGORIES_APPLIED':
      return {
        ...state,
        transactions: action.transactions,
      }

    case 'REPORT_GENERATED':
      return {
        ...state,
        reportData: action.data,
        step: 'report',
      }

    case 'GO_TO_STEP':
      return { ...state, step: action.step }

    case 'RESET':
      clearState()
      return initialState

    case 'RESTORE':
      return action.state

    default:
      return state
  }
}

// ─── Resume prompt UI ────────────────────────────────────────────────────────

interface ResumePromptProps {
  onResume: () => void
  onDiscard: () => void
}

function ResumePrompt({ onResume, onDiscard }: ResumePromptProps) {
  return (
    <Overlay>
      <Dialog>
        <Title>Resume previous session?</Title>
        <Body>
          A previous session was found. Would you like to resume where you left
          off, or start fresh?
        </Body>
        <Actions>
          <PrimaryButton onClick={onResume}>Resume session</PrimaryButton>
          <SecondaryButton onClick={onDiscard}>Start fresh</SecondaryButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const Dialog = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`

const Title = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  color: #1a1a1a;
`

const Body = styled.p`
  margin: 0 0 1.5rem;
  color: #555;
  line-height: 1.5;
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`

const PrimaryButton = styled.button`
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  &:hover {
    background: #2563eb;
  }
`

const SecondaryButton = styled.button`
  padding: 0.5rem 1.25rem;
  background: transparent;
  color: #555;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  &:hover {
    background: #f3f4f6;
  }
`

// ─── Provider ────────────────────────────────────────────────────────────────

type PromptState = 'checking' | 'prompting' | 'done'

/**
 * Provider component for application state.
 * Autosaves to localStorage on every state change and offers a
 * "Resume previous session?" prompt on startup.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Initialise synchronously: check for a saved session on first render.
  const [promptState, setPromptState] = useState<PromptState>(() =>
    hasSavedSession() ? 'prompting' : 'done',
  )

  // Autosave on every state change (skip while prompt is still showing to
  // avoid immediately overwriting the saved session with initialState).
  useEffect(() => {
    if (promptState !== 'done') return
    saveState(state)
  }, [state, promptState])

  const handleResume = () => {
    const saved = loadState()
    if (saved) {
      dispatch({ type: 'RESTORE', state: saved })
    }
    setPromptState('done')
  }

  const handleDiscard = () => {
    clearState()
    setPromptState('done')
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {promptState === 'prompting' && (
        <ResumePrompt onResume={handleResume} onDiscard={handleDiscard} />
      )}
      {children}
    </AppContext.Provider>
  )
}
