export type CheckMode = "always" | "never" | "ask";
export type Plan = "free" | "pro" | "team";

export interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  plan: Plan;
}

export interface UserSettingsRow {
  user_id: string;
  check_mode: CheckMode;
  ai_default: boolean;
  warn_main: boolean;
  theme: string;
  updated_at: string;
}

export interface PushEventRow {
  id: string;
  user_id: string;
  repo_url: string | null;
  branch: string;
  commit_hash: string;
  commit_msg: string;
  files_changed: number;
  used_ai: boolean;
  undone: boolean;
  duration_ms: number | null;
  created_at: string;
}

export interface AiUsageRow {
  id: string;
  user_id: string;
  tokens_used: number;
  model: string;
  created_at: string;
}

export interface ApiKeyRow {
  id: string;
  user_id: string;
  key_hash: string;
  label: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/**
 * Minimal Database type for the Supabase client generics. A full generated
 * type (via `supabase gen types typescript`) can replace this once the
 * project is linked.
 */
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      user_settings: { Row: UserSettingsRow; Insert: Partial<UserSettingsRow>; Update: Partial<UserSettingsRow> };
      push_events: { Row: PushEventRow; Insert: Partial<PushEventRow>; Update: Partial<PushEventRow> };
      ai_usage: { Row: AiUsageRow; Insert: Partial<AiUsageRow>; Update: Partial<AiUsageRow> };
      api_keys: { Row: ApiKeyRow; Insert: Partial<ApiKeyRow>; Update: Partial<ApiKeyRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
