# 🔧 Database Migration Fix

## Problema

L'errore `relation "financial_profiles" does not exist` indica che il database PostgreSQL non ha le tabelle necessarie. Le tabelle mancano perché:

1. ✅ Il codice backend è corretto (già fixato)
2. ✅ I modelli sono definiti correttamente
3. ❌ **Il database non ha le tabelle create** ← Problema attuale!

## Soluzione Rapida

### Passo 1: Avvia PostgreSQL

Prima di tutto, assicurati che PostgreSQL sia in esecuzione:

**Su Linux/WSL:**
```bash
# Verifica se PostgreSQL è in esecuzione
sudo systemctl status postgresql

# Se non è attivo, avvialo:
sudo systemctl start postgresql

# Oppure con pg_ctl:
pg_ctl start -D /var/lib/postgresql/data
```

**Su macOS:**
```bash
# Con Homebrew:
brew services start postgresql

# Oppure direttamente:
pg_ctl -D /usr/local/var/postgres start
```

**Su Windows:**
```powershell
# Apri Services.msc e avvia il servizio "PostgreSQL"
# Oppure usa pg_ctl dalla command line
```

**Con Docker:**
```bash
docker run --name financepro-postgres \
  -e POSTGRES_USER=financepro \
  -e POSTGRES_PASSWORD=financepro \
  -e POSTGRES_DB=financepro_dev \
  -p 5432:5432 \
  -d postgres:15
```

### Passo 2: Verifica Connessione Database

```bash
# Test connessione (dalla directory backend/)
psql postgresql://financepro:financepro@localhost:5432/financepro_dev -c "SELECT version();"
```

Se questo comando funziona, PostgreSQL è pronto! ✅

### Passo 3: Esegui la Migrazione

Ho creato uno script Python che applica automaticamente tutte le tabelle mancanti.

```bash
cd backend
python3 run_migration.py
```

**Output atteso:**
```
🔗 Connecting to database: localhost:5432/financepro_dev
✅ Connected successfully!
📋 Creating missing tables...
  - Creating ENUM types...
  - Creating financial_profiles table...
  - Creating categories table...
  - Creating tags table...
  - Creating accounts table...
  - Creating transactions table...
  - Creating budgets table...
  - Creating financial_goals table...
  - Creating assets table...
  - Creating recurring_transactions table...
  - Creating import_jobs table...
  - Creating audit_logs table...
  - Creating exchange_rates table...
  - Creating ml_classification_logs table...
  - Creating chat_conversations table...
  - Creating chat_messages table...
  - Creating transaction_tags table...
  - Updating alembic_version...

✅ Migration completed successfully!
🎉 All tables created. You can now create accounts!
```

### Passo 4: Riavvia il Backend

```bash
cd backend
uvicorn app.main:app --reload

# Oppure, se usi un altro metodo:
python -m app.main
```

### Passo 5: Testa la Creazione Account

1. Apri il frontend: `http://localhost:5173`
2. Fai login con un utente esistente
3. Vai su **Accounts** → Click **"New Account"**
4. Compila:
   - **Account Name**: "Test Account"
   - **Currency**: EUR
   - **Initial Balance**: 1000
5. Click **"Create Account"**
6. ✅ **Dovrebbe funzionare!**

---

## Metodo Alternativo: Migrazione Manuale con psql

Se lo script Python non funziona, puoi applicare manualmente la migrazione SQL:

```bash
cd backend
psql postgresql://financepro:financepro@localhost:5432/financepro_dev < alembic/versions/d8f2a1c9e3b4_add_financial_profiles_and_all_missing_tables.sql
```

*(Nota: Dovrai convertire il file Python in SQL puro se preferisci questo metodo)*

---

## Verifica Tabelle Create

Dopo la migrazione, verifica che le tabelle esistano:

```bash
psql postgresql://financepro:financepro@localhost:5432/financepro_dev -c "\dt"
```

**Output atteso:**
```
                        List of relations
 Schema |           Name            | Type  |    Owner
--------+---------------------------+-------+-------------
 public | accounts                  | table | financepro
 public | alembic_version          | table | financepro
 public | assets                   | table | financepro
 public | audit_logs               | table | financepro
 public | budgets                  | table | financepro
 public | categories               | table | financepro
 public | chat_conversations       | table | financepro
 public | chat_messages            | table | financepro
 public | exchange_rates           | table | financepro
 public | financial_goals          | table | financepro
 public | financial_profiles       | table | financepro  ← IMPORTANTE!
 public | import_jobs              | table | financepro
 public | ml_classification_logs   | table | financepro
 public | recurring_transactions   | table | financepro
 public | tags                     | table | financepro
 public | transaction_tags         | table | financepro
 public | transactions             | table | financepro
 public | users                    | table | financepro
```

---

## Troubleshooting

### ❌ "connection refused"
**Problema**: PostgreSQL non è in esecuzione.
**Soluzione**: Vedi **Passo 1** per avviare PostgreSQL.

### ❌ "password authentication failed"
**Problema**: Credenziali errate nel `.env.development`.
**Soluzione**: Verifica che:
```bash
DATABASE__URL=postgresql://financepro:financepro@localhost:5432/financepro_dev
```
Corrisponda alle credenziali del tuo database PostgreSQL.

### ❌ "database financepro_dev does not exist"
**Problema**: Il database non è stato creato.
**Soluzione**:
```bash
# Crea il database
psql -U financepro -c "CREATE DATABASE financepro_dev;"

# Oppure con l'utente postgres:
sudo -u postgres psql -c "CREATE DATABASE financepro_dev OWNER financepro;"
```

### ❌ "role financepro does not exist"
**Problema**: L'utente PostgreSQL non esiste.
**Soluzione**:
```bash
# Crea l'utente
sudo -u postgres psql -c "CREATE USER financepro WITH PASSWORD 'financepro';"
sudo -u postgres psql -c "ALTER USER financepro CREATEDB;"
```

---

## Cosa Fa lo Script di Migrazione

Lo script `run_migration.py`:

1. ✅ Connette al database PostgreSQL
2. ✅ Verifica se `financial_profiles` già esiste (evita duplicati)
3. ✅ Crea tutti i tipi ENUM necessari (profiletype, categorytype, transactiontype, etc.)
4. ✅ Crea tutte le tabelle in ordine corretto (rispettando le foreign keys):
   - `financial_profiles` (richiesta da accounts)
   - `categories` (richiesta da transactions, budgets)
   - `tags` (per transaction_tags)
   - `accounts` (richiesta da transactions)
   - `transactions`
   - `budgets`
   - `financial_goals`
   - `assets`
   - `recurring_transactions`
   - `import_jobs`
   - `audit_logs`
   - `exchange_rates`
   - `ml_classification_logs`
   - `chat_conversations` e `chat_messages`
   - `transaction_tags` (many-to-many)
5. ✅ Aggiorna `alembic_version` per tracciare la migrazione
6. ✅ Commit delle modifiche

---

## Architettura Database

```
User (users)
  └─→ FinancialProfile (financial_profiles) ← MANCAVA QUESTA TABELLA!
        ├─→ Account (accounts)
        │     └─→ Transaction (transactions)
        │           ├─→ Category (categories)
        │           └─→ Tag (tags) [many-to-many via transaction_tags]
        ├─→ Budget (budgets)
        ├─→ FinancialGoal (financial_goals)
        ├─→ Asset (assets)
        ├─→ ImportJob (import_jobs)
        ├─→ AuditLog (audit_logs)
        └─→ ChatConversation (chat_conversations)
              └─→ ChatMessage (chat_messages)
```

**Relazione Chiave**: Ogni `Account` **DEVE** avere un `financial_profile_id` (FK NOT NULL).

Quando un utente crea il primo account:
1. Il backend verifica se esiste un `FinancialProfile` per l'utente
2. Se NO → Crea automaticamente un profilo "Personal Finance"
3. Associa l'account a quel `financial_profile_id`

---

## Files Modificati/Creati

### ✅ Già Fixati (Commit Precedenti)
- `backend/app/api/accounts.py` - Usa `financial_profile_id` invece di `user_id`
- `frontend/src/api/client.ts` - Gestisce URL string da orval

### ✅ Nuovi Files
- `backend/alembic/env.py` - Import di tutti i modelli per Alembic
- `backend/alembic/versions/d8f2a1c9e3b4_add_financial_profiles_and_all_missing_tables.py` - Migrazione
- `backend/run_migration.py` - Script Python per applicare la migrazione
- `DATABASE_MIGRATION_FIX.md` - Questa documentazione

---

## Prossimi Passi Dopo la Migrazione

Una volta che il database è pronto:

1. ✅ Testa creazione/modifica/cancellazione account
2. ✅ Verifica che le transazioni funzionino
3. ⏳ Completa implementazione i18n nelle pagine rimanenti
4. ⏳ Wire Analytics filter modal
5. ⏳ Wire Budget details modal
6. ⏳ Update Settings page con preferenze (lingua, locale, etc.)

---

**Domande? Problemi?** Fammi sapere l'output dello script e posso aiutarti a risolvere! 🚀
