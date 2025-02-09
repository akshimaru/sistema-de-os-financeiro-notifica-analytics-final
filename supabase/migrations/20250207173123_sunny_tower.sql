/*
  # Create Brands System

  1. New Table
    - brands: Stores instrument brands
      - id (uuid, primary key)
      - name (text, not null)
      - created_at (timestamp)
      - user_id (uuid, reference to user)

  2. Security
    - RLS enabled
    - CRUD policies
    
  3. Initial Data
    - Common brands in Brazil
*/

-- Create brands table
CREATE TABLE IF NOT EXISTS marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own brands"
  ON marcas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brands"
  ON marcas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
  ON marcas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
  ON marcas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create default brands
CREATE OR REPLACE FUNCTION public.create_default_brands()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO marcas (nome, user_id) VALUES
    ('Yamaha', NEW.id),
    ('Tagima', NEW.id),
    ('Giannini', NEW.id),
    ('Eagle', NEW.id),
    ('Rozini', NEW.id),
    ('Fender', NEW.id),
    ('Gibson', NEW.id),
    ('Ibanez', NEW.id),
    ('Strinberg', NEW.id),
    ('Michael', NEW.id),
    ('Shelter', NEW.id),
    ('Vogga', NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for default brands
CREATE TRIGGER on_auth_user_created_brands
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_brands();