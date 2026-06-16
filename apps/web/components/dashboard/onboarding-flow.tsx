"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Spinner } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { CommandCopyBlock } from "@/components/marketing/command-copy-block";
import { createApiKey, type CreateApiKeyResult } from "@/app/(dashboard)/settings/actions";

const initialState: CreateApiKeyResult = {};

export function OnboardingFlow({ appUrl }: { appUrl: string }) {
  const [state, formAction, pending] = useActionState(async (_: CreateApiKeyResult, formData: FormData) => {
    return createApiKey(formData);
  }, initialState);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!state.rawKey) return;
    await navigator.clipboard.writeText(state.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-8">
      <OnboardingStep number={1} title="Install zap" done>
        <CommandCopyBlock command="npm install -g zap-git" />
      </OnboardingStep>

      <OnboardingStep number={2} title="Generate your API key" done={!!state.rawKey}>
        {state.rawKey ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center justify-between gap-3 rounded-(--radius-input) border border-border bg-surface-elevated px-3 py-2.5 font-mono text-sm text-fg transition-colors hover:border-border-strong"
            >
              <span className="truncate">{state.rawKey}</span>
              {copied ? <Check size={16} className="shrink-0 text-success" /> : <Copy size={16} className="shrink-0 text-fg-subtle" />}
            </button>
            <p className="text-xs text-warning">Copy this now — it won&apos;t be shown again.</p>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="label" value="First key" />
            <Button type="submit" disabled={pending} size="sm">
              {pending && <Spinner size={14} className="animate-spin" />}
              Generate API key
            </Button>
            {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
          </form>
        )}
      </OnboardingStep>

      <OnboardingStep number={3} title="Connect your repo" done={false}>
        <div className="flex flex-col gap-2">
          <CommandCopyBlock command="zap init" />
          <p className="text-sm text-fg-muted">
            When prompted: dashboard URL is{" "}
            <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">{appUrl}</code>, then paste the
            API key from step 2.
          </p>
        </div>
      </OnboardingStep>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard">
            Go to dashboard <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function OnboardingStep({
  number,
  title,
  done,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
          done ? "border-brand bg-brand/10 text-brand" : "border-border text-fg-muted"
        }`}
      >
        {done ? <Check size={14} weight="bold" /> : number}
      </div>
      <div className="flex flex-1 flex-col gap-3 pb-2">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {children}
      </div>
    </div>
  );
}
