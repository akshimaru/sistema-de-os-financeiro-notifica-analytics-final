/*
  # Create Services System

  1. New Table
    - services: Stores repair and maintenance services
      - id (uuid, primary key)
      - name (text, not null)
      - description (text)
      - value (decimal, not null)
      - created_at (timestamp)
      - user_id (uuid, reference to user)

  2. Security
    - RLS enabled
    - CRUD policies
    
  3. Initial Data
    - Common string instrument services
*/

-- Create services table if not exists
CREATE TABLE IF NOT EXISTS servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own services"
  ON servicos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON servicos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON servicos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create default services
CREATE OR REPLACE FUNCTION public.create_default_services()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO servicos (nome, descricao, valor, user_id) VALUES
    ('Regulagem Básica', 'Ajuste de altura das cordas, oitavas e tensor', 150.00, NEW.id),
    ('Troca de Cordas', 'Substituição completa das cordas com limpeza', 50.00, NEW.id),
    ('Limpeza Geral', 'Limpeza completa do instrumento e componentes', 80.00, NEW.id),
    ('Troca de Trastes', 'Substituição completa dos trastes', 450.00, NEW.id),
    ('Blindagem', 'Blindagem completa da parte elétrica', 200.00, NEW.id),
    ('Reparo de Traste Solto', 'Fixação de traste solto', 50.00, NEW.id),
    ('Instalação de Captador', 'Instalação e regulagem de captador', 120.00, NEW.id),
    ('Troca de Tarraxas', 'Substituição das tarraxas', 180.00, NEW.id),
    ('Reparo de Rachadura', 'Reparo de rachadura no corpo ou braço', 300.00, NEW.id),
    ('Setup Completo', 'Regulagem completa com troca de cordas', 250.00, NEW.id),
    ('Restauração', 'Restauração completa do instrumento', 800.00, NEW.id),
    ('Customização', 'Personalização conforme especificações', 500.00, NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for default services
CREATE TRIGGER on_auth_user_created_services
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_services();