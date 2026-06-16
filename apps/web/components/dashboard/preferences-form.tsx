"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updatePreferences, type ActionResult } from "@/app/(dashboard)/settings/actions";
import type { CheckMode } from "@/lib/supabase/types";

interface PreferencesFormProps {
  initialCheckMode: CheckMode;
  initialAiDefault: boolean;
  initialWarnMain: boolean;
}

const initialState: ActionResult = {};

export function PreferencesForm({ initialCheckMode, initialAiDefault, initialWarnMain }: PreferencesFormProps) {
  const [checkMode, setCheckMode] = useState<CheckMode>(initialCheckMode);
  const [aiDefault, setAiDefault] = useState(initialAiDefault);
  const [warnMain, setWarnMain] = useState(initialWarnMain);

  const [state, formAction, pending] = useActionState(async (_: ActionResult, formData: FormData) => {
    return updatePreferences(formData);
  }, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLI preferences</CardTitle>
        <CardDescription>
          Synced with `zap config` on every machine where you&apos;ve run `zap init` with this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="check_mode">Pre-push checks</Label>
              <p className="text-sm text-fg-muted">Run lint/test/build before pushing.</p>
            </div>
            <input type="hidden" name="check_mode" value={checkMode} />
            <Select value={checkMode} onValueChange={(v) => setCheckMode(v as CheckMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">Ask</SelectItem>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="ai_default">AI commit messages by default</Label>
              <p className="text-sm text-fg-muted">Equivalent to always running `zap --ai`.</p>
            </div>
            <Switch id="ai_default" checked={aiDefault} onCheckedChange={setAiDefault} />
            <input type="hidden" name="ai_default" value={aiDefault ? "on" : "off"} />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="warn_main">Warn before pushing to main/master</Label>
              <p className="text-sm text-fg-muted">Adds a confirmation step on protected branches.</p>
            </div>
            <Switch id="warn_main" checked={warnMain} onCheckedChange={setWarnMain} />
            <input type="hidden" name="warn_main" value={warnMain ? "on" : "off"} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending && <Spinner size={14} className="animate-spin" />}
              Save preferences
            </Button>
            {state.success && <span className="text-sm text-success">Saved</span>}
            {state.error && <span className="text-sm text-danger">{state.error}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
