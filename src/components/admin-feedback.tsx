import { cn } from "@/lib/cn";

type AdminFeedbackProps = {
  message: string;
  tone?: "success" | "error" | "info";
};

export function AdminFeedback({ message, tone = "info" }: AdminFeedbackProps) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        tone === "success" && "border border-green-200 bg-green-50 text-green-800",
        tone === "error" && "border border-red-200 bg-red-50 text-red-700",
        tone === "info" && "border border-line bg-white text-brand-blue",
      )}
    >
      {message}
    </p>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
};

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="text-lg font-bold text-brand-blue">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
