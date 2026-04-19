CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role;
BEGIN
  -- Attempt to cast the metadata role to our enum type, default to buyer if missing/invalid
  BEGIN
    assigned_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    assigned_role := 'buyer'::user_role;
  END;

  IF assigned_role IS NULL THEN
    assigned_role := 'buyer'::user_role;
  END IF;

  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (new.id, assigned_role, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
