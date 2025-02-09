/*
  # Financial System Implementation

  1. New Tables
    - `categorias_financeiras`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `tipo` (text) - 'receita' or 'despesa'
      - `cor` (text) - Hex color code
      - `created_at` (timestamptz)
      - `user_id` (uuid)

    - `transacoes_financeiras`
      - `id` (uuid, primary key)
      - `descricao` (text)
      - `valor` (decimal)
      - `tipo` (text) - 'receita' or 'despesa'
      - `data` (timestamptz)
      - `categoria_id` (uuid)
      - `ordem_servico_id` (uuid, optional)
      - `created_at` (timestamptz)
      - `user_id` (uuid)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Add foreign key constraints

  3. Default Categories
    - Create default categories for new users
*/

-- Create financial categories table
CREATE TABLE categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create financial transactions table
CREATE TABLE transacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor decimal(10,2) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  data timestamptz NOT NULL,
  categoria_id uuid REFERENCES categorias_financeiras(id) NOT NULL,
  ordem_servico_id uuid REFERENCES ordens_servico(id),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Create policies for categorias_financeiras
CREATE POLICY "Users can view their own categories"
  ON categorias_financeiras
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categorias_financeiras
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categorias_financeiras
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categorias_financeiras
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for transacoes_financeiras
CREATE POLICY "Users can view their own transactions"
  ON transacoes_financeiras
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transacoes_financeiras
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transacoes_financeiras
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transacoes_financeiras
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_transacoes_financeiras_data ON transacoes_financeiras(data);
CREATE INDEX idx_transacoes_financeiras_tipo ON transacoes_financeiras(tipo);
CREATE INDEX idx_transacoes_financeiras_categoria ON transacoes_financeiras(categoria_id);
CREATE INDEX idx_transacoes_financeiras_ordem ON transacoes_financeiras(ordem_servico_id);

-- Function to create default categories
CREATE OR REPLACE FUNCTION public.create_default_financial_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Revenue categories
  INSERT INTO categorias_financeiras (nome, tipo, cor, user_id) VALUES
    ('Serviços Luthieria', 'receita', '#10B981', NEW.id),
    ('Vendas', 'receita', '#3B82F6', NEW.id),
    ('Outros', 'receita', '#6366F1', NEW.id);

  -- Expense categories
  INSERT INTO categorias_financeiras (nome, tipo, cor, user_id) VALUES
    ('Materiais', 'despesa', '#EF4444', NEW.id),
    ('Ferramentas', 'despesa', '#F59E0B', NEW.id),
    ('Aluguel', 'despesa', '#EC4899', NEW.id),
    ('Energia', 'despesa', '#8B5CF6', NEW.id),
    ('Internet', 'despesa', '#6366F1', NEW.id),
    ('Marketing', 'despesa', '#10B981', NEW.id),
    ('Impostos', 'despesa', '#F43F5E', NEW.id),
    ('Outros', 'despesa', '#64748B', NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger for default categories
CREATE TRIGGER on_auth_user_created_financial_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_financial_categories();