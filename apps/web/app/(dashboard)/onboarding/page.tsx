import { headers } from "next/headers";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingFlow } from "@/components/dashboard/onboarding-flow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const appUrl = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-col">
      <Topbar title="Welcome to Zap" description="Three quick steps and you're pushing with Zap." />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <Card className="w-full">
          <CardContent className="p-6">
            <OnboardingFlow appUrl={appUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
