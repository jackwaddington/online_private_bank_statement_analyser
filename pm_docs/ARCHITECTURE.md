# Architecture

## Overview

A single-page React application that processes bank statements entirely in the browser. No backend server, no database, no user accounts. The only "persistence" is a downloadable groupings file that users can re-upload on future visits.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     React Application                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   UI Layer  │  │ State Mgmt  │  │   Core Logic    │   │  │
│  │  │  (screens)  │◄─┤  (context)  │◄─┤ (pure functions)│   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                                    ▲            │  │
│  │         ▼                                    │            │  │
│  │  ┌─────────────┐                   ┌─────────────────┐   │  │
│  │  │  Chart.js   │                   │   Papa Parse    │   │  │
│  │  │  (charts)   │                   │  (CSV parsing)  │   │  │
│  │  └─────────────┘                   └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Browser APIs                            │  │
│  │  • File API (read uploads)    • Blob API (create downloads)│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
    [User's CSV files]                    [Downloaded ZIP file]
    (never leave browser)                 (annotated CSVs + groupings)
```

## Tech Stack

| Purpose | Technology | Why |
|---------|------------|-----|
| Build tool | Vite | Fast dev server, simple config, good TS support |
| UI framework | React 18 | Component model suits wizard flow, good ecosystem |
| Language | TypeScript | Type safety, better IDE support, catches errors early |
| Styling | styled-components | CSS-in-JS, scoped styles, dynamic theming |
| Validation | Zod | Runtime validation for CSV data, great TS inference |
| Testing | Vitest | Fast, Vite-native, Jest-compatible API |
| CSV parsing | Papa Parse | Battle-tested, handles edge cases, streaming support |
| Charts | Chart.js | Lightweight, good defaults, accessible |
| ZIP creation | JSZip | Create downloadable archives client-side |

## Directory Structure

```
src/
├── core/                    # Pure business logic (no React)
│   ├── types/              # TypeScript types & Zod schemas
│   │   ├── transaction.ts
│   │   ├── contributor.ts
│   │   ├── category.ts
│   │   └── report.ts
│   ├── parsers/            # CSV parsing & validation
│   │   ├── nordea.ts
│   │   └── nordea.test.ts
│   ├── processors/         # Data transformation logic
│   │   ├── deduplication.ts
│   │   ├── deduplication.test.ts
│   │   ├── contributors.ts
│   │   ├── contributors.test.ts
│   │   ├── categorization.ts
│   │   └── categorization.test.ts
│   └── calculations/       # Report calculations
│       ├── cashflow.ts
│       ├── cashflow.test.ts
│       ├── contributions.ts
│       └── contributions.test.ts
│
├── components/             # React UI components
│   ├── common/            # Shared UI elements
│   │   ├── Button.tsx
│   │   ├── FileDropZone.tsx
│   │   ├── ProgressIndicator.tsx
│   │   └── ...
│   ├── screens/           # Full-page screens (wizard steps)
│   │   ├── LandingScreen.tsx
│   │   ├── DeduplicationScreen.tsx
│   │   ├── ContributorsScreen.tsx
│   │   ├── CategorizationScreen.tsx
│   │   ├── ReportScreen.tsx
│   │   └── DownloadScreen.tsx
│   └── charts/            # Chart.js wrapper components
│       ├── MonthlyBarChart.tsx
│       ├── CumulativeChart.tsx
│       └── StackedCategoryChart.tsx
│
├── context/               # React context for app state
│   ├── AppContext.tsx
│   └── types.ts
│
├── hooks/                 # Custom React hooks
│   ├── useFileUpload.ts
│   └── useDownload.ts
│
├── utils/                 # Utilities
│   ├── fileExport.ts     # ZIP generation
│   └── formatting.ts     # Currency, dates, etc.
│
├── assets/               # Static assets
│   └── sample-data/      # Sample CSVs for demo
│
├── App.tsx               # Root component with routing/wizard
├── main.tsx              # Entry point
└── index.css             # Global styles / CSS reset
```

## Data Flow

### 1. File Upload

```
User drops/selects CSV files
         │
         ▼
┌─────────────────────────┐
│   Browser File API      │
│   (FileList objects)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   file.text() / Reader  │
│   (raw CSV strings)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Papa Parse            │
│   (parse CSV → objects) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Zod validation        │
│   (validate & transform)│
└───────────┬─────────────┘
            │
            ▼
    Transaction[] stored in React state
```

### 2. Processing Pipeline

```
Transaction[] (raw, with duplicates)
         │
         ▼
┌─────────────────────────┐
│   Deduplication         │──► User reviews duplicates
│   (detect & flag)       │◄── User confirms removal
└───────────┬─────────────┘
            │
            ▼
Transaction[] (deduplicated)
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐
│  Income Transactions │          │ Expense Transactions │
│  (Amount > 0)        │          │ (Amount < 0)         │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                 │
           ▼                                 ▼
┌─────────────────────┐          ┌─────────────────────┐
│ Contributor ID      │          │ Categorization      │
│ (find top names)    │          │ (match titles)      │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                 │
           ▼                                 ▼
    User selects contributors         User assigns categories
           │                                 │
           └──────────────┬─────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │    Calculations     │
              │ (totals, averages,  │
              │  cumulative, etc.)  │
              └──────────┬──────────┘
                         │
                         ▼
                   ReportData object
```

### 3. Output Generation

```
ReportData
    │
    ├───────────────────────────────┐
    │                               │
    ▼                               ▼
┌─────────────┐            ┌─────────────────┐
│ React UI    │            │ Download ZIP    │
│ (charts,    │            │ • annotated CSVs│
│  tables)    │            │ • groupings.json│
└─────────────┘            └─────────────────┘
```

## Core Types

```typescript
// Transaction as parsed from Nordea CSV
interface Transaction {
  id: string;                    // Generated unique ID
  date: Date;
  amount: number;                // Positive = income, negative = expense
  title: string;                 // Payee/description
  referenceNumber: string;
  sourceFile: string;            // Which CSV it came from
  // Added during processing:
  category?: string;             // User-assigned category
  contributor?: string;          // Identified contributor name
  isDuplicate?: boolean;         // Flagged during dedup
}

// User's category mappings (saved in groupings file)
interface CategoryMapping {
  pattern: string;               // Title or substring to match
  category: string;              // Category name
  matchType: 'exact' | 'contains';
}

// Groupings file structure (JSON)
interface GroupingsFile {
  version: 1;
  contributors: string[];        // Selected contributor names
  categories: CategoryMapping[];
  createdAt: string;
  lastUsed: string;
}

// Report data structure
interface ReportData {
  dateRange: { start: Date; end: Date };
  dataQuality: {
    totalTransactions: number;
    duplicatesRemoved: number;
    missingWeeks: string[];
  };
  contributions: {
    byContributor: Map<string, number>;
    monthly: MonthlyContribution[];
    cumulative: CumulativeContribution[];
  };
  spending: {
    byCategory: Map<string, number>;
    monthly: MonthlySpending[];
    uncategorized: Transaction[];
  };
  cashFlow: {
    monthly: MonthlyCashFlow[];
  };
}
```

## State Management

Using React Context with a reducer pattern:

```typescript
type AppState = {
  step: 'landing' | 'dedup' | 'contributors' | 'categorize' | 'report';
  transactions: Transaction[];
  duplicates: Transaction[];
  selectedContributors: string[];
  categoryMappings: CategoryMapping[];
  reportData: ReportData | null;
};

type AppAction =
  | { type: 'FILES_LOADED'; transactions: Transaction[] }
  | { type: 'DUPLICATES_RESOLVED'; kept: Transaction[] }
  | { type: 'CONTRIBUTORS_SELECTED'; names: string[] }
  | { type: 'CATEGORY_ASSIGNED'; pattern: string; category: string }
  | { type: 'REPORT_GENERATED'; data: ReportData }
  | { type: 'RESET' };
```

## Accessibility

- All interactive elements keyboard-accessible
- ARIA labels on custom components
- Focus management during wizard navigation
- Sufficient color contrast (WCAG AA minimum)
- Screen reader announcements for step changes
- Charts include text alternatives (data tables)

## Security Considerations

- No data leaves the browser (architecture enforces this)
- No localStorage/cookies (groupings file is explicit user action)
- CSP headers on hosting to prevent XSS
- Input sanitization on file parsing (Papa Parse handles this)
- No `eval()` or dynamic code execution

## Deployment

Static files only. Any static hosting works:
- GitHub Pages (free)
- Netlify (free tier)
- Vercel (free tier)
- CloudFlare Pages (free)

Build output is just HTML, CSS, and JS files.
