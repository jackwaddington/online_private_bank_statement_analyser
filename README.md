# online_private_bank_statement_analyser
An expression of my [bank statement analysis logic](https://github.com/jackwaddington/joint-account-analyser) with a web interface.

I was thinking about what processing power we have with JavaScript in a browser, and that we could probably process CSVs locally (security benefit?) and share with others the ability to make this basic but powerful analysis to understand where our money goes.

I have a hunch also that this is easy to host, as there is nothing funky going one with cloud?

As I am pressed for time, with so many things I would like to explore and build I stop this short of being able to handle multiple formats of bank statements and leave it as is.

I am really impressed with what is possible here, and how much easier this is than what I have done with spreadsheets for years.

# 1. The "Data Engine" (Processing & Parsing)
This isn't just a simple UI; your project is built to handle and validate data.

papaparse: A powerful CSV parser. This lets users upload spreadsheet files so the app can read them.

jszip: This allows your app to create, read, and edit .zip files directly in the browser.

zod: This is a "schema validation" library. It ensures that the data coming into your app matches the exact shape we expect.

# 2. The Visuals (Charts & Styling)
chart.js & react-chartjs-2: We have Chart.js (the engine) with a React wrapper. This allows responsive, animated graphs and dashboards.

styled-components: Instead of traditional CSS files, you’re using "CSS-in-JS." This allows actual CSS code inside JavaScript files, scoped specifically to individual components.

# 3. The Testing Suite
We have a testing for project long-term health:

vitest: A blazing-fast unit test runner designed specifically to work with Vite.

jsdom: A tool that simulates a browser environment in your terminal so we can run tests without opening Chrome.

testing-library: Helps test React components from the user's perspective (e.g., "does the button exist?") rather than testing the code's internal logic.