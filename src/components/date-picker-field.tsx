"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { FormField } from "@/components/form-field";
import { usePopoverDismiss } from "@/hooks/use-popover-dismiss";
import { cn } from "@/lib/cn";

function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function DatePickerCalendar({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = "Select date",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? parseDateString(value) : null;
  const minDate = min ? parseDateString(min) : null;
  const maxDate = max ? parseDateString(max) : null;
  const [viewMonth, setViewMonth] = useState(
    () => selectedDate ?? minDate ?? new Date(),
  );

  useEffect(() => {
    if (value) {
      setViewMonth(parseDateString(value));
    }
  }, [value]);

  usePopoverDismiss(open, () => setOpen(false), rootRef);

  function isDisabled(date: Date) {
    const day = startOfDay(date);
    if (minDate && isBefore(day, startOfDay(minDate))) return true;
    if (maxDate && isAfter(day, startOfDay(maxDate))) return true;
    return false;
  }

  function handleSelect(date: Date) {
    if (isDisabled(date)) return;
    onChange(toDateString(date));
    setOpen(false);
  }

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = startOfDay(new Date());

  const displayValue = selectedDate
    ? format(selectedDate, "MMM d, yyyy")
    : placeholder;

  return (
    <div ref={rootRef} className={cn("relative", open && "z-50", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full min-h-12 items-center rounded-xl border-[1.5px] border-line bg-white px-4 py-3 pr-11 text-left text-[0.95rem] text-ink transition",
          "hover:border-[#c5d0ef] focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/10",
          open && "border-brand-blue ring-4 ring-brand-blue/10",
          !selectedDate && "text-[#a0aec0]",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60",
        )}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="truncate">{displayValue}</span>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          className="date-picker__popover absolute left-0 top-[calc(100%+0.5rem)] z-[110] rounded-2xl border-[1.5px] border-line bg-white shadow-[0_16px_40px_rgba(26,66,196,0.14)]"
          role="dialog"
          aria-label="Choose date"
        >
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__nav"
              aria-label="Previous month"
              onClick={() => setViewMonth((current) => subMonths(current, 1))}
            >
              ‹
            </button>
            <p className="date-picker__title">{format(viewMonth, "MMMM yyyy")}</p>
            <button
              type="button"
              className="date-picker__nav"
              aria-label="Next month"
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
            >
              ›
            </button>
          </div>

          <div className="date-picker__weekdays">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="date-picker__weekday">
                {day}
              </span>
            ))}
          </div>

          <div className="date-picker__grid">
            {days.map((day) => {
              const outsideMonth = !isSameMonth(day, viewMonth);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);
              const dayDisabled = isDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={dayDisabled}
                  aria-label={format(day, "MMMM d, yyyy")}
                  aria-selected={selected}
                  data-selected={selected ? "true" : undefined}
                  data-today={isToday && !selected ? "true" : undefined}
                  data-outside={outsideMonth && !selected ? "true" : undefined}
                  className="date-picker__day-btn"
                  onClick={() => handleSelect(day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type DateFieldProps = {
  label: string;
  hint?: string;
  id?: string;
  name?: string;
  value: string;
  onChange: (event: { target: { name?: string; value: string } }) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export function DateField({
  label,
  hint,
  id,
  name,
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  className = "",
  placeholder,
}: DateFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? name ?? generatedId;

  return (
    <FormField label={label} hint={hint} htmlFor={fieldId}>
      <DatePickerCalendar
          id={fieldId}
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          placeholder={placeholder ?? (required ? "Select date" : "Optional")}
          className={className}
          onChange={(nextValue) =>
            onChange({ target: { name, value: nextValue } })
          }
        />
    </FormField>
  );
}
