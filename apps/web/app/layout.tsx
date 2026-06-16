import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "zap — push code, just type zap",
  description:
    "zap replaces your entire git push workflow with one command: stage, commit (with AI-generated messages), and push — with main-branch guardrails, pre-push checks, and one-step undo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-fg antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-fg)",
            },
          }}
        />
      </body>
    </html>
  );
}
