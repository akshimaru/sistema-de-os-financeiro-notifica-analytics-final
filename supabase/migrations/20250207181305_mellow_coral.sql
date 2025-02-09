/*
  # Create Service Orders Table and Features

  1. New Tables
    - `ordens_servico`
      - `id` (uuid, primary key)
      - `numero` (serial, unique)
      - `cliente_id` (uuid, references clientes)
      - `instrumento_id` (uuid, references instrumentos)
      - `marca_id` (uuid, references marcas)
      - `modelo` (text)
      - `acessorios` (text)
      - `problema_id` (uuid, references problemas)
      - `problema_descricao` (text)
      - `servico_id` (uuid, references servicos)
      - `servico_descricao` (text)
      - `valor_servicos` (decimal)
      - `desconto` (decimal)
      - `valor_total` (decimal)
      - `forma_pagamento` (text)
      - `observacoes` (text)
      - `data_entrada` (timestamptz)
      - `data_previsao` (timestamptz)
      - `data_entrega` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Only authenticated users can access their own data
*/

-- Create service orders table
CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  instrumento_id uuid REFERENCES instrumentos(id) NOT NULL,
  marca_id uuid REFERENCES marcas(id) NOT NULL,
  modelo text,
  acessorios text,
  problema_id uuid REFERENCES problemas(id),
  problema_descricao text NOT NULL,
  servico_id uuid REFERENCES servicos(id),
  servico_descricao text NOT NULL,
  valor_servicos decimal(10,2) NOT NULL DEFAULT 0,
  desconto decimal(10,2) NOT NULL DEFAULT 0,
  valor_total decimal(10,2) NOT NULL DEFAULT 0,
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('credito', 'debito', 'pix')),
  observacoes text NOT NULL DEFAULT '
Horário de retirada entre 10h as 18h.
Obs: Os serviços executados na loja Vibratho instrumentos são de total responsabilidade do Samuel Silva.

ATENÇÃO!
Ao levar um equipamento para consertar, os consumidores devem ficar atentos ao prazo estabelecido para buscar o produto. Lei nº 2.560/2021.

SIGA NOSSO INSTAGRAM: https://www.instagram.com/luthieriabrasilia/',
  data_entrada timestamptz NOT NULL DEFAULT now(),
  data_previsao timestamptz NOT NULL,
  data_entrega timestamptz,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own service orders"
  ON ordens_servico
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service orders"
  ON ordens_servico
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service orders"
  ON ordens_servico
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service orders"
  ON ordens_servico
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to calculate total value
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS trigger AS $$
BEGIN
  NEW.valor_total = NEW.valor_servicos - NEW.desconto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for total value calculation
CREATE TRIGGER calculate_total_value_trigger
  BEFORE INSERT OR UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_value();