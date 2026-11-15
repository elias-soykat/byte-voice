import type { Appointment, AppointmentStatus } from "./appointment";
import type { Doctor } from "./doctor";
import type { CallOutcome } from "./call";

export type StatusCount = { status: AppointmentStatus; count: number };
export type DayPoint = { day: string; appointments: number };
export type MonthPoint = { month: string; count: number };

export type CallOutcomeCount = {
  outcome: CallOutcome;
  count: number;
  percentage: number;
};

export type CallDayPoint = {
  day: string;
  calls: number;
};

export type CallMetrics = {
  totalCalls: number;
  successfulBookings: number;
  enquiries: number;
  followUpsNeeded: number;
  failedCalls: number;
  incompleteCalls: number;
  bookingConversionRate: number;
  averageDurationSec: number;
  callsByOutcome: CallOutcomeCount[];
  weeklyCalls: CallDayPoint[];
};

export type DashboardStats = {
  totalDoctors: number;
  totalPatients: number;
  todaysAppointments: number;
  upcomingAppointments: number;
  weeklyAppointments: DayPoint[];
  appointmentsTrend: MonthPoint[];
  appointmentsByStatus: StatusCount[];
  recentAppointments: Appointment[];
  latestDoctors: Doctor[];
  callMetrics: CallMetrics;
};

export type AnalyticsData = {
  totalAppointments: number;
  activeDoctors: number;
  totalDoctors: number;
  totalPatients: number;
  averageAppointmentMinutes: number;
  appointmentsByStatus: StatusCount[];
  appointmentsTrend: MonthPoint[];
  weeklyAppointments: DayPoint[];
  callMetrics: CallMetrics;
};

