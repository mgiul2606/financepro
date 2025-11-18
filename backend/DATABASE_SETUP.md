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

### 3. Pulisci il Database (Se Necessario)

⚠️ **Se hai già eseguito migrazioni precedenti che hanno fallito**, devi prima pulire il database per rimuovere tipi ENUM e tabelle parziali.

**Opzione A: Script Python automatico (raccomandato)**
```bash
cd backend
python scripts/cleanup_database.py
```

Lo script ti chiederà conferma prima di eliminare i dati. Digita `SI` per confermare.

**Opzione B: Manualmente via psql**
```bash
psql "tua_connessione_string" -f backend/scripts/cleanup_database.sql
```

**Opzione C: Tramite GUI di Supabase (più semplice per Windows)**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Apri il progetto
3. Vai alla sezione **SQL Editor**
4. Copia il contenuto di `backend/scripts/cleanup_database.sql`
5. Esegui lo script (clicca "Run")

### 4. Esegui le Migrazioni

```bash
cd backend
python -m alembic upgrade head
```

Questo comando:
- Applicherà la migration iniziale `001_initial_schema.py`
- Creerà tutte le tabelle necessarie
- Configurerà gli indici e le foreign keys
- Gestirà automaticamente i tipi ENUM esistenti (non darà errore se già presenti)

### 5. Popola con Dati di Esempio (Opzionale)

Per testare l'applicazione, puoi popolare il database con dati di esempio realistici:

```bash
cd backend
python scripts/seed_database.py --clean
```

Questo crea:
- 2 utenti di esempio (`mario.rossi@example.com` / `password123`)
- 3 profili finanziari (personale e famiglia)
- 28 categorie italiane predefinite
- 10 tag
- 4 conti bancari
- 9+ transazioni realistiche
- 3 budget mensili
- 3 obiettivi finanziari
- 2 asset (auto e laptop)
- 2 transazioni ricorrenti (stipendio e affitto)

📝 **Vedi `backend/scripts/README.md` per dettagli completi sui dati creati**

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
# Opzione 1: Usa lo script di cleanup (raccomandato)
cd backend
python scripts/cleanup_database.py
python -m alembic upgrade head

# Opzione 2: Downgrade tutte le migrazioni
cd backend
python -m alembic downgrade base
python -m alembic upgrade head

# Opzione 3: Drop e ricreare il database (solo se hai i permessi amministrativi)
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

### Errore: "type already exists" (tipo profiletype/accounttype/etc già esistente)

**Causa**: I tipi ENUM esistono già nel database da una migrazione precedente fallita.

**Soluzione Rapida**: Usa lo script di cleanup automatico:

```bash
cd backend
python scripts/cleanup_database.py
```

Poi riesegui la migration:
```bash
python -m alembic upgrade head
```

**Soluzione Alternativa**: Esegui lo script SQL manualmente tramite la GUI di Supabase:
1. Copia il contenuto di `backend/scripts/cleanup_database.sql`
2. Vai su Supabase Dashboard → SQL Editor
3. Incolla ed esegui lo script
4. Riesegui `python -m alembic upgrade head`

**Nota**: La nuova migration `001_initial_schema.py` gestisce automaticamente i tipi ENUM esistenti, quindi questo errore dovrebbe verificarsi raramente.

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
