"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOwnedBusiness } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum([
    "general",
    "orders",
    "payments",
    "storefront",
    "billing",
    "technical",
    "other",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  message: z.string().trim().min(1).max(4000),
});

export async function createTicketAction(formData: FormData): Promise<void> {
  const parsed = createTicketSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    throw new Error("Check the highlighted fields.");
  }

  const business = await getOwnedBusiness();
  if (!business) {
    throw new Error("Set up your business first.");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("create_support_ticket", {
    p_business_id: business.id,
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
    p_category: parsed.data.category,
    p_priority: parsed.data.priority,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/support");
}

const replyTicketSchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

export async function replyTicketAction(formData: FormData): Promise<void> {
  const parsed = replyTicketSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    throw new Error("A reply message is required.");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("reply_support_ticket", {
    p_ticket_id: parsed.data.ticketId,
    p_message: parsed.data.message,
    p_status: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/support");
}
