# StrategyByte ByteVoice: 3-Minute Video Walkthrough Script

This script provides an exact timing, screen navigation guide, and spoken voiceover for recording the required **3-minute submission video** for StrategyByte.

---

### Timing Breakdown
- **0:00 – 0:50 (50s)**: Landing Page, Value Proposition & 3D Interactive Hero
- **0:50 – 2:05 (75s)**: Live Bangla Voice Call (Hero CTA, code-switching, phone confirmation, booking)
- **2:05 – 3:00 (55s)**: Data Portal & Architecture (Live call sync, extractions, schema)

---

### Scene 1: Landing Page & Hero Section (0:00 – 0:50)

**Visual:**
- Browser is on `https://byte-voice.vercel.app` (or `http://localhost:3000`).
- Move mouse over the 3D rotating tooth element in the hero to show real-time 3D parallax and orbital soundwaves.
- Click the language toggle (`English` ↔ `বাংলা`) in the navigation bar to demonstrate instant bilingual translation across all sections.
- Scroll down briefly to show **Features** (24/7 Bangla Receptionist, Code-Switching, Digit Capture, Medical Guardrail), **Use Cases** (Dental Clinics, Diagnostic Centres, Hospital OPD), and **Workflow**.

**Spoken Voiceover:**
> *"Hello, I am presenting the StrategyByte ByteVoice platform designed specifically for Bangladesh's healthcare launch. In busy clinics across Bangladesh, front desks face high missed-call volumes, after-hours enquiries, and manual booking errors. Most callers speak Bangla mixed with English medical terms.*
>
> *Here on our landing page, we introduce ByteVoice—a 24/7 AI receptionist tailored for dental practices like Dhaka Dental Care. The hero features an interactive 3D dental visualization, full responsiveness, and an instant bilingual toggle supporting English and natural colloquial Bangla."*

---

### Scene 2: Live Browser Voice Call (0:50 – 2:05)

**Visual:**
- Scroll back to the Hero.
- Click the prominent **"Talk to our Bangla caller"** (`আমাদের বাংলা কলারের সাথে কথা বলুন`) button.
- The voice overlay opens smoothly showing **"সংযুক্ত হচ্ছে… / Connecting…"**, and the agent greets in natural Bangla.
- Conduct a live conversation:

| Speaker | Spoken Dialogue |
| :--- | :--- |
| **Agent (AI)** | **"আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?"** |
| **You (Caller)** | **"ওয়ালাইকুম আসসালাম। আমার দাঁতে প্রচণ্ড ব্যথা, ডক্টর তানভীর আহমেদের সাথে একটা অ্যাপয়েন্টমেন্ট বুক করতে চাই।"** |
| **Agent (AI)** | **"অবশ্যই, আমি সাহায্য করছি। অনুগ্রহ করে আপনার নাম এবং মোবাইল নম্বরটি বলুন।"** |
| **You (Caller)** | **"আমার নাম রফিকুল ইসলাম, নম্বর ০১৭ ১১২৩৪৫৬৭৮।"** |
| **Agent (AI)** | *(Reads back digit by digit in Bangla)*<br>**"ধন্যবাদ রফিকুল সাহেব। আপনার নম্বরটি ০ ১ ৭ ১ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ নিশ্চিত করলাম। আপনি কোন দিন এবং কোন সময়ে দেখাতে চান?"** |
| **You (Caller)** | **"আগামী রবিবার বিকাল ৩টায়।"** |
| **Agent (AI)** | **"জি, আগামী রবিবার বিকাল ৩টায় ডক্টর তানভীর আহমেদের সাথে আপনার অ্যাপয়েন্টমেন্ট কনফার্ম করা হয়েছে। ধন্যবাদ।"** |

- Click the red **End Call** button. Show that the overlay closes cleanly.

**Spoken Voiceover:**
> *"Notice the low-latency turn taking, the accurate recognition of Bangla mixed with English ('appointment', 'doctor'), and how the voice agent captures the Bangladeshi mobile number and reads it back digit-by-digit for confirmation before booking against the doctor's real schedule."*

---

### Scene 3: Back-End Data Portal (2:05 – 3:00)

**Visual:**
- Click **"View Dashboard"** or navigate to `/sign-in`.
- Log in with reviewer credentials:
  - **Email**: `reviewer@strategybyte.com.au`
  - **Password**: `StrategyByte2026!`
- Go to the **Calls** tab (`/calls`).
- Show the newly completed call appearing at the top with status `Booked` (Green badge).
- Show the outcome filter pills: click **"Booked"**, **"Enquiries"**, and **"Follow-up Needed"**.
- Click on the newly completed call to open the **Call Detail Dialog**:
  - Point to the **Structured Clinical Extractions Card**:
    * Caller: *রফিকুল ইসলাম*
    * Validated Phone: *01712345678* (Green Checkmark)
    * Reason for Visit: *দাঁতে প্রচণ্ড ব্যথা (Severe toothache)*
    * Requested Slot: *আগামী রবিবার বিকাল ৩:০০ টা*
    * Booked Doctor: *Dr. Tanvir Ahmed (Orthodontics)*
  - Show the **Audio Player** and the full **Spoken Transcript** with speaker tags and timestamps.
- Briefly mention the relational schema in PostgreSQL (`calls`, `patients`, `call_extractions`, `appointments`).

**Spoken Voiceover:**
> *"Now we log in to the clinic admin portal. Immediately, the call appears at the top. When we open it, we see our post-call extraction pipeline in action: the patient's name, validated 11-digit phone number, reason for visit, and booked appointment are all structured and stored in PostgreSQL with full relational integrity.*
>
> *We also see the full transcript with speaker labels and audio playback. This completes our end-to-end solution: from a spoken Bangla conversation in the browser to a reliable clinical record in the portal. Thank you!"*
