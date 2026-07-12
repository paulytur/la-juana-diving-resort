"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  unitLabel?: string;
  compact?: boolean;
  presets?: number[];
  disabled?: boolean;
};

const fieldShellClass =
  "flex w-auto min-h-10 flex-row items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-2 py-1 transition hover:border-[#c5d0ef] focus-within:border-brand-blue focus-within:outline-none focus-within:ring-4 focus-within:ring-brand-blue/10";

const compactShellClass =
  "inline-flex min-h-9 w-auto max-w-full flex-row items-center gap-1.5 rounded-lg border-[1.5px] border-line bg-white px-2 py-1 transition hover:border-[#c5d0ef] focus-within:border-brand-blue focus-within:outline-none focus-within:ring-4 focus-within:ring-brand-blue/10";

function StepperButton({
  label,
  disabled,
  onClick,
  compact = false,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-white font-semibold leading-none text-brand-blue transition hover:border-brand-yellow hover:bg-brand-yellow-soft disabled:cursor-not-allowed disabled:opacity-40",
        compact ? "h-7 w-7 text-base" : "date-picker__nav touch-target",
      )}
    >
      {children}
    </button>
  );
}

export function QuantityStepper({
  value,
  min = 0,
  max,
  onChange,
  unitLabel = "item",
  compact = false,
  presets,
  disabled = false,
}: QuantityStepperProps) {
  const unit = value === 1 ? unitLabel : `${unitLabel}s`;

  const minusButton = (
    <StepperButton
      label={`Decrease ${unitLabel}`}
      disabled={disabled || value <= min}
      compact={compact}
      onClick={() => onChange(Math.max(min, value - 1))}
    >
      −
    </StepperButton>
  );

  const plusButton = (
    <StepperButton
      label={`Increase ${unitLabel}`}
      disabled={disabled || value >= max}
      compact={compact}
      onClick={() => onChange(Math.min(max, value + 1))}
    >
      +
    </StepperButton>
  );

  const valueLabel = (
    <p
      className={cn(
        "min-w-0 text-center text-ink",
        compact ? "px-1 text-sm" : "flex-1 text-[0.95rem]",
      )}
    >
      <span className="font-semibold text-brand-blue">{value}</span> {unit}
    </p>
  );

  const presetButtons =
    presets && presets.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-xs font-medium text-muted">Quick:</span>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled || preset > max || preset < min}
            onClick={() => onChange(preset)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              value === preset
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-line bg-white text-brand-blue hover:border-brand-blue hover:bg-brand-blue-light",
              (preset > max || preset < min) && "opacity-40",
            )}
          >
            {preset}
          </button>
        ))}
      </div>
    ) : null;

  if (compact) {
    return (
      <div className={compactShellClass}>
        {minusButton}
        {valueLabel}
        {plusButton}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={fieldShellClass}>
        {minusButton}
        {valueLabel}
        {plusButton}
      </div>
      {presetButtons}
    </div>
  );
}

type CapacityProgressProps = {
  selected: number;
  required: number;
};

export function CapacityProgress({ selected, required }: CapacityProgressProps) {
  const complete = selected >= required;
  const percent = required > 0 ? Math.min(100, Math.round((selected / required) * 100)) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        complete
          ? "border-brand-blue/30 bg-brand-blue-light"
          : "border-brand-yellow bg-brand-yellow-soft",
      )}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-brand-blue">
          {complete ? "All guests covered" : "Room capacity"}
        </p>
        <p className="font-bold text-brand-blue">
          {selected} / {required} guests
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            complete ? "bg-brand-blue" : "bg-brand-blue/70",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!complete && (
        <p className="mt-2 text-xs text-muted">
          Add more rooms until every guest has a place to stay.
        </p>
      )}
    </div>
  );
}
