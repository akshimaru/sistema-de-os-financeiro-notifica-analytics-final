/*
  # Update ordens_servico table structure

  1. Changes
    - Remove old columns for single problem/service
    - Add arrays for multiple problems/services
    - Add JSONB fields for descriptions
    - Update constraints and defaults
    - Add proper indexes

  2. Data Types
    - problemas_ids: uuid[] - Array of problem IDs
    - problemas_descricoes: jsonb - Problem descriptions keyed by ID
    - servicos_ids: uuid[] - Array of service IDs
    - servicos_descricoes: jsonb - Service descriptions keyed by ID

  3. Indexes
    - GIN indexes on array and JSONB columns for better performance
*/

-- First, remove old columns if they exist
DO $$ 
BEGIN
  -- Remove problema_id and problema_descricao if they exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'problema_id'
  ) THEN
    ALTER TABLE ordens_servico DROP COLUMN problema_id;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'problema_descricao'
  ) THEN
    ALTER TABLE ordens_servico DROP COLUMN problema_descricao;
  END IF;

  -- Remove servico_id and servico_descricao if they exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'servico_id'
  ) THEN
    ALTER TABLE ordens_servico DROP COLUMN servico_id;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'servico_descricao'
  ) THEN
    ALTER TABLE ordens_servico DROP COLUMN servico_descricao;
  END IF;
END $$;

-- Add new columns for multiple problems and services
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS problemas_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS problemas_descricoes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS servicos_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS servicos_descricoes jsonb DEFAULT '{}';

-- Add proper constraints
ALTER TABLE ordens_servico
  ALTER COLUMN cliente_id SET NOT NULL,
  ALTER COLUMN instrumento_id SET NOT NULL,
  ALTER COLUMN marca_id SET NOT NULL,
  ALTER COLUMN modelo SET NOT NULL,
  ALTER COLUMN valor_servicos SET NOT NULL,
  ALTER COLUMN desconto SET DEFAULT 0,
  ALTER COLUMN forma_pagamento SET NOT NULL,
  ALTER COLUMN data_previsao SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pendente',
  ALTER COLUMN user_id SET NOT NULL;

-- Add check constraint for status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servico_status_check'
  ) THEN
    ALTER TABLE ordens_servico
      ADD CONSTRAINT ordens_servico_status_check 
      CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado'));
  END IF;
END $$;

-- Add check constraint for forma_pagamento if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servico_forma_pagamento_check'
  ) THEN
    ALTER TABLE ordens_servico
      ADD CONSTRAINT ordens_servico_forma_pagamento_check 
      CHECK (forma_pagamento IN ('credito', 'debito', 'pix'));
  END IF;
END $$;

-- Create GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_ordens_servico_problemas_ids 
  ON ordens_servico USING GIN (problemas_ids);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_servicos_ids 
  ON ordens_servico USING GIN (servicos_ids);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_problemas_descricoes 
  ON ordens_servico USING GIN (problemas_descricoes);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_servicos_descricoes 
  ON ordens_servico USING GIN (servicos_descricoes);

-- Create btree indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_id 
  ON ordens_servico (cliente_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_status 
  ON ordens_servico (status);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_previsao 
  ON ordens_servico (data_previsao);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id 
  ON ordens_servico (user_id);

-- Update or create function to calculate total value
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS trigger AS $$
BEGIN
  NEW.valor_total = NEW.valor_servicos - COALESCE(NEW.desconto, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for total value calculation if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_total_value_trigger'
  ) THEN
    CREATE TRIGGER calculate_total_value_trigger
      BEFORE INSERT OR UPDATE ON ordens_servico
      FOR EACH ROW
      EXECUTE FUNCTION calculate_total_value();
  END IF;
END $$;