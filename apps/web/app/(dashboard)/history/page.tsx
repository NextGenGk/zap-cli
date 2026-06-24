import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { PushTable } from "@/components/dashboard/push-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PushEventRow } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Push History",
};

const PAGE_SIZE = 100;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch: branchFilter } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  // Fetch ALL events (up to PAGE_SIZE) without filter first, then derive
  // branches from that — so we always show every branch the user has pushed to.
  const [{ data: allEventsRaw }, { data: filteredRaw }] = await Promise.all([
    supabase
      .from("push_events")
      .select("branch")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
    branchFilter
      ? supabase
          .from("push_events")
          .select("*")
          .eq("user_id", userId)
          .eq("branch", branchFilter)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE)
      : supabase
          .from("push_events")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
  ]);

  const allEvents = (allEventsRaw ?? []) as { branch: string }[];
  const filteredEvents = (filteredRaw ?? []) as PushEventRow[];

  // Deduplicate branches, preserving insertion order (most-recently-pushed first)
  const seen = new Set<string>();
  const branches: string[] = [];
  for (const e of allEvents) {
    if (!seen.has(e.branch)) {
      seen.add(e.branch);
      branches.push(e.branch);
    }
  }

  return (
    <div className="flex flex-col">
      <Topbar
        title="Push history"
        description={`${filteredEvents.length} push${filteredEvents.length === 1 ? "" : "es"}${branchFilter ? ` on ${branchFilter}` : ""}`}
      />

      <div className="flex flex-col gap-4 p-4 sm:p-8">
        {branches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <FilterBadge label="All branches" href="/history" active={!branchFilter} />
            {branches.map((b) => (
              <FilterBadge
                key={b}
                label={b}
                href={`/history?branch=${encodeURIComponent(b)}`}
                active={branchFilter === b}
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <PushTable events={filteredEvents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterBadge({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href}>
      <Badge
        variant={active ? "brand" : "default"}
        className={cn("cursor-pointer transition-colors", !active && "hover:border-border-strong")}
      >
        {label}
      </Badge>
    </Link>
  );
}
