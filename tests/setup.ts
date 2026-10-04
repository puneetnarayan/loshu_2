import '@testing-library/jest-dom/vitest';
import fc from 'fast-check';

// Override with FC_RUNS=5000 npm test for a heavier property-test pass.
fc.configureGlobal({ numRuns: Number(process.env.FC_RUNS ?? 100) });
