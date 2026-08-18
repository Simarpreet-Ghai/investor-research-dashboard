# Investor Research & Qualification Dashboard

A small full-stack portfolio project for searching, reviewing, and qualifying **simulated** investor profiles. The app uses a transparent rule-based check—not machine learning—to compare a company's sector, region, and desired investment with an investor's mandate.

> All profiles, names, email addresses, criteria, and benchmark cases are fictional. This project is not affiliated with Bristol Capital or any real investment or investor-relations firm.

## Screenshots

| Dashboard | Qualification result |
| --- | --- |
| ... | ... |

## Tech stack

- Frontend: JavaScript, React, Vite, `fetch()`, normal CSS
- Backend: Node.js, Express, REST APIs
- Database: PostgreSQL, plain SQL, `pg`
- Testing: Node's built-in test runner
- Version control: Git and GitHub

## Features

- Browse 500 deterministic simulated investor profiles
- Search by investor name and filter by sector or region
- Review sector, region, investment range, email, and pipeline status
- Update an investor's status
- Evaluate a company against three simple qualification rules
- Run a reproducible 100-case benchmark with manual-review flags

## Architecture

```text
React (browser)
      |
      | fetch() / JSON
      v
Express REST API
      |
      | parameterized SQL through pg
      v
PostgreSQL
```

The React client never connects directly to PostgreSQL. It sends HTTP requests to Express, Express runs SQL queries, and Express sends JSON responses back to React.

## Project structure

```text
client/                 React and CSS frontend
server/
  benchmark/            deterministic 100-case fixture
  scripts/              database seed and benchmark runner
  src/                  Express app, database pool, and qualification rules
  test/                 basic tests using node:test
  schema.sql             investors table
.env.example            sample local configuration
INTERVIEW_GUIDE.md      plain-language project walkthrough
README.md
```

## Database schema

The project uses one main table:

```sql
investors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  sector VARCHAR(50),
  region VARCHAR(50),
  min_investment INTEGER,
  max_investment INTEGER,
  email VARCHAR(150),
  status VARCHAR(30)
)
```

`id` uniquely identifies each row. Check constraints restrict sectors and statuses and prevent invalid investment ranges.

## Four REST operations

| Method and path | Purpose |
| --- | --- |
| `GET /api/investors` | List profiles; accepts optional `search`, `sector`, and `region` query parameters |
| `GET /api/investors/:id` | Retrieve one profile by ID |
| `POST /api/investors/:id/qualify` | Run the three qualification rules for one profile |
| `PUT /api/investors/:id` | Update allowed profile fields, including status |

All database values are passed as PostgreSQL parameters such as `$1` and `$2`. User input is not joined directly into SQL values.

## Qualification rules

The result is `QUALIFIED` only when all three checks pass:

1. Company sector exactly matches the investor sector, ignoring capitalization.
2. Company region exactly matches the investor region, ignoring capitalization.
3. Desired investment is between the investor's minimum and maximum, including both boundaries.

If any check fails, the result is `NOT QUALIFIED`. The response also contains each individual check so the UI can explain the decision.

## 100-case benchmark

`server/benchmark/benchmarkCases.js` deterministically creates exactly 100 fixtures. Each fixture contains an investor, company criteria, and an expected `QUALIFIED` or `NOT QUALIFIED` outcome. The evaluation script loops through every fixture, calls the same real `qualifyInvestor()` function used by the API, compares actual with expected, and calculates the percentages from the counts.

Current calculated result:

```text
Total cases: 100
Matched expected outcome: 93/100 (93.0%)
Flagged for manual review: 7/100 (7.0%)
```

The seven mismatches are intentionally understandable borderline cases:

- Cases 14 and 58: a human expectation allows a nearby or additional region, while the rule requires an exact region.
- Cases 41 and 86: a human expectation allows a related sector, while the rule requires the same sector label.
- Case 27: the request is $25,000 above the investor's maximum.
- Case 72: the request is $25,000 below the investor's minimum.
- Case 99: all stored rules pass, but the expected label represents a qualitative preference that is not stored in the simple model.

The script prints all seven cases with expected result, actual result, and explanation. A mismatch is a prompt for `MANUAL REVIEW`; it is not silently changed to make the benchmark pass.

## Local setup

### 1. Requirements

- Node.js 20 or newer
- npm
- PostgreSQL running locally

### 2. Create the PostgreSQL database

Open `psql` or a PostgreSQL GUI such as pgAdmin and create an empty database:

```sql
CREATE DATABASE investor_dashboard;
```

The seed script creates the `investors` table, so you do not need to run `schema.sql` separately.

### 3. Configure the connection

From the repository root:

```bash
cp .env.example server/.env
```

Open `server/.env` and replace `your_password` with your local PostgreSQL password. Adjust the username, host, port, or database name if your PostgreSQL setup differs.

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/investor_dashboard
PORT=3001
```

### 4. Install dependencies

```bash
npm run install:all
```

### 5. Seed exactly 500 investors

```bash
npm run seed
```

The deterministic script clears the existing `investors` rows and inserts exactly 500 simulated profiles across exactly six sectors. Running it again produces the same data.

### 6. Start the backend

In one terminal:

```bash
npm run dev:server
```

The API runs at `http://localhost:3001`.

### 7. Start the frontend

In a second terminal:

```bash
npm run dev:client
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Evaluation and tests

Run the deterministic benchmark without a database connection:

```bash
npm run evaluate
```

Run the basic rule and API tests:

```bash
npm test
```

Build the frontend for a final check:

```bash
npm run build
```

## What I learned

- How React state drives filters, selected profiles, forms, and UI updates
- How `useEffect` loads API data when filters change
- How a browser calls REST routes with `fetch()` and JSON
- How Express validates requests and talks to PostgreSQL using `pg`
- How primary keys identify records and parameterized SQL protects queries
- How to keep business rules in a small reusable function
- How deterministic seed and benchmark data make results reproducible
- How to test real application functions with Node's built-in tools
