import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Home } from "./pages/Home";
import { Register } from "./pages/visitor/Register";
import { GatePass } from "./pages/visitor/GatePass";
import { SecurityDashboard } from "./pages/security/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { HostDashboard } from "./pages/host/Dashboard";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="visitor/register" element={<ProtectedRoute allowedRoles={['security', 'admin']}><Register /></ProtectedRoute>} />
            <Route path="visitor/pass/:id" element={<GatePass />} />
            <Route path="security" element={<ProtectedRoute allowedRoles={['security', 'admin']}><SecurityDashboard /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="host" element={<ProtectedRoute allowedRoles={['host', 'admin']}><HostDashboard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
