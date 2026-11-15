"use client";

import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  PhoneCall,
  PhoneOff,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyAppointmentsChart } from "@/components/charts/weekly-appointments-chart";
import { AppointmentStatusChart } from "@/components/charts/appointment-status-chart";
import { AppointmentsTrendChart } from "@/components/charts/appointments-trend-chart";
import { CallOutcomeChart } from "@/components/charts/call-outcome-chart";
import { WeeklyCallsChart } from "@/components/charts/weekly-calls-chart";


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


export default function AnalyticsPage() {
  const { data, isPending, isError, refetch } = useAnalytics();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clinical Analytics"
        description="Dhaka Dental Care patient trends, specialty distribution, and schedule efficiency."
        actions={<Badge variant="success">Live Metrics</Badge>}
      />

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <TriangleAlert className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Couldn&apos;t load analytics
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
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {isPending || !data ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : (
              <>
                <StatCard
                  label="Total Appointments"
                  value={data.totalAppointments}
                  icon={CalendarCheck}
                />
                <StatCard
                  label="Active Doctors"
                  value={data.activeDoctors}
                  icon={Stethoscope}
                />
                <StatCard
                  label="Total Patients"
                  value={data.totalPatients.toLocaleString()}
                  icon={Users}
                />
                <StatCard
                  label="Avg Appointment"
                  value={`${data.averageAppointmentMinutes} min`}
                  icon={Clock}
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ChartCard title="Appointments Trend" className="lg:col-span-2">
              {isPending || !data ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <AppointmentsTrendChart data={data.appointmentsTrend} />
              )}
            </ChartCard>
            <ChartCard title="Appointment Status">
              {isPending || !data ? (
                <Skeleton className="h-[180px] w-full" />
              ) : (
                <AppointmentStatusChart data={data.appointmentsByStatus} />
              )}
            </ChartCard>
          </div>

          {/* Clinical Weekly Appointments Chart */}
          <ChartCard title="Weekly Appointments">
            {isPending || !data ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <WeeklyAppointmentsChart data={data.weeklyAppointments} />
            )}
          </ChartCard>

          {/* Voice Reception & Call Intelligence Section */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Voice Reception Intelligence
                  </h2>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-xs font-medium text-emerald-800">
                    ByteVoice Live Data
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Database aggregations of inbound Bangla voice calls, outcome classification, and booking conversions.
                </p>
              </div>
              {data?.callMetrics && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Average Duration:{" "}
                    <strong className="text-foreground">
                      {Math.floor(data.callMetrics.averageDurationSec / 60)}m{" "}
                      {data.callMetrics.averageDurationSec % 60}s ({data.callMetrics.averageDurationSec}s)
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Voice KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {isPending || !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
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

            {/* Voice Charts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <ChartCard title="Weekly Call Volume (7 Days)" className="lg:col-span-2">
                {isPending || !data ? (
                  <Skeleton className="h-[230px] w-full" />
                ) : (
                  <WeeklyCallsChart data={data.callMetrics.weeklyCalls} />
                )}
              </ChartCard>
              <ChartCard title="Call Outcomes Distribution">
                {isPending || !data ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <CallOutcomeChart data={data.callMetrics.callsByOutcome} />
                )}
              </ChartCard>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
