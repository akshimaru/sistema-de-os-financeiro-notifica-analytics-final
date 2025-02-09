/*
  # Add default data for new users

  1. Changes
    - Create function to insert default problems
    - Create function to insert default services
    - Create trigger to call both functions when a new user is created

  2. Default Data
    - Common problems for musical instruments
    - Standard services with prices
*/

-- Function to create default problems
CREATE OR REPLACE FUNCTION public.create_default_problems()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO problemas (nome, descricao, user_id) VALUES
    ('Trastes Gastos', 'Trastes apresentam desgaste visível afetando a afinação e playability', NEW.id),
    ('Ponte Desregulada', 'Ponte fora de alinhamento causando problemas de afinação e ação das cordas', NEW.id),
    ('Tarraxas Frouxas', 'Tarraxas não mantêm a afinação adequadamente, necessitando ajuste ou substituição', NEW.id),
    ('Captadores com Ruído', 'Captadores apresentando ruídos ou interferências anormais', NEW.id),
    ('Rachadura no Braço', 'Rachadura no braço do instrumento afetando a estabilidade', NEW.id),
    ('Pestana Danificada', 'Pestana com entalhes profundos ou quebrada', NEW.id),
    ('Problemas Elétricos', 'Falhas na parte elétrica como mau contato ou ruídos', NEW.id),
    ('Corpo Riscado', 'Arranhões e marcas na superfície do instrumento', NEW.id),
    ('Traste Alto', 'Traste desnivelado causando trastejamento', NEW.id),
    ('Ação Alta', 'Cordas muito distantes do braço dificultando a tocabilidade', NEW.id),
    ('Braço Empenado', 'Braço do instrumento com empeno visível afetando a regulagem', NEW.id),
    ('Cordas Oxidadas', 'Cordas apresentam oxidação e perda de brilho sonoro', NEW.id);
  RETURN NEW;
END;
$$;

-- Function to create default services
CREATE OR REPLACE FUNCTION public.create_default_services()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO servicos (nome, descricao, valor, user_id) VALUES
    ('Regulagem Básica', 'Ajuste de altura das cordas, oitavas e tensor', 150.00, NEW.id),
    ('Troca de Cordas', 'Substituição completa das cordas com limpeza', 50.00, NEW.id),
    ('Limpeza Geral', 'Limpeza completa do instrumento e componentes', 80.00, NEW.id),
    ('Troca de Trastes', 'Substituição completa dos trastes', 450.00, NEW.id),
    ('Blindagem', 'Blindagem completa da parte elétrica', 200.00, NEW.id),
    ('Reparo de Traste Solto', 'Fixação de traste solto', 50.00, NEW.id),
    ('Instalação de Captador', 'Instalação e regulagem de captador', 120.00, NEW.id),
    ('Troca de Tarraxas', 'Substituição das tarraxas', 180.00, NEW.id),
    ('Reparo de Rachadura', 'Reparo de rachadura no corpo ou braço', 300.00, NEW.id),
    ('Setup Completo', 'Regulagem completa com troca de cordas', 250.00, NEW.id),
    ('Restauração', 'Restauração completa do instrumento', 800.00, NEW.id),
    ('Customização', 'Personalização conforme especificações', 500.00, NEW.id);
  RETURN NEW;
END;
$$;

-- Create triggers for default data
DO $$ 
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS on_auth_user_created_problems ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_created_services ON auth.users;
  
  -- Create new triggers
  CREATE TRIGGER on_auth_user_created_problems
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_problems();
    
  CREATE TRIGGER on_auth_user_created_services
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_services();
END $$;