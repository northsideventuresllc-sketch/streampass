-- Resolve login identifier (email or username) to auth email for sign-in
CREATE OR REPLACE FUNCTION public.streampass_email_for_login(login_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_email TEXT;
  trimmed TEXT;
BEGIN
  trimmed := lower(trim(login_identifier));

  IF trimmed IS NULL OR trimmed = '' THEN
    RETURN NULL;
  END IF;

  IF trimmed ~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RETURN trimmed;
  END IF;

  SELECT u.email INTO resolved_email
  FROM public.streampass_profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(p.username) = trimmed
  LIMIT 1;

  RETURN resolved_email;
END;
$$;

REVOKE ALL ON FUNCTION public.streampass_email_for_login(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.streampass_email_for_login(TEXT) TO service_role;
