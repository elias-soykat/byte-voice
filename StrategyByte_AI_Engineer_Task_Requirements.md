# AI Engineer Group Interview: Technical Task Brief

**Saturday 14 November 2026** | **Role:** AI Engineer | **StrategyByte**, L15, 60 Station Street, Parramatta NSW 2150

---

## 1. Case study

### 1.1 About StrategyByte
StrategyByte is an Australian AI company that builds voice agents and workflow automation, with a strong focus on healthcare, particularly dental clinics and hospitals. Our product, [ByteVoice](https://bytevoice.com.au) (`bytevoice.com.au`), is an AI receptionist and caller that answers and makes calls for clinics: it greets patients, books and reschedules appointments, answers common enquiries and hands structured information to the practice team. Alongside voice, we automate the administrative work that surrounds a phone call, such as updating records, sending confirmations and keeping staff informed.

### 1.2 The opportunity: Bangladesh
StrategyByte is now making strides to operate officially in Bangladesh. Healthcare providers there, like those in Australia, depend heavily on the phone as the first point of contact with patients. Most patients prefer to speak in Bangla, and an English-only assistant would not meet their needs. To serve this market we need a voice agent that speaks natural, polite, everyday Bangla, and that integrates with the way Bangladeshi dental clinics and hospitals actually run their front desks.

### 1.3 The problem clinics and hospitals face
Front-desk phone lines in busy clinics and hospitals commonly run into the same set of issues:
- **Missed calls.** When reception staff are busy with patients in person, calls go unanswered and the patient may book elsewhere.
- **After-hours enquiries.** Patients call outside opening hours and have no way to book or get basic information.
- **Manual booking.** Appointments are often taken by hand or in separate systems, which leads to errors, double bookings and lost details.
- **Receptionist workload.** Staff spend much of the day answering the same questions (opening hours, location, fees, doctor availability) instead of looking after patients.
- **Unstructured information.** What was said on a call is rarely captured in a form the clinic can search, report on or follow up.

### 1.4 Who the product serves

| User | What they need |
| :--- | :--- |
| **Patients and callers** | To be answered quickly, in Bangla, at any time, and to book, change or cancel an appointment or get information without waiting on hold. |
| **Receptionists and front-desk staff** | Fewer repetitive calls, and a clear list of bookings, requests and callbacks captured by the AI. |
| **Clinic and hospital managers** | Visibility of call volume, outcomes and patient requests, with data stored in an organised, reliable way. |

### 1.5 What the Bangla caller should handle
- **Appointments:** booking, rescheduling and cancelling, including checking a preferred date, time and doctor or service.
- **Clinic information:** opening hours, location and directions, services offered and how to prepare for a visit.
- **Frequently asked questions:** common patient enquiries, answered consistently and politely.
- **Capturing patient details:** name, phone number, reason for the call and any notes, confirmed back to the caller.
- **Handing over:** recognising when a request needs a human and recording it for staff follow-up.

---

### 1.6 Language considerations
- **Natural, colloquial Bangla.** The caller should sound like a courteous receptionist, not a formal or textbook script.
- **Code-switching.** Callers often mix Bangla and English in the same sentence (for example "appointment", "doctor", "scaling"). The caller must understand this and respond naturally.
- **Numbers, dates and times.** Phone numbers, dates, days of the week and times may be spoken in Bangla or English and must be captured accurately and read back for confirmation.
- **Names.** Bangladeshi personal names and doctor names should be recognised, spelled sensibly when stored and pronounced correctly.

### 1.7 The role of the portal
Every call produces information that clinic staff need to act on. The portal is where that information lives: staff should be able to see each call, its transcript or summary, the patient details captured, the outcome (for example booked, rescheduled, cancelled or callback needed) and how the underlying data is organised, structured and stored.

### 1.8 Your role
Imagine you have joined StrategyByte as an AI Engineer on the Bangladesh launch team. You have been asked to build an early, working version of this product end to end: a landing page that introduces it, a Bangla caller that prospective clients can try from the hero section, and a portal that shows clinic staff how their call data is captured and stored. Treat it as a demo you would show a Bangladeshi clinic owner.

---

## 2. Task overview

| Part | Component | Summary |
| :---: | :--- | :--- |
| **A** | Landing page | At least three sections, with the hero section as the main focus. |
| **B** | Hero call to action | A clear "Talk to our Bangla caller" option in the hero that starts a live conversation. |
| **C** | Bangla caller | A voice agent that holds a natural spoken Bangla conversation for a clinic or hospital. |
| **D** | Data portal | A portal showing how every call's data is organised, structured and stored. |

**What success looks like:** a reviewer opens your landing page, clicks the hero button, books a dental appointment in Bangla and hangs up. They then log in to your portal and, within a minute or two, see that call, its transcript and the patient's details neatly organised.

---

## 3. Part A: Landing page
Build a landing page that introduces StrategyByte's Bangla voice agent to dental clinics and hospitals in Bangladesh: what it does, who it is for and why they should care.

- **At least three sections.** More is up to you. Suggested: Hero; Features or how it works; Use cases (dental clinics, diagnostic centres, hospital outpatients, reminder calls); Contact or demo request.
- **The hero section is the primary focus.** It should communicate the product's value within seconds and lead naturally to the caller.
- **Any 3D animation or 3D elements implemented in the hero section will be treated as a plus.**
- **Responsive on mobile and desktop**, and deployed to a public URL.
- **Content can be in Bangla, English or both.** A bilingual page (for example, a language toggle) is a plus.

---

## 4. Part B: "Talk to our Bangla caller" in the hero
The hero must include a clear, prominent "Talk to our Bangla caller" option that starts a live conversation with the caller from Part C. It should work in the browser:

- **Browser voice:** the visitor grants microphone access and talks to the agent in the browser (for example WebRTC or a provider's web SDK).

Show when the call is connecting, live and ended, and handle microphone permission or connection errors gracefully.

---

## 5. Part C: The Bangla caller
Build a voice agent that sounds like a warm, competent receptionist: polite, clear, patient and efficient. Naturalness and reliability matter more than the number of features. Suggested flow:

1. **Greeting** and introduction of the clinic or hospital.
2. **Patient name**, confirmed back; **phone number**, read back digit by digit.
3. **Reason for visit**, for example toothache, cleaning, check-up or follow-up.
4. **Preferred date and time**, including phrases like "next Sunday evening".
5. **Booking or enquiry handling** (opening hours, location, services, fees).
6. **Out-of-scope questions** such as medical advice: politely decline and offer a human callback.
7. **Ending the call** with a summary of what was agreed.

| Speaker | Dialogue |
| :--- | :--- |
| **AGENT** | **আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?**<br>*Assalamu alaikum, welcome to Dhaka Dental Care. How can I help you?* |
| **PATIENT** | **আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই, আমার দাঁতে ব্যথা।**<br>*I would like to book an appointment, I have a toothache. (Example only; write your own script.)* |

We will assess natural Bangla (not literal English translation), low latency and smooth turn-taking including interruptions, accurate capture of Bangla names, numbers, dates and times, recovery from mishearing, silence or mixed Bangla and English, confirmation before booking, and safe behaviour with no medical advice or invented information.

Tech stack and providers are your choice; be ready to explain why.

---

## 6. Part D: The data portal
All call data must flow into a portal you build, showing clearly how the data is organised, structured and stored. Treat the data model as a first-class part of the task. At a minimum, show:

- **Call list** with date, time, caller, duration and status, ideally searchable or filterable.
- **Per-call view** with extracted fields (patient name, phone, reason for visit, preferred date and time, outcome), the full transcript with speaker labels, timestamps, and status (booked, enquiry, follow-up needed, incomplete, failed).
- **A simple login**, with reviewer login details provided in your submission.

### Example data model (illustration only; design your own):

| Entity | Example fields | Purpose |
| :--- | :--- | :--- |
| `calls` | `id`, `started_at`, `ended_at`, `duration_s`, `status`, `recording_url` | One record per call |
| `patients` | `id`, `full_name`, `phone`, `created_at` | The person behind the calls |
| `call_extractions` | `call_id`, `reason_for_visit`, `preferred_datetime`, `intent` | Structured fields |
| `transcript_turns` | `call_id`, `speaker`, `text_bn`, `text_en`, `ts` | Full transcript |
| `appointments` | `id`, `patient_id`, `call_id`, `slot`, `status` | Bookings made |

Be ready to explain your schema and relationships, where and how data is stored (database, region, recordings), how data moves from the live call into storage, and how you validate extracted fields such as Bangla digits and phone formats.

---

## 7. Deliverables

| Deliverable | Description | Status |
| :--- | :--- | :---: |
| **Landing page live link** | Public URL with the working "Talk to our Bangla caller" option in the hero. | Required |
| **Back-end portal live link** | Portal URL (with reviewer login if needed), pre-loaded with data from your own test calls. | Required |
| **GitHub repository link** | GitHub repository with a README. Please ensure we have access. | Required |
| **Video overview link** | A short video overview, 3 minutes maximum: landing page, a live Bangla call and the record in the portal. | Required |

---

## 8. Evaluation criteria

| Criterion | What we look for | Weighting |
| :--- | :--- | :---: |
| **Bangla caller quality** | Natural Bangla, smooth turn-taking, accurate capture of details, graceful error handling. | 30% |
| **Data structure and portal** | Clear schema, reliable flow from call to storage, easy-to-use portal. | 25% |
| **Hero and landing page design** | Compelling hero, clear messaging, responsive, visual quality. 3D animation or 3D elements in the hero are a plus. | 20% |
| **Code quality and architecture** | Readable, well-organised code; secrets handled correctly. | 15% |
| **Documentation and presentation** | Clear README, video overview and confident explanation of decisions and trade-offs. | 10% |

---

## 9. Guidelines
- Any tools, frameworks, providers, templates and AI coding assistants are allowed. Free tiers are fine; there is no need to spend money.
- Use test or fake patient data only. Keep API keys and secrets out of the repository.
- Keep everything live until assessment is complete, and be able to explain every part, including AI-generated code.
- A solution that works end to end beats a polished one that only partly works. Tell us honestly what is incomplete.

---

## 10. Submission and questions

| Item | Details |
| :--- | :--- |
| **Deadline** | Monday 16 November 2026, 6:00 AM BST (Bangladesh Standard Time, UTC+6) |
| **Submit to** | Email `hr@strategybyte.com.au` |
| **Email subject** | `AI Engineer Task Submission: your full name` |
| **Include** | Four links in the email: live link of the landing page, live link of the back-end portal (with login if needed), GitHub repository link and video overview link (3 minutes max). |
| **Questions** | `hr@strategybyte.com.au`. We are happy to clarify the brief, but will not prescribe a solution. |

Good luck. We look forward to seeing how you bring a Bangla voice to life. **The StrategyByte team**
