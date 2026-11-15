import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-0 p-6 border-border/80 shadow-soft", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <div className="mt-4 flex items-end gap-2.5">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mb-1 h-3.5 w-10" />
      </div>
    </Card>
  );
}

export function CompactStatCardSkeleton() {
  return (
    <Card className="gap-0 p-4 border-border/80 shadow-xs">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-7 w-14" />
      </div>
    </Card>
  );
}

export function BarChartSkeleton({ height = 230 }: { height?: number }) {
  const barHeights = ["45%", "75%", "35%", "90%", "60%", "40%", "70%"];
  return (
    <div
      className="flex w-full flex-col justify-end gap-2 pt-4"
      style={{ height: `${height}px` }}
    >
      <div className="flex h-full items-end gap-3 px-2">
        {barHeights.map((h, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <Skeleton
              className="w-full rounded-t-md opacity-60"
              style={{ height: h }}
            />
            <Skeleton className="h-2.5 w-6 rounded-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChartSkeleton({ rows = 4 }: { rows?: number; height?: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-1">
      <div className="relative flex size-[150px] shrink-0 items-center justify-center">
        <Skeleton className="size-[150px] rounded-full opacity-60" />
        <div className="absolute size-[102px] rounded-full bg-card" />
      </div>
      <div className="w-full space-y-1.5 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-3.5 w-18" />
            </div>
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentDoctorSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function RecentAppointmentSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="ml-auto flex flex-col items-end gap-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
