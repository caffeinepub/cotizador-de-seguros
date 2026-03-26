import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import { backendClient as backend } from "./backendClient";
import AdminDashboard from "./components/AdminDashboard";
import AgentDashboard from "./components/AgentDashboard";
import AuthPage from "./components/AuthPage";

export type AuthUser = {
  principal: string;
  role: string;
  username: string;
  token: string;
};

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem("insuranceToken");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const result = await backend.validateSession(token);
      if (result) {
        const [principal, role] = result;
        const profile = await backend.getCallerUserProfile();
        setAuthUser({
          principal: principal.toString(),
          role,
          username: profile?.username || "",
          token,
        });
      } else {
        localStorage.removeItem("insuranceToken");
        localStorage.removeItem("insuranceRole");
      }
    } catch {
      localStorage.removeItem("insuranceToken");
      localStorage.removeItem("insuranceRole");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem("insuranceToken", user.token);
    localStorage.setItem("insuranceRole", user.role);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("insuranceToken");
    if (token) {
      try {
        await backend.logout(token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem("insuranceToken");
    localStorage.removeItem("insuranceRole");
    setAuthUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sidebar-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (authUser.role === "admin") {
    return (
      <>
        <AdminDashboard authUser={authUser} onLogout={handleLogout} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <>
      <AgentDashboard authUser={authUser} onLogout={handleLogout} />
      <Toaster richColors position="top-right" />
    </>
  );
}
