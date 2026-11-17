import type { AiHistoryItem } from "@/lib/ai/types";

/** Shared props for every tool in the AI workspace. */
export type AiToolCallbacks = {
  configured: boolean;
  onCreated: (item: AiHistoryItem) => void;
  onUpdated: (item: AiHistoryItem) => void;
  onDeleted: (id: string) => void;
};
