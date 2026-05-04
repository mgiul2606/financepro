# Spec: i18n Fixes + Frontend Redesign (2026-04-30)

## Problema
128 chiavi i18n usate nel codice assenti da en.json/it.json → mostrate come testo grezzo.
Pagine principali da ridisegnare per migliorare UX/estetica.

## Scope

### 1. Traduzioni — chiavi mancanti da aggiungere ad ENTRAMBI i file

**accounts**: totalAccounts, activeAccounts, acrossAllAccounts, averageBalance, perAccount,
createAccountDesc, editAccountDesc, accountType, accountTypeHint, institutionName,
institutionNamePlaceholder, institutionNameHint, negativeBalanceAllowed, notes, notesPlaceholder

**transactions**: typeHint, amountHint, accountHint, categoryHint, dateHint, currencyHint,
merchantHint, notesPlaceholder, createTransactionDesc, editTransactionDesc,
filters.amountRange, filters.description, filters.noCategories

**budgets**: exceeded, warning, onTrack

**common**: dismiss

**recurring**: noCategory, form.name, form.namePlaceholder, form.transactionType,
form.transactionTypeHint, form.amount, form.amountModel, form.amountModelHint,
form.minAmount, form.maxAmount, form.currency, form.frequency, form.interval,
form.intervalHint, form.startDate, form.endDate, form.endDateHint, form.account,
form.noAccountsWarning, form.accountHint, form.category, form.categoryHint,
form.description, form.descriptionPlaceholder, form.options, form.optionsDescription,
form.isActive, form.isActiveHint, form.autoCreate, form.autoCreateHint,
form.currentInfo, form.created, form.nextOccurrence, form.lastOccurrence

**profiles**: deleteDialog.title, deleteDialog.description, mandatory.title,
mandatory.description, mandatory.creating, mandatory.create

**assets** (Form + Page): assetName, assetNamePlaceholder, assetType, assetTypeHint,
currentInfo, currentValue, currentValueHint, isLiquid, isLiquidHint, lastUpdated,
notes, notesPlaceholder, purchaseDate, purchaseDateHint, purchasePrice, purchasePriceHint,
quantity, quantityHint, tickerSymbol, tickerSymbolHint, tickerSymbolPlaceholder,
valuationMethod, valuationMethodHint, liquid, change, created

**analytics**: averageAmount, expectedAmount, frequency (flat), keyInsights, markAsReviewed,
netSavings, nextExpectedDate, recommendation, savingsRate, transactionsDetected,
variance, viewTransaction

**imports (en.json solo)**: errors.fileTooLarge, errors.invalidFormat, errors.loadFailed, uploading

**it.json solo**: assets.yourAssets, assets.manageAssets, assets.noAssetsYet,
assets.addFirstAsset, assets.purchased, recurring.yourRecurring, recurring.manageRecurring,
recurring.status, recurring.active

### 2. Design System
- Sfondo: gray-50 con card white
- Accento: indigo-600 | Successo: emerald-600 | Pericolo: rose-600 | Warning: amber-500
- Stat cards: valore text-3xl font-bold, label uppercase tracking-wide text-gray-500
- Card: rounded-xl shadow-sm border border-gray-100

### 3. Pagine da ridisegnare
- Dashboard.tsx
- AccountsPage.tsx
- TransactionsPage.tsx
- BudgetsPage.tsx
