-- SQL Script to Create Admin User
-- Copy and paste this into your Supabase SQL Editor

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Define user variables
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'admin@nexus.com'; -- Using email format for username
  user_pass TEXT := 'admin123';
BEGIN
  -- 3. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Nexus Admin","role":"admin"}',
      now(),
      now(),
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- 4. Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, user_email)::jsonb,
      'email',
      new_user_id, -- provider_id is the user_id for email provider
      now(),
      now(),
      now()
    );

    -- 5. Create Profile
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      role,
      verification_status
    )
    VALUES (
      new_user_id,
      'admin',
      'Nexus Admin',
      'admin',
      'approved'
    );
  ELSE
    -- If user exists, ensure they are admin
    UPDATE public.profiles 
    SET role = 'admin', verification_status = 'approved' 
    WHERE username = 'admin' OR id = (SELECT id FROM auth.users WHERE email = user_email);
  END IF;

END $$;
