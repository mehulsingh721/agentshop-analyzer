import type { Step2Result, Step3Result } from "../types";

const STRENGTH_WEIGHT: Record<string, number> = {
  strong: 1,
  medium: 0.6,
  weak: 0.3,
  absent: 0,
};

export function step3Score(step2: Step2Result): Step3Result {
  const answers = step2.answers;
  const total = answers.length || 1;

  const mentions = answers.filter((a) => a.target_brand_mentioned);
  const mention_rate = mentions.length / total;

  const ranks = mentions
    .map((a) => a.target_brand_rank)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const average_rank_when_mentioned =
    ranks.length > 0 ? ranks.reduce((s, r) => s + r, 0) / ranks.length : null;

  const strong_recommendation_rate =
    answers.filter((a) => a.recommendation_strength === "strong").length /
    total;

  // Top competitor by appearance count across all answers
  const compCounts = new Map<string, number>();
  for (const a of answers) {
    for (const c of a.competitors_mentioned) {
      compCounts.set(c, (compCounts.get(c) ?? 0) + 1);
    }
  }
  let top_competitor: string | null = null;
  let topCount = 0;
  for (const [name, count] of compCounts) {
    if (count > topCount) {
      topCount = count;
      top_competitor = name;
    }
  }
  const competitor_dominance = top_competitor ? topCount / total : 0;

  const citation_coverage =
    answers.filter((a) => a.citations_or_sources.length > 0).length / total;

  // Component scores (each 0..1 except rank, then weighted into 100)
  const mention_component = mention_rate; // higher = better
  const rank_component =
    average_rank_when_mentioned !== null
      ? Math.max(0, 1 - (average_rank_when_mentioned - 1) / 4) // rank 1 -> 1.0, rank 5+ -> 0
      : 0;
  const strength_component =
    answers.reduce(
      (s, a) => s + (STRENGTH_WEIGHT[a.recommendation_strength] ?? 0),
      0
    ) / total;
  // Penalty: high competitor dominance hurts the brand. We invert so 0 dominance = full points.
  const competitor_penalty = 1 - competitor_dominance;
  const citation_component = citation_coverage;

  const score = Math.round(
    100 *
      (0.3 * mention_component +
        0.2 * rank_component +
        0.2 * strength_component +
        0.15 * competitor_penalty +
        0.15 * citation_component)
  );

  return {
    prompt_coverage: total,
    mention_rate,
    average_rank_when_mentioned,
    strong_recommendation_rate,
    top_competitor,
    competitor_dominance,
    citation_coverage,
    score,
    breakdown: {
      mention_component,
      rank_component,
      strength_component,
      competitor_penalty,
      citation_component,
    },
  };
}
