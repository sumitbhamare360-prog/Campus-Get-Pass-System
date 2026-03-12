import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Users, LayoutDashboard, UserCheck, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white">
      <header className="bg-indigo-600 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight">
                CampusGate
              </span>
            </Link>
            <nav className="flex items-center space-x-4">
              {(user?.role === "admin" || user?.role === "security") && (
                <NavLink
                  to="/visitor/register"
                  current={location.pathname}
                  icon={<Users className="w-4 h-4" />}
                >
                  Add Visitor
                </NavLink>
              )}
              
              {(user?.role === "admin" || user?.role === "security") && (
                <NavLink
                  to="/security"
                  current={location.pathname}
                  icon={<Shield className="w-4 h-4" />}
                >
                  Security
                </NavLink>
              )}
              
              {(user?.role === "admin" || user?.role === "host") && (
                <NavLink
                  to="/host"
                  current={location.pathname}
                  icon={<UserCheck className="w-4 h-4" />}
                >
                  Host
                </NavLink>
              )}
              
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  current={location.pathname}
                  icon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Admin
                </NavLink>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white transition-colors ml-4 border border-indigo-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white transition-colors ml-4 border border-indigo-500"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">
        <Outlet />
      </main>
      <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm print:hidden">
        &copy; {new Date().getFullYear()} Campus Digital Gate Pass System
      </footer>
    </div>
  );
}

function NavLink({
  to,
  current,
  children,
  icon,
}: {
  to: string;
  current: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const isActive = (current.startsWith(to) && to !== "/") || current === to;
  return (
    <Link
      to={to}
      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-indigo-700 text-white"
          : "text-indigo-100 hover:bg-indigo-500 hover:text-white"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
