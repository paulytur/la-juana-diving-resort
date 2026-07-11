import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={htmlFor} className="block space-y-1.5">
        <span className="text-sm font-semibold text-brand-blue">{label}</span>
        {hint && <span className="input-hint block font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
