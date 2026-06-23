import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/data/ensure-user";
import { Sidebar } from "@/components/dashboard/sidebar";
import { CommandPalette } from "@/components/dashboard/command-palette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  // Safety net: guarantees public.users / user_settings rows exist before
  // any page tries to read or write rows that reference them (api_keys,
  // push_events, etc.) — see lib/data/ensure-user.ts.
  await ensureUserRecord(data.user.id, data.user.email);

  return (
    <div className="flex min-h-screen">
      <Sidebar email={data.user.email} />
      <main className="flex-1 min-w-0 page-enter">{children}</main>
      <CommandPalette />
    </div>
  );
}
