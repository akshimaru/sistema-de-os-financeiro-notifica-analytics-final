/*
  # Update ordens_servico table for multiple problems and services

  1. Changes
    - Add arrays for problems and services IDs
    - Add arrays for problems and services descriptions
    - Update constraints and indexes

  2. Data Migration
    - Preserve existing data by copying single values to arrays
*/

-- Add new array columns
ALTER TABLE ordens_servico
  ADD COLUMN problemas_ids uuid[] DEFAULT '{}',
  ADD COLUMN problemas_descricoes jsonb DEFAULT '{}',
  ADD COLUMN servicos_ids uuid[] DEFAULT '{}',
  ADD COLUMN servicos_descricoes jsonb DEFAULT '{}';

-- Migrate existing data
UPDATE ordens_servico
SET 
  problemas_ids = ARRAY[problema_id],
  problemas_descricoes = jsonb_build_object(problema_id::text, problema_descricao),
  servicos_ids = ARRAY[servico_id],
  servicos_descricoes = jsonb_build_object(servico_id::text, servico_descricao)
WHERE problema_id IS NOT NULL AND servico_id IS NOT NULL;

-- Drop old columns
ALTER TABLE ordens_servico
  DROP COLUMN problema_id,
  DROP COLUMN problema_descricao,
  DROP COLUMN servico_id,
  DROP COLUMN servico_descricao;

-- Add indexes for array columns
CREATE INDEX idx_ordens_servico_problemas_ids ON ordens_servico USING GIN (problemas_ids);
CREATE INDEX idx_ordens_servico_servicos_ids ON ordens_servico USING GIN (servicos_ids);