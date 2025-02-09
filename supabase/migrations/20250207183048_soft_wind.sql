/*
  # Fix ordens_servico table schema

  1. Changes
    - Add missing columns
    - Add proper constraints
    - Add indexes for better performance
    - Add trigger for total value calculation

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS calculate_total_value_trigger ON ordens_servico;

-- Add missing columns and constraints
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  ADD COLUMN IF NOT EXISTS data_entrada timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data_entrega timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create function to calculate total value
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS trigger AS $$
BEGIN
  NEW.valor_total = NEW.valor_servicos - NEW.desconto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for total value calculation
CREATE TRIGGER calculate_total_value_trigger
  BEFORE INSERT OR UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_value();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_id ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_instrumento_id ON ordens_servico(instrumento_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_marca_id ON ordens_servico(marca_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_servico_id ON ordens_servico(servico_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id ON ordens_servico(user_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_entrada ON ordens_servico(data_entrada);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_previsao ON ordens_servico(data_previsao);