/*
  # Criar tabela de instrumentos e adicionar instrumentos padrão

  1. Nova Tabela
    - `instrumentos`
      - `id` (uuid, chave primária)
      - `nome` (texto, não nulo)
      - `created_at` (timestamp com fuso horário)
      - `user_id` (uuid, referência para auth.users)

  2. Dados Iniciais
    - Adiciona instrumentos de corda comuns no Brasil

  3. Segurança
    - Habilita RLS
    - Adiciona políticas para CRUD
*/

-- Criar tabela de instrumentos se não existir
CREATE TABLE IF NOT EXISTS instrumentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Habilitar RLS
ALTER TABLE instrumentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver seus próprios instrumentos" ON instrumentos;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios instrumentos" ON instrumentos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios instrumentos" ON instrumentos;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios instrumentos" ON instrumentos;

-- Criar novas políticas
CREATE POLICY "Usuários podem ver seus próprios instrumentos"
  ON instrumentos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios instrumentos"
  ON instrumentos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios instrumentos"
  ON instrumentos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios instrumentos"
  ON instrumentos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Remover função e trigger existentes se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.criar_instrumentos_padrao();

-- Recriar função para inserir instrumentos padrão
CREATE OR REPLACE FUNCTION public.criar_instrumentos_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO instrumentos (nome, user_id) VALUES
    ('Violão', NEW.id),
    ('Viola Caipira', NEW.id),
    ('Guitarra', NEW.id),
    ('Baixo', NEW.id),
    ('Cavaquinho', NEW.id),
    ('Bandolim', NEW.id),
    ('Violino', NEW.id),
    ('Viola Clássica', NEW.id),
    ('Violoncelo', NEW.id),
    ('Contrabaixo Acústico', NEW.id),
    ('Ukulele', NEW.id),
    ('Harpa', NEW.id);
  RETURN NEW;
END;
$$;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_instrumentos_padrao();