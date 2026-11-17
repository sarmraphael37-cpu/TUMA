"use client";

import { useActionState } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";

import { updateStorefrontAction } from "@/app/(app)/dashboard/storefront/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/auth/form-state";

const INITIAL: FormState = { status: "idle" };

export function StorefrontForm({
  slug,
  isPublic,
  logoUrl,
  coverImageUrl,
  whatsapp,
  supported,
}: {
  slug: string;
  isPublic: boolean;
  logoUrl: string | null;
  coverImageUrl: string | null;
  whatsapp: string | null;
  supported: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateStorefrontAction,
    INITIAL,
  );

  const shopUrl = `/shop/${slug}`;

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <FormAlert tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </FormAlert>
      ) : null}

      {!supported ? (
        <div className="rounded-xl border border-amber-glow/20 bg-amber-glow/[0.07] px-3.5 py-3 text-[12px] leading-relaxed text-amber-100">
          Your workspace database does not have the storefront columns yet.
          Apply the storefront migration to publish your shop.
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={isPublic}
            disabled={!supported}
            className="mt-0.5 size-4 accent-[var(--color-cyan-glow)]"
          />
          <span>
            <span className="block text-[12.5px] font-medium">
              Publish my storefront
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground">
              When this is on, customers can browse your catalogue and place
              orders at {shopUrl}.
            </span>
          </span>
        </label>

        {isPublic ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-cyan-glow hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open my storefront
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Logo image link"
          htmlFor="logoUrl"
          hint="A public https:// image link"
          error={state.fieldErrors?.logoUrl?.[0]}
        >
          <Input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={logoUrl ?? ""}
            placeholder="https://images.example.com/logo.png"
            disabled={!supported}
            className="h-10"
          />
        </Field>

        <Field
          label="Cover image link"
          htmlFor="coverImageUrl"
          hint="Shown across the top of the shop"
          error={state.fieldErrors?.coverImageUrl?.[0]}
        >
          <Input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            defaultValue={coverImageUrl ?? ""}
            placeholder="https://images.example.com/cover.jpg"
            disabled={!supported}
            className="h-10"
          />
        </Field>

        <Field
          label="WhatsApp number"
          htmlFor="whatsapp"
          hint="Customers can reach you on WhatsApp"
          error={state.fieldErrors?.whatsapp?.[0]}
        >
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={whatsapp ?? ""}
            placeholder="+237 6 77 00 00 05"
            disabled={!supported}
            className="h-10"
          />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={pending || !supported}
        className="h-10 rounded-xl px-4 text-[13px]"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        {pending ? "Saving…" : "Save storefront"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11.5px] font-medium text-foreground/85"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[10.5px] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
