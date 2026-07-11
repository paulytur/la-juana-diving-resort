"use client";

import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { FormField } from "@/components/form-field";
import { usePopoverDismiss } from "@/hooks/use-popover-dismiss";
import { cn } from "@/lib/cn";

type SelectOption = {
  value: string;
  label: string;
};

function getTextFromChildren(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return getTextFromChildren(child.props.children);
      }
      return "";
    })
    .join("");
}

function parseOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const element = child as ReactElement<{
        value: string | number;
        children: ReactNode;
      }>;
      return {
        value: String(element.props.value),
        label: getTextFromChildren(element.props.children).trim(),
      };
    });
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue transition-transform",
        open && "rotate-180",
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type CustomSelectProps = {
  id: string;
  value: string | number | readonly string[];
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function CustomSelect({
  id,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select an option",
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stringValue = String(value);
  const selected = options.find((option) => option.value === stringValue);

  usePopoverDismiss(open, () => setOpen(false), rootRef);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full min-h-12 items-center rounded-xl border-[1.5px] border-line bg-white px-4 py-3 pr-11 text-left text-[0.95rem] text-ink transition",
          "hover:border-[#c5d0ef] focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/10",
          open && "border-brand-blue ring-4 ring-brand-blue/10",
          !selected && "text-[#a0aec0]",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60",
        )}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && !disabled && options.length > 0 && (
        <ul
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[100] max-h-64 w-full list-none overflow-y-auto rounded-2xl border-[1.5px] border-line bg-white p-2 shadow-[0_16px_40px_rgba(26,66,196,0.14)]"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === stringValue;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "block w-full rounded-[0.65rem] border border-transparent px-3.5 py-2.5 text-left text-[0.925rem] font-medium text-ink transition",
                    "hover:border-brand-yellow hover:bg-brand-yellow-soft",
                    isSelected &&
                      "border-brand-blue bg-brand-blue font-semibold text-white hover:border-brand-blue-dark hover:bg-brand-blue-dark",
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  hint?: string;
  id?: string;
  name?: string;
  value: string | number | readonly string[];
  onChange: (event: { target: { name?: string; value: string } }) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  hint,
  id,
  name,
  value,
  onChange,
  disabled,
  required,
  className = "",
  placeholder,
  children,
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;
  const options = parseOptions(children);

  return (
    <FormField label={label} hint={hint} htmlFor={fieldId}>
      <CustomSelect
        id={fieldId}
        value={value}
        options={options}
        disabled={disabled}
        placeholder={placeholder ?? (required ? "Select an option" : "Optional")}
        className={className}
        onChange={(nextValue) =>
          onChange({ target: { name, value: nextValue } })
        }
      />
    </FormField>
  );
}
