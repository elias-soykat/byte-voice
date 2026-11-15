"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PhoneCall,
  TriangleAlert,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  PhoneOff,
  XCircle,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { useCallsList } from "@/hooks/useCalls";
import { useDashboardStats } from "@/hooks/useAnalytics";
import type { CallSummary, CallOutcome } from "@/types/call";

import { CallsTable } from "./_components/calls-table";
import { CallsTableSkeleton } from "./_components/calls-table-skeleton";
import { CallDetailDialog } from "./_components/call-detail-dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const OUTCOME_FILTERS: { label: string; value?: CallOutcome; icon?: React.ComponentType<{ className?: string }> }[] = [
  { label: "All Calls", value: undefined },
  { label: "Booked", value: "BOOKED", icon: CheckCircle2 },
  { label: "Enquiries", value: "ENQUIRY", icon: HelpCircle },
  { label: "Follow-up Needed", value: "FOLLOW_UP_NEEDED", icon: AlertTriangle },
  { label: "Incomplete", value: "INCOMPLETE", icon: PhoneOff },
  { label: "Failed", value: "FAILED", icon: XCircle },
];

export default function CallsPage() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<CallOutcome | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CallSummary | null>(null);

  const debouncedSearch = useDebounce(search.trim());

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, outcomeFilter]);

  const { data: statsData, isPending: isStatsPending } = useDashboardStats();
  const callMetrics = statsData?.callMetrics;

  const { data, isPending, isFetching, isError, refetch } = useCallsList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    outcome: outcomeFilter,
  });

  const total = data?.total ?? 0;
  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = debouncedSearch.length > 0 || outcomeFilter !== undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Center & Voice Logs"
        description="Structured call data, clinical extractions, transcripts, and audio playback."
      />

      {/* Real-time Call Database Metrics Strip */}
      {callMetrics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Total Calls</span>
            <span className="mt-1 text-xl font-bold text-foreground">
              {callMetrics.totalCalls}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Bookings</span>
            <span className="mt-1 text-xl font-bold text-emerald-600">
              {callMetrics.successfulBookings}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Enquiries</span>
            <span className="mt-1 text-xl font-bold text-sky-600">
              {callMetrics.enquiries}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Follow-ups</span>
            <span className="mt-1 text-xl font-bold text-amber-600">
              {callMetrics.followUpsNeeded}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Failed</span>
            <span className="mt-1 text-xl font-bold text-rose-600">
              {callMetrics.failedCalls}
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs">
            <span className="text-xs text-muted-foreground">Conversion</span>
            <span className="mt-1 text-xl font-bold text-emerald-700">
              {callMetrics.bookingConversionRate}%
            </span>
          </div>
        </div>
      ) : isStatsPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-border/80 bg-card p-3 shadow-xs"
            >
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search by caller name or phone..."
          containerClassName="sm:max-w-sm"
        />

        {/* Outcome Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isFetching && !isPending && (
            <span className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span className="hidden sm:inline">Updating…</span>
            </span>
          )}
          {OUTCOME_FILTERS.map((f) => {
            const active = outcomeFilter === f.value;
            const Icon = f.icon;
            const isFailed = f.value === "FAILED";
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setOutcomeFilter(f.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? isFailed
                      ? "bg-destructive text-destructive-foreground shadow-soft"
                      : "bg-primary text-primary-foreground shadow-soft"
                    : isFailed
                      ? "border border-border bg-card text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isPending ? (
        <CallsTableSkeleton rows={PAGE_SIZE} />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <TriangleAlert className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Couldn&apos;t load calls
              </h3>
              <p className="text-sm text-muted-foreground">
                There was a problem reaching the backend server.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={outcomeFilter === "FAILED" && !debouncedSearch ? CheckCircle2 : PhoneCall}
          title={
            outcomeFilter === "FAILED"
              ? debouncedSearch
                ? "No matching failed calls found"
                : "No failed calls recorded"
              : hasFilters
                ? "No matching calls found"
                : "No calls yet"
          }
          description={
            outcomeFilter === "FAILED"
              ? debouncedSearch
                ? "No failed call records match your search criteria."
                : "All voice sessions and clinical extractions completed without system failures."
              : hasFilters
                ? "Try adjusting your search terms or filter selection."
                : "Live Bangla voice calls will appear here automatically with their audio, transcript, and clinical extractions."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setOutcomeFilter(undefined);
                }}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={cn("space-y-6 transition-opacity duration-200", isFetching && "opacity-75")}>
          <CallsTable calls={items} onSelect={setSelected} />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page >= totalPages}
                    className={
                      page >= totalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      <CallDetailDialog call={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
