/*
  # Create Problems Table and Default Data

  1. New Table
    - `problemas`
      - `id` (uuid, primary key)
      - `nome` (text, required)
      - `descricao` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Only authenticated users can access their own data

  3. Default Data
    - Trigger to create default problems for new users
*/

-- Create problems table
CREATE TABLE IF NOT EXISTS problemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE problemas ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own problems"
  ON problemas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own problems"
  ON problemas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own problems"
  ON problemas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own problems"
  ON problemas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create default problems
CREATE OR REPLACE FUNCTION public.create_default_problems()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO problemas (nome, descricao, user_id) VALUES
    ('Cordas Oxidadas', 'Cordas apresentam oxidação e perda de brilho sonoro', NEW.id),
    ('Trastes Gastos', 'Trastes com desgaste visível afetando a afinação', NEW.id),
    ('Ponte Desregulada', 'Ponte fora de alinhamento causando problemas de afinação', NEW.id),
    ('Tarraxas Frouxas', 'Tarraxas não mantêm a afinação adequadamente', NEW.id),
    ('Captadores com Ruído', 'Captadores apresentando ruídos ou interferências', NEW.id),
    ('Rachadura no Braço', 'Rachadura no braço do instrumento', NEW.id),
    ('Pestana Danificada', 'Pestana com entalhes profundos ou quebrada', NEW.id),
    ('Problemas Elétricos', 'Falhas na parte elétrica do instrumento', NEW.id),
    ('Corpo Riscado', 'Arranhões e marcas na superfície do instrumento', NEW.id),
    ('Traste Alto', 'Traste desnivelado causando trastejamento', NEW.id),
    ('Ação Alta', 'Cordas muito distantes do braço', NEW.id),
    ('Braço Empenado', 'Braço do instrumento com empeno visível', NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for default problems
CREATE TRIGGER on_auth_user_created_problems
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_problems();