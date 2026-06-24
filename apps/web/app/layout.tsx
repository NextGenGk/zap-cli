import type { Metadata } from "next";
import { Phudu } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const phudu = Phudu({
  subsets: ["latin"],
  variable: "--font-phudu",
});

export const metadata: Metadata = {
  title: {
    template: "%s - Zap",
    default: "Zap - push code, just type zap",
  },
  description:
    "Zap replaces your entire git push workflow with one command: stage, commit (with AI-generated messages), and push — with main-branch guardrails, pre-push checks, and one-step undo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`bg-canvas text-fg antialiased ${phudu.variable}`}>
        {/* Global frame borders */}
        <div className="pointer-events-none fixed inset-y-0 left-0 right-0 z-50 flex justify-center px-6 hidden md:flex">
          <div className="w-full max-w-[1200px] border-x border-dashed border-border/80" />
        </div>
        
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
