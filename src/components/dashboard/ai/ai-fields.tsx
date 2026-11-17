"use client";

import type { ReactNode } from "react";
import { Languages } from "lucide-react";

import { cn } from "cn";
import {
  AI_LANGUAGES,
  AI_LANGUAGE_LABELS,
  AI_TONES,
  AI_TONE_LABELS,
  type AiLanguage,
  type AiTone,
} from "@/lib/ai/types";

export function AiField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-medium text-foreground/85"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[10.5px] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AiLanguageToggle({
  value,
  onChange,
  disabled,
}: {
  value: AiLanguage;
  onChange: (language: AiLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] p-0.5">
      <span className="grid size-6 place-items-center text-muted-foreground">
        <Languages className="size-3.5" aria-hidden />
      </span>
      {AI_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          disabled={disabled}
          onClick={() => onChange(language)}
          aria-pressed={value === language}
          className={cn(
            "h-6 rounded-md px-2 text-[10.5px] font-medium transition-colors disabled:opacity-50",
            value === language
              ? "bg-electric-500/20 text-electric-200"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {language === "en" ? "EN" : "FR"}
          <span className="sr-only"> {AI_LANGUAGE_LABELS[language]}</span>
        </button>
      ))}
    </div>
  );
}

export function AiSelect({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[12px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
    >
      {children}
    </select>
  );
}

export function AiToneSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: AiTone;
  onChange: (tone: AiTone) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <AiSelect
      id={id}
      value={value}
      onChange={(next) => onChange(next as AiTone)}
      disabled={disabled}
    >
      {AI_TONES.map((tone) => (
        <option key={tone} value={tone}>
          {AI_TONE_LABELS[tone]}
        </option>
      ))}
    </AiSelect>
  );
}

export function AiToolHeading({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-electric-500/12 text-electric-300 ring-1 ring-electric-400/20">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-[13.5px] font-medium">{title}</h3>
          <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Small inline pills used for suggested prompts and focus presets. */
export function AiSuggestionChip({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-white/[0.09] bg-white/[0.025] px-2.5 py-1 text-left text-[10.5px] leading-relaxed text-muted-foreground transition-colors hover:border-electric-400/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}
