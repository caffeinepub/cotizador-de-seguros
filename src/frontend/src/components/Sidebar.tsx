import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Shield,
  Users,
} from "lucide-react";
import type { AuthUser } from "../App";

type AgentView = "dashboard" | "nueva-cotizacion" | "mis-cotizaciones";
type AdminView = "dashboard" | "usuarios" | "cotizaciones";
type View = AgentView | AdminView;

interface Props {
  authUser: AuthUser;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const agentNavItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  {
    id: "nueva-cotizacion" as View,
    label: "Nueva Cotización",
    icon: PlusCircle,
  },
  { id: "mis-cotizaciones" as View, label: "Mis Cotizaciones", icon: FileText },
];

const adminNavItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios" as View, label: "Usuarios", icon: Users },
  { id: "cotizaciones" as View, label: "Cotizaciones", icon: FileText },
];

export default function Sidebar({
  authUser,
  activeView,
  onNavigate,
  onLogout,
}: Props) {
  const isAdmin = authUser.role === "admin";
  const navItems = isAdmin ? adminNavItems : agentNavItems;
  const initials = authUser.username.slice(0, 2).toUpperCase();

  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, #0B1F33 0%, #071726 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-7 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(200,162,74,0.2)",
              border: "1px solid rgba(200,162,74,0.3)",
            }}
          >
            <Shield className="w-5 h-5" style={{ color: "#C8A24A" }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">
              SEGUROS
            </p>
            <p
              className="font-bold text-sm leading-tight tracking-wider"
              style={{ color: "#C8A24A" }}
            >
              PREMIUM
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback
              className="text-sm font-semibold"
              style={{ background: "rgba(200,162,74,0.2)", color: "#C8A24A" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {authUser.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-white/40 text-xs">
                {isAdmin ? "Administrador" : "Agente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={
                isActive
                  ? {
                      background: "rgba(200,162,74,0.15)",
                      borderLeft: "3px solid #C8A24A",
                      color: "#C8A24A",
                      paddingLeft: "9px",
                    }
                  : { color: "rgba(255,255,255,0.6)" }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/8"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
