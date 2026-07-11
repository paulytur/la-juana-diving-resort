import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-blue sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
