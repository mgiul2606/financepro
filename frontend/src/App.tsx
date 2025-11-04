// src/App.tsx (aggiorna)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


// // src/App.tsx
// import { useState, useEffect } from 'react';
// import api from './services/api';

// function App() {
//   const [message, setMessage] = useState<string>('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Test connessione API
//     api.get('/')
//       .then(response => {
//         setMessage(response.data.message);
//         setLoading(false);
//       })
//       .catch(error => {
//         console.error('API Error:', error);
//         setMessage('Errore connessione API');
//         setLoading(false);
//       });
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-gray-900 mb-4">
//           FinancePro
//         </h1>
//         {loading ? (
//           <p className="text-gray-600">Connessione al backend...</p>
//         ) : (
//           <div>
//             <p className="text-gray-600 mb-2">Backend risponde:</p>
//             <p className="text-lg font-semibold text-green-600">{message}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;