# Prepd — Lovable Design Prompt

## What You Are Building

Prepd is a two-sided legal case preparation platform. It connects lawyers with their clients and uses AI to help clients practice answering deposition and testimony questions before their court date. The platform has two completely separate user experiences — one for lawyers, one for clients — and the product lives entirely in the browser.

This is not a law firm website. It is not a document management tool. It is an AI-powered coaching and readiness platform for real legal cases. The stakes are high — clients are preparing for moments that will affect the rest of their lives. The product should feel serious, trustworthy, and precise, but also human and supportive. It is helping real people through one of the hardest experiences of their lives.

Do not use dark mode. The entire product should be light.

---

## The Two Users

### Lawyer
A practicing attorney who manages one or more cases. They upload case documents, write case summaries and key facts, invite their clients to the platform, assign practice sessions, and review AI-generated reports after their client completes a session. The lawyer is the operator — they control everything and use Prepd as a professional tool built into their workflow.

### Client
An individual involved in a legal case — a plaintiff, defendant, or witness. They receive an invitation from their lawyer, accept it, and then use Prepd to practice answering questions before their actual deposition or testimony. They have no administrative control. They see only their own case information and their own sessions. The client experience should feel guided, calm, and supportive — like being coached, not tested.

---

## The Full Product Flow

### Lawyer Side

**1. Login**
Standard email/password authentication. After login, lawyers land on their dashboard.

**2. Dashboard**
The lawyer sees all of their active cases in a card-based layout. Each case card shows the case name, case type (e.g. Personal Injury, Family Law, Criminal Defense), trial date, number of clients attached, and whether there is a new session report waiting to be reviewed. There is a button to create a new case.

**3. Create New Case**
A form where the lawyer fills in:
- Case name
- Case type (selected from a list)
- Trial date
- Court name
- Case summary (free text — a paragraph or two describing the situation)
- Key facts (free text — bullet-style facts, dates, people, events that are critical to the case)

The form auto-saves as a draft so the lawyer doesn't lose progress if they navigate away.

**4. Case Detail**
After creating or selecting a case, the lawyer sees a full case detail view with four tabs:

- **Overview** — Displays the case summary, key facts, trial date, court name, and case type. The lawyer can edit these at any time.
- **Documents** — A drag-and-drop upload zone for case files (PDF, DOCX, TXT). When a document is uploaded, the text is automatically extracted and stored so the AI can use it to generate questions. The lawyer sees a list of uploaded documents with file names and upload timestamps.
- **Clients** — A list of clients attached to this case. Each client row shows their name, email, how many sessions they've completed, and whether a report is ready. There are two actions per client: "View report" (if a report exists) and "Assign session." There is also a button to invite a new client to the case.
- **Reports** — A list of all completed session reports for this case, showing the client name, session type, date completed, and consistency score (out of 10).

**5. Invite Client**
The lawyer enters the client's email and full name. The client receives a portal notification (not an email — an in-app notification) that they've been invited to a case. There is no link-sharing or clipboard — it's all handled in-platform. Once the client accepts, they appear in the lawyer's Clients tab in real time.

**6. Assign Session — First Time**
When assigning the first session to a client, there is NO type selection. The AI automatically generates a foundational set of 12 questions covering the most critical aspects of the case: timeline, key facts, credibility, document evidence, and early risk areas. The lawyer just clicks one button and the session is generated.

**7. Assign Session — Follow-up**
After the client has completed at least one session and the lawyer has reviewed the report, the lawyer can assign a follow-up session. This time, they choose a specific focus area from the following options:
- Background & Timeline
- Relationship Questions
- Credibility Challenges
- Event-Specific Deep Dive
- Document Confrontation
- Hostile Cross-Examination
- Procedural Familiarity

The AI generates 12 questions tailored to that focus area using all case documents, the case summary, and key facts.

**8. Report View**
After a client completes a session, the lawyer can open a full report. The report contains:

- **Red Flags** — A high-priority section at the top listing: high-risk weak points, internal contradictions the client made between their answers, and conflicts between the client's answers and the uploaded case documents. This section is the lawyer's first stop — it shows exactly what needs to be addressed before trial.
- **Overall Assessment** — A paragraph-length AI analysis of how the client performed.
- **Consistency Score** — A score out of 10 with a visual bar.
- **Strong Points** — Things the client answered well.
- **Weak Points** — Specific areas where the client's answers were inconsistent, incomplete, or risky, each labeled High / Medium / Low risk.
- **Contradictions** — Side-by-side display of contradicting answers the client gave to different questions.
- **Document Conflicts** — Side-by-side display of what the client said vs. what the uploaded documents say.
- **Volunteered Information** — Things the client said that weren't asked for — potentially useful or potentially risky.
- **Recommended Next Session** — An AI recommendation for what to focus on next.
- **Assign Follow-up Session** button — Takes the lawyer directly to assign a new session for this client.
- **Download PDF** button — Generates a print-ready PDF of the report.

---

### Client Side

**1. Login**
Same login page as the lawyer but routes differently based on role.

**2. Client Home (Prepare)**
The client's home screen has two states:

- If they have pending invitations: They see a card for each invitation showing the lawyer's name and the case name. They can Accept or Decline.
- If they have accepted a case: They see a card for their case (name, case type, trial date). The card is clickable and takes them to their case detail. If a session has been assigned, there is a prominent "Begin session" button on the home screen.

**3. Client Case Detail**
When a client clicks their case card, they see two tabs:

- **Overview** — Read-only view of the case summary and key facts (so they understand the context of their case). Also shows trial date and court name. If a session is ready, there is a "Begin session" call-to-action inline.
- **My Sessions** — A list of all sessions assigned to them. Pending/in-progress sessions show a "Begin" button. Completed sessions show: the session type, when it was completed, their consistency score out of 10, a summary of strong points, and areas to improve. The client does NOT see the full lawyer report — they only see encouraging, forward-looking feedback about their own performance.

**4. Session**
When a client begins a session, they enter a focused, distraction-free interface that presents one question at a time. For each question:

- The question is displayed clearly.
- The client can answer by typing text OR by recording a voice answer (voice is transcribed automatically).
- After submitting an answer, the client receives brief AI coaching feedback — 2-3 sentences on how they answered and one concrete suggestion for improvement. This feedback appears before they move to the next question.
- A progress bar shows how far through the session they are.
- There is a "Next question" button to proceed.

**5. Session Complete**
After answering all 12 questions, the client sees a completion screen. It tells them their session is done and that their lawyer will review their responses. They cannot see the full report. They are returned to their home screen.

---

## Data and Content That Lives in the Product

**Cases contain:**
- Name, type, trial date, court name
- Case summary (paragraph)
- Key facts (paragraph or list)

**Documents contain:**
- File name, upload date
- Extracted text (used by AI, not shown raw to users)

**Question sets contain:**
- 12 AI-generated questions
- Session type / focus area
- Status: pending, in progress, completed
- Assigned client

**Session responses contain:**
- Each question and the client's answer
- Whether the answer was voice or text
- Per-answer coaching feedback

**Reports contain:**
- Overall assessment paragraph
- Consistency score (0–10)
- Strong points (list of strings)
- Weak points (each has: which questions it applies to, the finding, and a risk level: High / Medium / Low)
- Contradictions (pairs of conflicting answers)
- Document conflicts (client answer vs. document excerpt)
- Volunteered information (list)
- Recommended next session type

---

## Technical Context

- React + TypeScript + Vite
- Tailwind CSS for styling
- Supabase for auth, database, and file storage
- AI features powered by Anthropic Claude (via Supabase Edge Functions)
- Voice input via ElevenLabs STT
- React Router for navigation
- shadcn/ui component primitives (you can replace or restyle these entirely)

The backend is fully functional. You are redesigning the frontend only. All routes, API calls, hooks, and data fetching logic remain the same — only the visual layer changes.

---

## What the Product Must Feel Like

- **Trustworthy and serious.** This is a legal product. People's cases, careers, and freedom can depend on it. It should never feel like a startup toy or a generic SaaS template.
- **Human.** The client side especially needs warmth. A client preparing for a deposition is nervous. The interface should feel like a good coach, not a software dashboard.
- **Precise and information-dense on the lawyer side.** Lawyers work with a lot of information. The lawyer dashboard and report views should be clean but capable of showing detail clearly — no hiding information behind unnecessary clicks.
- **Focused on the task during sessions.** The session interface (question by question) should strip away everything except the question, the answer input, and the feedback. Zero distraction.
- **Premium.** Not flashy. Not loud. Premium — like a product built for professionals that costs what it's worth.

---

## Constraints

- Light mode only. No dark mode at any point.
- The two-sided nature (lawyer vs. client) must be clearly distinct in visual language — a lawyer and a client should feel like they're using related but different products.
- Mobile responsive — especially the client session flow, which someone might complete on their phone.
- The report view is information-dense — design it so it can be printed as a clean PDF.
- Do not add features or pages that don't exist. Redesign what's already described above.

---

## What You Have Full Creative Freedom Over

Everything visual. Typography, color palette, spacing, layout, component style, iconography, motion, transitions, micro-interactions, card shapes, empty states, loading states, illustrations if you want them, the visual distinction between lawyer and client — all of it. Make it unlike anything in legal tech today. The industry is full of conservative blue-and-white dashboards with bad typography. This product should look like it was made by people who take design seriously.

The only non-negotiable: light mode, and the product must feel appropriate for high-stakes legal proceedings.
