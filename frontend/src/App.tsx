// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './hooks/useConfirm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './app/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AccountsPage } from './features/accounts';
import { TransactionsPage } from './features/transactions/pages/TransactionsPage';
import { BudgetsPage } from './features/budgets/pages/BudgetsPage';
import { GoalsPage } from './features/goals';
import { AnalyticPage } from './features/analytic/pages/AnalyticPage';
import { OptimizationPage } from './features/optimization/pages/OptimizationPage';
import { AIAssistantPage } from './features/ai-assistant/pages/AIAssistantPage';
import { Settings } from './pages/Settings';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/accounts" element={<AccountsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/analytics" element={<AnalyticPage />} />
                        <Route path="/optimization" element={<OptimizationPage />} />
                        <Route path="/ai-assistant" element={<AIAssistantPage />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;