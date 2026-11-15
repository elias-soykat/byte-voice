"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, PhoneCall, Trash2 } from "lucide-react";
import Link from "next/link";

import { formatDate, formatTime } from "@/lib/datetime";
import type { Appointment } from "@/types/appointment";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentStatusBadge } from "./appointment-status-badge";

type AppointmentsTableProps = {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  isDeleting?: boolean;
};

export function AppointmentsTable({
  appointments,
  onEdit,
  onDelete,
  isDeleting,
}: AppointmentsTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <p className="text-sm font-medium text-foreground">
                  {appointment.patientName}
                </p>
                {appointment.reason && (
                  <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {appointment.reason}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {appointment.doctor?.name ?? "—"}
                {appointment.doctor?.speciality && (
                  <p className="text-xs text-muted-foreground">
                    {appointment.doctor.speciality}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(appointment.startTime)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatTime(appointment.startTime)} –{" "}
                {formatTime(appointment.endTime)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <AppointmentStatusBadge status={appointment.status} />
                  {appointment.callId ? (
                    <Link
                      href={`/calls?search=${encodeURIComponent(appointment.call?.callId ?? appointment.patientName)}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 hover:bg-emerald-100"
                      title="Booked via AI Voice Call (Click to view Call)"
                    >
                      <PhoneCall className="size-2.5 text-emerald-600" />
                      AI Call
                    </Link>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Manual</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Actions for ${appointment.patientName}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(appointment)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setPendingDelete(appointment)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete appointment</DialogTitle>
            <DialogDescription>
              Delete the appointment for{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.patientName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
