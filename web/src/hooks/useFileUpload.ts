import { useCallback } from 'react'
import { useAppDispatch } from '../context'
import { parseNordeaCSV } from '../core/parsers'
import { findDuplicates } from '../core/processors'
import { GroupingsFileSchema, type CategoryMapping } from '../core/types/category'
import type { Transaction } from '../core/types'

interface UseFileUploadResult {
  processFiles: (files: File[]) => Promise<void>
}

/**
 * Hook for handling file uploads.
 * Parses CSV files and optional groupings JSON, then updates app state.
 */
export function useFileUpload(): UseFileUploadResult {
  const dispatch = useAppDispatch()

  const processFiles = useCallback(async (files: File[]) => {
    dispatch({ type: 'SET_LOADING', isLoading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      const csvFiles: File[] = []
      let groupingsFile: File | null = null

      // Separate CSV and JSON files
      for (const file of files) {
        if (file.name.endsWith('.csv')) {
          csvFiles.push(file)
        } else if (file.name.endsWith('.json')) {
          groupingsFile = file
        }
      }

      if (csvFiles.length === 0) {
        throw new Error('Please select at least one CSV file')
      }

      // Parse CSV files
      const allTransactions: Transaction[] = []

      for (const file of csvFiles) {
        const content = await file.text()
        const transactions = parseNordeaCSV(content, file.name)
        allTransactions.push(...transactions)
      }

      // Sort by date
      allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())

      // Update state with loaded transactions
      dispatch({ type: 'FILES_LOADED', transactions: allTransactions })

      // Parse groupings file if provided
      if (groupingsFile) {
        const groupingsContent = await groupingsFile.text()
        const groupingsData = JSON.parse(groupingsContent)
        const validated = GroupingsFileSchema.safeParse(groupingsData)

        if (validated.success) {
          dispatch({
            type: 'GROUPINGS_LOADED',
            contributors: validated.data.contributors,
            categories: validated.data.categories as CategoryMapping[],
          })
        } else {
          console.warn('Invalid groupings file format, ignoring')
        }
      }

      // Find duplicates and advance to next step
      const duplicateGroups = findDuplicates(allTransactions)
      dispatch({ type: 'DUPLICATES_FOUND', groups: duplicateGroups })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process files'
      dispatch({ type: 'SET_ERROR', error: message })
    }
  }, [dispatch])

  return { processFiles }
}
