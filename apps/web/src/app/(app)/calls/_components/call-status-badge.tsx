import { Badge } from "@/components/ui/badge";
import type { CallStatus, CallOutcome } from "@/types/call";

const STATUS: Record<
  CallStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  COMPLETED: { label: "Completed", variant: "success" },
  NO_AUDIO: { label: "No audio", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
};

const OUTCOME: Record<
  CallOutcome,
  { label: string; variant: "success" | "warning" | "destructive" | "default" | "outline" }
> = {
  BOOKED: { label: "Booked", variant: "success" },
  ENQUIRY: { label: "Enquiry", variant: "default" },
  FOLLOW_UP_NEEDED: { label: "Follow-up Needed", variant: "warning" },
  INCOMPLETE: { label: "Incomplete", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const config = STATUS[status] ?? { label: status, variant: "warning" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function CallOutcomeBadge({ outcome }: { outcome?: CallOutcome | null }) {
  if (!outcome) return null;
  const config = OUTCOME[outcome] ?? { label: outcome, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Seconds -> "m:ss" (e.g. 75 -> "1:15").
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
