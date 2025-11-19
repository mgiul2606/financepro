-- =====================================================
-- PULIZIA TOTALE DATABASE - FinancePro
-- =====================================================
-- ATTENZIONE: Questo elimina TUTTO dal database!
-- Esegui questo nella GUI di Supabase (SQL Editor)
-- =====================================================

-- 1. Drop schema pubblico (elimina tutte le tabelle e tipi)
DROP SCHEMA IF EXISTS public CASCADE;

-- 2. Ricrea schema pubblico
CREATE SCHEMA public;

-- 3. Ripristina permessi
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 4. Commenta opzionale per conferma
COMMENT ON SCHEMA public IS 'Standard public schema - pulito e ricreato';

-- =====================================================
-- FATTO! Ora puoi eseguire: python -m alembic upgrade head
-- =====================================================
