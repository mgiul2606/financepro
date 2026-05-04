# Design System Refactoring — Standardize on shadcn/ui

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the parallel core/atomic component system and standardize the entire frontend on shadcn/ui, extended with finance-specific variants and a centralized color token layer.

**Architecture:** CSS variables in `index.css` define both the shadcn design tokens and new finance semantic tokens (income, expense, warning). Shadcn components in `src/components/ui/` are extended with missing variants via CVA. Pages migrate from `@/core/components/atomic/` to `@/components/ui/`, then the atomic directory is deleted.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v4, shadcn/ui, class-variance-authority (CVA), `cn()` from `src/lib/utils.ts`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/index.css` | Modify | Remove redundant HSL layer; add finance semantic tokens + utilities |
| `src/lib/finance-colors.ts` | Create | Centralized color-to-variant mapping functions |
| `src/components/ui/badge.tsx` | Modify | Add `success`, `warning`, `info` variants via CVA |
| `src/components/ui/button.tsx` | Modify | Add `leftIcon`, `rightIcon`, `isLoading`, `fullWidth` props |
| `src/components/ui/card.tsx` | Modify | Add `variant` prop (`elevated`, `bordered`) + export `CardBody` alias |
| `src/components/ui/spinner.tsx` | Create | New spinner component (replaces `core/atomic/Spinner`) |
| `src/core/components/formatters/index.ts` | Create | Re-export CurrencyText, DateText, PercentageText, NumberText |
| `src/core/components/atomic/CurrencyText.tsx` | Move → `formatters/` | |
| `src/core/components/atomic/DateText.tsx` | Move → `formatters/` | |
| `src/core/components/atomic/NumberText.tsx` | Move → `formatters/` | |
| `src/core/components/atomic/PercentageText.tsx` | Move → `formatters/` | |
| `src/features/budgets/pages/BudgetsPage.tsx` | Modify | Migrate to shadcn imports |
| `src/features/budgets/components/BudgetDetailsModal.tsx` | Modify | Migrate to shadcn imports |
| `src/features/goals/pages/GoalsPage.tsx` | Modify | Migrate to shadcn imports |
| `src/pages/Dashboard.tsx` | Modify | Migrate to shadcn imports |
| `src/features/analytic/` pages | Modify | Migrate to shadcn imports |
| `src/features/optimization/` pages | Modify | Migrate to shadcn imports |
| `src/app/layout/Sidebar.tsx` | Modify | Migrate to shadcn imports |
| `src/core/components/atomic/` | Delete | Removed after all pages migrated |

---

## Phase 1 — Infrastructure

---

### Task 1: Clean up index.css and add finance semantic tokens

**Files:**
- Modify: `src/index.css`

The file currently has two `:root` blocks: one in `@layer base` with HSL values (lines ~7–62), and one outside any layer with OKLch values that overrides the first. Remove the redundant HSL block and add finance semantic tokens to the OKLch block.

- [ ] **Step 1: Remove the @layer base HSL block**

Open `src/index.css`. Remove the entire first `@layer base` block — the one that contains `--background: 0 0% 100%` (HSL format). It starts at the line `@layer base {` (first occurrence) and ends before `@layer base {` (second occurrence, which has `* { border-color... }`). Keep everything else.

After removal, the top of the file should look like:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
```

- [ ] **Step 2: Add finance semantic tokens to the OKLch :root block**

Find the OKLch `:root` block (the one with `--radius: 0.625rem` and `--background: oklch(1 0 0)`). Append the finance tokens at the end of that block:

```css
  /* Finance semantic tokens */
  --color-income: oklch(0.65 0.2 142);
  --color-income-subtle: oklch(0.95 0.05 142);
  --color-income-foreground: oklch(0.25 0.08 142);
  --color-expense: oklch(0.62 0.23 27);
  --color-expense-subtle: oklch(0.96 0.04 27);
  --color-expense-foreground: oklch(0.28 0.1 27);
  --color-warning-finance: oklch(0.75 0.18 70);
  --color-warning-finance-subtle: oklch(0.97 0.04 70);
  --color-warning-finance-foreground: oklch(0.3 0.1 70);
```

- [ ] **Step 3: Add finance tokens to the .dark block**

Find the OKLch `.dark` block and append:

```css
  /* Finance semantic tokens — dark mode */
  --color-income: oklch(0.72 0.18 142);
  --color-income-subtle: oklch(0.22 0.06 142);
  --color-income-foreground: oklch(0.9 0.08 142);
  --color-expense: oklch(0.68 0.2 27);
  --color-expense-subtle: oklch(0.24 0.05 27);
  --color-expense-foreground: oklch(0.92 0.06 27);
  --color-warning-finance: oklch(0.8 0.16 70);
  --color-warning-finance-subtle: oklch(0.26 0.05 70);
  --color-warning-finance-foreground: oklch(0.92 0.08 70);
```

- [ ] **Step 4: Add @utility declarations for finance tokens**

At the end of the file, add:

```css
/* Finance semantic utilities */
@utility bg-income {
  background-color: var(--color-income);
}
@utility bg-income-subtle {
  background-color: var(--color-income-subtle);
}
@utility text-income {
  color: var(--color-income);
}
@utility text-income-foreground {
  color: var(--color-income-foreground);
}
@utility bg-expense {
  background-color: var(--color-expense);
}
@utility bg-expense-subtle {
  background-color: var(--color-expense-subtle);
}
@utility text-expense {
  color: var(--color-expense);
}
@utility text-expense-foreground {
  color: var(--color-expense-foreground);
}
@utility bg-finance-warning {
  background-color: var(--color-warning-finance);
}
@utility bg-finance-warning-subtle {
  background-color: var(--color-warning-finance-subtle);
}
@utility text-finance-warning {
  color: var(--color-warning-finance);
}
@utility text-finance-warning-foreground {
  color: var(--color-warning-finance-foreground);
}
```

- [ ] **Step 5: Verify build compiles**

Run: `cd frontend && npm run build`
Expected: no errors related to CSS (TypeScript errors from other files are fine at this stage)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css
git commit -m "refactor: clean up index.css, add finance semantic tokens"
```

---

### Task 2: Create finance-colors.ts utility

**Files:**
- Create: `src/lib/finance-colors.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/finance-colors.ts

/**
 * Returns the shadcn Badge variant for a budget/goal progress percentage.
 * Used to replace scattered getProgressColor() helpers in individual pages.
 */
export function getProgressVariant(
  percentage: number
): 'destructive' | 'warning' | 'success' {
  if (percentage >= 100) return 'destructive';
  if (percentage >= 80) return 'warning';
  return 'success';
}

/**
 * Returns a Tailwind progress bar bg class based on percentage.
 * Uses finance semantic tokens instead of hardcoded colors.
 */
export function getProgressBarClass(percentage: number): string {
  if (percentage >= 100) return 'bg-expense';
  if (percentage >= 80) return 'bg-finance-warning';
  return 'bg-income';
}

/**
 * Returns the shadcn Badge variant for a transaction amount.
 */
export function getAmountVariant(amount: number): 'success' | 'destructive' {
  return amount >= 0 ? 'success' : 'destructive';
}

/**
 * Returns Tailwind text class for income/expense amounts.
 */
export function getAmountClass(amount: number): string {
  return amount >= 0 ? 'text-income' : 'text-expense';
}

/**
 * Returns shadcn Badge variant for goal/budget priority.
 */
export function getPriorityVariant(
  priority: string
): 'destructive' | 'warning' | 'secondary' {
  if (priority === 'high') return 'destructive';
  if (priority === 'medium') return 'warning';
  return 'secondary';
}

/**
 * Returns Tailwind text class for days-remaining urgency.
 */
export function getDaysRemainingClass(days: number): string {
  if (days < 0) return 'text-expense';
  if (days <= 7) return 'text-finance-warning';
  return 'text-income';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from `src/lib/finance-colors.ts`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/finance-colors.ts
git commit -m "feat: add finance-colors utility module"
```

---

### Task 3: Extend shadcn Badge with finance variants

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Replace badge.tsx**

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-income-subtle text-income-foreground",
        warning:
          "border-transparent bg-finance-warning-subtle text-finance-warning-foreground",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from badge.tsx

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/badge.tsx
git commit -m "feat: extend shadcn Badge with success/warning/info variants"
```

---

### Task 4: Extend shadcn Button with icon and loading support

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Replace button.tsx**

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Spinner = () => (
  <svg
    className="animate-spin size-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        fullWidth && "w-full"
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from button.tsx

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/button.tsx
git commit -m "feat: extend shadcn Button with leftIcon/rightIcon/isLoading/fullWidth"
```

---

### Task 5: Extend shadcn Card with variant support and CardBody alias

**Files:**
- Modify: `src/components/ui/card.tsx`

The core Card had `variant="elevated"` and `variant="bordered"`. Adding these to shadcn Card lets pages migrate without JSX restructuring.

- [ ] **Step 1: Replace card.tsx**

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-md border-neutral-100",
        bordered: "border-2 border-neutral-300 shadow-none",
        flat: "shadow-none border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/** Alias for CardContent — matches the core Card API for easier migration */
const CardBody = CardContent

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardBody,
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from card.tsx

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/card.tsx
git commit -m "feat: extend shadcn Card with elevated/bordered variants and CardBody alias"
```

---

### Task 6: Create shadcn-compatible Spinner component

**Files:**
- Create: `src/components/ui/spinner.tsx`

- [ ] **Step 1: Create spinner.tsx**

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

function Spinner({
  className,
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & VariantProps<typeof spinnerVariants>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export { Spinner }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/spinner.tsx
git commit -m "feat: add Spinner component to shadcn ui"
```

---

### Task 7: Move formatter utilities out of core/atomic

**Files:**
- Create: `src/core/components/formatters/index.ts`
- The formatter files (CurrencyText.tsx, DateText.tsx, NumberText.tsx, PercentageText.tsx) stay in `atomic/` for now — this task just creates a new import path that remains valid after atomic is deleted.

> **Note:** To avoid a large breaking refactor of formatter imports across the entire codebase, this task creates a forwarding module. After Phase 3 cleanup, the formatter files will be moved physically to `formatters/`.

- [ ] **Step 1: Check actual formatter file locations**

Run: `ls frontend/src/core/components/atomic/`

Confirm the following files exist: `CurrencyText.tsx`, `DateText.tsx`, `NumberText.tsx`, `PercentageText.tsx`

- [ ] **Step 2: Create formatters/index.ts**

```typescript
// src/core/components/formatters/index.ts
export { CurrencyText } from '../atomic/CurrencyText'
export { DateText } from '../atomic/DateText'
export { NumberText } from '../atomic/NumberText'
export { PercentageText } from '../atomic/PercentageText'
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/formatters/
git commit -m "refactor: add formatters re-export module for migration path"
```

---

## Phase 2 — Page Migration

**Variant mapping reference:**
| core/atomic variant | shadcn variant |
|---------------------|----------------|
| Button `primary` | Button `default` |
| Button `secondary` | Button `secondary` |
| Button `danger` | Button `destructive` |
| Button `ghost` | Button `ghost` |
| Button `link` | Button `link` |
| Badge `primary` | Badge `default` |
| Badge `secondary` | Badge `secondary` |
| Badge `success` | Badge `success` |
| Badge `warning` | Badge `warning` |
| Badge `danger` | Badge `destructive` |
| Badge `info` | Badge `info` |
| Card `default` | Card `default` |
| Card `elevated` | Card `elevated` |
| Card `bordered` | Card `bordered` |

---

### Task 8: Migrate BudgetsPage and BudgetDetailsModal

**Files:**
- Modify: `src/features/budgets/pages/BudgetsPage.tsx`
- Modify: `src/features/budgets/components/BudgetDetailsModal.tsx`

- [ ] **Step 1: Update BudgetsPage imports**

Replace the core atomic imports at the top of `BudgetsPage.tsx`:

```typescript
// REMOVE these lines:
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { CurrencyText, PercentageText, DateText } from '@/core/components/atomic';

// ADD these lines:
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyText, PercentageText, DateText } from '@/core/components/formatters';
```

- [ ] **Step 2: Update Button usages in BudgetsPage**

Find every `<Button variant="primary"` and replace with `<Button variant="default"`.
Find every `<Button variant="danger"` and replace with `<Button variant="destructive"`.

- [ ] **Step 3: Update CardHeader usages in BudgetsPage**

The core `CardHeader` accepted `title`, `subtitle`, `action` props. Replace each usage with shadcn composition. Example pattern:

```tsx
// BEFORE:
<CardHeader title="Budget Name" subtitle="Jan 2026" action={<Button size="sm">Edit</Button>} />

// AFTER:
<CardHeader>
  <CardTitle>Budget Name</CardTitle>
  <CardDescription>Jan 2026</CardDescription>
  <CardAction><Button size="sm">Edit</Button></CardAction>
</CardHeader>
```

Apply this pattern to all `<CardHeader title=` usages in the file.

- [ ] **Step 4: Update getProgressColor to use finance-colors**

Remove the local `getProgressColor` function and replace with import:

```typescript
// REMOVE:
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return 'bg-rose-600';
  if (percentage >= 80) return 'bg-amber-500';
  return 'bg-emerald-600';
};

// ADD import at top of file:
import { getProgressBarClass } from '@/lib/finance-colors';
```

Replace all calls to `getProgressColor(...)` with `getProgressBarClass(...)`.

- [ ] **Step 5: Update BudgetDetailsModal with same pattern**

Open `src/features/budgets/components/BudgetDetailsModal.tsx` and apply the same import replacements and variant changes as Steps 1–4.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from budgets feature files

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/budgets/
git commit -m "refactor: migrate BudgetsPage and BudgetDetailsModal to shadcn/ui"
```

---

### Task 9: Migrate GoalsPage

**Files:**
- Modify: `src/features/goals/pages/GoalsPage.tsx`

- [ ] **Step 1: Update GoalsPage imports**

```typescript
// REMOVE:
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText, PercentageText, DateText } from '@/core/components/atomic';
import { Spinner } from '@/core/components/atomic/Spinner';
import type { BadgeVariant } from '@/core/components/atomic/Badge';

// ADD:
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CurrencyText, PercentageText, DateText } from '@/core/components/formatters';
import { getPriorityVariant, getProgressBarClass, getDaysRemainingClass } from '@/lib/finance-colors';
```

- [ ] **Step 2: Remove local helper functions now in finance-colors**

Remove the local `getProgressColor`, `getPriorityVariant`, `getDaysRemaining` functions (the last two exist in finance-colors; keep `getDaysRemaining` if it's only computing the number, not the color).

Replace `getPriorityVariant` calls to use the imported version (note: imported version returns `'destructive'` for `'high'`, not `'danger'`).

Replace `getProgressColor(current, target)` calls:
```tsx
// BEFORE:
className={getProgressColor(goal.currentAmount, goal.targetAmount)}

// AFTER:
className={getProgressBarClass((goal.currentAmount / goal.targetAmount) * 100)}
```

- [ ] **Step 3: Update CardHeader usages**

Apply the same composition pattern as Task 8 Step 3:
```tsx
// BEFORE:
<CardHeader title={goal.name} subtitle={goal.description} action={...} />

// AFTER:
<CardHeader>
  <CardTitle>{goal.name}</CardTitle>
  {goal.description && <CardDescription>{goal.description}</CardDescription>}
  <CardAction>...</CardAction>
</CardHeader>
```

- [ ] **Step 4: Update Button and Badge variants**

- `variant="primary"` → `variant="default"`
- `variant="danger"` → `variant="destructive"`
- Badge `variant="danger"` → `variant="destructive"`

- [ ] **Step 5: Update days-remaining color logic**

Find any inline ternary color classes for days remaining and replace:

```tsx
// BEFORE:
className={daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'}

// AFTER:
className={getDaysRemainingClass(daysRemaining)}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors from goals feature files

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/goals/
git commit -m "refactor: migrate GoalsPage to shadcn/ui"
```

---

### Task 10: Migrate Dashboard, Sidebar, and remaining feature pages

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/app/layout/Sidebar.tsx`
- Modify: `src/features/analytic/` (all pages/components using core/atomic)
- Modify: `src/features/optimization/` (all pages/components using core/atomic)
- Modify: `src/features/recurring/` (any components using core/atomic)

- [ ] **Step 1: Find all remaining core/atomic imports**

Run: `cd frontend && grep -r "from '@/core/components/atomic" src/ --include="*.tsx" --include="*.ts" -l`

This lists every file still importing from core/atomic. These are the files to migrate in this task.

- [ ] **Step 2: For each file listed, apply the same migration pattern**

For every file found in Step 1:

a. Replace Button import: `from '@/core/components/atomic/Button'` → `from '@/components/ui/button'`
b. Replace Card imports: `from '@/core/components/atomic/Card'` → `from '@/components/ui/card'`
   - Add `CardTitle`, `CardDescription`, `CardAction`, `CardBody` to the import
c. Replace Badge import: `from '@/core/components/atomic/Badge'` → `from '@/components/ui/badge'`
   - Remove `type BadgeVariant` imports — use `string` or inline union types
d. Replace Spinner import: `from '@/core/components/atomic/Spinner'` → `from '@/components/ui/spinner'`
e. Replace formatter imports: `from '@/core/components/atomic'` → `from '@/core/components/formatters'`
f. Apply variant mapping (see table above)
g. Convert `<CardHeader title=...>` to shadcn composition pattern
h. Replace local `getProgressColor`/`getPriorityVariant` helpers with `finance-colors` imports

For `Dashboard.tsx` specifically — look for hardcoded colors like `bg-emerald-100`, `text-emerald-600`, `bg-rose-100`, `text-rose-600` and replace with `bg-income-subtle`/`text-income`/`bg-expense-subtle`/`text-expense`.

For `Sidebar.tsx` — apply Button/Badge variant mapping.

- [ ] **Step 3: Re-run grep to confirm no remaining core/atomic imports**

Run: `cd frontend && grep -r "from '@/core/components/atomic" src/ --include="*.tsx" --include="*.ts" -l`
Expected: empty output

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ frontend/src/app/ frontend/src/features/
git commit -m "refactor: migrate Dashboard, Sidebar, analytic, optimization, recurring to shadcn/ui"
```

---

## Phase 3 — Cleanup

---

### Task 11: Delete core/atomic, finalize formatters, verify full build

**Files:**
- Delete: `src/core/components/atomic/` (everything except formatter files)
- Move: formatter files to `src/core/components/formatters/`
- Modify: `src/core/components/formatters/index.ts` (update paths after move)

- [ ] **Step 1: Verify no remaining atomic imports**

Run: `cd frontend && grep -r "from '@/core/components/atomic" src/ --include="*.tsx" --include="*.ts"`
Expected: empty output. If any results appear, fix them before continuing.

- [ ] **Step 2: Move formatter files**

Move these four files from `src/core/components/atomic/` to `src/core/components/formatters/`:
- `CurrencyText.tsx`
- `DateText.tsx`
- `NumberText.tsx`
- `PercentageText.tsx`

In PowerShell:
```powershell
Move-Item frontend/src/core/components/atomic/CurrencyText.tsx frontend/src/core/components/formatters/CurrencyText.tsx
Move-Item frontend/src/core/components/atomic/DateText.tsx frontend/src/core/components/formatters/DateText.tsx
Move-Item frontend/src/core/components/atomic/NumberText.tsx frontend/src/core/components/formatters/NumberText.tsx
Move-Item frontend/src/core/components/atomic/PercentageText.tsx frontend/src/core/components/formatters/PercentageText.tsx
```

- [ ] **Step 3: Update formatters/index.ts to use local paths**

```typescript
// src/core/components/formatters/index.ts
export { CurrencyText } from './CurrencyText'
export { DateText } from './DateText'
export { NumberText } from './NumberText'
export { PercentageText } from './PercentageText'
```

- [ ] **Step 4: Delete the atomic directory**

In PowerShell:
```powershell
Remove-Item -Recurse -Force frontend/src/core/components/atomic
```

- [ ] **Step 5: Verify TypeScript compiles with no errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 6: Run full build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with zero TypeScript errors. Note any Vite/CSS warnings but they are non-blocking.

- [ ] **Step 7: Final commit**

```bash
git add -A frontend/src/core/components/
git commit -m "refactor: delete core/atomic, move formatters, complete design system migration"
```

---

## Success Criteria Checklist

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `grep -r "from '@/core/components/atomic" src/` returns empty
- [ ] `ls src/core/components/atomic` → directory does not exist
- [ ] No hardcoded `bg-emerald-*`, `text-gray-*`, `bg-rose-*`, `bg-green-*`, `text-red-*` outside `index.css` (verify: `grep -r "bg-emerald\|bg-rose\|text-gray-[0-9]\|bg-green-[0-9]" src/features src/pages src/app`)
- [ ] All pages import Button/Card/Badge only from `@/components/ui/`
