# Project Charter: Joint Account Analyser

## Project Summary

A monthly report generator that analyses joint bank account data to answer two questions: are we contributing fairly, and where does the money go?

## Problem Statement

Couples or housemates sharing a joint account need visibility into contributions and spending patterns. As individual financial situations change and shared expenses vary, a clear view of the facts helps maintain fairness and understanding.

## Objectives

1. Show who has contributed what over time, and the amount needed to equalise
2. Categorise spending to understand where money goes
3. Flag data quality issues without halting the report
4. Produce a monthly report that helps us stay on top of finances

## Scope

### In Scope

- Import bank statement CSVs and merge into single dataset
- Detect and report data import errors (duplicate files, gaps in records)
- Calculate contributions by person (automatically identifies the two highest contributors)
- Calculate cumulative contributions and equalisation amount
- Categorise outgoings using minor/major group mappings
- Report spending by category over time
- Show monthly income vs outgoings and net cash flow
- List unassigned transactions for optional manual categorisation

### Out of Scope

- Automated transaction categorisation beyond keyword matching
- Web interface or API
- Multi-currency support
- Integration with bank APIs
- Handling accounts used "unhygienically" (transfers to self, corrections)
- Achieving zero unassigned transactions

## Assumptions

1. The account is used hygienically:
   - Money flows in one direction (in from personal accounts, out to vendors)
   - No transfers between own accounts
   - No paying yourself back from the joint account

2. Name matching (contributor names in transaction title + positive amount) reliably identifies contributions

3. Company names in transaction titles may vary over time (e.g., "NETFLIX INTERNATIONAL B.V" → "Netflix.com") and users will update category mappings accordingly

4. Users maintain their own helper files (minor_groups.csv, major_groups.csv)

5. Some transactions will remain unassigned - this is acceptable

## Constraints

- Bank statements older than 2 years are not easily accessible
- Report runs monthly (not real-time)
- Output is PDF via RMarkdown

## Stakeholders

| Role       | Interest                                            |
|------------|-----------------------------------------------------|
| Developer  | Building portfolio piece, creating reusable tool    |
| End Users  | Managing joint account finances with transparency   |

## Success Criteria

1. Report generates without errors from available bank statements
2. Data quality issues are clearly communicated at the start of the report
3. Contribution totals and equalisation amount are accurate
4. Spending categories provide meaningful insight into where money goes
5. Report is understandable to both users without explanation

## Timeline

Portfolio project - no fixed deadline. Milestone: publishable state for GitHub.
