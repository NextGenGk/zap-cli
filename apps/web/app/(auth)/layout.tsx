import Link from "next/link";
import { ZapMark } from "@/components/marketing/zap-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="glow-brand pointer-events-none absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2" />
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2">
        <ZapMark size={24} />
        <span className="font-display text-xl font-bold text-fg">zap</span>
      </Link>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
