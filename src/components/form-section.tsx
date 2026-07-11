import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="form-section space-y-5 overflow-visible">
      <div>
        <h3 className="text-base font-bold text-brand-blue">{title}</h3>
        {description && <p className="input-hint mt-1.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}
