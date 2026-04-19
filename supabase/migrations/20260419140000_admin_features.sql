-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow admins to update profiles (specifically the is_banned column)
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
CREATE POLICY "Admins can update all profiles."
  ON public.profiles FOR UPDATE
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Allow admins to delete products globally
DROP POLICY IF EXISTS "Admins can delete any product." ON public.products;
CREATE POLICY "Admins can delete any product."
  ON public.products FOR DELETE
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
