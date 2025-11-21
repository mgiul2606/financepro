# FinancePro v2.1 - SQL Query Examples & Best Practices

Questa guida fornisce esempi pratici di query SQL per le operazioni più comuni in FinancePro v2.1, con particolare attenzione a RLS, performance e sicurezza.

---

## 🔐 Row Level Security (RLS) Setup

### Configurazione Context per RLS

```sql
-- ❌ SBAGLIATO: Query diretta senza context
SELECT * FROM transactions WHERE financial_profile_id = 'uuid';

-- ✅ CORRETTO: Impostare context prima della query
SET app.current_user_id = 'user-uuid-here';
SELECT * FROM transactions;  -- RLS filtra automaticamente
```

### In Python/FastAPI

```python
import asyncpg
from fastapi import Depends

async def get_db_with_rls(user_id: str):
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute(f"SET app.current_user_id = '{user_id}'")
    try:
        yield conn
    finally:
        await conn.close()

@app.get("/transactions")
async def get_transactions(
    db: asyncpg.Connection = Depends(get_db_with_rls)
):
    # Tutte le query avranno RLS applicato automaticamente
    result = await db.fetch("SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT 10")
    return result
```

---

## 💰 Transaction Queries

### Inserimento Transazione Standard (Clear)

```sql
-- Transazione per profilo STANDARD
INSERT INTO transactions (
    id, financial_profile_id, account_id, category_id,
    transaction_date, transaction_type, source,
    amount, amount_clear, currency, amount_in_profile_currency,
    description, description_clear, merchant_name,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'profile-uuid',
    'account-uuid',
    'category-uuid',
    '2025-11-20',
    'purchase',
    'manual',
    '49.99',  -- Plain text per profilo standard
    49.99,
    'EUR',
    49.99,
    'Grocery shopping at Conad',
    'Grocery shopping at Conad',
    'Conad',
    NOW(),
    NOW()
);
```

### Inserimento Transazione High-Security (Encrypted)

```python
# Lato applicativo - Esempio Python
from crypto import HSProfileEncryptor

encryptor = HSProfileEncryptor()
key = encryptor.derive_key(user_password, profile_salt)

amount_encrypted = encryptor.encrypt("49.99", key)
description_encrypted = encryptor.encrypt("Grocery shopping at Conad", key)

await db.execute("""
    INSERT INTO transactions (
        id, financial_profile_id, account_id, category_id,
        transaction_date, transaction_type, source,
        amount, amount_clear, currency, amount_in_profile_currency,
        description, description_clear, merchant_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
""", 
    uuid.uuid4(), profile_id, account_id, category_id,
    date.today(), 'purchase', 'manual',
    amount_encrypted, 49.99, 'EUR', 49.99,
    description_encrypted, 'Grocery shopping...', 'Conad'
)
```

### Query Transazioni con Filtri Comuni

```sql
-- Transazioni del mese corrente per categoria
SELECT 
    t.id,
    t.transaction_date,
    t.amount_clear AS amount,  -- Usa sempre _clear per aggregazioni
    t.description_clear AS description,
    t.merchant_name,
    c.name AS category_name,
    a.name AS account_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
WHERE t.financial_profile_id = 'profile-uuid'
  AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.transaction_date DESC;
```

### Aggregazione Spese per Categoria

```sql
-- Top 10 categorie per spesa (mese corrente)
SELECT 
    c.name AS category,
    COUNT(t.id) AS transaction_count,
    SUM(t.amount_clear) AS total_spent,
    AVG(t.amount_clear) AS avg_transaction
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.financial_profile_id = 'profile-uuid'
  AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.amount_clear < 0  -- Solo spese (negative)
GROUP BY c.id, c.name
ORDER BY total_spent ASC  -- ASC perché negativi
LIMIT 10;
```

### Ricerca Full-Text su Transazioni

```sql
-- Ricerca transazioni per testo (con ts_vector)
SELECT 
    t.id,
    t.transaction_date,
    t.amount_clear,
    t.description_clear,
    t.merchant_name,
    ts_rank(
        to_tsvector('italian', COALESCE(t.description_clear, '') || ' ' || COALESCE(t.merchant_name, '')),
        to_tsquery('italian', 'supermercato | alimentari')
    ) AS rank
FROM transactions t
WHERE t.financial_profile_id = 'profile-uuid'
  AND to_tsvector('italian', COALESCE(t.description_clear, '') || ' ' || COALESCE(t.merchant_name, ''))
      @@ to_tsquery('italian', 'supermercato | alimentari')
ORDER BY rank DESC, t.transaction_date DESC
LIMIT 20;
```

---

## 👤 User & Profile Management

### Creazione Utente con Profilo Default

```sql
BEGIN;

-- 1. Crea utente
INSERT INTO users (
    id, email, hashed_password, full_name, 
    preferred_language, timezone, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'mario.rossi@example.com',
    '$argon2id$...',  -- Password hashata
    'Mario Rossi',
    'it',
    'Europe/Rome',
    NOW(),
    NOW()
) RETURNING id AS user_id;

-- 2. Crea profilo finanziario default
INSERT INTO financial_profiles (
    id, user_id, name, profile_type, security_level,
    default_currency, is_default, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    /* user_id from above */,
    'Personale',
    'personal',
    'standard',
    'EUR',
    true,
    NOW(),
    NOW()
) RETURNING id AS profile_id;

-- 3. Crea categorie di default
INSERT INTO categories (id, financial_profile_id, name, level, full_path, is_default, is_income)
VALUES 
    (gen_random_uuid(), /* profile_id */, 'Alimentari', 1, 'Alimentari', true, false),
    (gen_random_uuid(), /* profile_id */, 'Trasporti', 1, 'Trasporti', true, false),
    (gen_random_uuid(), /* profile_id */, 'Stipendio', 1, 'Stipendio', true, true),
    -- ... altre categorie default
;

-- 4. Crea preferenze utente
INSERT INTO user_preferences (
    id, user_id, theme, ai_proactivity_level,
    ml_training_consent, data_sharing_consent,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    /* user_id */,
    'light',
    'moderate',
    false,
    false,
    NOW(),
    NOW()
);

COMMIT;
```

### Creazione Profilo High-Security

```sql
-- Genera random salt
WITH salt AS (
    SELECT encode(gen_random_bytes(32), 'base64') AS encryption_salt
)
INSERT INTO financial_profiles (
    id, user_id, name, profile_type, security_level,
    encryption_salt, default_currency, is_default,
    color_code, icon, created_at, updated_at
) SELECT
    gen_random_uuid(),
    'user-uuid',
    'Conto Svizzero',
    'business',
    'high_security',
    encryption_salt,
    'CHF',
    false,
    '#FF5722',
    'lock',
    NOW(),
    NOW()
FROM salt
RETURNING *;
```

### Query Multi-Profile per Utente

```sql
-- Panoramica di tutti i profili dell'utente con saldi
SELECT 
    fp.id,
    fp.name,
    fp.profile_type,
    fp.security_level,
    fp.default_currency,
    COUNT(DISTINCT a.id) AS account_count,
    SUM(a.current_balance) AS total_balance
FROM financial_profiles fp
LEFT JOIN accounts a ON a.financial_profile_id = fp.id AND a.is_active = true
WHERE fp.user_id = 'user-uuid'
  AND fp.is_active = true
GROUP BY fp.id, fp.name, fp.profile_type, fp.security_level, fp.default_currency
ORDER BY fp.is_default DESC, fp.name;
```

---

## 📊 Budget Tracking

### Creazione Budget Mensile con Categorie

```sql
BEGIN;

-- 1. Crea budget
INSERT INTO budgets (
    id, financial_profile_id, name, period_type,
    start_date, end_date, total_amount, currency,
    rollover_enabled, alert_threshold_percent,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'profile-uuid',
    'Budget Novembre 2025',
    'monthly',
    '2025-11-01',
    '2025-11-30',
    3000.00,
    'EUR',
    false,
    80,
    NOW(),
    NOW()
) RETURNING id AS budget_id;

-- 2. Alloca importi alle categorie
INSERT INTO budget_categories (id, budget_id, category_id, allocated_amount)
VALUES
    (gen_random_uuid(), /* budget_id */, 'category-alimentari-uuid', 500.00),
    (gen_random_uuid(), /* budget_id */, 'category-trasporti-uuid', 200.00),
    (gen_random_uuid(), /* budget_id */, 'category-casa-uuid', 1200.00),
    -- ... altre categorie
;

COMMIT;
```

### Monitoraggio Budget: Spent vs Allocated

```sql
-- Dashboard budget con spent corrente
WITH budget_spending AS (
    SELECT 
        bc.budget_id,
        bc.category_id,
        bc.allocated_amount,
        COALESCE(SUM(ABS(t.amount_clear)), 0) AS spent_amount
    FROM budget_categories bc
    LEFT JOIN transactions t ON t.category_id = bc.category_id
        AND t.transaction_date >= (SELECT start_date FROM budgets WHERE id = bc.budget_id)
        AND t.transaction_date <= (SELECT end_date FROM budgets WHERE id = bc.budget_id)
        AND t.amount_clear < 0  -- Solo spese
    GROUP BY bc.budget_id, bc.category_id, bc.allocated_amount
)
SELECT 
    b.name AS budget_name,
    c.name AS category_name,
    bs.allocated_amount,
    bs.spent_amount,
    bs.allocated_amount - bs.spent_amount AS remaining,
    ROUND((bs.spent_amount / NULLIF(bs.allocated_amount, 0)) * 100, 2) AS percent_used,
    CASE 
        WHEN bs.spent_amount >= bs.allocated_amount THEN '🔴 Exceeded'
        WHEN bs.spent_amount >= bs.allocated_amount * 0.8 THEN '🟡 Warning'
        ELSE '🟢 On Track'
    END AS status
FROM budget_spending bs
JOIN budgets b ON b.id = bs.budget_id
JOIN categories c ON c.id = bs.category_id
WHERE b.financial_profile_id = 'profile-uuid'
  AND b.is_active = true
ORDER BY bs.spent_amount / NULLIF(bs.allocated_amount, 0) DESC;
```

---

## 🎯 Goal Planning

### Creazione Goal con Milestone

```sql
INSERT INTO financial_goals (
    id, financial_profile_id, name, goal_type, description,
    target_amount, current_amount, currency,
    start_date, target_date, monthly_contribution,
    auto_allocate, priority, status,
    milestones, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'profile-uuid',
    'Anticipo Casa',
    'house',
    'Risparmiare per anticipo mutuo prima casa',
    50000.00,
    5000.00,
    'EUR',
    '2025-01-01',
    '2027-12-31',
    1250.00,  -- 50k - 5k = 45k / 36 months
    true,
    10,  -- Priorità massima
    'active',
    jsonb_build_object(
        'milestones', jsonb_build_array(
            jsonb_build_object('amount', 15000, 'label', '30% raggiunto', 'achieved', false),
            jsonb_build_object('amount', 25000, 'label', 'Metà strada', 'achieved', false),
            jsonb_build_object('amount', 40000, 'label', '80% raggiunto', 'achieved', false)
        )
    ),
    NOW(),
    NOW()
);
```

### Tracking Goal Progress con Contributi

```sql
-- Dashboard goal con progress
SELECT 
    fg.id,
    fg.name,
    fg.goal_type,
    fg.target_amount,
    fg.current_amount,
    fg.currency,
    fg.target_date,
    fg.monthly_contribution,
    fg.achievement_probability,
    -- Calcoli derivati
    fg.target_amount - fg.current_amount AS remaining,
    ROUND((fg.current_amount / NULLIF(fg.target_amount, 0)) * 100, 2) AS percent_complete,
    (fg.target_date - CURRENT_DATE) AS days_remaining,
    -- Ultimo contributo
    (SELECT contribution_date FROM goal_contributions 
     WHERE goal_id = fg.id ORDER BY contribution_date DESC LIMIT 1) AS last_contribution_date,
    -- Totale contributi (ultimi 6 mesi)
    (SELECT COALESCE(SUM(amount), 0) FROM goal_contributions 
     WHERE goal_id = fg.id AND contribution_date >= CURRENT_DATE - INTERVAL '6 months') AS contributions_6m
FROM financial_goals fg
WHERE fg.financial_profile_id = 'profile-uuid'
  AND fg.status = 'active'
ORDER BY fg.priority DESC, fg.target_date ASC;
```

### Aggiungere Contributo a Goal

```sql
BEGIN;

-- 1. Inserisci contributo
INSERT INTO goal_contributions (
    id, goal_id, transaction_id, amount, contribution_date, notes
) VALUES (
    gen_random_uuid(),
    'goal-uuid',
    'transaction-uuid',  -- Opzionale: link a transazione specifica
    500.00,
    CURRENT_DATE,
    'Contributo mensile automatico'
);

-- 2. Aggiorna current_amount del goal
UPDATE financial_goals
SET current_amount = current_amount + 500.00,
    gamification_points = gamification_points + 50,  -- +50 punti per contributo
    updated_at = NOW()
WHERE id = 'goal-uuid';

-- 3. Controlla raggiungimento milestone
UPDATE financial_goals
SET milestones = jsonb_set(
    milestones,
    '{milestones,0,achieved}',
    'true'::jsonb
)
WHERE id = 'goal-uuid'
  AND current_amount >= (milestones->'milestones'->0->>'amount')::numeric
  AND NOT (milestones->'milestones'->0->>'achieved')::boolean;

COMMIT;
```

---

## 🏦 Asset Management

### Inserimento Asset con Valutazione Iniziale

```sql
BEGIN;

-- 1. Crea asset
INSERT INTO assets (
    id, financial_profile_id, name, asset_type,
    purchase_date, purchase_price, purchase_transaction_id,
    current_value, valuation_method, last_valuation_date,
    currency, is_liquid, quantity, ticker_symbol,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'profile-uuid',
    'Appartamento Milano Centro',
    'real_estate',
    '2023-05-15',
    350000.00,
    'transaction-uuid',
    350000.00,  -- Valore iniziale = purchase price
    'range',
    '2023-05-15',
    'EUR',
    false,
    1,
    NULL,
    NOW(),
    NOW()
) RETURNING id AS asset_id;

-- 2. Prima valutazione
INSERT INTO asset_valuations (
    id, asset_id, valuation_date, value, value_min, value_max,
    valuation_method, source, notes
) VALUES (
    gen_random_uuid(),
    /* asset_id */,
    '2023-05-15',
    350000.00,
    330000.00,
    370000.00,
    'appraisal',
    'Perizia Notarile',
    'Valutazione iniziale acquisto'
);

COMMIT;
```

### Aggiornamento Valutazione Asset

```sql
BEGIN;

-- 1. Nuova valutazione
INSERT INTO asset_valuations (
    id, asset_id, valuation_date, value, value_min, value_max,
    valuation_method, source, notes
) VALUES (
    gen_random_uuid(),
    'asset-uuid',
    CURRENT_DATE,
    380000.00,
    370000.00,
    390000.00,
    'range',
    'Valutazione Immobiliare.it',
    'Rivalutazione annuale 2025'
);

-- 2. Aggiorna current_value su asset
UPDATE assets
SET current_value = 380000.00,
    current_value_min = 370000.00,
    current_value_max = 390000.00,
    last_valuation_date = CURRENT_DATE,
    updated_at = NOW()
WHERE id = 'asset-uuid';

COMMIT;
```

### Net Worth Calculation

```sql
-- Utilizzo della vista net_worth_summary
SELECT 
    profile_name,
    total_accounts_balance,
    total_assets_value,
    total_liabilities,
    net_worth,
    -- Breakdown liquido vs immobilizzato
    (SELECT COALESCE(SUM(current_balance), 0) 
     FROM accounts 
     WHERE financial_profile_id = nw.financial_profile_id 
       AND account_type IN ('checking', 'savings', 'cash')) AS liquid_assets,
    total_assets_value AS illiquid_assets
FROM net_worth_summary nw
WHERE user_id = 'user-uuid';
```

---

## 🤖 ML Classification

### Log Classificazione Automatica

```sql
INSERT INTO ml_classification_logs (
    id, transaction_id, financial_profile_id,
    original_description, suggested_category_id, suggested_merchant_id,
    suggested_tags, confidence_score, model_name, model_version,
    features_used, explanation, processing_time_ms
) VALUES (
    gen_random_uuid(),
    'transaction-uuid',
    'profile-uuid',
    'AMZN*Mktplace Amazon.it',
    'category-shopping-uuid',
    'merchant-amazon-uuid',
    ARRAY['online', 'shopping'],
    0.9542,
    'gradient_boosting_v3',
    '3.2.1',
    jsonb_build_object(
        'merchant_match_score', 0.98,
        'historical_category_frequency', 0.85,
        'amount_typical', true,
        'day_of_week', 'Monday'
    ),
    'Classificato come Shopping Online perché: (1) Merchant "Amazon" ha 98% match con database, (2) Storico mostra 85% delle transazioni Amazon in categoria Shopping',
    87
);
```

### Performance ML Models

```sql
-- Accuracy del modello per utente/profilo
WITH predictions AS (
    SELECT 
        financial_profile_id,
        model_name,
        model_version,
        COUNT(*) AS total_predictions,
        COUNT(*) FILTER (WHERE was_accepted = true) AS correct_predictions,
        COUNT(*) FILTER (WHERE was_accepted = false) AS incorrect_predictions,
        AVG(confidence_score) AS avg_confidence,
        AVG(processing_time_ms) AS avg_latency
    FROM ml_classification_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND was_accepted IS NOT NULL  -- Solo predizioni con feedback
    GROUP BY financial_profile_id, model_name, model_version
)
SELECT 
    fp.name AS profile_name,
    p.model_name,
    p.model_version,
    p.total_predictions,
    p.correct_predictions,
    ROUND((p.correct_predictions::numeric / NULLIF(p.total_predictions, 0)) * 100, 2) AS accuracy_percent,
    ROUND(p.avg_confidence, 4) AS avg_confidence,
    ROUND(p.avg_latency, 0) AS avg_latency_ms
FROM predictions p
JOIN financial_profiles fp ON fp.id = p.financial_profile_id
ORDER BY p.total_predictions DESC;
```

---

## 📈 Predictions & Forecasting

### Inserimento Predizione

```sql
INSERT INTO predictions (
    id, financial_profile_id, prediction_type, category_id,
    prediction_date, predicted_amount, 
    confidence_interval_min, confidence_interval_max, confidence_level,
    model_name, model_version, features_used
) VALUES (
    gen_random_uuid(),
    'profile-uuid',
    'expense',
    'category-alimentari-uuid',
    '2025-12-01',  -- Dicembre
    -520.00,
    -580.00,
    -460.00,
    0.95,
    'prophet_seasonal_v2',
    '2.1.3',
    jsonb_build_object(
        'historical_mean', -510.00,
        'seasonal_factor', 1.02,  -- +2% per festività
        'trend', 'stable',
        'external_events', jsonb_build_array('Christmas')
    )
);
```

### Confronto Predicted vs Actual

```sql
-- Accuracy predizioni passate
SELECT 
    p.prediction_type,
    c.name AS category_name,
    p.prediction_date,
    p.predicted_amount,
    p.actual_amount,
    p.actual_amount - p.predicted_amount AS error,
    ABS(p.actual_amount - p.predicted_amount) / NULLIF(ABS(p.predicted_amount), 0) * 100 AS mape_percent,
    CASE 
        WHEN p.actual_amount BETWEEN p.confidence_interval_min AND p.confidence_interval_max 
        THEN 'Within CI'
        ELSE 'Outside CI'
    END AS ci_status
FROM predictions p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.financial_profile_id = 'profile-uuid'
  AND p.actual_amount IS NOT NULL  -- Solo predizioni con actual
  AND p.prediction_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY ABS(p.error) DESC;
```

---

## 🔔 Notifications

### Creazione Notifica

```sql
INSERT INTO notifications (
    id, user_id, financial_profile_id, notification_type,
    title, message, status, priority, action_url,
    related_entity_type, related_entity_id,
    sent_via_email, sent_via_push, expires_at
) VALUES (
    gen_random_uuid(),
    'user-uuid',
    'profile-uuid',
    'budget_alert',
    'Budget Superato: Alimentari',
    'Hai superato il budget per Alimentari di €50 (10%). Attuale: €550 / Budget: €500',
    'unread',
    8,
    '/budgets/budget-uuid',
    'budget',
    'budget-uuid',
    true,
    true,
    NOW() + INTERVAL '7 days'
);
```

### Query Notifiche Non Lette

```sql
-- Dashboard notifiche
SELECT 
    n.id,
    n.notification_type,
    n.title,
    n.message,
    n.priority,
    n.created_at,
    -- Profilo associato
    fp.name AS profile_name,
    -- Icona per tipo
    CASE n.notification_type
        WHEN 'budget_alert' THEN '⚠️'
        WHEN 'goal_milestone' THEN '🎯'
        WHEN 'recurring_reminder' THEN '🔔'
        WHEN 'anomaly_detected' THEN '🚨'
        WHEN 'optimization_suggestion' THEN '💡'
        WHEN 'security_alert' THEN '🔐'
        ELSE 'ℹ️'
    END AS icon
FROM notifications n
LEFT JOIN financial_profiles fp ON fp.id = n.financial_profile_id
WHERE n.user_id = 'user-uuid'
  AND n.status = 'unread'
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.priority DESC, n.created_at DESC
LIMIT 20;
```

---

## 📅 Calendar Integration

### Query Eventi Futuri con Impatto Finanziario

```sql
-- Prossimi eventi con costi stimati
SELECT 
    ce.id,
    ce.event_name,
    ce.event_type,
    ce.event_date,
    ce.end_date,
    ce.estimated_cost,
    c.name AS category_name,
    -- Giorni rimanenti
    ce.event_date - CURRENT_DATE AS days_until,
    -- Categorizzazione urgenza
    CASE 
        WHEN ce.event_date - CURRENT_DATE <= 7 THEN '🔴 Urgent'
        WHEN ce.event_date - CURRENT_DATE <= 30 THEN '🟡 Soon'
        ELSE '🟢 Future'
    END AS urgency
FROM calendar_events ce
LEFT JOIN categories c ON c.id = ce.category_id
WHERE ce.financial_profile_id = 'profile-uuid'
  AND ce.event_date >= CURRENT_DATE
  AND ce.event_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY ce.event_date ASC;
```

---

## 🔍 Advanced Queries

### Top Merchants (con normalizzazione)

```sql
-- Top 10 esercenti per spesa
SELECT 
    m.canonical_name,
    m.logo_url,
    c.name AS default_category,
    COUNT(t.id) AS transaction_count,
    SUM(ABS(t.amount_clear)) AS total_spent,
    AVG(ABS(t.amount_clear)) AS avg_transaction,
    MAX(t.transaction_date) AS last_transaction
FROM transactions t
JOIN merchants m ON m.id = t.merchant_id
LEFT JOIN categories c ON c.id = m.category_id
WHERE t.financial_profile_id = 'profile-uuid'
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 year'
  AND t.amount_clear < 0  -- Solo spese
GROUP BY m.id, m.canonical_name, m.logo_url, c.name
ORDER BY total_spent ASC  -- ASC perché negativo
LIMIT 10;
```

### Spending Trends (YoY Comparison)

```sql
-- Confronto spese mese corrente vs stesso mese anno scorso
WITH this_year AS (
    SELECT 
        c.name AS category,
        SUM(ABS(t.amount_clear)) AS amount
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.financial_profile_id = 'profile-uuid'
      AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      AND t.amount_clear < 0
    GROUP BY c.name
),
last_year AS (
    SELECT 
        c.name AS category,
        SUM(ABS(t.amount_clear)) AS amount
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.financial_profile_id = 'profile-uuid'
      AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
      AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '1 month'
      AND t.amount_clear < 0
    GROUP BY c.name
)
SELECT 
    COALESCE(ty.category, ly.category) AS category,
    COALESCE(ty.amount, 0) AS this_year_amount,
    COALESCE(ly.amount, 0) AS last_year_amount,
    COALESCE(ty.amount, 0) - COALESCE(ly.amount, 0) AS difference,
    CASE 
        WHEN ly.amount IS NULL OR ly.amount = 0 THEN NULL
        ELSE ROUND(((ty.amount - ly.amount) / ly.amount) * 100, 2)
    END AS percent_change
FROM this_year ty
FULL OUTER JOIN last_year ly ON ty.category = ly.category
ORDER BY ABS(COALESCE(ty.amount, 0) - COALESCE(ly.amount, 0)) DESC;
```

### Cash Flow Analysis

```sql
-- Cash flow mensile (ultimi 12 mesi)
SELECT 
    DATE_TRUNC('month', t.transaction_date) AS month,
    SUM(CASE WHEN t.amount_clear > 0 THEN t.amount_clear ELSE 0 END) AS income,
    SUM(CASE WHEN t.amount_clear < 0 THEN ABS(t.amount_clear) ELSE 0 END) AS expenses,
    SUM(t.amount_clear) AS net_cash_flow,
    -- Running total
    SUM(SUM(t.amount_clear)) OVER (ORDER BY DATE_TRUNC('month', t.transaction_date)) AS cumulative_cash_flow
FROM transactions t
WHERE t.financial_profile_id = 'profile-uuid'
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  AND t.transaction_type NOT IN ('internal_transfer')
GROUP BY DATE_TRUNC('month', t.transaction_date)
ORDER BY month DESC;
```

### Anomaly Detection (Simple)

```sql
-- Transazioni con importo anomalo (> 2 std dev dalla media categoria)
WITH category_stats AS (
    SELECT 
        category_id,
        AVG(ABS(amount_clear)) AS avg_amount,
        STDDEV(ABS(amount_clear)) AS stddev_amount
    FROM transactions
    WHERE financial_profile_id = 'profile-uuid'
      AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      AND amount_clear < 0
    GROUP BY category_id
)
SELECT 
    t.id,
    t.transaction_date,
    t.description_clear,
    t.merchant_name,
    ABS(t.amount_clear) AS amount,
    c.name AS category,
    cs.avg_amount,
    ROUND((ABS(t.amount_clear) - cs.avg_amount) / NULLIF(cs.stddev_amount, 0), 2) AS z_score
FROM transactions t
JOIN categories c ON c.id = t.category_id
JOIN category_stats cs ON cs.category_id = t.category_id
WHERE t.financial_profile_id = 'profile-uuid'
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 month'
  AND t.amount_clear < 0
  AND ABS(t.amount_clear) > cs.avg_amount + (2 * cs.stddev_amount)  -- > 2σ
ORDER BY z_score DESC;
```

---

## ⚡ Performance Tips

### 1. Use Indexes Wisely

```sql
-- Analizza query lente
EXPLAIN ANALYZE
SELECT * FROM transactions 
WHERE financial_profile_id = 'uuid' 
  AND transaction_date >= '2025-01-01';

-- Se Seq Scan invece di Index Scan, crea indice
CREATE INDEX CONCURRENTLY idx_transactions_custom 
ON transactions(financial_profile_id, transaction_date DESC);
```

### 2. Partitioning per Date Ranges

```sql
-- Query su partizione specifica (più veloce)
SELECT * FROM transactions_2025 
WHERE transaction_date BETWEEN '2025-01-01' AND '2025-01-31';

-- vs query generale (scansiona tutte le partizioni)
SELECT * FROM transactions 
WHERE transaction_date BETWEEN '2025-01-01' AND '2025-01-31';
```

### 3. Use CTEs for Complex Queries

```sql
-- ✅ Leggibile e performante
WITH monthly_totals AS (
    SELECT DATE_TRUNC('month', transaction_date) AS month,
           SUM(amount_clear) AS total
    FROM transactions
    WHERE financial_profile_id = 'uuid'
    GROUP BY DATE_TRUNC('month', transaction_date)
)
SELECT * FROM monthly_totals WHERE total < 0 ORDER BY month DESC;

-- ❌ Subquery nidificate (meno leggibile)
SELECT * FROM (
    SELECT DATE_TRUNC('month', transaction_date) AS month, ...
) WHERE ...
```

### 4. Batch Operations

```python
# ❌ LENTO: 1000 INSERT singoli
for transaction in transactions:
    await db.execute("INSERT INTO transactions (...) VALUES (...)", transaction)

# ✅ VELOCE: Batch insert
await db.executemany(
    "INSERT INTO transactions (...) VALUES ($1, $2, ...)",
    [(t.id, t.amount, ...) for t in transactions]
)
```

---

## 🔒 Security Best Practices

### 1. Always Use Parameterized Queries

```python
# ❌ SQL INJECTION VULNERABLE
query = f"SELECT * FROM users WHERE email = '{user_input}'"

# ✅ SAFE
query = "SELECT * FROM users WHERE email = $1"
result = await db.fetch(query, user_input)
```

### 2. RLS Context Validation

```python
# Valida che RLS sia attivo
async def validate_rls(conn):
    result = await conn.fetchval(
        "SELECT current_setting('app.current_user_id', true)"
    )
    if not result:
        raise SecurityError("RLS context not set!")
```

### 3. Audit Critical Operations

```python
# Log ogni operazione critica
async def audit_log(conn, user_id, action, entity_type, entity_id):
    await conn.execute("""
        INSERT INTO audit_logs (
            id, user_id, event_type, action, entity_type, entity_id,
            ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    """, 
        uuid.uuid4(), user_id, 'financial_op', action, 
        entity_type, entity_id, request.client.host, request.headers.get('user-agent')
    )
```

---

## 📚 Useful Functions

### Calculate Days Until Goal

```sql
CREATE OR REPLACE FUNCTION days_until_goal_target(goal_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT target_date - CURRENT_DATE
        FROM financial_goals
        WHERE id = goal_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT name, days_until_goal_target(id) AS days_remaining
FROM financial_goals
WHERE status = 'active';
```

### Get User's Total Net Worth

```sql
CREATE OR REPLACE FUNCTION user_total_net_worth(user_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT SUM(net_worth)
        FROM net_worth_summary
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT user_total_net_worth('user-uuid');
```

---

**Happy Querying! 🚀**
