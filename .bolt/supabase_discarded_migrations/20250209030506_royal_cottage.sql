/*
  # Recreate orders table with improved structure

  1. Changes
    - Drop existing table and recreate with proper structure
    - Change problemas_descricoes and servicos_descricoes to text[] type
    - Add proper constraints and defaults
    - Add indexes for better performance
    - Add RLS policies

  2. Structure
    - Primary key with UUID
    - Auto-incrementing order number
    - Required fields with proper constraints
    - Array fields for problems and services
    - Proper foreign key relationships
    - Timestamps for tracking

  3. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Restrict access to user's own data
*/

-- Drop existing table
DROP TABLE IF EXISTS ordens_servico CASCADE;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS ordens_servico_numero_seq;

-- Create new table with improved structure
CREATE TABLE ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE NOT NULL DEFAULT nextval('ordens_servico_numero_seq'),
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  instrumento_id uuid NOT NULL REFERENCES instrumentos(id),
  marca_id uuid NOT NULL REFERENCES marcas(id),
  modelo text NOT NULL,
  acessorios text,
  problemas_ids uuid[] DEFAULT '{}',
  problemas_descricoes text[] DEFAULT '{}',
  servicos_ids uuid[] DEFAULT '{}',
  servicos_descricoes text[] DEFAULT '{}',
  valor_servicos decimal(10,2) NOT NULL DEFAULT 0,
  desconto decimal(10,2) NOT NULL DEFAULT 0,
  valor_total decimal(10,2) NOT NULL DEFAULT 0,
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('credito', 'debito', 'pix')),
  observacoes text NOT NULL DEFAULT '
Horário de retirada entre 10h as 18h.
Obs: Os serviços executados na loja Vibratho instrumentos são de total responsabilidade do Samuel Silva.

ATENÇÃO!
Ao levar um equipamento para consertar, os consumidores devem ficar atentos ao prazo estabelecido para buscar o produto. Lei nº 2.560/2021.

SIGA NOSSO INSTAGRAM: https://www.instagram.com/luthieriabrasilia/',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  data_entrada timestamptz NOT NULL DEFAULT now(),
  data_previsao timestamptz NOT NULL,
  data_entrega timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_ordens_servico_cliente_id ON ordens_servico(cliente_id);
CREATE INDEX idx_ordens_servico_instrumento_id ON ordens_servico(instrumento_id);
CREATE INDEX idx_ordens_servico_marca_id ON ordens_servico(marca_id);
CREATE INDEX idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX idx_ordens_servico_data_previsao ON ordens_servico(data_previsao);
CREATE INDEX idx_ordens_servico_user_id ON ordens_servico(user_id);
CREATE INDEX idx_ordens_servico_problemas_ids ON ordens_servico USING GIN (problemas_ids);
CREATE INDEX idx_ordens_servico_servicos_ids ON ordens_servico USING GIN (servicos_ids);

-- Create function to calculate total value and update timestamp
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS trigger AS $$
BEGIN
  NEW.valor_total = NEW.valor_servicos - COALESCE(NEW.desconto, 0);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for total value calculation
CREATE TRIGGER calculate_total_value_trigger
  BEFORE INSERT OR UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_value();

-- Enable RLS
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own service orders"
  ON ordens_servico
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service orders"
  ON ordens_servico
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service orders"
  ON ordens_servico
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service orders"
  ON ordens_servico
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);