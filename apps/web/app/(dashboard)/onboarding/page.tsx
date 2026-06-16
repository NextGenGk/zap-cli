import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingFlow } from "@/components/dashboard/onboarding-flow";

export default function OnboardingPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.zap.dev";

  return (
    <div className="flex flex-col">
      <Topbar title="Welcome to zap ⚡" description="Three quick steps and you're pushing with zap." />

      <div className="flex flex-col gap-6 p-8">
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <OnboardingFlow appUrl={appUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
