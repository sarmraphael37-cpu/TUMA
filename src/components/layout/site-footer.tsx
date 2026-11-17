import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { footerLinks } from "@/content/marketing";

const socialLinks = [
  { label: "X (Twitter)", href: siteConfig.social.x },
  { label: "LinkedIn", href: siteConfig.social.linkedin },
  { label: "Instagram", href: siteConfig.social.instagram },
  { label: "Facebook", href: siteConfig.social.facebook },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-navy-950/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/30 to-transparent"
      />

      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr] lg:gap-16">
          <div>
            <Logo showTagline />
            <p className="mt-5 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
              The intelligent business workspace for small businesses in Cameroon
              and across Africa. Built with care, for how you actually trade.
            </p>

            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] text-foreground/85 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06]"
            >
              <Mail className="size-3.5 text-cyan-glow" aria-hidden />
              {siteConfig.contactEmail}
            </a>

            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10.5px] text-muted-foreground transition-colors hover:border-white/[0.14] hover:text-foreground"
                >
                  {social.label}
                  <ArrowUpRight className="size-2.5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
          >
            {footerLinks.map((group) => (
              <div key={group.title}>
                <p className="text-[10.5px] font-semibold tracking-[0.16em] text-foreground/60 uppercase">
                  {group.title}
                </p>
                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-[12px] leading-snug text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator className="my-10 bg-white/[0.06]" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[11px] text-muted-foreground">
            © 2026 TUMA. Built in Cameroon, for Africa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <a
              href="#security"
              className="transition-colors hover:text-foreground"
            >
              Security
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=Privacy%20enquiry`}
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=Terms%20enquiry`}
              className="transition-colors hover:text-foreground"
            >
              Terms
            </a>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-mint-glow shadow-[0_0_8px_1px_rgba(52,224,176,0.4)]" />
              All systems operational
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
