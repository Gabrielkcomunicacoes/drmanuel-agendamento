import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/lib/auth'
import Appointments from '@/pages/Appointments'
import Contacts from '@/pages/Contacts'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import PublicBooking from '@/pages/PublicBooking'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pagina publica: sem sidebar, sem autenticacao. */}
          <Route path="agendar" element={<PublicBooking />} />
          <Route path="login" element={<Login />} />

          {/* Paginas internas: exigem sessao logada. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="contatos" element={<Contacts />} />
              <Route path="agendamentos" element={<Appointments />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
