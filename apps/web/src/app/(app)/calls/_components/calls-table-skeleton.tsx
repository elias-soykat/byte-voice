import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CallsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Caller & Phone</TableHead>
            <TableHead>Reason for Visit</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Audio Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {/* Caller & Phone */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>

              {/* Reason for Visit */}
              <TableCell className="max-w-[200px]">
                <Skeleton className="h-3.5 w-36" />
              </TableCell>

              {/* Date & Time */}
              <TableCell className="whitespace-nowrap">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>

              {/* Duration & Turns */}
              <TableCell className="whitespace-nowrap">
                <Skeleton className="h-3.5 w-20" />
              </TableCell>

              {/* Outcome Badge */}
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-md" />
              </TableCell>

              {/* Audio Status Badge */}
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
