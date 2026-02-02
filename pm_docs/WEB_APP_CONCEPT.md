# Web App Concept

## Vision

A browser-based version of the joint account analyser where all processing happens client-side. Users get powerful financial analysis without their data ever leaving their machine.

## Core Principle

**Privacy by architecture**: All computation runs in the user's browser using JavaScript. No server-side processing, no data storage, no accounts. We never see their financial data.

This is arguably a terrible business decision. Hosting costs are minimal since we're just serving static files.

## User Flow

### 1. Landing Page

Two options:
- **Download sample files** - Let users try the tool with fake data
- **Upload bank statements** - Start analysing their own data

### 2. De-duplication

When multiple CSV files are uploaded, the system detects duplicate transactions (same date, amount, title, reference across files).

User is shown duplicates and can choose to remove them. This handles the common case of overlapping date ranges in monthly exports.

### 3. Identify Contributors (Money In)

System finds the top payees - on a joint account these are typically the people contributing.

User selects which contributors to track. Others are grouped as "Other Income".

### 4. Categorise Spending (Money Out)

System analyses outgoing transactions and finds common words/phrases, ranked by frequency or total amount.

User assigns these to categories:
- "LIDL" appears 47 times → user types "Groceries"
- "PRISMA" appears 23 times → user types "Groceries" (autocomplete from previously created categories)
- "NETFLIX" appears 12 times → user types "Entertainment"

As each word/phrase is assigned, the count of ungrouped transactions decreases. User can click "Skip" to leave items ungrouped.

**UI for category selection**: When typing a category name, show autocomplete suggestions from categories already created in this session. Could also offer a dropdown of common categories as starting suggestions.

**Grouping approach**: Single tier only (Title → Category). Simpler for users than the two-tier system in the R version. We sacrifice the possibility to compare vendors withing a spending group.

### 5. Report

Generate an HTML report showing:
- Data quality summary (duplicates found, date range, gaps)
- Money in by contributor (monthly, cumulative, totals)
- Money out by category (monthly, trends)
- Ungrouped transactions

User can print to PDF from browser if needed.

### 6. Download

Button to download a zip containing:
- Original bank statements with added "Category" column
- Groupings file (maps words/phrases to categories)

Next time user visits, they upload both their new statements AND their groupings file. System applies existing groupings and only asks about new ungrouped items.

## Technical Approach

All client-side JavaScript:
- **CSV parsing**: Papa Parse library
- **Data manipulation**: Plain JS or lightweight library
- **Charts**: Chart.js or similar
- **UI**: Vanilla JS or lightweight framework
- **File handling**: Browser File API
- **Zip creation**: JSZip library

No localStorage or cookies - the downloaded groupings file is the only persistence mechanism.

## Scope Limitations (v1)

- **Nordea CSV format only** - Other banks could be added later by detecting format
- **No multi-currency** - Assumes single currency (EUR)
- **No historical comparison** - Each session is independent (though groupings persist via file)

## Why This Works

1. **Zero marginal cost** - Static hosting only, no compute costs per user
2. **Privacy sells** - "Your data never leaves your computer" is a genuine differentiator
3. **Portfolio piece** - Demonstrates full-stack thinking without needing backend infrastructure
4. **Useful** - Solves a real problem people have with shared finances

