import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandCopyBlock } from "@/components/marketing/command-copy-block";
import { getAppUrl } from "@/lib/utils";
import type { ApiKeyRow, UserSettingsRow } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user!;

  const [{ data: settingsRow }, { data: apiKeys }, { data: profileRow }] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
    supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("users").select("plan").eq("id", user.id).single(),
  ]);

  const settings = (settingsRow ?? {
    check_mode: "ask",
    ai_default: false,
    warn_main: true,
  }) as Partial<UserSettingsRow>;

  const appUrl = getAppUrl();

  return (
    <div className="flex flex-col">
      <Topbar title="Settings" description="Manage your account, preferences, and API keys." />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fg">{user.email}</p>
              <p className="text-sm text-fg-muted">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant="brand" className="capitalize">
              {(profileRow as { plan?: string } | null)?.plan ?? "free"}
            </Badge>
          </CardContent>
        </Card>

        <PreferencesForm
          initialCheckMode={settings.check_mode ?? "ask"}
          initialAiDefault={settings.ai_default ?? false}
          initialWarnMain={settings.warn_main ?? true}
        />

        <ApiKeysManager apiKeys={(apiKeys ?? []) as ApiKeyRow[]} />

        <Card>
          <CardHeader>
            <CardTitle>Connect the CLI</CardTitle>
            <CardDescription>Run this in any repo to connect zap to this account.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <CommandCopyBlock command="zap init" />
            <p className="text-sm text-fg-muted">
              When prompted, set the dashboard URL to{" "}
              <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">{appUrl}</code> and paste an
              API key from above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
