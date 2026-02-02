import { z } from 'zod'

/**
 * How a category mapping matches transaction titles.
 * - 'exact': Title must match exactly (case-insensitive)
 * - 'contains': Title must contain the pattern (case-insensitive)
 */
export type MatchType = 'exact' | 'contains'

/**
 * A mapping from a pattern to a category.
 * Used to automatically categorize transactions based on their title.
 */
export interface CategoryMapping {
  pattern: string       // The title or substring to match
  category: string      // The category to assign
  matchType: MatchType  // How to match: exact or contains
}

export const CategoryMappingSchema = z.object({
  pattern: z.string().min(1),
  category: z.string().min(1),
  matchType: z.enum(['exact', 'contains']),
})

/**
 * The groupings file that users can download and re-upload.
 * Contains their category mappings and contributor selections.
 * This is the persistence mechanism - no server storage.
 */
export interface GroupingsFile {
  version: 1                        // Schema version for future compatibility
  contributors: string[]            // Selected contributor names to track
  categories: CategoryMapping[]     // All category mappings
  createdAt: string                 // ISO date when first created
  lastUsed: string                  // ISO date when last used
}

export const GroupingsFileSchema = z.object({
  version: z.literal(1),
  contributors: z.array(z.string()),
  categories: z.array(CategoryMappingSchema),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime(),
})

/**
 * Create a new empty groupings file.
 */
export function createEmptyGroupingsFile(): GroupingsFile {
  const now = new Date().toISOString()
  return {
    version: 1,
    contributors: [],
    categories: [],
    createdAt: now,
    lastUsed: now,
  }
}
