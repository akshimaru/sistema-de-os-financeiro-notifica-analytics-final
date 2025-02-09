/*
  # Add numero column to ordens_servico table

  1. Changes
    - Add numero column to ordens_servico table
    - Add sequence for automatic numero generation
    - Add trigger to automatically set numero on insert

  2. Notes
    - The numero will be automatically generated on insert
    - The sequence ensures unique numbers
*/

-- Create sequence for order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS ordens_servico_numero_seq;

-- Add numero column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' AND column_name = 'numero'
  ) THEN
    ALTER TABLE ordens_servico ADD COLUMN numero integer;
    
    -- Update existing rows with sequence numbers
    WITH numbered_rows AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
      FROM ordens_servico
    )
    UPDATE ordens_servico os
    SET numero = nr.row_num
    FROM numbered_rows nr
    WHERE os.id = nr.id;
    
    -- Make numero required and unique
    ALTER TABLE ordens_servico ALTER COLUMN numero SET NOT NULL;
    ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_numero_unique UNIQUE (numero);
  END IF;
END $$;

-- Create or replace function to set numero from sequence
CREATE OR REPLACE FUNCTION set_ordem_numero()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := nextval('ordens_servico_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_ordem_numero_trigger'
  ) THEN
    CREATE TRIGGER set_ordem_numero_trigger
      BEFORE INSERT ON ordens_servico
      FOR EACH ROW
      EXECUTE FUNCTION set_ordem_numero();
  END IF;
END $$;