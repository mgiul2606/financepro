-- Script per pulire il database e rimuovere tutti i tipi ENUM e tabelle esistenti
-- ATTENZIONE: Questo script eliminerà TUTTI i dati!

-- Drop tutte le tabelle se esistono (in ordine inverso per rispettare le foreign key)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS ml_classification_logs CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS import_jobs CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transaction_tags CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profile_selection CASCADE;
DROP TABLE IF EXISTS financial_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop tutti i tipi ENUM se esistono
DROP TYPE IF EXISTS importfileformat CASCADE;
DROP TYPE IF EXISTS importstatus CASCADE;
DROP TYPE IF EXISTS recurrencefrequency CASCADE;
DROP TYPE IF EXISTS assettype CASCADE;
DROP TYPE IF EXISTS transactionstatus CASCADE;
DROP TYPE IF EXISTS transactiontype CASCADE;
DROP TYPE IF EXISTS accounttype CASCADE;
DROP TYPE IF EXISTS databasetype CASCADE;
DROP TYPE IF EXISTS profiletype CASCADE;

-- Drop la tabella alembic_version per resettare completamente le migrazioni
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Messaggio di conferma (verrà mostrato nei log)
SELECT 'Database pulito con successo! Ora puoi eseguire: python -m alembic upgrade head' AS status;
