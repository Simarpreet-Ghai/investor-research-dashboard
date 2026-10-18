# Investor Research & Qualification Dashboard

I built this project to get more comfortable connecting a React frontend, a Node.js backend, and PostgreSQL in one full-stack application.

The dashboard works with 500 simulated investor profiles and lets users search, filter, review, update, and qualify investors using a small set of transparent rules.

The qualification logic is rule-based, not machine learning, so every result can be explained.

> All investor profiles, names, emails, criteria, and benchmark cases are fictional. This project is not affiliated with Bristol Capital or any real investment or investor-relations firm.

## What It Does

The app lets a user:

- browse 500 deterministic simulated investor profiles
- search by investor name
- filter by sector and region
- view investment ranges and contact information
- update an investor's pipeline status
- compare a company against an investor's criteria
- flag borderline qualification cases for manual review

## How It Works

```text
React frontend
      |
      | fetch() + JSON
      v
Node.js / Express API
      |
      | parameterized SQL
      v
PostgreSQL
```

The React frontend never talks directly to PostgreSQL.

Instead, React sends HTTP requests to Express, Express handles the application logic and SQL queries, and the results are returned to the frontend as JSON.

## Tech Used

- **React + Vite** — frontend interface and development setup
- **JavaScript** — frontend and backend application logic
- **Node.js + Express** — REST API
- **PostgreSQL** — stores the simulated investor profiles
- **SQL + pg** — database queries and PostgreSQL access
- **Node's built-in test runner** — checks qualification rules and API behaviour
- **Git/GitHub** — version control

## Main Features

### Search and Filtering

Investor profiles can be searched or filtered using:

```text
name
sector
region
```

The backend uses parameterized PostgreSQL queries such as `$1` and `$2` instead of inserting user input directly into SQL.

### Qualification Rules

I kept the qualification logic intentionally simple so the result is easy to understand.

An investor is `QUALIFIED` only when:

1. the company sector matches the investor's sector
2. the company region matches the investor's region
3. the requested investment falls within the investor's minimum and maximum range

Sector and region comparisons ignore capitalization, and the investment boundaries are included.

The API also returns the result of each individual check so the frontend can show why an investor qualified or did not qualify.

### REST API

The backend currently has four main operations:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/investors` | Search and list investors |
| GET | `/api/investors/:id` | Get one investor |
| POST | `/api/investors/:id/qualify` | Run the qualification rules |
| PUT | `/api/investors/:id` | Update investor information |

## Project Structure

```text
client/                 React frontend

server/
├── benchmark/          100 deterministic benchmark cases
├── scripts/            database seed + benchmark scripts
├── src/                Express API, PostgreSQL connection, qualification logic
├── test/               rule and API tests
└── schema.sql          investor table

.env.example
INTERVIEW_GUIDE.md
README.md
```

## Database

The project uses one main PostgreSQL table:

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

I also added database checks for valid sectors, statuses, and investment ranges so obviously invalid records are not stored.

## 100-Case Benchmark

I created 100 deterministic cases to check how the qualification rules behave.

Each case contains:

```text
investor
company criteria
expected result
```

The benchmark calls the same `qualifyInvestor()` function used by the actual API rather than using separate testing logic.

Current result:

```text
100 total cases

93/100 matched the expected result
7/100 flagged for manual review
```

The seven manual-review cases are intentionally borderline situations, such as:

- closely related but non-identical sectors
- nearby or additional regions
- investment amounts just outside the allowed range
- qualitative preferences that are not represented in the stored rules

I kept those cases visible instead of changing the expected result just to make the benchmark say 100%.

## How to Run It on Another Computer

### 1. Requirements

You will need:

- Node.js 20+
- npm
- PostgreSQL
- Git

### 2. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 3. Create the PostgreSQL database

Open `psql` and run:

```sql
CREATE DATABASE investor_dashboard;
```

The seed script creates the `investors` table automatically.

### 4. Configure the database connection

From the project root:

```bash
cp .env.example server/.env
```

Then update `server/.env` with your own PostgreSQL information:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/investor_dashboard
PORT=3001
```

### 5. Install the dependencies

```bash
npm run install:all
```

### 6. Seed the database

```bash
npm run seed
```

This creates the same 500 simulated investor profiles each time.

### 7. Start the backend

In one terminal:

```bash
npm run dev:server
```

The API runs on:

```text
http://localhost:3001
```

### 8. Start the frontend

In another terminal:

```bash
npm run dev:client
```

Vite normally runs the frontend on:

```text
http://localhost:5173
```

## Testing and Evaluation

Run the 100-case qualification benchmark:

```bash
npm run evaluate
```

Run the rule and API tests:

```bash
npm test
```

Check that the React frontend builds successfully:

```bash
npm run build
```

## What I Learned

This project helped me understand how the different parts of a full-stack application connect together.

Some of the main things I practiced were:

- connecting React to an Express REST API
- using `fetch()` and JSON between the frontend and backend
- working with PostgreSQL from Node.js using `pg`
- writing parameterized SQL queries
- keeping database access and qualification logic separate
- using React state and `useEffect` for filtering and API data
- creating deterministic data so results can be reproduced
- testing the same application functions used by the real API

It also helped me see why it is useful to keep business rules small and easy to explain instead of hiding them inside routes or frontend components.

## Current Limitations

Right now:

- all investor profiles are simulated
- qualification only considers sector, region, and investment size
- related sectors or nearby regions are not automatically treated as matches
- qualitative investor preferences are not represented
- the project is meant for software-development practice, not real investment recommendations

I kept the first version focused on understanding the full frontend → API → database flow instead of adding a large number of features.

## Possible Next Steps

Things I could add later:

- more advanced filtering
- pagination
- authentication
- more detailed qualification rules
- broader automated API testing
- Docker for easier local setup
- deployment
