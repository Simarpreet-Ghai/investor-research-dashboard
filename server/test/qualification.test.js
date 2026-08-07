import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyInvestor } from '../src/qualification.js';

const investor = {
  sector: 'Technology',
  region: 'Ontario',
  min_investment: 200000,
  max_investment: 800000,
};

test('qualifies when sector, region, and investment range all match', () => {
  const result = qualifyInvestor(investor, {
    sector: 'Technology',
    region: 'Ontario',
    desiredInvestment: 500000,
  });

  assert.equal(result.result, 'QUALIFIED');
  assert.deepEqual(result.checks, {
    sector: true,
    region: true,
    investmentRange: true,
  });
});

test('does not qualify when the sector differs', () => {
  const result = qualifyInvestor(investor, {
    sector: 'Healthcare',
    region: 'Ontario',
    desiredInvestment: 500000,
  });

  assert.equal(result.result, 'NOT QUALIFIED');
  assert.equal(result.checks.sector, false);
});

test('treats the minimum and maximum investments as valid boundaries', () => {
  const atMinimum = qualifyInvestor(investor, {
    sector: 'Technology',
    region: 'Ontario',
    desiredInvestment: 200000,
  });
  const aboveMaximum = qualifyInvestor(investor, {
    sector: 'Technology',
    region: 'Ontario',
    desiredInvestment: 800001,
  });

  assert.equal(atMinimum.result, 'QUALIFIED');
  assert.equal(aboveMaximum.result, 'NOT QUALIFIED');
  assert.equal(aboveMaximum.checks.investmentRange, false);
});

test('does not qualify when the region differs', () => {
  const result = qualifyInvestor(investor, {
    sector: 'Technology',
    region: 'Quebec',
    desiredInvestment: 500000,
  });

  assert.equal(result.result, 'NOT QUALIFIED');
  assert.equal(result.checks.region, false);
});
