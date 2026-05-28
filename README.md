# Prepd — Legal Case Preparation Platform

A two-sided web platform for lawyers and clients to prepare for depositions and trials.

## Quick Start

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. In **Project Settings > API**, copy your Project URL and anon key

### 2. Deploy Edge Functions

Install the Supabase CLI, then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set the Anthropic API key as a secret
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deploy both functions
supabase functions deploy generate-questions
supabase functions deploy analyse-session
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 4. Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Creating a Lawyer Account (for Demo)

Supabase doesn't expose signup by default for this app. Create a lawyer account manually:

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **Invite user**, enter the lawyer's email
3. After they set a password, go to **Table Editor > users**
4. Find their row and set `role = 'lawyer'`

Or use the SQL Editor:

```sql
-- After the lawyer signs up via the invite email:
UPDATE public.users SET role = 'lawyer' WHERE email = 'lawyer@example.com';
```

---

## Demo Flow

1. **Login as lawyer** → `/dashboard`
2. **Create a case** → fill in name, type, summary, key facts
3. **Upload documents** → PDFs/DOCXs are parsed immediately
4. **Invite client** → generates a `/invite/:token` link
5. **Client opens link** → creates account, attached to case
6. **Assign question set** → AI generates 12 case-specific questions (10-20s)
7. **Client logs in** → `/prepare` → begins session, answers questions
8. **After final answer** → AI analysis triggers, report saved
9. **Lawyer views report** → contradictions, weak points, document conflicts highlighted

---

## Architecture

```
Browser (React + Vite)
  └── Supabase JS SDK
        ├── Auth (email/password)
        ├── PostgreSQL (RLS-protected tables)
        ├── Storage (case-documents bucket)
        └── Edge Functions (Deno)
              ├── generate-questions → Anthropic Claude API
              └── analyse-session   → Anthropic Claude API → saves report to DB

Client voice input → ElevenLabs STT API (browser → ElevenLabs)
PDF/DOCX parsing   → pdfjs-dist + mammoth (in-browser)
```

---

## File Structure

```
prepd/
├── src/
│   ├── components/
│   │   ├── lawyer/          # CaseCard, CaseForm, DocumentUpload, ClientList,
│   │   │                    # AssignSetModal, InviteClientModal, ReportView
│   │   ├── client/          # QuestionCard, VoiceRecorder, ProgressBar
│   │   ├── shared/          # Layout, ProtectedRoute
│   │   └── ui/              # Button, Input, Textarea, Label, Badge, Card,
│   │                        # Progress, Tabs, Dialog, Select
│   ├── pages/
│   │   ├── lawyer/          # Dashboard, NewCase, CaseDetail, ReportPage
│   │   ├── client/          # Prepare, Session, Complete
│   │   ├── Login.tsx
│   │   └── Invite.tsx
│   ├── lib/                 # supabase.ts, claude.ts, elevenlabs.ts, documentParser.ts, utils.ts
│   ├── hooks/               # useAuth.ts, useCase.ts
│   └── types/               # index.ts
└── supabase/
    ├── schema.sql
    └── functions/
        ├── generate-questions/index.ts
        └── analyse-session/index.ts
```
