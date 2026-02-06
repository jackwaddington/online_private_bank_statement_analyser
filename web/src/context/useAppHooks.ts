import { useContext, createContext } from 'react'
import type { AppState, AppAction } from './types'

/**
 * Context type including state and dispatch.
 */
export interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export const AppContext = createContext<AppContextType | null>(null)

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
