"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Menu, Mic, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useLanguage } from "@/context/language-context";
import { useCall } from "@/hooks/useCall";

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { lang, toggleLang, t } = useLanguage();
  const { openForm } = useCall();

  const links = [
    { label: t.nav.features, href: "#features" },
    { label: t.nav.useCases, href: "#use-cases" },
    { label: t.nav.howItWorks, href: "#how-it-works" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-surface/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft transition-all hover:bg-accent"
            title="Toggle Language (English / বাংলা)"
          >
            <Globe className="size-3.5 text-primary" />
            <span>{lang === "en" ? "বাংলা" : "English"}</span>
          </button>

          <Button asChild variant="ghost" size="sm">
            {session ? (
              <Link href="/dashboard">{t.nav.viewDashboard}</Link>
            ) : (
              <Link href="/sign-in">{t.nav.login}</Link>
            )}
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={openForm}
            className="gap-2 transition-transform hover:scale-[1.03]"
          >
            <Mic className="size-3.5" />
            {t.nav.talkToCaller}
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground shadow-soft"
          >
            <Globe className="size-3 text-primary" />
            <span>{lang === "en" ? "বাং" : "EN"}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="gradient"
                onClick={() => {
                  setOpen(false);
                  openForm();
                }}
              >
                <Mic className="size-4 mr-2" />
                {t.nav.talkToCaller}
              </Button>
              <Button asChild variant="outline">
                {session ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    {t.nav.viewDashboard}
                  </Link>
                ) : (
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    {t.nav.login}
                  </Link>
                )}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export { LandingNav };
