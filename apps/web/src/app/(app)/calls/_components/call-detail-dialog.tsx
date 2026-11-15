"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Phone,
  Stethoscope,
  TriangleAlert,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/datetime";
import { useCallDetail } from "@/hooks/useCalls";
import type { CallSummary } from "@/types/call";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CallOutcomeBadge, CallStatusBadge, formatDuration } from "./call-status-badge";

type CallDetailDialogProps = {
  call: CallSummary | null;
  onClose: () => void;
};

export function CallDetailDialog({ call, onClose }: CallDetailDialogProps) {
  const { data, isPending, isError } = useCallDetail(call?.id ?? null);

  const phone =
    data?.patientPhone ||
    data?.patient?.phone ||
    data?.extraction?.phone ||
    call?.patientPhone;

  return (
    <Dialog open={call !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
                <User className="size-5" />
              </span>
              {call?.patientName ?? "Unknown caller"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <CallOutcomeBadge outcome={call?.outcome} />
              {call && <CallStatusBadge status={call.status} />}
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {call && (
              <>
                Call Session: <span className="font-mono text-foreground/80">{call.callId}</span> ·{" "}
                {formatDate(call.startedAt)} at {formatTime(call.startedAt)} ·{" "}
                {formatDuration(call.durationSec)} ({call.userTurns} user turns)
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <TriangleAlert className="size-6 text-destructive" />
            <p className="text-sm">Couldn&apos;t load details for this call.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Structured Extractions Card */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/20 p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
                  <FileText className="size-3.5 text-emerald-600" />
                  Structured Clinical Extractions (AI Extracted)
                </h4>
                {data.extraction?.validationStatus === "VALID" ? (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Validated BD Phone
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {data.extraction?.validationStatus ?? "Reviewed"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Caller / Patient:
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {data.extraction?.patientName || data.patientName || "Not provided"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Phone Number:
                  </span>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Phone className="size-3.5 text-primary" />
                    {phone ?? "Not captured"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Reason for Visit:
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {data.extraction?.reasonForVisit ?? "General Dental Enquiry"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Requested Date & Time:
                  </span>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="size-3.5 text-primary" />
                    {data.extraction?.preferredDateTime ?? "Flexible / Not requested"}
                  </p>
                </div>
              </div>

              {/* Staff Notes */}
              {data.extraction?.notes && (
                <div className="mt-3.5 rounded-xl border border-border/50 bg-secondary/50 p-2.5 text-xs text-foreground/90">
                  <span className="font-semibold text-primary">Summary Note: </span>
                  {data.extraction.notes}
                </div>
              )}

              {/* Linked Appointment Details */}
              {data.appointment && (
                <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Stethoscope className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Booked with {data.appointment.doctor?.name ?? "Specialist"} ({data.appointment.doctor?.speciality})
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(data.appointment.startTime)} · {formatTime(data.appointment.startTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Recording Player */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Call Audio Recording
              </h4>
              {data.audioUrl ? (
                <audio controls src={data.audioUrl} className="w-full rounded-xl">
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <p className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Audio was processed in real time via WebRTC/Socket.io. (S3 bucket optional storage).
                </p>
              )}
            </div>

            {/* Full Transcript with Speaker Labels & Timestamps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Full Spoken Transcript ({data.transcript.length} turns)
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  Bangla & English Code-Switching
                </span>
              </div>

              <div className="flex max-h-72 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-border/80 bg-card p-3 shadow-inner">
                {data.transcript.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No transcript turns captured for this call.
                  </p>
                ) : (
                  data.transcript.map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col",
                        line.role === "user" ? "items-end" : "items-start",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                        <span>{line.role === "user" ? "Caller" : "Receptionist (AI)"}</span>
                        {line.at && (
                          <span className="flex items-center gap-0.5 text-muted-foreground/70">
                            <Clock className="size-2.5" />
                            {formatTime(new Date(line.at).toISOString())}
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          line.role === "user"
                            ? "bg-secondary text-foreground"
                            : "bg-brand-gradient text-white shadow-soft",
                        )}
                      >
                        {line.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
