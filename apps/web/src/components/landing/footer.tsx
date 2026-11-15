import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-sm text-center sm:text-left">
            <Logo href="/" />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              StrategyByte builds intelligent AI voice agents and healthcare
              workflow automation. Powered by ByteVoice (
              <a
                href="https://bytevoice.com.au"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                bytevoice.com.au
              </a>
              ) for Australian and Bangladeshi healthcare.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a
              href="#features"
              className="transition-colors hover:text-emerald-700"
            >
              Features
            </a>
            <a
              href="#use-cases"
              className="transition-colors hover:text-emerald-700"
            >
              Use Cases
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-emerald-700"
            >
              How It Works
            </a>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-emerald-700"
            >
              Clinic Portal
            </Link>
          </nav>

          <div className="text-center sm:text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">
              StrategyByte Operations
            </p>
            <p className="mt-1">Level 15, 60 Station St, Parramatta NSW 2150</p>
            <p>Dhaka, Bangladesh</p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} StrategyByte Pty Ltd . All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
