-- ============================================================
-- Prepd — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Public users profile table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('lawyer', 'client')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Cases
CREATE TABLE IF NOT EXISTS public.cases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  case_type   TEXT NOT NULL,
  trial_date  DATE,
  court_name  TEXT,
  summary     TEXT,
  key_facts   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Client invites (pre-signup tokens)
CREATE TABLE IF NOT EXISTS public.client_invites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Case <-> Client junction
CREATE TABLE IF NOT EXISTS public.case_clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
  UNIQUE(case_id, client_id)
);

-- Case documents
CREATE TABLE IF NOT EXISTS public.case_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  extracted_text  TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Question sets
CREATE TABLE IF NOT EXISTS public.question_sets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id       UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  set_type      TEXT NOT NULL,
  questions     JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- Session responses
CREATE TABLE IF NOT EXISTS public.session_responses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id   UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  question_index    INTEGER NOT NULL,
  question_text     TEXT NOT NULL,
  answer_text       TEXT NOT NULL,
  answer_type       TEXT NOT NULL DEFAULT 'text' CHECK (answer_type IN ('voice', 'text')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (lawyer-only)
CREATE TABLE IF NOT EXISTS public.reports (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id          UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  case_id                  UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  overall_assessment       TEXT,
  consistency_score        INTEGER CHECK (consistency_score >= 1 AND consistency_score <= 10),
  strong_points            JSONB DEFAULT '[]',
  weak_points              JSONB DEFAULT '[]',
  contradictions           JSONB DEFAULT '[]',
  document_conflicts       JSONB DEFAULT '[]',
  volunteered_information  JSONB DEFAULT '[]',
  recommended_next_set     TEXT,
  raw_report_text          TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- cases
CREATE POLICY "cases_lawyer_all" ON public.cases FOR ALL
  USING (lawyer_id = auth.uid());

CREATE POLICY "cases_client_select" ON public.cases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.case_clients cc
    WHERE cc.case_id = cases.id AND cc.client_id = auth.uid()
  ));

-- client_invites (anyone can read by token for the invite page)
CREATE POLICY "invites_lawyer_all" ON public.client_invites FOR ALL
  USING (lawyer_id = auth.uid());

CREATE POLICY "invites_public_select" ON public.client_invites FOR SELECT
  USING (true);

-- case_clients
CREATE POLICY "case_clients_lawyer_select" ON public.case_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = case_clients.case_id AND c.lawyer_id = auth.uid()
  ));

CREATE POLICY "case_clients_client_select" ON public.case_clients FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "case_clients_insert_own" ON public.case_clients FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "case_clients_lawyer_insert" ON public.case_clients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = case_clients.case_id AND c.lawyer_id = auth.uid()
  ));

-- case_documents
CREATE POLICY "docs_lawyer_all" ON public.case_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = case_documents.case_id AND c.lawyer_id = auth.uid()
  ));

CREATE POLICY "docs_client_select" ON public.case_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.case_clients cc
    WHERE cc.case_id = case_documents.case_id AND cc.client_id = auth.uid()
  ));

-- question_sets
CREATE POLICY "qs_lawyer_select" ON public.question_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = question_sets.case_id AND c.lawyer_id = auth.uid()
  ));

CREATE POLICY "qs_lawyer_insert" ON public.question_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = question_sets.case_id AND c.lawyer_id = auth.uid()
  ));

CREATE POLICY "qs_client_select" ON public.question_sets FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "qs_client_update" ON public.question_sets FOR UPDATE
  USING (client_id = auth.uid());

-- session_responses
CREATE POLICY "sr_client_insert" ON public.session_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.question_sets qs WHERE qs.id = session_responses.question_set_id AND qs.client_id = auth.uid()
  ));

CREATE POLICY "sr_client_select" ON public.session_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.question_sets qs WHERE qs.id = session_responses.question_set_id AND qs.client_id = auth.uid()
  ));

CREATE POLICY "sr_lawyer_select" ON public.session_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.question_sets qs
    JOIN public.cases c ON c.id = qs.case_id
    WHERE qs.id = session_responses.question_set_id AND c.lawyer_id = auth.uid()
  ));

-- reports (lawyer only)
CREATE POLICY "reports_lawyer_select" ON public.reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases c WHERE c.id = reports.case_id AND c.lawyer_id = auth.uid()
  ));

CREATE POLICY "reports_service_insert" ON public.reports FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'case-documents' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'case-documents' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'case-documents' AND auth.role() = 'authenticated');

