import type React from "react";
import { FormField } from "@/components/form-field";

export { SelectField } from "@/components/select-field";
export { DateField } from "@/components/date-picker-field";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function TextField({
  label,
  hint,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <FormField label={label} hint={hint} htmlFor={fieldId} className={className}>
      <input id={fieldId} className="input-field" {...props} />
    </FormField>
  );
}

type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextAreaField({
  label,
  hint,
  id,
  className = "",
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <FormField label={label} hint={hint} htmlFor={fieldId} className={className}>
      <textarea
        id={fieldId}
        className="input-field resize-none"
        {...props}
      />
    </FormField>
  );
}
