export type AuditInput = {
  brand_name: string;
  brand_url: string;
  category: string;
  competitors: string[];
};

export type StepStatus = "pending" | "running" | "done" | "failed";

export type StepRecord<T = unknown> = {
  name: string;
  status: StepStatus;
  result: T | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_seconds: number | null;
  pipeline_version: number | null;
};

export type AuditStatus = "pending" | "running" | "completed" | "failed";

export type Audit = {
  id: string;
  brand_name: string;
  brand_url: string;
  category: string;
  competitors: string[];
  status: AuditStatus;
  current_step: number;
  steps: StepRecord[];
  error: string | null;
  created_at: string;
  updated_at: string;
};

// Step 1
export type IntentType =
  | "category_discovery"
  | "comparison"
  | "problem_aware"
  | "occasion_use_case"
  | "budget"
  | "ingredient_material";

export type FunnelStage = "awareness" | "consideration" | "decision";

export type PromptItem = {
  prompt: string;
  intent_type: IntentType;
  funnel_stage: FunnelStage;
  why_it_matters: string;
};

export type Step1Result = { prompts: PromptItem[] };

// Step 2
export type RecommendationStrength = "strong" | "medium" | "weak" | "absent";

export type ShelfAnswer = {
  prompt: string;
  intent_type: IntentType;
  raw_answer: string;
  brands_mentioned: string[];
  target_brand_mentioned: boolean;
  target_brand_rank: number | null;
  competitors_mentioned: string[];
  recommendation_strength: RecommendationStrength;
  citations_or_sources: string[];
  notes: string;
};

export type Step2Result = { answers: ShelfAnswer[] };

// Step 3
export type Step3Result = {
  prompt_coverage: number;
  mention_rate: number; // 0..1
  average_rank_when_mentioned: number | null;
  strong_recommendation_rate: number; // 0..1
  top_competitor: string | null;
  competitor_dominance: number; // 0..1, share of answers featuring top competitor
  citation_coverage: number; // 0..1
  score: number; // 0..100
  breakdown: {
    mention_component: number;
    rank_component: number;
    strength_component: number;
    competitor_penalty: number;
    citation_component: number;
  };
};

// Step 4
export type AuditFieldQuality = "high" | "medium" | "low" | "none";

export type CatalogAuditField = {
  field: string;
  present: "yes" | "partial" | "no";
  quality: AuditFieldQuality;
  notes: string;
};

export type Step4Result = {
  source_url: string;
  fields: CatalogAuditField[];
  overall_summary: string;
};

// Step 5
export type Step5Result = {
  product_name: string;
  category: string;
  primary_benefits: string[];
  best_for: string[];
  not_best_for: string[];
  comparison_claims: string[];
  ai_safe_description: string;
};

// Step 6
export type Recommendation = {
  recommendation: string;
  why_it_helps: string;
  effort: "low" | "medium" | "high";
  expected_impact: "low" | "medium" | "high";
};

export type Step6Result = { recommendations: Recommendation[] };

export const STEP_NAMES = [
  "AI shopping prompt set",
  "AI shelf simulation",
  "AI Product Shelf Score",
  "Catalog AI-readiness audit",
  "Smart attribute enrichment",
  "Recommendations",
] as const;
