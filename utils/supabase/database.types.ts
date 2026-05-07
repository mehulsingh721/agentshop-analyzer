import type { Audit, AuditStatus, StepRecord } from "@/lib/types";

// Hand-written Database type for the single `audits` table.
// If the schema grows, generate this with: `supabase gen types typescript`.
export type Database = {
  public: {
    Tables: {
      audits: {
        Row: {
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
        Insert: {
          id?: string;
          brand_name: string;
          brand_url: string;
          category: string;
          competitors?: string[];
          status?: AuditStatus;
          current_step?: number;
          steps?: StepRecord[];
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Audit> & { updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
