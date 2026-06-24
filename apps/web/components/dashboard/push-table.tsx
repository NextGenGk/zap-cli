import { ArrowSquareOut, Sparkle, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { timeAgo, truncate, remoteUrlToHttps } from "@/lib/utils";
import type { PushEventRow } from "@/lib/supabase/types";

export function PushTable({ events, emptyState }: { events: PushEventRow[]; emptyState?: React.ReactNode }) {
  if (events.length === 0) {
    return (
      emptyState ?? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="text-sm font-medium text-fg">No pushes yet</p>
          <p className="max-w-xs text-sm text-fg-muted">
            Run <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">zap</code> in any
            connected repo to see your push history here.
          </p>
        </div>
      )
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Commit</TableHead>
          <TableHead className="hidden sm:table-cell">Files</TableHead>
          <TableHead className="hidden md:table-cell">Hash</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Repo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id} className={event.undone ? "opacity-50" : undefined}>
            <TableCell className="whitespace-nowrap text-fg-muted">{timeAgo(event.created_at)}</TableCell>
            <TableCell>
              <Badge>{event.branch}</Badge>
            </TableCell>
            <TableCell className="max-w-xs">
              <span className="flex items-center gap-2">
                <span className="truncate text-fg">{truncate(event.commit_msg, 60)}</span>
                {event.used_ai && <Sparkle size={14} weight="fill" className="shrink-0 text-info" />}
                {event.undone && (
                  <span className="flex items-center gap-1 text-xs text-fg-subtle">
                    <ArrowCounterClockwise size={12} />
                    undone
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-fg-muted">{event.files_changed}</TableCell>
            <TableCell className="hidden md:table-cell font-mono text-xs text-fg-subtle">{event.commit_hash}</TableCell>
            <TableCell className="hidden sm:table-cell text-right">
              {event.repo_url && (
                <a
                  href={`${remoteUrlToHttps(event.repo_url)}/commit/${event.commit_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-brand"
                >
                  View <ArrowSquareOut size={12} />
                </a>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
