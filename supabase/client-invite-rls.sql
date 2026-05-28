-- ============================================================
-- Client invite accept / decline support
-- Run this in Supabase SQL Editor AFTER fix-rls-recursion.sql
-- ============================================================

-- SECURITY DEFINER RPC so the JOIN to cases + users bypasses
-- those tables' RLS (client hasn't accepted yet, so they have
-- no direct access to the case or the lawyer's profile row).
CREATE OR REPLACE FUNCTION public.get_pending_invites_for_user()
RETURNS TABLE(
  id          UUID,
  case_id     UUID,
  case_name   TEXT,
  lawyer_name TEXT,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
  SELECT
    ci.id,
    ci.case_id,
    c.name        AS case_name,
    u.full_name   AS lawyer_name,
    ci.created_at
  FROM public.client_invites ci
  JOIN public.cases          c ON c.id  = ci.case_id
  JOIN public.users          u ON u.id  = ci.lawyer_id
  WHERE ci.email = (SELECT email FROM public.users WHERE id = auth.uid())
    AND ci.status = 'pending';
$$;

-- Helper: is this invite addressed to the currently logged-in user?
CREATE OR REPLACE FUNCTION public.is_invite_for_current_user(invite_email TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND email = invite_email
  );
$$;

-- Client can UPDATE their own invite row (set status = 'accepted')
CREATE POLICY "invites_client_update" ON public.client_invites FOR UPDATE
  USING (is_invite_for_current_user(email));

-- Client can DELETE their own invite row (decline)
CREATE POLICY "invites_client_delete" ON public.client_invites FOR DELETE
  USING (is_invite_for_current_user(email));
