"use client";

import { Phone, PhoneCall, User } from "lucide-react";

import { formatDate, formatTime } from "@/lib/datetime";
import type { CallSummary } from "@/types/call";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CallOutcomeBadge, CallStatusBadge, formatDuration } from "./call-status-badge";

type CallsTableProps = {
  calls: CallSummary[];
  onSelect: (call: CallSummary) => void;
};

export function CallsTable({ calls, onSelect }: CallsTableProps) {
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
          {calls.map((call) => {
            const phone =
              call.patientPhone ||
              call.patient?.phone ||
              call.extraction?.phone;

            return (
              <TableRow
                key={call.id}
                className="cursor-pointer transition-colors hover:bg-emerald-50/30"
                onClick={() => onSelect(call)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20">
                      {call.patientName ? (
                        <User className="size-4" />
                      ) : (
                        <PhoneCall className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {call.patientName ?? "Unknown caller"}
                      </p>
                      {phone && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3 text-emerald-600" />
                          {phone}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="max-w-[200px]">
                  <p className="truncate text-xs font-medium text-foreground">
                    {call.extraction?.reasonForVisit ?? "General enquiry / Dental visit"}
                  </p>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(call.startedAt)} · {formatTime(call.startedAt)}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDuration(call.durationSec)} ({call.userTurns} turns)
                </TableCell>

                <TableCell>
                  <CallOutcomeBadge outcome={call.outcome} />
                </TableCell>

                <TableCell>
                  <CallStatusBadge status={call.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
