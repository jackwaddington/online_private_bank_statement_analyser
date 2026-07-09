import { type AppState } from './types'

/**
 * Schema version. Increment when the serialised shape changes in a
 * backwards-incompatible way so that old blobs are discarded gracefully.
 */
export const SCHEMA_VERSION = 1

export const STORAGE_KEY = 'bank_analyser_state_v1'

// ─── Serialised shapes ────────────────────────────────────────────────────────

/** Transaction with date stored as an ISO string. */
type SerializedTransaction = Omit<import('../core/types').Transaction, 'date'> & {
  date: string
}

/** DuplicateGroup with dates stored as ISO strings. */
type SerializedDuplicateGroup = {
  transactions: SerializedTransaction[]
  date: string
  amount: number
  title: string
  referenceNumber: string
}

/** DataQuality with Date fields stored as ISO strings. */
type SerializedDataQuality = Omit<
  import('../core/types/report').DataQuality,
  'dateRange'
> & {
  dateRange: { start: string; end: string }
}

/** ReportData with Dates and Maps serialised. */
type SerializedReportData = Omit<
  import('../core/types/report').ReportData,
  'spending' | 'dataQuality'
> & {
  dataQuality: SerializedDataQuality
  spending: Omit<
    import('../core/types/report').ReportData['spending'],
    'byCategory' | 'uncategorized'
  > & {
    byCategory: [string, number][]
    uncategorized: SerializedTransaction[]
  }
}

/** Full persisted blob. */
export interface PersistedState {
  schemaVersion: number
  savedAt: string
  state: Omit<AppState, 'rawTransactions' | 'transactions' | 'duplicateGroups' | 'reportData'> & {
    rawTransactions: SerializedTransaction[]
    transactions: SerializedTransaction[]
    duplicateGroups: SerializedDuplicateGroup[]
    reportData: SerializedReportData | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeTransaction(
  t: import('../core/types').Transaction,
): SerializedTransaction {
  return { ...t, date: t.date.toISOString() }
}

function deserializeTransaction(
  t: SerializedTransaction,
): import('../core/types').Transaction {
  return { ...t, date: new Date(t.date) }
}

function serializeDuplicateGroup(
  g: import('../core/types/report').DuplicateGroup,
): SerializedDuplicateGroup {
  return {
    ...g,
    date: g.date.toISOString(),
    transactions: g.transactions.map(serializeTransaction),
  }
}

function deserializeDuplicateGroup(
  g: SerializedDuplicateGroup,
): import('../core/types/report').DuplicateGroup {
  return {
    ...g,
    date: new Date(g.date),
    transactions: g.transactions.map(deserializeTransaction),
  }
}

function serializeReportData(
  r: import('../core/types/report').ReportData,
): SerializedReportData {
  return {
    ...r,
    dataQuality: {
      ...r.dataQuality,
      dateRange: {
        start: r.dataQuality.dateRange.start.toISOString(),
        end: r.dataQuality.dateRange.end.toISOString(),
      },
    },
    spending: {
      ...r.spending,
      byCategory: Array.from(r.spending.byCategory.entries()),
      uncategorized: r.spending.uncategorized.map(serializeTransaction),
    },
  }
}

function deserializeReportData(
  r: SerializedReportData,
): import('../core/types/report').ReportData {
  return {
    ...r,
    dataQuality: {
      ...r.dataQuality,
      dateRange: {
        start: new Date(r.dataQuality.dateRange.start),
        end: new Date(r.dataQuality.dateRange.end),
      },
    },
    spending: {
      ...r.spending,
      byCategory: new Map(r.spending.byCategory),
      uncategorized: r.spending.uncategorized.map(deserializeTransaction),
    },
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Serialise AppState to a JSON string ready for localStorage. */
export function serializeState(state: AppState): string {
  const blob: PersistedState = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    state: {
      ...state,
      rawTransactions: state.rawTransactions.map(serializeTransaction),
      transactions: state.transactions.map(serializeTransaction),
      duplicateGroups: state.duplicateGroups.map(serializeDuplicateGroup),
      reportData: state.reportData ? serializeReportData(state.reportData) : null,
    },
  }
  return JSON.stringify(blob)
}

/** Deserialise a JSON string back to AppState. Returns null on any failure. */
export function deserializeState(json: string): AppState | null {
  try {
    const blob = JSON.parse(json) as PersistedState
    if (blob.schemaVersion !== SCHEMA_VERSION) {
      return null
    }
    const s = blob.state
    return {
      ...s,
      rawTransactions: s.rawTransactions.map(deserializeTransaction),
      transactions: s.transactions.map(deserializeTransaction),
      duplicateGroups: s.duplicateGroups.map(deserializeDuplicateGroup),
      reportData: s.reportData ? deserializeReportData(s.reportData) : null,
    }
  } catch {
    return null
  }
}

/** Load saved state from localStorage. Returns null if nothing saved or corrupt. */
export function loadState(): AppState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return null
    return deserializeState(json)
  } catch {
    return null
  }
}

/** Save state to localStorage. */
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state))
  } catch {
    // Quota exceeded or private-browsing restrictions — silently ignore.
  }
}

/** Clear saved state from localStorage. */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

/** Returns true if there is a non-empty saved session (step !== 'landing'). */
export function hasSavedSession(): boolean {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return false
    const blob = JSON.parse(json) as PersistedState
    return blob.schemaVersion === SCHEMA_VERSION && blob.state.step !== 'landing'
  } catch {
    return false
  }
}
