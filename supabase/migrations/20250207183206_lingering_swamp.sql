/*
  # Fix ordens_servico table schema

  1. Changes
    - Add missing columns
    - Add proper constraints
    - Add foreign key relationships
    - Add indexes for better performance
    - Add trigger for total value calculation

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS calculate_total_value_trigger ON ordens_servico;

-- Add missing columns and update existing ones
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS problema_id uuid REFERENCES problemas(id),
  ADD COLUMN IF NOT EXISTS observacoes text NOT NULL DEFAULT '
Horário de retirada entre 10h as 18h.
Obs: Os serviços executados na loja Vibratho instrumentos são de total responsabilidade do Samuel Silva.

ATENÇÃO!
Ao levar um equipamento para consertar, os consumidores devem ficar atentos ao prazo estabelecido para buscar o produto. Lei nº 2.560/2021.

SIGA NOSSO INSTAGRAM: https://www.instagram.com/luthieriabrasilia/';

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
CREATE INDEX IF NOT EXISTS idx_ordens_servico_problema_id ON ordens_servico(problema_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_previsao ON ordens_servico(data_previsao);