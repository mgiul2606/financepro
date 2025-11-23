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

FinancePro supports multiple financial profiles for managing different aspects of your finances:

### Profile Features

- **Profile Types**: Personal, Family, Business
- **Separate Data**: Each profile has its own accounts, transactions, budgets, and goals
- **Multi-Profile Analytics**: Aggregate reporting across selected profiles
- **Default Currency**: Configurable default currency per profile

### Profile Management

- **Automatic Default Selection**: After login, the main (default) profile is automatically selected
- **Mandatory Profile Creation**: If no profiles exist, a modal prompts you to create one before accessing the app
- **Profile Selector**: Use the dropdown in the sidebar to select one or more profiles
- **CRUD Operations**: Create, update, and delete profiles from Settings > Profiles

### How Profiles Work

1. **At Login**: The app fetches all user profiles and selects the default (main) profile automatically
2. **Profile Selector**: Toggle profiles on/off to filter data across the app
3. **Main Profile**: Set any profile as the main profile (marked with a star)
4. **Multi-Select**: Select multiple profiles for aggregated views in Dashboard and Analytics
5. **Delete Default**: When deleting the default profile, another active profile becomes the new default

### ProfileContext API

The `useProfileContext()` hook provides:

```typescript
const {
  profiles,           // All user profiles
  activeProfiles,     // Currently selected profiles
  mainProfile,        // The default profile object
  activeProfileIds,   // IDs of selected profiles
  mainProfileId,      // ID of the default profile
  isLoading,          // Loading state
  hasProfiles,        // Whether user has any profiles
  requiresProfileCreation, // True if user needs to create a profile
  setMainProfile,     // Set a profile as default
  setActiveProfiles,  // Set selected profile IDs
  toggleProfileSelection, // Toggle a profile selection
  refreshProfiles,    // Refetch profile data
} = useProfileContext();
```

### Using Profiles in API Hooks

All data-fetching hooks automatically use `activeProfileIds` to filter data:

```typescript
// Example: useTransactions fetches from all active profiles
const { transactions, isLoading } = useTransactions(filters);

// Example: useBudgets aggregates budgets from selected profiles
const { budgets, total } = useBudgets();
```

## Internationalization

Supported languages: English (en), Italian (it)

Add new translations in `src/i18n/locales/`.

## License

MIT
