import "dotenv/config";
import { PrismaClient, DayOfWeek, AppointmentStatus, CallOutcome } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/byte_care";
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting Dhaka Dental Care seed...");

  // 1. Seed Doctors
  const doctorsData = [
    {
      name: "Dr. Tanvir Ahmed",
      speciality: "Orthodontics",
      department: "Dental Surgery",
      isActive: true,
      schedules: [
        { dayOfWeek: DayOfWeek.SUNDAY, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: DayOfWeek.MONDAY, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: DayOfWeek.THURSDAY, startTime: "09:00", endTime: "17:00" },
      ],
    },
    {
      name: "Dr. Farzana Rahman",
      speciality: "Periodontics & Scaling",
      department: "Preventive Dentistry",
      isActive: true,
      schedules: [
        { dayOfWeek: DayOfWeek.SUNDAY, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: DayOfWeek.THURSDAY, startTime: "10:00", endTime: "18:00" },
      ],
    },
    {
      name: "Dr. Shakil Hossain",
      speciality: "Endodontics & Root Canal",
      department: "Restorative Dentistry",
      isActive: true,
      schedules: [
        { dayOfWeek: DayOfWeek.MONDAY, startTime: "09:00", endTime: "16:00" },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "16:00" },
        { dayOfWeek: DayOfWeek.SATURDAY, startTime: "10:00", endTime: "16:00" },
      ],
    },
    {
      name: "Dr. Nusrat Jahan",
      speciality: "General & Pediatric Dentistry",
      department: "General Dentistry",
      isActive: true,
      schedules: [
        { dayOfWeek: DayOfWeek.SUNDAY, startTime: "09:00", endTime: "15:00" },
        { dayOfWeek: DayOfWeek.MONDAY, startTime: "09:00", endTime: "15:00" },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: "09:00", endTime: "15:00" },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "15:00" },
      ],
    },
  ];

  const seededDoctors: Record<string, string> = {};

  for (const doc of doctorsData) {
    const existing = await prisma.doctor.findFirst({ where: { name: doc.name } });
    if (existing) {
      seededDoctors[doc.name] = existing.id;
      console.log(`Doctor already exists: ${doc.name}`);
    } else {
      const created = await prisma.doctor.create({
        data: {
          name: doc.name,
          speciality: doc.speciality,
          department: doc.department,
          isActive: doc.isActive,
          schedules: {
            create: doc.schedules,
          },
        },
      });
      seededDoctors[doc.name] = created.id;
      console.log(`Created doctor: ${doc.name}`);
    }
  }

  // 2. Seed Patients
  const patientsData = [
    { fullName: "রফিকুল ইসলাম (Rafiqul Islam)", phone: "01712345678", email: "rafiqul.islam@example.com" },
    { fullName: "নুসরাত পারভীন (Nusrat Parvin)", phone: "01898765432", email: "nusrat.parvin@example.com" },
    { fullName: "আনিসুর রহমান (Anisur Rahman)", phone: "01911223344", email: "anisur.rahman@example.com" },
    { fullName: "সাদিয়া আক্তার (Sadia Akter)", phone: "01655443322", email: "sadia.akter@example.com" },
    { fullName: "তারিক হাসান (Tariq Hasan)", phone: "01799887766", email: "tariq.hasan@example.com" },
  ];

  const seededPatients: Record<string, string> = {};

  for (const p of patientsData) {
    const existing = await prisma.patient.findUnique({ where: { phone: p.phone } });
    if (existing) {
      seededPatients[p.phone] = existing.id;
    } else {
      const created = await prisma.patient.create({ data: p });
      seededPatients[p.phone] = created.id;
      console.log(`Created patient: ${p.fullName}`);
    }
  }

  // 3. Seed Realistic Calls with Bengali Transcripts & Extractions
  const tanvirId = seededDoctors["Dr. Tanvir Ahmed"]!;
  const farzanaId = seededDoctors["Dr. Farzana Rahman"]!;

  const now = Date.now();
  const sampleCalls = [
    {
      callId: "call_demo_001_booked",
      startedAt: new Date(now - 1000 * 60 * 45), // 45 mins ago
      endedAt: new Date(now - 1000 * 60 * 42),
      durationSec: 180,
      patientName: "রফিকুল ইসলাম (Rafiqul Islam)",
      patientPhone: "01712345678",
      patientId: seededPatients["01712345678"],
      userTurns: 6,
      status: "COMPLETED",
      outcome: CallOutcome.BOOKED,
      transcript: [
        { role: "agent", text: "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", at: now - 180000 },
        { role: "user", text: "ওয়ালাইকুম আসসালাম। আমার দাঁতে প্রচণ্ড ব্যথা, একটা অ্যাপয়েন্টমেন্ট বুক করতে চাই।", at: now - 165000 },
        { role: "agent", text: "অবশ্যই, আমি সাহায্য করছি। দয়া করে আপনার নাম এবং মোবাইল নম্বরটি বলুন।", at: now - 150000 },
        { role: "user", text: "আমার নাম রফিকুল ইসলাম, নম্বর ০১৭ ১১২৩৪৫৬৭৮।", at: now - 130000 },
        { role: "agent", text: "ধন্যবাদ রফিকুল সাহেব। আপনার নম্বরটি ০১৭ ১১২৩৪৫৬৭৮ নিশ্চিত করলাম। আপনি কোন দিন এবং কোন সময়ে দেখাতে চান?", at: now - 110000 },
        { role: "user", text: "আগামী রবিবার বিকাল ৩টায় ডক্টর তানভীর আহমেদের সাথে অ্যাপয়েন্টমেন্ট পেলে ভালো হয়।", at: now - 90000 },
        { role: "agent", text: "জি, আগামী রবিবার বিকাল ৩টায় ডক্টর তানভীর আহমেদের সাথে আপনার অ্যাপয়েন্টমেন্ট সফলভাবে বুক করা হয়েছে। আপনি শীঘ্রই একটি নিশ্চিতকরণ বার্তা পাবেন। ধন্যবাদ।", at: now - 60000 },
      ],
      extraction: {
        patientName: "রফিকুল ইসলাম (Rafiqul Islam)",
        phone: "01712345678",
        reasonForVisit: "দাঁতে প্রচণ্ড ব্যথা (Severe toothache)",
        preferredDateTime: "আগামী রবিবার বিকাল ৩:০০ টা",
        intent: "BOOK_APPOINTMENT",
        outcome: CallOutcome.BOOKED,
        notes: "Appointment booked with Dr. Tanvir Ahmed for toothache.",
        validationStatus: "VALID",
      },
      appointment: {
        doctorId: tanvirId,
        patientName: "রফিকুল ইসলাম",
        patientPhone: "01712345678",
        startTime: new Date(Date.now() + 86400000 * 2), // 2 days later
        endTime: new Date(Date.now() + 86400000 * 2 + 1800000),
        status: AppointmentStatus.BOOKED,
        reason: "দাঁতে প্রচণ্ড ব্যথা (Toothache consultation)",
      },
    },
    {
      callId: "call_demo_002_enquiry",
      startedAt: new Date(now - 1000 * 60 * 120), // 2 hours ago
      endedAt: new Date(now - 1000 * 60 * 118),
      durationSec: 120,
      patientName: "নুসরাত পারভীন (Nusrat Parvin)",
      patientPhone: "01898765432",
      patientId: seededPatients["01898765432"],
      userTurns: 4,
      status: "COMPLETED",
      outcome: CallOutcome.ENQUIRY,
      transcript: [
        { role: "agent", text: "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", at: now - 7200000 },
        { role: "user", text: "আপনাদের এখানে দাঁত স্কেলিং ও পরিষ্কার করাতে কত খরচ হয়?", at: now - 7180000 },
        { role: "agent", text: "আমাদের ক্লিনিকে দাঁত স্কেলিং ও পলিশিং এর প্যাকেজ ১৫০০ থেকে ২৫০০ টাকার মধ্যে হয়ে থাকে। আপনি কি ডক্টর ফারজানা রহমানের সাথে অ্যাপয়েন্টমেন্ট নিতে আগ্রহী?", at: now - 7160000 },
        { role: "user", text: "ধন্যবাদ, আমি ভেবে জানাচ্ছি। ক্লিনিক কয়টা পর্যন্ত খোলা থাকে?", at: now - 7140000 },
        { role: "agent", text: "আমাদের ক্লিনিক প্রতিদিন সকাল ৯টা থেকে রাত ৮টা পর্যন্ত খোলা থাকে। আপনার আর কোনো তথ্য লাগবে কি?", at: now - 7120000 },
      ],
      extraction: {
        patientName: "নুসরাত পারভীন",
        phone: "01898765432",
        reasonForVisit: "দাঁত স্কেলিং এর খরচ ও সময়সূচি জানা",
        preferredDateTime: null,
        intent: "CLINIC_ENQUIRY",
        outcome: CallOutcome.ENQUIRY,
        notes: "Scaling charges and opening hours enquiry. Provided fee range: 1500-2500 BDT.",
        validationStatus: "VALID",
      },
    },
    {
      callId: "call_demo_003_followup",
      startedAt: new Date(now - 1000 * 60 * 240), // 4 hours ago
      endedAt: new Date(now - 1000 * 60 * 237),
      durationSec: 175,
      patientName: "আনিসুর রহমান (Anisur Rahman)",
      patientPhone: "01911223344",
      patientId: seededPatients["01911223344"],
      userTurns: 5,
      status: "COMPLETED",
      outcome: CallOutcome.FOLLOW_UP_NEEDED,
      transcript: [
        { role: "agent", text: "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", at: now - 14400000 },
        { role: "user", text: "গতকাল রুট ক্যানেল করিয়েছিলাম, কিন্তু এখনও রক্ত পড়ছে। কি অ্যান্টিবায়োটিক খাব একটু বলবেন?", at: now - 14380000 },
        { role: "agent", text: "আমি দুঃখিত, সুরক্ষার স্বার্থে একজন এআই হিসেবে আমি কোনো ওষুধের নাম প্রেসক্রাইব করতে পারব না। তবে আপনার পরিস্থিতি জরুরি বিবেচনা করে আমি আমাদের অন-কল ডাক্তারের কাছে একটি জরুরি কলব্যাক রিকোয়েস্ট পাঠিয়ে দিচ্ছি। আপনার নাম এবং ফোন নম্বরটি দয়া করে বলুন।", at: now - 14350000 },
        { role: "user", text: "আমার নাম আনিসুর রহমান, নম্বর ০১৯১১২২৩৩৪৪। দ্রুত একটু ফোন দিতে বলুন।", at: now - 14320000 },
        { role: "agent", text: "আনিসুর সাহেব, আপনার তথ্য নোট করে ডাক্তারের টেবিলে পাঠানো হয়েছে। খুব শীঘ্রই আমাদের ক্লিনিক থেকে আপনাকে কল করা হবে। প্রয়োজন হলে নিকটস্থ জরুরি বিভাগে যোগাযোগ করুন।", at: now - 14300000 },
      ],
      extraction: {
        patientName: "আনিসুর রহমান",
        phone: "01911223344",
        reasonForVisit: "রুট ক্যানেল পরবর্তী রক্তপাত ও ওষুধের পরামর্শ চাওয়া",
        preferredDateTime: "জরুরি কলব্যাক (ASAP)",
        intent: "MEDICAL_ADVICE_CALLBACK",
        outcome: CallOutcome.FOLLOW_UP_NEEDED,
        notes: "Out-of-scope medical advice request safely declined. Urgent doctor callback requested for post-op bleeding.",
        validationStatus: "VALID",
      },
    },
    {
      callId: "call_demo_004_incomplete",
      startedAt: new Date(now - 1000 * 60 * 360),
      endedAt: new Date(now - 1000 * 60 * 359),
      durationSec: 35,
      patientName: "সাদিয়া আক্তার",
      patientPhone: "01655443322",
      patientId: seededPatients["01655443322"],
      userTurns: 1,
      status: "COMPLETED",
      outcome: CallOutcome.INCOMPLETE,
      transcript: [
        { role: "agent", text: "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", at: now - 21600000 },
        { role: "user", text: "হ্যালো? শোনা যাচ্ছে?", at: now - 21590000 },
        { role: "agent", text: "জি, আমি শুনতে পাচ্ছি। ঢাকা ডেন্টাল কেয়ার থেকে বলছি। আপনাকে কীভাবে সাহায্য করতে পারি?", at: now - 21580000 },
      ],
      extraction: {
        patientName: "সাদিয়া আক্তার",
        phone: "01655443322",
        reasonForVisit: "কল বিচ্ছিন্ন হয়েছে (Line dropped)",
        preferredDateTime: null,
        intent: "DROPPED_CALL",
        outcome: CallOutcome.INCOMPLETE,
        notes: "Caller dropped the call after microphone check.",
        validationStatus: "NEEDS_REVIEW",
      },
    },
  ];

  for (const c of sampleCalls) {
    const existing = await prisma.call.findUnique({ where: { callId: c.callId } });
    if (!existing) {
      const createdCall = await prisma.call.create({
        data: {
          callId: c.callId,
          startedAt: c.startedAt,
          endedAt: c.endedAt,
          durationSec: c.durationSec,
          patientName: c.patientName,
          patientPhone: c.patientPhone,
          patientId: c.patientId,
          userTurns: c.userTurns,
          status: c.status,
          outcome: c.outcome,
          transcript: c.transcript,
          extraction: {
            create: {
              patientId: c.patientId,
              patientName: c.extraction.patientName,
              phone: c.extraction.phone,
              reasonForVisit: c.extraction.reasonForVisit,
              preferredDateTime: c.extraction.preferredDateTime,
              intent: c.extraction.intent,
              outcome: c.extraction.outcome,
              notes: c.extraction.notes,
              validationStatus: c.extraction.validationStatus,
            },
          },
        },
      });

      if (c.appointment) {
        await prisma.appointment.create({
          data: {
            doctorId: c.appointment.doctorId,
            patientId: c.patientId,
            callId: createdCall.id,
            patientName: c.appointment.patientName,
            patientPhone: c.appointment.patientPhone,
            startTime: c.appointment.startTime,
            endTime: c.appointment.endTime,
            status: c.appointment.status,
            reason: c.appointment.reason,
          },
        });
      }
      console.log(`Created seed call: ${c.callId} (${c.outcome})`);
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
