# FinancePro Frontend

A modern, modular React frontend for FinancePro - a comprehensive personal finance management application.

## Features

- **Dashboard** - Overview of financial health with key metrics
- **Accounts** - Manage bank accounts and balances
- **Transactions** - Track income and expenses with filtering
- **Recurring Transactions** - Manage recurring payments and income
- **Budgets** - Set and track budgets with visual indicators
- **Goals** - Financial goal tracking with progress visualization
- **Assets** - Track property, vehicles, investments
- **Analytics** - Charts and analysis of spending patterns
- **AI Assistant** - AI-powered financial insights
- **Import Data** - Import transactions from CSV/Excel
- **Multi-Profile** - Separate personal, family, business finances

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS v4** for styling
- **React Query** (TanStack Query) for server state
- **React Hook Form + Zod** for form validation
- **Orval** for API client generation from OpenAPI
- **Recharts** for data visualization
- **i18next** for internationalization

## Prerequisites

- Node.js 18+
- npm 9+
- Backend API running on localhost:8000

## Installation

```bash
# Install dependencies
npm install

# Generate API client from backend OpenAPI spec
npm run generate:api
```

## Development

```bash
# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/
│   ├── generated/      # Auto-generated API client (orval)
│   └── client.ts       # Axios instance configuration
├── app/
│   └── layout/         # AppLayout, Sidebar
├── contexts/           # React contexts (Auth, Profile, Preferences)
├── core/
│   └── components/
│       ├── atomic/     # Button, Input, Card, Badge, etc.
│       └── composite/  # DataTable, PageHeader, Charts
├── features/           # Feature modules
│   ├── accounts/
│   ├── ai-assistant/
│   ├── analytic/
│   ├── assets/
│   ├── budgets/
│   ├── goals/
│   ├── imports/
│   ├── optimization/
│   ├── profiles/
│   ├── recurring/
│   └── transactions/
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
├── pages/              # Route-level pages
├── services/           # API configuration
└── utils/              # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run generate:api` - Generate API client from OpenAPI

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

## API Integration

The frontend uses Orval to auto-generate TypeScript API client from the backend OpenAPI specification:

```bash
# Regenerate API client after backend changes
npm run generate:api
```

All API calls go through React Query hooks for caching, background refetching, and error handling.

## Authentication

- JWT-based authentication
- Access tokens stored in localStorage
- Automatic 401 handling with redirect to login
- Protected routes requiring authentication

## Multi-Profile Support

FinancePro supports multiple financial profiles:
- Personal, Family, Business profile types
- Separate accounts, transactions, budgets per profile
- Cross-profile analytics and aggregated reporting

## Internationalization

Supported languages: English (en), Italian (it)

Add new translations in `src/i18n/locales/`.

## License

MIT
