CREATE TABLE IF NOT EXISTS investors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sector VARCHAR(50) NOT NULL CHECK (
    sector IN ('Technology', 'Healthcare', 'Energy', 'Financial Services', 'Industrials', 'Mining')
  ),
  region VARCHAR(50) NOT NULL,
  min_investment INTEGER NOT NULL CHECK (min_investment >= 0),
  max_investment INTEGER NOT NULL CHECK (max_investment >= min_investment),
  email VARCHAR(150) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'New' CHECK (
    status IN ('New', 'Contacted', 'Qualified', 'Not a Fit')
  )
);
