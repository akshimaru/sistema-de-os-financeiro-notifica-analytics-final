/*
  # Update ordens_servico table structure

  1. Changes
    - Add columns for multiple problems and services
    - Add columns for problem and service descriptions
    - Add indexes for new columns

  2. New Columns
    - problemas_ids (uuid[])
    - problemas_descricoes (jsonb)
    - servicos_ids (uuid[])
    - servicos_descricoes (jsonb)

  3. Indexes
    - GIN indexes for array and JSONB columns
*/

-- Add new columns for multiple problems and services
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS problemas_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS problemas_descricoes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS servicos_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS servicos_descricoes jsonb DEFAULT '{}';

-- Create GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_ordens_servico_problemas_ids 
  ON ordens_servico USING GIN (problemas_ids);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_servicos_ids 
  ON ordens_servico USING GIN (servicos_ids);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_problemas_descricoes 
  ON ordens_servico USING GIN (problemas_descricoes);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_servicos_descricoes 
  ON ordens_servico USING GIN (servicos_descricoes);