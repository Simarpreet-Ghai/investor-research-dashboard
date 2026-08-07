# Interview Guide

This guide explains the Investor Research & Qualification Dashboard in simple language. Read it while following the files in the repository, then practice explaining the flow without looking at the text.

## 1. What does the application do?

It lets a user browse 500 fictional investor profiles, search and filter them, open a profile, update its status, and check whether a company may match the investor. The check uses three clear rules: sector, region, and investment amount.

All data is simulated. The application is a learning and portfolio project, not a tool used by a real investment firm.

## 2. How does the React frontend work?

React builds the page from the `App` component in `client/src/App.jsx`. The component stores changing information in state, such as the search text, filters, investor list, selected investor, and qualification result. When state changes, React renders the affected parts of the page again.

The component calls the Express API with `fetch()`. It receives JSON and puts that data into state so it appears on screen.

## 3. What does `useState` do here?

`useState` lets a React component remember a value between renders. For example:

```js
const [search, setSearch] = useState('');
```

`search` is the current search text. Calling `setSearch('Investor 042')` changes the value and tells React to render again. The project also uses state for filters, profiles, loading, messages, the selected investor, company criteria, and the result.

## 4. What does `useEffect` do here?

`useEffect` runs code after React renders. The first effect loads investors from the API. Its dependency list includes the search and filter values, so it runs again when one of those values changes.

The second effect resets the company criteria when the user selects a different investor. This makes the form start with that investor's sector, region, and minimum investment.

## 5. What happens when the user searches?

1. The user types in the search input.
2. `setSearch()` updates React state.
3. The data-loading `useEffect` runs because `search` changed.
4. React builds a query such as `?search=Investor+042`.
5. `fetch()` sends a GET request to Express.
6. Express runs a parameterized SQL query using `ILIKE`.
7. PostgreSQL returns matching rows.
8. Express sends the rows as JSON.
9. React stores the rows in `investors` state and renders the list.

## 6. What does Node.js do?

Node.js runs JavaScript outside the browser. In this project it runs the Express server, seed script, benchmark script, and tests. That lets both the frontend and backend use JavaScript.

## 7. What does Express do?

Express is a small Node.js web framework. It listens for HTTP requests, matches each request to a route, validates inputs, calls the database or qualification function, and sends an HTTP response. Express also parses incoming JSON with `express.json()`.

## 8. What is a REST API?

A REST API is a set of HTTP operations that other programs can call. Each operation uses a method and URL to describe an action. For example, `GET /api/investors/42` asks for investor 42, while `PUT /api/investors/42` updates that investor.

This project sends and receives JSON, which is a text format that maps naturally to JavaScript objects.

## 9. How does React communicate with Express?

React uses the browser's built-in `fetch()` function. It sends a request to `http://localhost:3001/api/...`. Express returns a response with a status code and usually JSON. React checks `response.ok`, converts the JSON with `response.json()`, and updates state.

The `cors` middleware allows the Vite frontend on port 5173 to call the Express backend on port 3001 during local development.

## 10. What does PostgreSQL do?

PostgreSQL permanently stores the investor rows. It can search, filter, retrieve, and update those rows using SQL. Unlike React state, the database data stays after the browser is refreshed or the server restarts.

## 11. How does Express communicate with PostgreSQL?

The `pg` package creates a connection pool in `server/src/db.js`. A pool reuses database connections. Express calls `pool.query(sql, values)`. PostgreSQL runs the query and returns an object whose `rows` property contains the results.

## 12. What SQL queries are used?

The project uses basic SQL:

- `CREATE TABLE IF NOT EXISTS` creates the table during seeding.
- `TRUNCATE TABLE ... RESTART IDENTITY` clears old seed data and resets IDs.
- `INSERT INTO investors ... VALUES ($1, ...)` inserts each simulated investor.
- `SELECT ... FROM investors` lists profiles.
- `SELECT * FROM investors WHERE id = $1` retrieves one profile.
- `UPDATE investors SET ... WHERE id = $n RETURNING *` updates a profile and returns it.
- `WHERE name ILIKE $1`, `sector = $n`, and `region = $n` apply optional filters.

## 13. What is a primary key?

A primary key is a column that uniquely identifies each row. The `investors.id` column is the primary key. PostgreSQL generates it with `SERIAL`. Two investors cannot have the same ID, so `/api/investors/42` has one clear meaning.

## 14. Why are parameterized SQL queries used?

Parameterized queries keep SQL instructions separate from input values. The SQL contains placeholders such as `$1`, and the values are sent in a separate array:

```js
database.query('SELECT * FROM investors WHERE id = $1', [id]);
```

PostgreSQL treats `id` as data instead of executable SQL. This is the standard way to reduce SQL injection risk and avoid manual quote escaping.

## 15. How does the qualification algorithm work?

The reusable `qualifyInvestor()` function is in `server/src/qualification.js`. It independently calculates three Boolean values:

```text
sectorMatch AND regionMatch AND investmentMatch
```

- Sector passes when the labels match, ignoring capitalization and surrounding spaces.
- Region passes using the same exact-text rule.
- Investment passes when the desired amount is greater than or equal to the minimum and less than or equal to the maximum.

All three must be true for `QUALIFIED`. Otherwise the result is `NOT QUALIFIED`. This is a deterministic rule system, not AI or machine learning.

## 16. Where do the 500 investor records come from?

`server/scripts/seed.js` uses a loop from 1 through 500. It creates names such as `Investor 001`, selects sectors and regions from fixed arrays, calculates predictable investment ranges, and creates addresses under the fake `example.test` domain.

The script starts a database transaction. If every insert works, it commits. If one fails, it rolls back so the database is not left half-seeded.

## 17. Why are there six sectors?

The project brief defines exactly six: Technology, Healthcare, Energy, Financial Services, Industrials, and Mining. The seed script cycles through that fixed list, so all six are represented and the result is reproducible.

## 18. Where do the 100 benchmark cases come from?

`server/benchmark/benchmarkCases.js` builds an array with `Array.from({ length: 100 })`. Each item gets a deterministic investor, company criteria, expected outcome, case type, and note. Most cases represent obvious exact-rule outcomes. Seven are intentionally borderline.

The benchmark does not query PostgreSQL because it is testing the rule function itself. This keeps it fast and reproducible on any computer.

## 19. How are 93/100 and 93.0% calculated?

`server/scripts/evaluate.js` maps over all fixtures and calls the real `qualifyInvestor()` function. It compares each actual result with that fixture's expected result. Then it filters matches and mismatches.

The percentage formula is:

```text
matched cases / total cases × 100
```

The program finds 93 matches out of 100, calculates `93 / 100 × 100`, and formats it to one decimal place as `93.0%`. It does not store an `accuracy = 93` value or print a result without running the cases.

## 20. Why are seven cases sent to manual review?

Those seven actual results disagree with their expected labels:

- Two involve nearby or broader geographic coverage.
- Two involve related sectors that a person may consider compatible.
- Two are only $25,000 outside an investment boundary.
- One passes the three stored rules but has an expected rejection based on a preference the simple data model does not store.

The disagreement shows a limitation of exact rules. Instead of pretending the algorithm knows more, the evaluation prints the case for a human to inspect.

## 21. What do the four REST operations do?

1. `GET /api/investors` lists profiles and applies optional name, sector, and region filters.
2. `GET /api/investors/:id` gets one complete profile using its primary key.
3. `POST /api/investors/:id/qualify` validates company criteria, loads the investor, and runs the qualification function.
4. `PUT /api/investors/:id` validates and updates allowed fields such as status.

The project describes these as four operations because each method-and-path pair is one API operation.

## 22. How do Git and GitHub fit into the project?

Git records changes as commits. A useful workflow is to commit after a working phase, using messages such as `feat: add investor API routes` or `test: add qualification benchmark`. Git makes it possible to review history or return to an earlier version.

GitHub hosts the repository so employers can read the code, README, screenshots, and commit history. Secrets such as `server/.env` are excluded by `.gitignore`; only `.env.example` is committed.

## 10 realistic internship interview questions

### 1. Why did you choose this architecture?

I wanted to learn the standard flow of a small full-stack app without hiding the basics. React handles the interface, Express handles HTTP and validation, and PostgreSQL stores data. The layers have clear jobs and are easy to explain.

### 2. Why is the qualification function separate from the Express route?

The route handles HTTP concerns, while the function handles the business rule. Separating them lets the API, benchmark, and tests call the exact same logic. It also keeps the function easy to read.

### 3. How did you prevent SQL injection?

I used parameterized queries through `pg`. Dynamic values go into an array and the SQL uses placeholders such as `$1`. The update route only permits column names from a fixed object in the source code.

### 4. How would you improve search for a much larger dataset?

For this 500-row project, a simple `ILIKE` query is enough. For larger data I would add pagination, appropriate indexes, debouncing in React, and possibly PostgreSQL full-text search after measuring the need.

### 5. What is one limitation of the matching algorithm?

It uses exact sector and region labels and strict numeric boundaries. Real investing decisions include related sectors, broader mandates, negotiation, company stage, and qualitative preferences. The manual-review examples make that limitation visible.

### 6. What happens if the database query fails?

The route catches the error, logs it on the server, and returns HTTP 500 with a simple message. A production system would add structured logging and more detailed monitoring, but that would be unnecessary for this learning project.

### 7. Why did you make the seed deterministic?

Everyone gets the same 500 profiles every time. That makes screenshots, demos, debugging, and tests easier to reproduce. It also avoids adding Faker when fixed arrays and a loop are enough.

### 8. What did you test?

I tested successful qualification, sector mismatch, exact investment boundaries, amount outside the range, region mismatch, invalid API input, and successful qualification endpoint behavior. The endpoint test starts the real Express app and calls it with `fetch()`.

### 9. What would you add before using this in production?

Depending on the real requirements, I would consider authentication and authorization, stricter validation, pagination, migrations, rate limiting, production logging, secure deployment configuration, and broader tests. I intentionally left those out because this project is designed to stay small and understandable.

### 10. What was the most important thing you learned?

I learned the complete request flow: a React event changes state, `fetch()` sends an HTTP request, Express validates it, PostgreSQL reads or updates a row, and JSON travels back to update the interface. I also learned that benchmark numbers should be calculated from real cases rather than written as a constant.
