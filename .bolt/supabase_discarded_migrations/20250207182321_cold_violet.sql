/*
  # Update Service Orders Schema

  1. Changes
    - Add missing columns to ordens_servico table
    - Add proper constraints and defaults
    - Add performance indexes
    - Add total value calculation trigger

  2. Security
    - Maintain existing RLS policies
*/

-- Add columns one at a time to avoid timeout
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'marca_id') THEN
    ALTER TABLE ordens_servico ADD COLUMN marca_id uuid REFERENCES marcas(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'modelo') THEN
    ALTER TABLE ordens_servico ADD COLUMN modelo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'acessorios') THEN
    ALTER TABLE ordens_servico ADD COLUMN acessorios text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'problema_descricao') THEN
    ALTER TABLE ordens_servico ADD COLUMN problema_descricao text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'servico_descricao') THEN
    ALTER TABLE ordens_servico ADD COLUMN servico_descricao text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'valor_servicos') THEN
    ALTER TABLE ordens_servico ADD COLUMN valor_servicos decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'desconto') THEN
    ALTER TABLE ordens_servico ADD COLUMN desconto decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'valor_total') THEN
    ALTER TABLE ordens_servico ADD COLUMN valor_total decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'forma_pagamento') THEN
    ALTER TABLE ordens_servico ADD COLUMN forma_pagamento text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'data_previsao') THEN
    ALTER TABLE ordens_servico ADD COLUMN data_previsao timestamptz;
  END IF;
END $$;

-- Add constraints
DO $$
BEGIN
  -- Add check constraint for forma_pagamento if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'ordens_servico_forma_pagamento_check'
  ) THEN
    ALTER TABLE ordens_servico 
      ADD CONSTRAINT ordens_servico_forma_pagamento_check 
      CHECK (forma_pagamento IN ('credito', 'debito', 'pix'));
  END IF;

  -- Set NOT NULL constraints
  ALTER TABLE ordens_servico 
    ALTER COLUMN marca_id SET NOT NULL,
    ALTER COLUMN modelo SET NOT NULL,
    ALTER COLUMN problema_descricao SET NOT NULL,
    ALTER COLUMN servico_descricao SET NOT NULL,
    ALTER COLUMN valor_servicos SET NOT NULL,
    ALTER COLUMN desconto SET NOT NULL,
    ALTER COLUMN valor_total SET NOT NULL,
    ALTER COLUMN forma_pagamento SET NOT NULL,
    ALTER COLUMN data_previsao SET NOT NULL;
END $$;

-- Create indexes one at a time
DO $$
BEGIN
  -- Create indexes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_cliente_id') THEN
    CREATE INDEX idx_ordens_servico_cliente_id ON ordens_servico(cliente_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_instrumento_id') THEN
    CREATE INDEX idx_ordens_servico_instrumento_id ON ordens_servico(instrumento_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_marca_id') THEN
    CREATE INDEX idx_ordens_servico_marca_id ON ordens_servico(marca_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_servico_id') THEN
    CREATE INDEX idx_ordens_servico_servico_id ON ordens_servico(servico_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_status') THEN
    CREATE INDEX idx_ordens_servico_status ON ordens_servico(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_user_id') THEN
    CREATE INDEX idx_ordens_servico_user_id ON ordens_servico(user_id);
  END IF;
END $$;

-- Create or replace the total value calculation function
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS trigger AS $$
BEGIN
  NEW.valor_total = NEW.valor_servicos - NEW.desconto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'calculate_total_value_trigger'
  ) THEN
    CREATE TRIGGER calculate_total_value_trigger
      BEFORE INSERT OR UPDATE ON ordens_servico
      FOR EACH ROW
      EXECUTE FUNCTION calculate_total_value();
  END IF;
END $$;