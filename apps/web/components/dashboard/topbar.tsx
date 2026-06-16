import { type ReactNode } from "react";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-fg">{title}</h1>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
