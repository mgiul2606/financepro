# Database Setup Guide

Questa guida spiega come configurare il database per FinancePro.

## Prerequisiti

- PostgreSQL installato e in esecuzione
- Python 3.10+ con ambiente virtuale attivato
- File `.env.development` configurato con le credenziali corrette del database

## Configurazione Database

### 1. Verifica le Credenziali

Assicurati che il file `.env.development` contenga la connessione corretta al database:

```env
DATABASE__URL=postgresql://user:password@host:port/database_name
```

**IMPORTANTE**: Se usi Supabase o un altro servizio cloud, assicurati che:
- Le credenziali siano corrette (username, password)
- L'IP del client sia autorizzato nel firewall
- La password non contenga caratteri speciali che richiedono URL encoding

### 2. Verifica la Connessione

Prima di eseguire le migrazioni, verifica che il database sia accessibile:

```bash
# Test connessione con psql
psql "postgresql://user:password@host:port/database_name"
```

### 3. Esegui le Migrazioni

```bash
cd backend
python -m alembic upgrade head
```

Questo comando:
- Applicherà la migration iniziale `001_initial_schema.py`
- Creerà tutte le tabelle necessarie
- Configurerà gli indici e le foreign keys

## Struttura Database

La migration iniziale crea le seguenti tabelle:

### Tabelle Principali

1. **users** - Utenti dell'applicazione
   - `id` (UUID) - Primary key
   - `email` - Email univoca
   - `hashed_password` - Password hashata
   - `main_profile_id` - Profilo finanziario principale (nullable)

2. **financial_profiles** - Profili finanziari
   - `id` (UUID) - Primary key
   - `user_id` (UUID) - Foreign key a users
   - `name` - Nome del profilo
   - `profile_type` - Tipo: personal, family, business
   - `default_currency` - Valuta predefinita (default: EUR)

3. **accounts** - Conti bancari/finanziari
   - `id` (UUID) - Primary key
   - `financial_profile_id` (UUID) - Foreign key a financial_profiles
   - `name` - Nome del conto
   - `account_type` - Tipo di conto
   - `initial_balance` - Saldo iniziale

4. **transactions** - Transazioni finanziarie
   - `id` (UUID) - Primary key
   - `account_id` (UUID) - Foreign key a accounts
   - `category_id` (UUID) - Foreign key a categories (nullable)
   - `amount` - Importo
   - `transaction_date` - Data transazione

5. **categories** - Categorie per transazioni
   - `id` (UUID) - Primary key
   - `financial_profile_id` (UUID) - Foreign key a financial_profiles
   - `name` - Nome categoria
   - `parent_category_id` - Categoria padre (per sottocategorie)

6. **budgets** - Budget
7. **financial_goals** - Obiettivi finanziari
8. **assets** - Beni/Asset
9. **tags** - Tag per transazioni
10. **recurring_transactions** - Transazioni ricorrenti
11. **import_jobs** - Job di importazione
12. **audit_logs** - Log di audit
13. **exchange_rates** - Tassi di cambio
14. **ml_classification_logs** - Log classificazione ML
15. **chat_conversations** e **chat_messages** - Chat con AI

### Tipi ENUM PostgreSQL

La migration crea anche i seguenti tipi ENUM:
- `profiletype`: personal, family, business
- `databasetype`: postgresql, mssql
- `accounttype`: checking, savings, credit_card, investment, cash, loan, other
- `transactiontype`: income, expense, transfer
- `transactionstatus`: pending, completed, cancelled
- `assettype`: real_estate, vehicle, investment, other
- `recurrencefrequency`: daily, weekly, biweekly, monthly, quarterly, yearly
- `importstatus`: pending, processing, completed, failed
- `importfileformat`: csv, excel, qif, ofx

## Reset Database

Se hai bisogno di resettare completamente il database:

```bash
# Opzione 1: Downgrade tutte le migrazioni
cd backend
python -m alembic downgrade base

# Opzione 2: Drop e ricreare il database (se hai i permessi)
# ATTENZIONE: Questo elimina TUTTI i dati!
dropdb financepro_dev
createdb financepro_dev
python -m alembic upgrade head
```

## Troubleshooting

### Errore: "password authentication failed"

**Causa**: Credenziali errate o IP non autorizzato.

**Soluzione**:
1. Verifica username e password nel file `.env.development`
2. Se usi Supabase/servizio cloud, verifica che il tuo IP sia autorizzato
3. Controlla che la password non contenga caratteri speciali non escaped

### Errore: "foreign key constraint cannot be implemented"

**Causa**: Questo errore si verificava con le vecchie migrazioni inconsistenti.

**Soluzione**: Questo problema è stato risolto con la nuova migration unificata `001_initial_schema.py`.

### Errore: "type already exists"

**Causa**: I tipi ENUM esistono già nel database da una migrazione precedente.

**Soluzione**:
```bash
# Connettiti al database e elimina i tipi esistenti
psql "your_connection_string"
DROP TYPE IF EXISTS profiletype CASCADE;
DROP TYPE IF EXISTS databasetype CASCADE;
DROP TYPE IF EXISTS accounttype CASCADE;
DROP TYPE IF EXISTS transactiontype CASCADE;
DROP TYPE IF EXISTS transactionstatus CASCADE;
DROP TYPE IF EXISTS assettype CASCADE;
DROP TYPE IF EXISTS recurrencefrequency CASCADE;
DROP TYPE IF EXISTS importstatus CASCADE;
DROP TYPE IF EXISTS importfileformat CASCADE;

# Poi riesegui la migration
python -m alembic upgrade head
```

## Note Importanti

1. **UUID come Primary Key**: Tutte le tabelle usano UUID per maggiore sicurezza (non prevedibili)
2. **Cascading Deletes**: Le foreign key sono configurate con CASCADE per mantenere l'integrità referenziale
3. **Timestamps**: Tutte le tabelle hanno `created_at` e `updated_at` con default automatici
4. **Precisione Numerica**: Gli importi usano `Numeric(15, 2)` per precisione finanziaria
5. **Soft Deletes**: Molte tabelle hanno `is_active` per implementare soft deletes

## Creazione Nuove Migrazioni

Se modifichi i modelli in futuro:

```bash
cd backend
python -m alembic revision --autogenerate -m "Descrizione modifica"
python -m alembic upgrade head
```

## Supporto

Per problemi o domande, consulta la documentazione di Alembic: https://alembic.sqlalchemy.org/
