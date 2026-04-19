-- Create an enum for user roles
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin', 'rider');

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  role user_role not null default 'buyer',
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint role_must_be_single_type check (role in ('buyer', 'seller', 'admin', 'rider'))
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create a trigger to automatically create a profile when a new user signs up in auth.users
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
