# Implementation Plan

## Approach

**Test-Driven Development (TDD)** for core logic, **Component-First** for UI.

The core data processing is pure functions with no UI dependencies. We write tests first, using the R implementation as the reference "spec". Once core logic passes tests, we build UI on top.

## Phase Overview

```
Phase 1: Project Setup           ░░░░░░░░░░ Foundation
Phase 2: Types & Schemas         ██░░░░░░░░ Data contracts
Phase 3: CSV Parsing             ████░░░░░░ File input
Phase 4: Deduplication           █████░░░░░ Data cleaning
Phase 5: Contributors            ██████░░░░ Income analysis
Phase 6: Categorization          ███████░░░ Expense analysis
Phase 7: Calculations            ████████░░ Report math
Phase 8: UI Shell                ████████░░ App structure
Phase 9-13: Screens              █████████░ User interface
Phase 14: Download               ██████████ File output
Phase 15: Polish                 ██████████ Accessibility & UX
```

---

## Phase 1: Project Setup

**Goal:** Working dev environment with all tooling configured.

### Tasks

- [ ] Initialize Vite project with React + TypeScript template
- [ ] Install dependencies:
  - `styled-components` + `@types/styled-components`
  - `zod`
  - `papaparse` + `@types/papaparse`
  - `chart.js` + `react-chartjs-2`
  - `jszip` + `@types/jszip`
- [ ] Configure Vitest in `vite.config.ts`
- [ ] Create directory structure (as per ARCHITECTURE.md)
- [ ] Add sample Nordea CSV to `src/assets/sample-data/`
- [ ] Verify: `npm run dev` starts, `npm run test` runs

### Output

```
npm run dev    → localhost:5173 shows "Hello World"
npm run test   → 0 tests, but vitest runs
npm run build  → dist/ folder created
```

---

## Phase 2: Types & Schemas

**Goal:** TypeScript types and Zod schemas for all data structures.

### Tasks

- [ ] Create `src/core/types/transaction.ts`
  - `RawNordeaRow` type (matches CSV columns exactly)
  - `Transaction` type (our normalized format)
  - Zod schemas for both
- [ ] Create `src/core/types/category.ts`
  - `CategoryMapping` type
  - `GroupingsFile` type
- [ ] Create `src/core/types/report.ts`
  - All report-related types
- [ ] Write tests: schema validation accepts valid data, rejects invalid

### Test Cases

```typescript
// transaction.test.ts
describe('Transaction Schema', () => {
  it('accepts valid Nordea CSV row');
  it('rejects row with missing date');
  it('rejects row with non-numeric amount');
  it('preserves reference number as string (leading zeros)');
});
```

---

## Phase 3: CSV Parsing

**Goal:** Parse Nordea CSV files into Transaction arrays.

### Tasks

- [ ] Create `src/core/parsers/nordea.ts`
  - Function: `parseNordeaCSV(csvString: string, filename: string): Transaction[]`
  - Handle Nordea's semicolon separator
  - Handle comma decimal format (European: `1.234,56`)
  - Parse date format `YYYY/MM/DD`
- [ ] Write comprehensive tests using sample data

### Test Cases

```typescript
// nordea.test.ts
describe('Nordea CSV Parser', () => {
  it('parses valid CSV with multiple rows');
  it('handles semicolon separator');
  it('converts comma decimals to numbers (1.234,56 → 1234.56)');
  it('parses dates correctly');
  it('preserves reference numbers with leading zeros');
  it('includes source filename on each transaction');
  it('throws on empty file');
  it('throws on wrong column format');
});
```

### Reference

Nordea CSV format (from R code):
```
Booking date;Amount;Sender;Receiver;Name;Title;Reference number;...
2024/01/15;-45,50;...
```

---

## Phase 4: Deduplication

**Goal:** Detect and remove duplicate transactions across files.

### Tasks

- [ ] Create `src/core/processors/deduplication.ts`
  - Function: `findDuplicates(transactions: Transaction[]): DuplicateGroup[]`
  - Function: `removeDuplicates(transactions: Transaction[], toRemove: Transaction[]): Transaction[]`
- [ ] Duplicate = same date + amount + title + reference, different source file
- [ ] Write tests matching R implementation behavior

### Test Cases

```typescript
// deduplication.test.ts
describe('Deduplication', () => {
  it('finds duplicates across different source files');
  it('does not flag same transaction in same file as duplicate');
  it('groups all occurrences of a duplicate together');
  it('removeDuplicates keeps first occurrence');
  it('handles no duplicates gracefully');
  it('handles all transactions being duplicates');
});
```

---

## Phase 5: Contributor Identification

**Goal:** Identify the top contributors from income transactions.

### Tasks

- [ ] Create `src/core/processors/contributors.ts`
  - Function: `findTopContributors(transactions: Transaction[], count: number): Contributor[]`
  - Function: `tagContributions(transactions: Transaction[], selectedNames: string[]): Transaction[]`
- [ ] Extract first word/name from title (as R does)
- [ ] Rank by total contribution amount
- [ ] Write tests

### Test Cases

```typescript
// contributors.test.ts
describe('Contributor Identification', () => {
  it('finds top N contributors by total amount');
  it('extracts name from transaction title');
  it('is case-insensitive');
  it('tags transactions with contributor name or "Other"');
  it('only considers positive amounts (income)');
});
```

---

## Phase 6: Categorization Engine

**Goal:** Match transaction titles to categories.

### Tasks

- [ ] Create `src/core/processors/categorization.ts`
  - Function: `suggestCategories(transactions: Transaction[]): TitleSuggestion[]`
    - Returns unique titles ranked by frequency/amount
  - Function: `applyCategories(transactions: Transaction[], mappings: CategoryMapping[]): Transaction[]`
  - Function: `getAutocomplete(input: string, existingCategories: string[]): string[]`
- [ ] Support exact and contains matching
- [ ] Write tests

### Test Cases

```typescript
// categorization.test.ts
describe('Categorization', () => {
  it('suggests titles ranked by total amount');
  it('applies exact match mappings');
  it('applies contains match mappings');
  it('exact match takes precedence over contains');
  it('leaves unmatched transactions uncategorized');
  it('autocomplete returns matching categories');
  it('autocomplete is case-insensitive');
});
```

---

## Phase 7: Calculations

**Goal:** All report calculations (matching R output).

### Tasks

- [ ] Create `src/core/calculations/contributions.ts`
  - Monthly contributions per person
  - Cumulative contributions
  - Totals and difference
- [ ] Create `src/core/calculations/spending.ts`
  - Monthly spending by category
  - Uncategorized totals
- [ ] Create `src/core/calculations/cashflow.ts`
  - Monthly income vs outgoings
  - Net flow and cumulative balance
- [ ] Create `src/core/calculations/dataQuality.ts`
  - Missing weeks detection
  - Transaction counts
- [ ] Write tests using sample data with known expected outputs

### Test Cases

```typescript
// contributions.test.ts
describe('Contribution Calculations', () => {
  it('calculates monthly totals per contributor');
  it('fills zero for months with no contributions');
  it('calculates cumulative correctly');
  it('calculates equalisation amount');
});

// cashflow.test.ts
describe('Cash Flow Calculations', () => {
  it('calculates monthly income (sum of positives)');
  it('calculates monthly outgoings (sum of negatives, absolute)');
  it('calculates net flow');
  it('calculates cumulative balance');
});
```

---

## Phase 8: UI Shell & Navigation

**Goal:** App skeleton with wizard navigation.

### Tasks

- [ ] Create `src/context/AppContext.tsx` with reducer
- [ ] Create `src/App.tsx` with step-based rendering
- [ ] Create basic step indicator component
- [ ] Create shared styled-components (theme, global styles)
- [ ] Implement step navigation (next/back)
- [ ] Test: can navigate through empty screens

### Screens (placeholder)

```tsx
// App.tsx
const screens = {
  landing: LandingScreen,
  dedup: DeduplicationScreen,
  contributors: ContributorsScreen,
  categorize: CategorizationScreen,
  report: ReportScreen,
};
```

---

## Phase 9: Landing Screen

**Goal:** File upload and sample data download.

### Tasks

- [ ] Create `FileDropZone` component
  - Drag and drop support
  - Click to open file picker
  - Accept multiple `.csv` files
  - Also accept `.json` for groupings file
- [ ] Create "Download Sample Data" button
- [ ] Wire up: files selected → parse → store in context → advance to next step
- [ ] Handle errors (invalid files, parse failures)

---

## Phase 10: Deduplication Screen

**Goal:** Show duplicates, let user confirm removal.

### Tasks

- [ ] Display duplicate groups in a table
- [ ] Show which files each duplicate appears in
- [ ] "Remove Duplicates" button (removes all but first occurrence)
- [ ] "Keep All" option (user's choice)
- [ ] Skip screen if no duplicates found

---

## Phase 11: Contributors Screen

**Goal:** User selects which contributors to track.

### Tasks

- [ ] Display top contributors with totals
- [ ] Checkboxes to select (default: top 2 selected)
- [ ] Show what will be grouped as "Other Income"
- [ ] Continue button → tag transactions → next step

---

## Phase 12: Categorization Screen

**Goal:** Interactive category assignment.

### Tasks

- [ ] Display uncategorized titles (sorted by total amount)
- [ ] For each: input field with autocomplete
- [ ] "Skip" button for items user doesn't want to categorize
- [ ] Progress indicator (X of Y categorized, €Z remaining)
- [ ] "Done" or "Continue with uncategorized" button
- [ ] Performance: handle potentially hundreds of unique titles

---

## Phase 13: Report Screen

**Goal:** Display full analysis report.

### Tasks

- [ ] Data quality section (dates, duplicates removed, gaps)
- [ ] Cash flow chart (monthly in/out bars + cumulative line)
- [ ] Contributions section
  - Monthly chart
  - Cumulative chart
  - Totals and equalisation
- [ ] Spending section
  - Stacked category chart
  - Per-category detail (like R version)
- [ ] Uncategorized transactions list
- [ ] "Print" button (browser print dialog)
- [ ] "Download" button → next screen

---

## Phase 14: Download

**Goal:** Generate and download ZIP file.

### Tasks

- [ ] Create `src/utils/fileExport.ts`
  - Function: `generateZip(transactions, mappings): Blob`
- [ ] ZIP contents:
  - Each original CSV with added "Category" column
  - `groupings.json` with category mappings and contributor selections
- [ ] Trigger download via creating object URL + click
- [ ] Write tests for ZIP generation

---

## Phase 15: Polish & Accessibility

**Goal:** Production-ready quality.

### Tasks

- [ ] Accessibility audit
  - Keyboard navigation through all steps
  - Focus management on step changes
  - ARIA labels on custom components
  - Screen reader testing
- [ ] Responsive design (mobile-friendly)
- [ ] Error boundaries (graceful failure)
- [ ] Loading states (for large files)
- [ ] Empty states (no data scenarios)
- [ ] Final visual polish
- [ ] Performance testing with large datasets

---

## Definition of Done

A phase is complete when:

1. All tasks checked off
2. All tests passing
3. Code reviewed (self-review checklist)
4. No TypeScript errors
5. Accessible (where applicable)

## Getting Started

Begin with Phase 1. Run:

```bash
npm create vite@latest bank-statement-analyzer -- --template react-ts
cd bank-statement-analyzer
npm install
```

Then proceed through phases in order. Each phase builds on the previous.
