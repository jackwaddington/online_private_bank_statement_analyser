import type { Transaction } from '../core/types'
import type { CategoryMapping } from '../core/types/category'
import type { DuplicateGroup, ReportData } from '../core/types/report'

/**
 * Application steps in the wizard flow.
 */
export type AppStep =
  | 'landing'
  | 'dedup'
  | 'contributors'
  | 'categorize'
  | 'report'

/**
 * Complete application state.
 */
export interface AppState {
  // Current step in the wizard
  step: AppStep

  // Raw transactions (before deduplication)
  rawTransactions: Transaction[]

  // Duplicate information
  duplicateGroups: DuplicateGroup[]
  duplicatesRemoved: number

  // Cleaned transactions (after deduplication)
  transactions: Transaction[]

  // Contributor selection
  selectedContributors: string[]

  // Category mappings (user-defined)
  categoryMappings: CategoryMapping[]

  // Generated report data
  reportData: ReportData | null

  // Loading and error states
  isLoading: boolean
  error: string | null
}

/**
 * Actions that can modify state.
 */
export type AppAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'FILES_LOADED'; transactions: Transaction[] }
  | { type: 'GROUPINGS_LOADED'; contributors: string[]; categories: CategoryMapping[] }
  | { type: 'DUPLICATES_FOUND'; groups: DuplicateGroup[] }
  | { type: 'DUPLICATES_RESOLVED'; transactions: Transaction[]; removedCount: number }
  | { type: 'CONTRIBUTORS_SELECTED'; names: string[] }
  | { type: 'TRANSACTIONS_TAGGED'; transactions: Transaction[] }
  | { type: 'CATEGORY_ADDED'; mapping: CategoryMapping }
  | { type: 'CATEGORIES_APPLIED'; transactions: Transaction[] }
  | { type: 'REPORT_GENERATED'; data: ReportData }
  | { type: 'GO_TO_STEP'; step: AppStep }
  | { type: 'RESET' }

/**
 * Initial state for the application.
 */
export const initialState: AppState = {
  step: 'landing',
  rawTransactions: [],
  duplicateGroups: [],
  duplicatesRemoved: 0,
  transactions: [],
  selectedContributors: [],
  categoryMappings: [],
  reportData: null,
  isLoading: false,
  error: null,
}
