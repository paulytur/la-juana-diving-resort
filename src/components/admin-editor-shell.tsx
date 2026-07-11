"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AdminEditorShellProps = {
  list: ReactNode;
  detail: ReactNode | null;
  showDetail: boolean;
  emptyDetail?: ReactNode;
};

export function AdminEditorShell({
  list,
  detail,
  showDetail,
  emptyDetail,
}: AdminEditorShellProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
      <div
        className={cn(
          "lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto",
          showDetail && "hidden lg:block",
        )}
      >
        {list}
      </div>

      <div className={cn(!showDetail && "hidden lg:block")}>
        {detail ??
          emptyDetail ?? (
            <div className="surface-card rounded-2xl px-6 py-16 text-center">
              <p className="font-semibold text-brand-blue">Select an item to edit</p>
              <p className="input-hint mt-2">Choose from the list on the left.</p>
            </div>
          )}
      </div>
    </div>
  );
}

type AdminListItemProps = {
  active: boolean;
  onClick: () => void;
  image: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
};

export function AdminListItem({
  active,
  onClick,
  image,
  title,
  subtitle,
  badge,
}: AdminListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
        active
          ? "border-brand-blue bg-brand-blue-light shadow-sm"
          : "border-line bg-white hover:border-brand-blue/25 hover:bg-brand-yellow-soft/40",
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-brand-yellow-soft">
        <Image src={image} alt={title} fill className="object-cover" sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-blue">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
        {badge && <div className="mt-1.5">{badge}</div>}
      </div>
    </button>
  );
}

export function AdminDetailHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-brand-blue lg:hidden"
          >
            ← Back
          </button>
        )}
        <h2 className="text-xl font-bold text-brand-blue">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function AdminStatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600",
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
