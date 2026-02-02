# Requirements: Joint Account Analyser

## 1. Data Import

### 1.1 File Handling
- **REQ-1.1.1**: System shall import all CSV files from a designated `statements/` directory
- **REQ-1.1.2**: System shall handle bank CSV format with semicolon separator and comma decimal
- **REQ-1.1.3**: System shall preserve reference numbers as character type (leading zeros)

### 1.2 Duplicate File Detection
- **REQ-1.2.1**: System shall detect when the same statement file has been imported twice
- **REQ-1.2.2**: A duplicate is defined as: identical Date, Amount, Title, and Reference Number
- **REQ-1.2.3**: Duplicate transactions shall be listed in the report overview
- **REQ-1.2.4**: Duplicate transactions shall be removed before analysis proceeds
- **REQ-1.2.5**: Report shall show count of duplicates removed, their file and details.

### 1.3 Gap Detection
- **REQ-1.3.1**: System shall identify weeks (year/week number) with no transactions
- **REQ-1.3.2**: Gaps shall be reported in the overview section
- **REQ-1.3.3**: Gaps shall not halt report generation

## 2. Money In (Contributions)

### 2.1 Payee Identification

- **REQ-2.1.1**: System shall identify Person 1's contributions by: Amount > 0 AND Title contains person 1's name (case insensitive)
- **REQ-2.1.2**: System shall identify Person 2's contributions by: Amount > 0 AND Title contains person 2's name (case insensitive)
- **REQ-2.1.3**: System shall dynamically identify the two highest contributors by total contribution amount
- **REQ-2.1.4**: All other positive amounts shall be classified as "Other" and excluded from contribution calculations

### 2.2 Contribution Calculations
- **REQ-2.2.1**: System shall calculate total contributions per person (all-time)
- **REQ-2.2.2**: System shall calculate monthly contributions per person
- **REQ-2.2.3**: System shall calculate cumulative contributions per person over time
- **REQ-2.2.4**: System shall calculate equalisation amount: abs(difference) / 2

### 2.3 Contribution Outputs
- **REQ-2.3.1**: Monthly contributions chart (by person)
- **REQ-2.3.2**: Cumulative contributions chart (by person)
- **REQ-2.3.3**: Total per person and equalisation amount as text

## 3. Money Out (Spending)

### 3.1 Categorisation

- **REQ-3.1.1**: System shall use two-tier categorisation: Transaction Title → Minor Group → Major Group
- **REQ-3.1.2**: Minor group mappings shall be loaded from `helpers/minor_groups.csv`
- **REQ-3.1.3**: Major group mappings shall be loaded from `helpers/major_groups.csv`
- **REQ-3.1.4**: Transactions not matching any minor group shall be assigned Major Group = "Unassigned"
- **REQ-3.1.5**: System may include fallback keyword patterns for common vendors
- **REQ-3.1.6**: Note: Company names may vary over time (e.g., "NETFLIX INTERNATIONAL B.V" vs "Netflix.com") - users should update mappings as needed

### 3.2 Spending Calculations
- **REQ-3.2.1**: System shall calculate monthly spending per major group
- **REQ-3.2.2**: System shall count transactions per major group per month

### 3.3 Spending Outputs
- **REQ-3.3.1**: Stacked bar chart of monthly spending by category
- **REQ-3.3.2**: Faceted charts showing each category's spending over time
- **REQ-3.3.3**: Transaction count displayed on category charts

### 3.4 Unassigned Handling
- **REQ-3.4.1**: Report shall show total amount unassigned per month
- **REQ-3.4.2**: Report shall show count of unassigned transactions per month
- **REQ-3.4.3**: Report shall list unassigned transaction titles with totals
- **REQ-3.4.4**: Unassigned transactions shall not block report generation

## 4. Cash Flow

### 4.1 Calculations
- **REQ-4.1.1**: System shall calculate monthly total income (all positive amounts)
- **REQ-4.1.2**: System shall calculate monthly total outgoings
- **REQ-4.1.3**: System shall calculate monthly net (income - outgoings)
- **REQ-4.1.4**: System shall calculate cumulative balance over time

### 4.2 Outputs
- **REQ-4.2.1**: Monthly income vs outgoings comparison chart
- **REQ-4.2.2**: Net flow chart with cumulative balance line

## 5. Report Structure

### 5.1 Section Order
1. Overview (dates covered, data quality)
2. The Big Picture (cash flow)
3. Money In (contributions)
4. Money Out (spending by category)
5. What's Possible (lowest spending months)

### 5.2 Technical Requirements
- **REQ-5.2.1**: All calculations shall complete before any output is rendered
- **REQ-5.2.2**: Report section order shall be independent of calculation order
- **REQ-5.2.3**: Output format shall be PDF via RMarkdown

## 6. Data Hygiene Assumptions

The following are not enforced by the system but are assumed to be true:

- **ASSUME-6.1**: No transfers between user's own accounts via joint account
- **ASSUME-6.2**: No payments to self (e.g., paying yourself back)
- **ASSUME-6.3**: Shared gifts received by individuals before transfer to joint account
- **ASSUME-6.4**: Users understand that unhygienic use invalidates the report's usefulness
