"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  PhoneCall,
  PhoneOff,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { formatTime } from "@/lib/datetime";
import { useDashboardStats } from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyAppointmentsChart } from "@/components/charts/weekly-appointments-chart";
import { AppointmentStatusChart } from "@/components/charts/appointment-status-chart";
import { CallOutcomeChart } from "@/components/charts/call-outcome-chart";
import { WeeklyCallsChart } from "@/components/charts/weekly-calls-chart";
import { AppointmentStatusBadge } from "../appointments/_components/appointment-status-badge";
import {
  StatCardSkeleton,
  CompactStatCardSkeleton,
  BarChartSkeleton,
  DonutChartSkeleton,
  RecentDoctorSkeleton,
  RecentAppointmentSkeleton,
} from "./_components/dashboard-skeleton";

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isPending, isFetching, isError, refetch } = useDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clinical Dashboard"
        description="Dhaka Dental Care — patient flow, doctor schedules, and voice reception stats."
        actions={
          <div className="flex items-center gap-3">
            {isFetching && !isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span className="hidden sm:inline">Syncing…</span>
              </span>
            )}
            <Button asChild variant="gradient">
              <Link href="/doctors/new">
                <UserPlus className="size-4" />
                Add Doctor
              </Link>
            </Button>
          </div>
        }
      />

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <TriangleAlert className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Couldn&apos;t load dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                There was a problem reaching the server. Please try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "space-y-8 transition-opacity duration-200",
            isFetching && !isPending && "opacity-80",
          )}
        >
          {/* Clinical KPI cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {isPending || !data ? (
              Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            ) : (
              <>
                <StatCard
                  label="Total Doctors"
                  value={data.totalDoctors}
                  icon={Stethoscope}
                />
                <StatCard
                  label="Total Patients"
                  value={data.totalPatients.toLocaleString()}
                  icon={Users}
                />
                <StatCard
                  label="Today's Appointments"
                  value={data.todaysAppointments}
                  icon={CalendarDays}
                />
                <StatCard
                  label="Upcoming"
                  value={data.upcomingAppointments}
                  icon={Clock}
                />
              </>
            )}
          </div>

          {/* Voice Reception Analytics Section */}
          <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-linear-to-b from-emerald-50/20 to-transparent p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Voice Reception Analytics (Bangla AI Caller)
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct database calculations from real patient voice calls and
                  LangGraph agent turns.
                </p>
              </div>
              {data?.callMetrics ? (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Avg Duration:{" "}
                    <strong className="text-foreground">
                      {Math.floor(data.callMetrics.averageDurationSec / 60)}m{" "}
                      {data.callMetrics.averageDurationSec % 60}s
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Conversion:{" "}
                    <strong className="text-emerald-700">
                      {data.callMetrics.bookingConversionRate}%
                    </strong>
                  </span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
              {isPending || !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <CompactStatCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <StatCard
                    size="compact"
                    label="Total Calls"
                    value={data.callMetrics.totalCalls}
                    icon={PhoneCall}
                    iconBg="bg-slate-100 ring-slate-200"
                    iconColor="text-slate-700"
                  />
                  <StatCard
                    size="compact"
                    label="Bookings Made"
                    value={data.callMetrics.successfulBookings}
                    icon={CheckCircle2}
                    iconBg="bg-emerald-50 ring-emerald-500/20"
                    iconColor="text-emerald-700"
                  />
                  <StatCard
                    size="compact"
                    label="Enquiries"
                    value={data.callMetrics.enquiries}
                    icon={HelpCircle}
                    iconBg="bg-sky-50 ring-sky-500/20"
                    iconColor="text-sky-700"
                  />
                  <StatCard
                    size="compact"
                    label="Follow-ups"
                    value={data.callMetrics.followUpsNeeded}
                    icon={AlertTriangle}
                    iconBg="bg-amber-50 ring-amber-500/20"
                    iconColor="text-amber-700"
                  />
                  <StatCard
                    size="compact"
                    label="Failed Calls"
                    value={data.callMetrics.failedCalls}
                    icon={PhoneOff}
                    iconBg="bg-rose-50 ring-rose-500/20"
                    iconColor="text-rose-700"
                  />
                  <StatCard
                    size="compact"
                    label="Conversion Rate"
                    value={`${data.callMetrics.bookingConversionRate}%`}
                    icon={TrendingUp}
                    iconBg="bg-emerald-50 ring-emerald-500/20"
                    iconColor="text-emerald-700"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 pt-2">
              <ChartCard
                title="Weekly Call Volume"
                className="lg:col-span-2 border-border/80"
              >
                {isPending || !data ? (
                  <BarChartSkeleton height={230} />
                ) : (
                  <WeeklyCallsChart data={data.callMetrics.weeklyCalls} />
                )}
              </ChartCard>
              <ChartCard title="Call Outcomes" className="border-border/80">
                {isPending || !data ? (
                  <DonutChartSkeleton height={200} />
                ) : (
                  <CallOutcomeChart data={data.callMetrics.callsByOutcome} />
                )}
              </ChartCard>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ChartCard title="Weekly Appointments" className="lg:col-span-2">
              {isPending || !data ? (
                <BarChartSkeleton height={260} />
              ) : (
                <WeeklyAppointmentsChart data={data.weeklyAppointments} />
              )}
            </ChartCard>
            <ChartCard title="Appointment Status">
              {isPending || !data ? (
                <DonutChartSkeleton height={180} />
              ) : (
                <AppointmentStatusChart data={data.appointmentsByStatus} />
              )}
            </ChartCard>
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Latest Doctors</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/doctors">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {isPending || !data ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <RecentDoctorSkeleton key={i} />
                  ))
                ) : data.latestDoctors.length === 0 ? (
                  <p className="px-2 py-6 text-sm text-muted-foreground">
                    No doctors yet.
                  </p>
                ) : (
                  data.latestDoctors.map((doctor) => (
                    <Link
                      key={doctor.id}
                      href={`/doctors/${doctor.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-emerald-50/40"
                    >
                      <Avatar className="size-9 ring-1 ring-emerald-500/20">
                        <AvatarFallback className="bg-emerald-50 text-emerald-800 font-semibold text-xs">
                          {getInitials(doctor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doctor.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doctor.speciality}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent Appointments</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/appointments">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {isPending || !data ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <RecentAppointmentSkeleton key={i} />
                  ))
                ) : data.recentAppointments.length === 0 ? (
                  <p className="px-2 py-6 text-sm text-muted-foreground">
                    No appointments yet.
                  </p>
                ) : (
                  data.recentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-emerald-50/20"
                    >
                      <Avatar className="size-9 ring-1 ring-emerald-500/20">
                        <AvatarFallback className="bg-emerald-50 text-emerald-800 font-semibold text-xs">
                          {getInitials(appointment.patientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {appointment.patientName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.doctor?.name ?? "—"}
                        </p>
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(appointment.startTime)}
                        </span>
                        <AppointmentStatusBadge status={appointment.status} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
