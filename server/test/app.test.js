import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const exampleInvestor = {
  id: 1,
  name: 'Investor 001',
  sector: 'Technology',
  region: 'Ontario',
  min_investment: 100000,
  max_investment: 700000,
  email: 'investor001@example.test',
  status: 'New',
};

function makeDatabase() {
  return {
    async query(sql) {
      if (sql.includes('WHERE id = $1')) {
        return { rows: [exampleInvestor] };
      }
      return { rows: [exampleInvestor] };
    },
  };
}

async function withServer(runTest) {
  const server = createApp(makeDatabase()).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  try {
    await runTest(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('qualification endpoint calls the real rules and returns their checks', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/investors/1/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector: 'Technology',
        region: 'Ontario',
        desiredInvestment: 500000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.result, 'QUALIFIED');
    assert.equal(body.checks.sector, true);
    assert.equal(body.checks.region, true);
    assert.equal(body.checks.investmentRange, true);
  });
});

test('qualification endpoint rejects invalid request data', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/investors/1/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector: 'Technology',
        region: '',
        desiredInvestment: -1,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /required/i);
  });
});
