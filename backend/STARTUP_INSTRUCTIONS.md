# FinancePro Backend v1.0.0 - Startup Instructions

## Overview

This is the consolidated FinancePro backend API v1 with all endpoints under `/api/v1/`.

## API Endpoints

All APIs are versioned under `/api/v1/`:

- **Authentication**: `/api/v1/auth/`
- **Financial Profiles**: `/api/v1/profiles/`
- **Accounts**: `/api/v1/accounts/`
- **Transactions**: `/api/v1/transactions/`
- **Categories**: `/api/v1/categories/`
- **Budgets**: `/api/v1/budgets/`
- **Financial Goals**: `/api/v1/goals/`
- **Imports**: `/api/v1/imports/`
- **Analysis**: `/api/v1/analysis/`
- **AI Services**: `/api/v1/ai/`

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/financepro"
export SECURITY_SECRET_KEY="your-secret-key"
```

4. Run migrations:
```bash
alembic upgrade head
```

## Starting the Application

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/api/v1/openapi.json

## Running Tests

```bash
# Run all tests
pytest app/tests/ -v

# Run with coverage
pytest app/tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest app/tests/test_api_v1.py -v

# Run specific test class
pytest app/tests/test_api_v1.py::TestBudgets -v
```

## Key Features

### Budget API
- User-level budgets with scope support (USER, PROFILE, MULTI_PROFILE)
- Automatic spending calculation
- Alert threshold monitoring
- Category allocations

### Goals API
- Financial goal tracking with milestones
- Contribution management
- Achievement probability calculation
- Gamification support

### Import API
- CSV file import
- Automatic field mapping
- Duplicate detection
- Batch processing

### Analysis API
- Expense analysis by category
- Income analysis
- Spending trends
- Budget vs actual comparison
- Multi-profile aggregations
- Cash flow analysis
- Period comparison

## Security Features

- JWT authentication
- Row-Level Security (RLS)
- AES-GCM encryption for High-Security profiles
- Password policy enforcement

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| SECURITY_SECRET_KEY | JWT signing key | Required |
| ENVIRONMENT | development/staging/production | development |
| DEBUG | Enable debug mode | True |
| LOG_LEVEL | Logging level | INFO |

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists and user has permissions

### Import Errors
- Run `pip install -r requirements.txt` again
- Check Python version (3.11+ required)

### Test Failures
- Ensure test database is configured
- Check fixture setup in conftest.py
