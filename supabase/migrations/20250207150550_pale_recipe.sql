/*
  # Schema inicial do sistema de ordens de serviço

  1. Tabelas
    - clientes
    - marcas
    - instrumentos
    - servicos
    - ordens_servico

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

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

-- Tabela de Marcas
CREATE TABLE IF NOT EXISTS marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias marcas"
  ON marcas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias marcas"
  ON marcas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tabela de Instrumentos
CREATE TABLE IF NOT EXISTS instrumentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  marca_id uuid REFERENCES marcas(id),
  modelo text NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE instrumentos ENABLE ROW LEVEL SECURITY;

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

-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor decimal(10,2) NOT NULL,
  descricao text,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios serviços"
  ON servicos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios serviços"
  ON servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id),
  instrumento_id uuid REFERENCES instrumentos(id),
  servico_id uuid REFERENCES servicos(id),
  problema text NOT NULL,
  status text NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  valor_total decimal(10,2) NOT NULL,
  data_abertura timestamptz DEFAULT now(),
  data_conclusao timestamptz,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias ordens"
  ON ordens_servico
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias ordens"
  ON ordens_servico
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias ordens"
  ON ordens_servico
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);