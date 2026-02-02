import { describe, it, expect } from 'vitest'
import {
  CategoryMappingSchema,
  GroupingsFileSchema,
  createEmptyGroupingsFile,
  type CategoryMapping,
  type GroupingsFile,
} from './category'

describe('CategoryMappingSchema', () => {
  it('accepts valid exact match mapping', () => {
    const mapping: CategoryMapping = {
      pattern: 'LIDL HELSINKI HERTTONIEMI',
      category: 'Groceries',
      matchType: 'exact',
    }

    const result = CategoryMappingSchema.safeParse(mapping)
    expect(result.success).toBe(true)
  })

  it('accepts valid contains match mapping', () => {
    const mapping: CategoryMapping = {
      pattern: 'LIDL',
      category: 'Groceries',
      matchType: 'contains',
    }

    const result = CategoryMappingSchema.safeParse(mapping)
    expect(result.success).toBe(true)
  })

  it('rejects mapping with empty pattern', () => {
    const mapping = {
      pattern: '',
      category: 'Groceries',
      matchType: 'exact',
    }

    const result = CategoryMappingSchema.safeParse(mapping)
    expect(result.success).toBe(false)
  })

  it('rejects mapping with empty category', () => {
    const mapping = {
      pattern: 'LIDL',
      category: '',
      matchType: 'exact',
    }

    const result = CategoryMappingSchema.safeParse(mapping)
    expect(result.success).toBe(false)
  })

  it('rejects mapping with invalid matchType', () => {
    const mapping = {
      pattern: 'LIDL',
      category: 'Groceries',
      matchType: 'fuzzy', // Invalid
    }

    const result = CategoryMappingSchema.safeParse(mapping)
    expect(result.success).toBe(false)
  })
})

describe('GroupingsFileSchema', () => {
  it('accepts valid groupings file', () => {
    const groupings: GroupingsFile = {
      version: 1,
      contributors: ['Alex', 'Jordan'],
      categories: [
        { pattern: 'LIDL', category: 'Groceries', matchType: 'contains' },
        { pattern: 'NETFLIX', category: 'Entertainment', matchType: 'contains' },
      ],
      createdAt: '2024-05-01T10:00:00.000Z',
      lastUsed: '2024-05-15T14:30:00.000Z',
    }

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(true)
  })

  it('accepts groupings file with empty arrays', () => {
    const groupings: GroupingsFile = {
      version: 1,
      contributors: [],
      categories: [],
      createdAt: '2024-05-01T10:00:00.000Z',
      lastUsed: '2024-05-01T10:00:00.000Z',
    }

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(true)
  })

  it('rejects groupings file with wrong version', () => {
    const groupings = {
      version: 2, // Only version 1 is valid
      contributors: [],
      categories: [],
      createdAt: '2024-05-01T10:00:00.000Z',
      lastUsed: '2024-05-01T10:00:00.000Z',
    }

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(false)
  })

  it('rejects groupings file with invalid date format', () => {
    const groupings = {
      version: 1,
      contributors: [],
      categories: [],
      createdAt: '2024-05-01', // Not ISO datetime
      lastUsed: '2024-05-01T10:00:00.000Z',
    }

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(false)
  })

  it('rejects groupings file with invalid category mapping', () => {
    const groupings = {
      version: 1,
      contributors: [],
      categories: [
        { pattern: '', category: 'Groceries', matchType: 'exact' }, // Empty pattern
      ],
      createdAt: '2024-05-01T10:00:00.000Z',
      lastUsed: '2024-05-01T10:00:00.000Z',
    }

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(false)
  })
})

describe('createEmptyGroupingsFile', () => {
  it('creates a valid groupings file', () => {
    const groupings = createEmptyGroupingsFile()

    const result = GroupingsFileSchema.safeParse(groupings)
    expect(result.success).toBe(true)
  })

  it('has version 1', () => {
    const groupings = createEmptyGroupingsFile()
    expect(groupings.version).toBe(1)
  })

  it('has empty contributors array', () => {
    const groupings = createEmptyGroupingsFile()
    expect(groupings.contributors).toEqual([])
  })

  it('has empty categories array', () => {
    const groupings = createEmptyGroupingsFile()
    expect(groupings.categories).toEqual([])
  })

  it('has valid ISO date strings', () => {
    const groupings = createEmptyGroupingsFile()

    // Should be valid ISO strings
    expect(() => new Date(groupings.createdAt)).not.toThrow()
    expect(() => new Date(groupings.lastUsed)).not.toThrow()
  })
})
