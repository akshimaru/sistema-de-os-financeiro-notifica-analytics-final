/*
  # Fix problema fields in ordens_servico table

  1. Changes
    - Remove not-null constraint from problema column
    - Add proper foreign key relationship with problemas table
    - Ensure problema_descricao is required
*/

-- Remove not-null constraint from problema column if it exists
ALTER TABLE ordens_servico 
  ALTER COLUMN problema DROP NOT NULL;

-- Make sure problema_descricao is required
ALTER TABLE ordens_servico 
  ALTER COLUMN problema_descricao SET NOT NULL;

-- Add foreign key relationship if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'ordens_servico' 
    AND column_name = 'problema_id'
  ) THEN
    ALTER TABLE ordens_servico
      ADD COLUMN IF NOT EXISTS problema_id uuid REFERENCES problemas(id);
  END IF;
END $$;