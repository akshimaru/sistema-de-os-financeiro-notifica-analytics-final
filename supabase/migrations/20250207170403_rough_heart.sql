/*
  # Atualização da tabela de clientes

  1. Alterações
    - Removido campo de email
    - Adicionado campo de CPF/CNPJ
    - Atualizado políticas de RLS

  2. Campos
    - id (uuid, chave primária)
    - nome (texto, não nulo)
    - cpf_cnpj (texto, único, não nulo)
    - telefone (texto, não nulo)
    - created_at (timestamp com fuso horário)
    - user_id (uuid, referência para auth.users)

  3. Segurança
    - RLS habilitado
    - Políticas para select, insert, update e delete
*/

-- Atualizar a estrutura da tabela existente
DO $$ 
BEGIN
  -- Remover coluna de email se existir
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'email'
  ) THEN
    ALTER TABLE clientes DROP COLUMN email;
  END IF;

  -- Adicionar coluna CPF/CNPJ se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'cpf_cnpj'
  ) THEN
    ALTER TABLE clientes ADD COLUMN cpf_cnpj text;
    ALTER TABLE clientes ADD CONSTRAINT clientes_cpf_cnpj_unique UNIQUE (cpf_cnpj);
    ALTER TABLE clientes ALTER COLUMN cpf_cnpj SET NOT NULL;
  END IF;

  -- Garantir que outras colunas necessárias existam
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE clientes ADD COLUMN telefone text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE clientes ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clientes ADD COLUMN user_id uuid REFERENCES auth.users(id);
    ALTER TABLE clientes ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Habilitar RLS (se ainda não estiver habilitado)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios clientes" ON clientes;

-- Criar novas políticas
CREATE POLICY "Usuários podem ver seus próprios clientes"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios clientes"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios clientes"
  ON clientes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);