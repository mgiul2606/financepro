# FinancePro Backend v2.1

## Overview

FinancePro is a comprehensive personal finance management platform with:
- Multi-profile support (personal, family, business)
- High-Security encryption (AES-256-GCM)
- ML-powered transaction classification
- Budget and goal tracking with alerts
- Recurring transaction automation
- CSV import with duplicate detection

## New v2.1 Features

### Services
- **BudgetService** - User-level budgets with scope support, spent calculation, alerts
- **GoalService** - Financial goals with contributions, milestones, achievement probability
- **ImportService** - CSV import with field mapping, fuzzy duplicate detection
- **ExchangeRateService** - Multi-currency support with rate fetching
- **RecurringTransactionService** - Automated recurring transaction processing

### Scheduled Jobs
Located in `app/jobs/scheduled_jobs.py`:
- `process_recurring_transactions()` - Process due recurring transactions
- `update_exchange_rates()` - Fetch and update exchange rates
- `update_budget_spent()` - Recalculate budget spent amounts
- `update_goal_probabilities()` - Update goal achievement probabilities
- `cleanup_old_notifications()` - Remove old notifications
- `run_all_daily_jobs()` - Run all maintenance jobs

### API Endpoints
New v2 API at `/api/v1/v2/`:
- `/v2/budgets` - Budget management with scope support
- `/v2/goals` - Goal management with contributions
- `/v2/imports` - CSV import functionality

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Redis (optional, for caching)

### Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env.development
# Edit .env.development with your database credentials
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Seed database (optional):
```bash
python scripts/seed_database.py
```

## Running the Application

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Running Scheduled Jobs

### Manual Execution
```bash
# Run all daily jobs
python -m app.jobs.scheduled_jobs all

# Run specific job
python -m app.jobs.scheduled_jobs recurring
python -m app.jobs.scheduled_jobs rates
python -m app.jobs.scheduled_jobs budgets
python -m app.jobs.scheduled_jobs goals
```

### With APScheduler
```python
from apscheduler.schedulers.background import BackgroundScheduler
from app.jobs import (
    process_recurring_transactions,
    update_exchange_rates,
    update_budget_spent
)

scheduler = BackgroundScheduler()
scheduler.add_job(process_recurring_transactions, 'cron', hour=6)
scheduler.add_job(update_exchange_rates, 'cron', hour=7)
scheduler.add_job(update_budget_spent, 'cron', hour=8)
scheduler.start()
```

### With Celery
```python
from celery import Celery
from app.jobs import process_recurring_transactions

app = Celery('financepro')

@app.task
def recurring_task():
    return process_recurring_transactions()
```

## Running Tests

```bash
# Run all tests
pytest

# Run v2 service tests
pytest app/tests/test_services_v2.py -v

# Run with coverage
pytest --cov=app --cov-report=html
```

## API Documentation

When running locally:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Project Structure

```
backend/
├── app/
│   ├── api/               # API routers
│   │   ├── v2/            # v2.1 routers
│   │   └── ...
│   ├── core/              # Core utilities
│   │   ├── encryption.py  # AES-256-GCM encryption
│   │   └── rls.py         # Row Level Security
│   ├── db/                # Database configuration
│   ├── jobs/              # Scheduled jobs
│   ├── ml/                # ML services
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   │   └── v2/            # v2.1 schemas
│   ├── services/          # Business logic
│   │   └── v2/            # v2.1 services
│   └── tests/             # Unit tests
├── migrations/            # Alembic migrations
├── requirements.txt
└── .env.development
```

## Key Features

### High-Security Profiles
Profiles with `security_level='high_security'` have:
- AES-256-GCM encryption for amounts, descriptions, notes
- PBKDF2 key derivation from user password + profile salt
- User password required for encrypted field access

### Scope Support
Budgets and goals support different scopes:
- `user` - Applies to all user's profiles
- `profile` - Applies to specific profile
- `multi_profile` - Applies to multiple profiles

### Duplicate Detection
Import service detects duplicates using:
- Date range matching (+/- 3 days)
- Exact amount matching
- Fuzzy description matching (80% threshold)

## Environment Variables

Key configuration variables:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/financepro
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ENVIRONMENT=development

# Feature flags
ENABLE_AI_CLASSIFICATION=true
ENABLE_VECTOR_SEARCH=false
ENABLE_ANALYTICS=true
```

## Encryption Architecture

1. **Key Derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations
2. **Encryption**: AES-256-GCM with 12-byte random IV
3. **Format**: Base64(IV + Ciphertext + Auth Tag)
4. **Per-Profile Salt**: 32-byte random salt stored with profile

## Contributing

1. Create feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit pull request

## License

Proprietary - All rights reserved
