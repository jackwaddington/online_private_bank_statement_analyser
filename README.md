# Joint Account Analyser

**[Try it live](https://jackwaddington.github.io/online_private_bank_statement_analyser/)** - No signup, no data leaves your browser.

A privacy-first tool for couples to analyse shared bank accounts. Upload Nordea CSV exports, categorise spending, track contributions, and see where your money goes.

## Features

- **Complete privacy** - all processing happens in your browser, nothing sent to any server
- **Duplicate detection** - automatically finds overlapping transactions across statement files
- **Smart categorisation** - pattern matching with bulk assignment by keyword
- **Contribution tracking** - see who paid what and calculate equalisation amounts
- **Monthly trends** - charts showing spending patterns over time
- **Clean export** - download organised CSVs and a groupings file to continue next month

## Future Plans

- Support for more bank formats (currently Nordea only)
- Recurring transaction detection
- Budget targets and alerts

## Running Locally

```bash
cd web
npm install
npm run dev
```

## Tech

React 19, TypeScript, Chart.js, Vite, styled-components. 177 passing tests.
