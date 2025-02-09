/*
  # Update ordens_servico schema for multiple problems and services

  1. Changes
    - Drop old columns if they exist
    - Add new array and JSONB columns
    - Create indexes for better performance
*/

-- Drop old columns if they exist
DO $$ 
BEGIN
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

-- Add new array and JSONB columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'problemas_ids'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN problemas_ids uuid[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'problemas_descricoes'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN problemas_descricoes jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'servicos_ids'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN servicos_ids uuid[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'servicos_descricoes'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN servicos_descricoes jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create or replace indexes
DROP INDEX IF EXISTS idx_ordens_servico_problemas_ids;
DROP INDEX IF EXISTS idx_ordens_servico_servicos_ids;
DROP INDEX IF EXISTS idx_ordens_servico_problemas_descricoes;
DROP INDEX IF EXISTS idx_ordens_servico_servicos_descricoes;

CREATE INDEX idx_ordens_servico_problemas_ids 
  ON ordens_servico USING GIN (problemas_ids);

CREATE INDEX idx_ordens_servico_servicos_ids 
  ON ordens_servico USING GIN (servicos_ids);

CREATE INDEX idx_ordens_servico_problemas_descricoes 
  ON ordens_servico USING GIN (problemas_descricoes);

CREATE INDEX idx_ordens_servico_servicos_descricoes 
  ON ordens_servico USING GIN (servicos_descricoes);