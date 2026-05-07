/**
 * Bumped whenever a step's runtime characteristics change in a way that
 * makes prior measurements unrepresentative. `computeStepEstimates`
 * filters historical samples to those tagged with the current version,
 * so old data automatically rolls out instead of skewing ETAs.
 *
 * Version log:
 *   1 — initial sequential step 2.
 *   2 — step 2 batched (5 concurrent simulations); ~5× faster.
 */
export const PIPELINE_VERSION = 2;
