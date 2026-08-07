const sectors = [
  'Technology',
  'Healthcare',
  'Energy',
  'Financial Services',
  'Industrials',
  'Mining',
];

const regions = [
  'Ontario',
  'British Columbia',
  'Alberta',
  'Quebec',
  'New York',
  'California',
  'Texas',
  'Illinois',
];

const borderlineCases = {
  14: {
    type: 'neighboring region',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: investor.sector,
      region: regions[(regions.indexOf(investor.region) + 1) % regions.length],
      desiredInvestment: (investor.min_investment + investor.max_investment) / 2,
    }),
    reason: 'The expected result treats a nearby region as compatible; the app requires an exact region.',
  },
  27: {
    type: 'slightly above maximum',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: investor.sector,
      region: investor.region,
      desiredInvestment: investor.max_investment + 25000,
    }),
    reason: 'The amount is only $25,000 above the stated maximum, but the app applies the limit strictly.',
  },
  41: {
    type: 'related sector',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: sectors[(sectors.indexOf(investor.sector) + 1) % sectors.length],
      region: investor.region,
      desiredInvestment: (investor.min_investment + investor.max_investment) / 2,
    }),
    reason: 'The expected result assumes two adjacent sectors may overlap; the app requires the same sector label.',
  },
  58: {
    type: 'cross-region mandate',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: investor.sector,
      region: regions[(regions.indexOf(investor.region) + 1) % regions.length],
      desiredInvestment: investor.min_investment,
    }),
    reason: 'The expected result assumes this investor may work in another region; the stored mandate is exact.',
  },
  72: {
    type: 'slightly below minimum',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: investor.sector,
      region: investor.region,
      desiredInvestment: investor.min_investment - 25000,
    }),
    reason: 'The amount is only $25,000 below the minimum, but the app does not guess that the investor will negotiate.',
  },
  86: {
    type: 'sector adjacency',
    expected: 'QUALIFIED',
    makeCriteria: (investor) => ({
      sector: sectors[(sectors.indexOf(investor.sector) + 1) % sectors.length],
      region: investor.region,
      desiredInvestment: investor.max_investment,
    }),
    reason: 'A human labeled the related sector as a fit; the rule only recognizes exact sector equality.',
  },
  99: {
    type: 'missing qualitative preference',
    expected: 'NOT QUALIFIED',
    makeCriteria: (investor) => ({
      sector: investor.sector,
      region: investor.region,
      desiredInvestment: (investor.min_investment + investor.max_investment) / 2,
    }),
    reason: 'All three stored rules pass, but the expected label assumes an unstored qualitative preference.',
  },
};

function makeStandardCriteria(investor, caseNumber) {
  const pattern = caseNumber % 4;

  if (pattern === 0) {
    return {
      criteria: {
        sector: sectors[(sectors.indexOf(investor.sector) + 1) % sectors.length],
        region: investor.region,
        desiredInvestment: investor.min_investment,
      },
      expected: 'NOT QUALIFIED',
    };
  }

  if (pattern === 2) {
    return {
      criteria: {
        sector: investor.sector,
        region: regions[(regions.indexOf(investor.region) + 1) % regions.length],
        desiredInvestment: investor.min_investment,
      },
      expected: 'NOT QUALIFIED',
    };
  }

  if (pattern === 3) {
    return {
      criteria: {
        sector: investor.sector,
        region: investor.region,
        desiredInvestment: investor.max_investment + 100000,
      },
      expected: 'NOT QUALIFIED',
    };
  }

  return {
    criteria: {
      sector: investor.sector,
      region: investor.region,
      desiredInvestment: (investor.min_investment + investor.max_investment) / 2,
    },
    expected: 'QUALIFIED',
  };
}

export const benchmarkCases = Array.from({ length: 100 }, (_, index) => {
  const caseNumber = index + 1;
  const minimum = 100000 + (index % 10) * 50000;
  const investor = {
    id: caseNumber,
    name: `Benchmark Investor ${String(caseNumber).padStart(3, '0')}`,
    sector: sectors[index % sectors.length],
    region: regions[index % regions.length],
    min_investment: minimum,
    max_investment: minimum + 500000,
  };

  const borderline = borderlineCases[caseNumber];
  if (borderline) {
    return {
      caseNumber,
      investor,
      companyCriteria: borderline.makeCriteria(investor),
      expectedOutcome: borderline.expected,
      note: borderline.reason,
      caseType: borderline.type,
    };
  }

  const standard = makeStandardCriteria(investor, caseNumber);
  return {
    caseNumber,
    investor,
    companyCriteria: standard.criteria,
    expectedOutcome: standard.expected,
    note: 'Standard exact-rule case.',
    caseType: 'standard',
  };
});
