import { benchmarkCases } from '../benchmark/benchmarkCases.js';
import { qualifyInvestor } from '../src/qualification.js';

const results = benchmarkCases.map((benchmarkCase) => {
  const actualOutcome = qualifyInvestor(
    benchmarkCase.investor,
    benchmarkCase.companyCriteria,
  ).result;

  return {
    ...benchmarkCase,
    actualOutcome,
    matchesExpected: actualOutcome === benchmarkCase.expectedOutcome,
  };
});

const matches = results.filter((result) => result.matchesExpected);
const manualReviews = results.filter((result) => !result.matchesExpected);
const total = results.length;
const matchPercentage = ((matches.length / total) * 100).toFixed(1);
const reviewPercentage = ((manualReviews.length / total) * 100).toFixed(1);

console.log('Investor Qualification Benchmark');
console.log('================================');
console.log(`Total cases: ${total}`);
console.log(`Matched expected outcome: ${matches.length}/${total} (${matchPercentage}%)`);
console.log(`Flagged for manual review: ${manualReviews.length}/${total} (${reviewPercentage}%)`);

console.log('\nManual-review cases');
console.log('-------------------');
for (const result of manualReviews) {
  console.log(`Case ${result.caseNumber}: ${result.caseType}`);
  console.log(`  Investor: ${result.investor.name}`);
  console.log(`  Expected: ${result.expectedOutcome}`);
  console.log(`  Actual:   ${result.actualOutcome}`);
  console.log(`  Why: ${result.note}`);
}
