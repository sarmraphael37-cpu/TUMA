"use client";

import { useActionState, useDeferredValue, useState } from "react";

import { createBusinessAction } from "@/app/(app)/onboarding/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyFormState } from "@/lib/auth/form-state";
import { slugifyBusinessName } from "@/lib/slug";
import { businessCategories } from "@/lib/validation";

export function BusinessForm() {
  const [state, formAction] = useActionState(
    createBusinessAction,
    emptyFormState,
  );
  const [name, setName] = useState("");
  const deferredName = useDeferredValue(name);
  const errors = state.fieldErrors ?? {};
  const slug = slugifyBusinessName(deferredName || "your business");

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <AuthField
        label="Business name"
        htmlFor="name"
        error={errors.name?.[0]}
        hint={`Your workspace handle: ${slug}`}
      >
        <Input
          id="name"
          name="name"
          autoComplete="organization"
          placeholder="Boutique Kana"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name) || undefined}
          aria-describedby={errors.name ? "name-error" : "name-hint"}
          className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
        />
      </AuthField>

      <AuthField
        label="Business category"
        htmlFor="category"
        error={errors.category?.[0]}
      >
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          aria-invalid={Boolean(errors.category) || undefined}
          aria-describedby={errors.category ? "category-error" : undefined}
          className="h-11 w-full rounded-lg border border-input bg-navy-900 px-3 text-[13.5px] text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        >
          <option value="" disabled>
            Choose the closest fit
          </option>
          {businessCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </AuthField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="Business phone"
          htmlFor="phone"
          error={errors.phone?.[0]}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+237 6 90 00 00 00"
            required
            aria-invalid={Boolean(errors.phone) || undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
          />
        </AuthField>

        <AuthField
          label="Location"
          htmlFor="location"
          error={errors.location?.[0]}
        >
          <Input
            id="location"
            name="location"
            autoComplete="address-level2"
            placeholder="Douala, Cameroon"
            required
            aria-invalid={Boolean(errors.location) || undefined}
            aria-describedby={errors.location ? "location-error" : undefined}
            className="h-11 bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
          />
        </AuthField>
      </div>

      <AuthField
        label="What does your business do?"
        htmlFor="description"
        error={errors.description?.[0]}
        hint="Optional — a sentence is enough."
      >
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="We sell Ankara fabric and ready-to-wear pieces to boutiques across Douala."
          aria-invalid={Boolean(errors.description) || undefined}
          aria-describedby={
            errors.description ? "description-error" : "description-hint"
          }
          className="min-h-20 resize-none bg-white/[0.02] text-[13.5px] placeholder:text-muted-foreground/50"
        />
      </AuthField>

      <SubmitButton pendingLabel="Creating workspace…">
        Create my workspace
      </SubmitButton>
    </form>
  );
}
