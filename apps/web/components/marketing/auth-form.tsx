"use client";

import { useActionState } from "react";
import { CheckCircle, EnvelopeSimple, Spinner } from "@phosphor-icons/react/dist/ssr";
import { GithubIcon, GoogleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AuthResult } from "@/app/(auth)/actions";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<AuthResult>;
  onGithub: () => Promise<void>;
  onGoogle: () => Promise<void>;
}

const initialState: AuthResult = {};

export function AuthForm({ mode, action, onGithub, onGoogle }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(async (_: AuthResult, formData: FormData) => {
    return action(formData);
  }, initialState);

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-(--radius-card) border border-border bg-surface p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand">
          <EnvelopeSimple size={22} weight="fill" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-bold text-fg">Check your inbox</h1>
          <p className="text-sm text-fg-muted">{state.message}</p>
        </div>
        <Button asChild variant="secondary" className="w-full">
          <a href="/login">
            <CheckCircle size={16} />
            Back to sign in
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-(--radius-card) border border-border bg-surface p-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-xl font-bold text-fg">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        {mode === "login" && (
          <p className="text-sm text-fg-muted">Welcome back to your push history.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <form action={onGithub} className="flex flex-col">
          <Button type="submit" variant="secondary" className="w-full">
            <GithubIcon />
            Continue with GitHub
          </Button>
        </form>
        <form action={onGoogle} className="flex flex-col">
          <Button type="submit" variant="secondary" className="w-full">
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-fg-subtle">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Spinner size={16} className="animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <a href="/signup" className="zap-underline text-brand">
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="zap-underline text-brand">
              Sign in
            </a>
          </>
        )}
      </p>
    </div>
  );
}
