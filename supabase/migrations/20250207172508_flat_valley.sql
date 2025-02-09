/*
  # Corrigir estrutura da tabela de instrumentos

  1. Alterações
    - Remove a coluna modelo que estava causando erro
    - Mantém apenas os campos necessários: nome, created_at e user_id

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Remover coluna modelo se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'instrumentos' AND column_name = 'modelo'
  ) THEN
    ALTER TABLE instrumentos DROP COLUMN modelo;
  END IF;
END $$;