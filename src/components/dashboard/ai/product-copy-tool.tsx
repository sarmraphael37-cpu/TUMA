"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Loader2, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  AiField,
  AiLanguageToggle,
  AiSelect,
  AiToneSelect,
  AiToolHeading,
} from "@/components/dashboard/ai/ai-fields";
import { AiGenerationCard } from "@/components/dashboard/ai/generation-card";
import type { AiToolCallbacks } from "@/components/dashboard/ai/tool-props";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AiClientError,
  aiErrorMessage,
  requestAiGeneration,
} from "@/lib/ai/client";
import { aiFieldError, type AiFieldErrors } from "@/lib/ai/field-errors";
import type {
  AiCatalogueOption,
  AiHistoryItem,
  AiLanguage,
  AiTone,
} from "@/lib/ai/types";

type Props = AiToolCallbacks & {
  products: AiCatalogueOption[];
};

const EXAMPLE_FEATURES =
  "100% cotton, reinforced stitching, available in three colours, machine washable";

export function AiProductCopyTool({
  configured,
  products,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState("");
  const [targetCustomers, setTargetCustomers] = useState("");
  const [language, setLanguage] = useState<AiLanguage>("en");
  const [tone, setTone] = useState<AiTone>("professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AiFieldErrors>({});
  const [result, setResult] = useState<AiHistoryItem | null>(null);

  const categories = useMemo(() => {
    const unique = new Set<string>();

    for (const product of products) {
      if (product.category) {
        unique.add(product.category);
      }
    }

    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [products]);

  function applyProduct(id: string) {
    setProductId(id);
    const product = products.find((item) => item.id === id);

    if (!product) {
      return;
    }

    setProductName(product.name);
    setCategory(product.category ?? "");

    if (product.description && !features.trim()) {
      setFeatures(product.description.slice(0, 1_200));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      const generation = await requestAiGeneration({
        kind: "product_description",
        input: {
          productName: productName.trim(),
          category: category.trim(),
          features: features.trim(),
          targetCustomers: targetCustomers.trim(),
          language,
          tone,
        },
      });

      setResult(generation);
      onCreated(generation);
      toast.success("Product copy is ready.");
    } catch (submitError) {
      if (submitError instanceof AiClientError) {
        setFieldErrors(submitError.fieldErrors ?? {});
      }
      setError(aiErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
      >
        <AiToolHeading
          icon={<Package className="size-4" aria-hidden />}
          title="Product copy generator"
          description="Turn a few product facts into a professional title, description and key selling points."
          action={
            <AiLanguageToggle
              value={language}
              onChange={setLanguage}
              disabled={busy}
            />
          }
        />

        <div className="mt-4 grid gap-3">
          {products.length > 0 ? (
            <AiField
              label="Start from an existing product"
              htmlFor="ai-product-picker"
              hint="Optional. It only fills the fields below so you can edit them."
            >
              <AiSelect
                id="ai-product-picker"
                value={productId}
                onChange={applyProduct}
                disabled={busy}
              >
                <option value="">Choose a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </AiSelect>
            </AiField>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <AiField
              label="Product name"
              htmlFor="ai-product-name"
              error={aiFieldError(fieldErrors, "productName")}
            >
              <Input
                id="ai-product-name"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Ankara print tote bag"
                maxLength={160}
                disabled={busy}
              />
            </AiField>

            <AiField
              label="Category"
              htmlFor="ai-product-category"
              error={aiFieldError(fieldErrors, "category")}
            >
              <Input
                id="ai-product-category"
                list="ai-product-categories"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Fashion and textiles"
                maxLength={80}
                disabled={busy}
              />
              <datalist id="ai-product-categories">
                {categories.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </AiField>
          </div>

          <AiField
            label="Features"
            htmlFor="ai-product-features"
            hint="Materials, sizes, colours or anything the customer should know. One per line works well."
            error={aiFieldError(fieldErrors, "features")}
          >
            <Textarea
              id="ai-product-features"
              value={features}
              onChange={(event) => setFeatures(event.target.value)}
              placeholder={EXAMPLE_FEATURES}
              rows={4}
              maxLength={1_200}
              disabled={busy}
            />
          </AiField>

          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <AiField
              label="Target customers"
              htmlFor="ai-product-target"
              hint="Optional. Who is this product for?"
              error={aiFieldError(fieldErrors, "targetCustomers")}
            >
              <Input
                id="ai-product-target"
                value={targetCustomers}
                onChange={(event) => setTargetCustomers(event.target.value)}
                placeholder="Young professionals, students, gift buyers"
                maxLength={400}
                disabled={busy}
              />
            </AiField>

            <AiField label="Tone" htmlFor="ai-product-tone">
              <AiToneSelect
                id="ai-product-tone"
                value={tone}
                onChange={setTone}
                disabled={busy}
              />
            </AiField>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-200"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {!configured ? (
          <p className="mt-3 text-[10.5px] text-amber-glow">
            Add TUMA_AI_API_KEY on the server to enable generation.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={!configured || busy}>
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-3.5" aria-hidden />
            )}
            {busy ? "Writing…" : "Generate product copy"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            The result is saved to your AI history and can be edited.
          </p>
        </div>
      </form>

      {result ? (
        <div className="space-y-2">
          <h3 className="px-1 font-heading text-[12.5px] font-medium">
            Latest result
          </h3>
          <AiGenerationCard
            item={result}
            onUpdated={(updated) => {
              setResult(updated);
              onUpdated(updated);
            }}
            onDeleted={(id) => {
              setResult(null);
              onDeleted(id);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
