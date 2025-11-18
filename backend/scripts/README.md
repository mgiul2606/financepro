# Scripts - FinancePro Backend

Questa cartella contiene script utili per la gestione del database.

## Script Disponibili

### 1. `cleanup_database.py` / `cleanup_database.sql`

Pulisce completamente il database eliminando tutte le tabelle e tipi ENUM.

**Uso:**

```bash
# Script Python interattivo
python scripts/cleanup_database.py

# Script SQL (via psql)
psql "connection_string" -f scripts/cleanup_database.sql

# Script SQL (via GUI Supabase)
# Copia il contenuto di cleanup_database.sql e incollalo nel SQL Editor
```

**ATTENZIONE:** Questo script elimina **TUTTI** i dati dal database!

---

### 2. `seed_database.py`

Popola il database con dati di esempio realistici per testare l'applicazione.

**Uso:**

```bash
# Popola il database (aggiunge ai dati esistenti)
python scripts/seed_database.py

# Pulisce PRIMA di popolare (raccomandato)
python scripts/seed_database.py --clean
```

**Dati Creati:**

- ✅ **2 Utenti** di esempio con credenziali:
  - `mario.rossi@example.com` / `password123`
  - `giulia.bianchi@example.com` / `password123`

- ✅ **3 Profili finanziari**:
  - Profilo personale per Mario
  - Profilo famiglia per Mario
  - Profilo personale per Giulia

- ✅ **28 Categorie** predefinite italiane:
  - Alimentari, Ristoranti, Trasporti, Casa, Salute
  - Intrattenimento, Shopping, Istruzione, Viaggi, Tecnologia
  - Stipendio, Freelance, Investimenti, Altro

- ✅ **10 Tag** per organizzare le transazioni:
  - Urgente, Ricorrente, Deducibile, Lavoro, Personale

- ✅ **4 Conti bancari**:
  - Conto corrente Intesa Sanpaolo
  - Conto risparmio
  - Carta di credito American Express
  - Conto famiglia UniCredit

- ✅ **9+ Transazioni** realistiche:
  - Entrate (stipendio)
  - Spese (alimentari, ristoranti, trasporti, casa, shopping)
  - Date recenti per visualizzazione immediata

- ✅ **3 Budget mensili**:
  - Budget alimentari (€400)
  - Budget ristoranti (€200)
  - Budget trasporti (€250)

- ✅ **3 Obiettivi finanziari**:
  - Fondo emergenza (€10.000)
  - Vacanza estate 2025 (€3.000)
  - Nuovo laptop (€2.500)

- ✅ **2 Asset/Beni**:
  - Automobile Fiat 500
  - MacBook Pro 2022

- ✅ **2 Transazioni ricorrenti**:
  - Stipendio mensile
  - Affitto mensile

**Output di esempio:**

```
================================================================================
🌱 SEED DATABASE - FinancePro
================================================================================

📡 Connessione al database...

👤 Creazione utenti...
✅ Creati 2 utenti

💼 Creazione profili finanziari...
✅ Creati 3 profili finanziari

📁 Creazione categorie...
✅ Create 28 categorie

🏷️  Creazione tag...
✅ Creati 10 tag

🏦 Creazione conti...
✅ Creati 4 conti

💸 Creazione transazioni...
✅ Create 9 transazioni

📊 Creazione budget...
✅ Creati 3 budget

🎯 Creazione obiettivi finanziari...
✅ Creati 3 obiettivi finanziari

🏠 Creazione asset...
✅ Creati 2 asset

🔄 Creazione transazioni ricorrenti...
✅ Create 2 transazioni ricorrenti

================================================================================
✅ DATABASE POPOLATO CON SUCCESSO!
================================================================================

📊 Riepilogo:
   • Utenti: 2
   • Profili finanziari: 3
   • Categorie: 28
   • Tag: 10
   • Conti: 4
   • Transazioni: 9
   • Budget: 3
   • Obiettivi: 3
   • Asset: 2
   • Transazioni ricorrenti: 2

🔐 Credenziali di accesso:
   Email: mario.rossi@example.com
   Password: password123

   Email: giulia.bianchi@example.com
   Password: password123
```

---

## Workflow Tipico di Setup

Per configurare un database da zero per lo sviluppo:

```bash
# 1. Pulisci il database (opzionale se nuovo)
python scripts/cleanup_database.py

# 2. Esegui le migrazioni
cd backend
python -m alembic upgrade head

# 3. Popola con dati di esempio
python scripts/seed_database.py --clean

# 4. Avvia il backend
uvicorn app.main:app --reload
```

Ora puoi accedere all'applicazione con:
- Email: `mario.rossi@example.com`
- Password: `password123`

---

## Note

- Tutti gli script richiedono che il file `.env.development` sia configurato correttamente con le credenziali del database
- Gli importi monetari usano `Decimal` per precisione finanziaria
- Le password sono hashate con bcrypt per sicurezza
- I dati sono in italiano e realistici per il mercato italiano
- Le date sono relative al momento di esecuzione per avere transazioni recenti

---

## Troubleshooting

### Errore: "No module named 'app'"

**Causa**: Lo script non trova i moduli dell'applicazione.

**Soluzione**:
```bash
# Assicurati di eseguire lo script dalla cartella backend
cd backend
python scripts/seed_database.py
```

### Errore: "connection refused" o "password authentication failed"

**Causa**: Credenziali database errate.

**Soluzione**:
1. Verifica il file `.env.development`
2. Assicurati che il database sia accessibile
3. Controlla username e password

### Lo script si blocca o è lento

**Causa**: Il database potrebbe essere remoto o lento.

**Soluzione**:
- Normale per database cloud come Supabase
- Attendi il completamento (di solito < 1 minuto)
