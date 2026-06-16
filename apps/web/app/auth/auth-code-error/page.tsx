import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZapMark } from "@/components/marketing/zap-mark";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <ZapMark size={24} />
        <span className="font-display text-xl font-bold text-fg">zap</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Link expired or invalid</CardTitle>
          <CardDescription>
            That confirmation or sign-in link didn&apos;t work. It may have expired or already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/signup">Create a new account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
