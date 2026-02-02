import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { type AppState, type AppAction, initialState } from './types'

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
      return initialState

    default:
      return state
  }
}

/**
 * Context type including state and dispatch.
 */
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | null>(null)

/**
 * Provider component for application state.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

/**
 * Hook to access application state and dispatch.
 */
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

/**
 * Hook to access just the state (for components that only read).
 */
export function useAppState() {
  return useApp().state
}

/**
 * Hook to access just the dispatch (for components that only write).
 */
export function useAppDispatch() {
  return useApp().dispatch
}
