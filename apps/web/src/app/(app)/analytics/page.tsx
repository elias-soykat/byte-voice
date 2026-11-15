"use client";

import {
  CalendarCheck,
  Clock,
  Stethoscope,
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

          <ChartCard title="Weekly Appointments">
            {isPending || !data ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <WeeklyAppointmentsChart data={data.weeklyAppointments} />
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
