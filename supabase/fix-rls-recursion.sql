-- ============================================================
-- FIX: Infinite recursion in RLS policies for "cases" table
--
-- Root cause: cases_client_select queries case_clients,
-- which triggers case_clients_lawyer_select, which queries
-- cases again → infinite loop.
--
-- Fix: SECURITY DEFINER functions bypass RLS in subqueries,
-- breaking the circular chain.
--
-- Run this entire file in Supabase SQL Editor.
-- ============================================================

-- ---- 1. DROP THE RECURSIVE POLICIES ----

DROP POLICY IF EXISTS "cases_client_select" ON public.cases;
DROP POLICY IF EXISTS "case_clients_lawyer_select" ON public.case_clients;

-- Also drop other policies that cross-reference cases from
-- child tables (same recursion risk):
DROP POLICY IF EXISTS "docs_lawyer_all" ON public.case_documents;
DROP POLICY IF EXISTS "docs_client_select" ON public.case_documents;
DROP POLICY IF EXISTS "qs_lawyer_select" ON public.question_sets;
DROP POLICY IF EXISTS "qs_lawyer_insert" ON public.question_sets;
DROP POLICY IF EXISTS "sr_lawyer_select" ON public.session_responses;
DROP POLICY IF EXISTS "reports_lawyer_select" ON public.reports;


-- ---- 2. SECURITY DEFINER HELPER FUNCTIONS ----
-- These run as postgres (bypassing RLS), so subqueries inside
-- them won't re-trigger the outer table's policies.

-- Is the current user a client on this case?
CREATE OR REPLACE FUNCTION public.is_case_client(p_case_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.case_clients
    WHERE case_id = p_case_id AND client_id = auth.uid()
  );
$$;

-- Is the current user the lawyer who owns this case?
CREATE OR REPLACE FUNCTION public.is_case_lawyer(p_case_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases
    WHERE id = p_case_id AND lawyer_id = auth.uid()
  );
$$;


-- ---- 3. RECREATE POLICIES USING HELPER FUNCTIONS ----

-- cases: clients can select their own cases
CREATE POLICY "cases_client_select" ON public.cases FOR SELECT
  USING (is_case_client(id));

-- case_clients: lawyer can see all clients on their cases
CREATE POLICY "case_clients_lawyer_select" ON public.case_clients FOR SELECT
  USING (is_case_lawyer(case_id));

-- case_documents
CREATE POLICY "docs_lawyer_all" ON public.case_documents FOR ALL
  USING (is_case_lawyer(case_id));

CREATE POLICY "docs_client_select" ON public.case_documents FOR SELECT
  USING (is_case_client(case_id));

-- question_sets
CREATE POLICY "qs_lawyer_select" ON public.question_sets FOR SELECT
  USING (is_case_lawyer(case_id));

CREATE POLICY "qs_lawyer_insert" ON public.question_sets FOR INSERT
  WITH CHECK (is_case_lawyer(case_id));

-- session_responses (lawyer path chains through question_sets → cases)
CREATE OR REPLACE FUNCTION public.is_qs_case_lawyer(p_qs_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.question_sets qs
    JOIN public.cases c ON c.id = qs.case_id
    WHERE qs.id = p_qs_id AND c.lawyer_id = auth.uid()
  );
$$;

CREATE POLICY "sr_lawyer_select" ON public.session_responses FOR SELECT
  USING (is_qs_case_lawyer(question_set_id));

-- reports
CREATE POLICY "reports_lawyer_select" ON public.reports FOR SELECT
  USING (is_case_lawyer(case_id));
