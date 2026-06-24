"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Plus, Spinner, Trash, Warning } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createApiKey, revokeApiKey, type ActionResult, type CreateApiKeyResult } from "@/app/(dashboard)/settings/actions";
import { timeAgo } from "@/lib/utils";
import type { ApiKeyRow } from "@/lib/supabase/types";

const initialCreateState: CreateApiKeyResult = {};
const initialRevokeState: ActionResult = {};

export function ApiKeysManager({ apiKeys }: { apiKeys: ApiKeyRow[] }) {
  const [open, setOpen] = useState(false);
  const [createState, createAction, creating] = useActionState(async (_: CreateApiKeyResult, formData: FormData) => {
    return createApiKey(formData);
  }, initialCreateState);

  const [revokeState, revokeAction] = useActionState(async (_: ActionResult, formData: FormData) => {
    return revokeApiKey(formData);
  }, initialRevokeState);

  const activeKeys = apiKeys.filter((k) => !k.revoked_at);
  const revokedKeys = apiKeys.filter((k) => k.revoked_at);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>API keys</CardTitle>
          <CardDescription>Used by `zap init` to connect the CLI to this account.</CardDescription>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              New key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {createState.rawKey ? (
              <RevealKey rawKey={createState.rawKey} label={createState.label} onClose={() => setOpen(false)} />
            ) : (
              <form action={createAction} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>New API key</DialogTitle>
                  <DialogDescription>
                    Give it a label so you can recognize it later (e.g. &quot;Work laptop&quot;).
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" placeholder="Work laptop" defaultValue="CLI key" required />
                </div>
                {createState.error && <p className="text-sm text-danger">{createState.error}</p>}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={creating}>
                    {creating && <Spinner size={14} className="animate-spin" />}
                    Generate key
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {activeKeys.length === 0 && revokedKeys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-sm font-medium text-fg">No API keys yet</p>
            <p className="max-w-xs text-sm text-fg-muted">
              Generate one and paste it into <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">zap init</code>.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...activeKeys, ...revokedKeys].map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="text-fg">{key.label}</TableCell>
                  <TableCell className="hidden sm:table-cell text-fg-muted">{timeAgo(key.created_at)}</TableCell>
                  <TableCell className="hidden md:table-cell text-fg-muted">{key.last_used_at ? timeAgo(key.last_used_at) : "Never"}</TableCell>
                  <TableCell>
                    {key.revoked_at ? <Badge variant="danger">Revoked</Badge> : <Badge variant="success">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {!key.revoked_at && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="ghost" size="sm">
                            <Trash size={14} />
                            Revoke
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke API key</DialogTitle>
                            <DialogDescription>
                              This will immediately invalidate the key <strong>{key.label}</strong>. Any CLI using it will
                              lose access to the dashboard.
                            </DialogDescription>
                          </DialogHeader>
                          {revokeState.error && (
                            <p className="text-sm text-danger">{revokeState.error}</p>
                          )}
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="ghost">
                                Cancel
                              </Button>
                            </DialogClose>
                            <form action={revokeAction}>
                              <input type="hidden" name="id" value={key.id} />
                              <Button type="submit" variant="destructive" size="sm">
                                Yes, revoke
                              </Button>
                            </form>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RevealKey({ rawKey, label, onClose }: { rawKey: string; label?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{label ?? "New key"} created</DialogTitle>
        <DialogDescription>
          Copy this key now — you won&apos;t be able to see it again. Paste it into{" "}
          <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">zap init</code> when prompted for
          an API key.
        </DialogDescription>
      </DialogHeader>

      <button
        onClick={handleCopy}
        type="button"
        className="flex items-center justify-between gap-3 rounded-(--radius-input) border border-border bg-surface-elevated px-3 py-2.5 font-mono text-sm text-fg transition-colors hover:border-border-strong"
      >
        <span className="truncate">{rawKey}</span>
        {copied ? <Check size={16} className="shrink-0 text-success" /> : <Copy size={16} className="shrink-0 text-fg-subtle" />}
      </button>

      <p className="flex items-center gap-2 text-xs text-warning">
        <Warning size={14} weight="fill" />
        This key won&apos;t be shown again.
      </p>

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}
