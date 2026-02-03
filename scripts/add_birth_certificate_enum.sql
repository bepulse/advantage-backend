-- Script para adicionar o valor 'BIRTH_CERTIFICATE' ao enum 'DocumentKind'
-- Schema: advantage

-- Opção 1: Comando direto (PostgreSQL 12+)
ALTER TYPE "advantage"."DocumentKind" ADD VALUE IF NOT EXISTS 'BIRTH_CERTIFICATE';

-- Opção 2: Caso o comando acima não funcione (versões antigas), use o bloco abaixo:
/*
DO $$
BEGIN
    ALTER TYPE "advantage"."DocumentKind" ADD VALUE 'BIRTH_CERTIFICATE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
*/
