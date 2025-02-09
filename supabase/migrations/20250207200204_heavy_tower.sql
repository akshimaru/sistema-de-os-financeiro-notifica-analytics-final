/*
  # Fix ordem servico status constraint

  1. Changes
    - Update status check constraint to use 'pendente' instead of 'aberto'
    - Ensure all existing records have valid status values

  2. Security
    - Maintains existing RLS policies
*/

-- First, temporarily disable the constraint
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

-- Update any existing 'aberto' status to 'pendente'
UPDATE ordens_servico SET status = 'pendente' WHERE status = 'aberto';

-- Add the constraint back with correct values
ALTER TABLE ordens_servico
  ADD CONSTRAINT ordens_servico_status_check 
  CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado'));