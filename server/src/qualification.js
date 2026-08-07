function sameText(left, right) {
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
}

export function qualifyInvestor(investor, company) {
  const desiredInvestment = Number(company.desiredInvestment);
  const sectorMatch = sameText(investor.sector, company.sector);
  const regionMatch = sameText(investor.region, company.region);
  const investmentMatch =
    desiredInvestment >= Number(investor.min_investment) &&
    desiredInvestment <= Number(investor.max_investment);

  return {
    result: sectorMatch && regionMatch && investmentMatch ? 'QUALIFIED' : 'NOT QUALIFIED',
    checks: {
      sector: sectorMatch,
      region: regionMatch,
      investmentRange: investmentMatch,
    },
  };
}
