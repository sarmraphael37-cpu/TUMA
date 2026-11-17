"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, CalendarClock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { contactSchema, type ContactValues } from "@/lib/validation";
import { cn } from "cn";

type ContactDialogProps = {
  label?: string;
  subject?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

const defaultValues: ContactValues = {
  name: "",
  email: "",
  message: "",
};

/**
 * Requests a walkthrough without a backend: validated details are composed into
 * a pre-filled email draft and handed to the visitor's mail app. A visible
 * address is always provided as a fallback.
 */
export function ContactDialog({
  label = "Talk to us",
  subject = "TUMA walkthrough request",
  className,
  variant = "default",
}: ContactDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
    mode: "onTouched",
  });

  const onSubmit = (values: ContactValues) => {
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      "",
      values.message,
      "",
      "— Sent from tuma.africa",
    ].join("\n");

    const mailto = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    window.location.assign(mailto);
    toast.success("Your email draft is ready", {
      description:
        "Send it from your mail app and our team will reply within one working day.",
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={cn(
            "group h-11 rounded-full px-6 text-[14px]",
            variant === "outline" &&
              "border-white/[0.1] bg-white/[0.03] backdrop-blur hover:bg-white/[0.07]",
            variant === "default" &&
              "shadow-[0_18px_50px_-16px_rgba(37,99,235,0.9)]",
            className,
          )}
        >
          {label}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-5 border border-white/[0.09] bg-navy-900 p-6 ring-0 sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-glow/20 bg-cyan-glow/[0.07] px-2.5 py-1 text-[10px] font-medium tracking-wide text-cyan-glow uppercase">
            <CalendarClock className="size-3" aria-hidden />
            Personal walkthrough
          </span>
          <DialogTitle className="font-heading text-xl tracking-[-0.02em]">
            See TUMA with your own numbers
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Tell us a little about your business. We&apos;ll reply with a time for
            a 20-minute tour — no pressure, no sales script.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        placeholder="Sandrine Mbarga"
                        className="h-10 bg-white/[0.02] placeholder:text-muted-foreground/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@business.cm"
                        className="h-10 bg-white/[0.02] placeholder:text-muted-foreground/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What would you like to see?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="We run two shops in Douala and need better control of stock and invoices."
                      className="min-h-24 resize-none bg-white/[0.02] placeholder:text-muted-foreground/60"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Submitting opens a pre-filled email in your mail app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-3.5" aria-hidden />
                {siteConfig.contactEmail}
              </a>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-[13px]"
                disabled={form.formState.isSubmitting}
              >
                Compose email
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
