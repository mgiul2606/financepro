# Fix Auth Error - Multi-Profile Support

## 🐛 Problema Risolto

Le ultime modifiche per il supporto multi-profilo hanno introdotto un errore critico che impediva login e registrazione:

1. **Backend**: La colonna `users.main_profile_id` non aveva un ForeignKey constraint → SQLAlchemy crash
2. **Frontend**: `ProfileProvider` faceva chiamate API ai profili prima del login → 403 Forbidden

## ✅ Modifiche Apportate

### Backend

#### 1. Modello User (`backend/app/models/user.py`)
- ✅ Aggiunto ForeignKey constraint a `main_profile_id`
- ✅ Aggiunta relazione `main_profile` per accesso diretto al profilo principale
- ✅ Specificato `ondelete="SET NULL"` per gestire cancellazione profili

#### 2. Migration Alembic (`backend/alembic/versions/e9a3c5f7b2d1_*.py`)
- ✅ Aggiunto ForeignKey constraint nella migration esistente
- ✅ Aggiornato downgrade per rimuovere correttamente il constraint

#### 3. Router Auth (`backend/app/api/auth.py`)
- ✅ Durante registrazione viene creato automaticamente:
  - Un profilo finanziario di default ("Default Profile")
  - Viene impostato come `main_profile` dell'utente
  - Viene creata la `UserProfileSelection` con il profilo attivo

### Frontend

#### 1. App.tsx (`frontend/src/App.tsx`)
- ✅ Spostato `ProfileProvider` dentro `ProtectedRoute`
- ✅ Ora le chiamate API ai profili vengono fatte SOLO dopo il login

#### 2. ProfileContext (`frontend/src/contexts/ProfileContext.tsx`)
- ✅ Semplificata logica di inizializzazione profili
- ✅ Ora si basa sul `main_profile_id` già settato dal backend

## 🔧 Come Applicare il Fix

### 1. Resettare il Database

Il database esistente ha uno schema inconsistente. È necessario resettarlo:

```bash
cd backend
./scripts/reset_database.sh
```

Lo script farà automaticamente:
1. Drop del database `financepro_dev`
2. Creazione nuovo database
3. Applicazione di tutte le migration

### Alternativa Manuale

Se lo script non funziona, esegui manualmente:

```bash
# 1. Drop e ricrea database
psql -U financepro -h localhost -c "DROP DATABASE IF EXISTS financepro_dev;"
psql -U financepro -h localhost -c "CREATE DATABASE financepro_dev;"

# 2. Applica migration
cd backend
alembic upgrade head
```

### 2. Riavviare Backend e Frontend

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend (in un altro terminale)
cd frontend
npm run dev
```

## 🧪 Test

### Test Registrazione
1. Vai su `/register`
2. Registra un nuovo utente
3. Verifica che:
   - Registrazione avvenga con successo
   - Nessun errore 403 Forbidden
   - Dopo login, Dashboard si carica correttamente

### Test Login
1. Vai su `/login`
2. Login con le credenziali
3. Verifica che:
   - Login avvenga con successo
   - Nessun errore 403 Forbidden
   - ProfileProvider carichi i profili correttamente

### Test Profili
1. Dopo login, vai su `/settings/profiles`
2. Verifica che sia visibile "Default Profile"
3. Prova a creare un nuovo profilo
4. Verifica che il profilo venga creato correttamente

## 📋 Checklist File Modificati

- ✅ `backend/app/models/user.py`
- ✅ `backend/alembic/versions/e9a3c5f7b2d1_add_user_profile_selection_and_main_profile.py`
- ✅ `backend/app/api/auth.py`
- ✅ `frontend/src/App.tsx`
- ✅ `frontend/src/contexts/ProfileContext.tsx`
- ✅ `backend/scripts/reset_database.sh` (nuovo)

## 🔍 Dettagli Tecnici

### Foreign Key Constraint

```python
# Prima (ERRORE)
main_profile_id = Column(UUID(as_uuid=True), nullable=True, index=True)

# Dopo (FIX)
main_profile_id = Column(
    UUID(as_uuid=True),
    ForeignKey("financial_profiles.id", ondelete="SET NULL"),
    nullable=True,
    index=True
)
```

### Creazione Profilo Default

Durante la registrazione (`auth.py`):

```python
# Crea profilo default
default_profile = FinancialProfile(
    user_id=db_user.id,
    name="Default Profile",
    description="Your default financial profile",
    profile_type=ProfileType.PERSONAL,
    default_currency="EUR",
    is_active=True
)

# Setta come main profile
db_user.main_profile_id = default_profile.id

# Crea selezione profili
profile_selection = UserProfileSelection(
    user_id=db_user.id,
    active_profile_ids=[default_profile.id]
)
```

### Architettura Frontend

```
AuthProvider (sempre attivo)
  ├─ Login/Register (NO ProfileProvider)
  └─ ProtectedRoute
       └─ ProfileProvider (SOLO dopo autenticazione)
            └─ App Layout + Routes
```

## ⚠️ Note Importanti

1. **Database Reset Obbligatorio**: Lo schema DB precedente era inconsistente
2. **Dati Perduti**: Il reset cancella tutti i dati. Backup se necessario
3. **Migration Aggiornata**: La migration `e9a3c5f7b2d1` è stata modificata
4. **Breaking Change**: Richiede reset DB, non è possibile upgrade incrementale

## 🎯 Risultato Atteso

Dopo l'applicazione del fix:
- ✅ Login funziona senza errori
- ✅ Registrazione funziona e crea profilo default
- ✅ Nessun errore 403 durante il caricamento dell'app
- ✅ ProfileProvider carica i profili solo dopo autenticazione
- ✅ Main profile e active profiles vengono gestiti correttamente
