import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "../App";
import type { InsurancePlan, Quote, UserProfile } from "../backend";
import {
  useAdminStats,
  useAllQuotes,
  useAllUsers,
  usePlans,
  useSetUserActive,
  useUpdateUserRole,
} from "../hooks/useQueries";
import KpiCard from "./KpiCard";
import QuoteSummaryModal from "./QuoteSummaryModal";
import Sidebar from "./Sidebar";

interface Props {
  authUser: AuthUser;
  onLogout: () => void;
}

type View = "dashboard" | "usuarios" | "cotizaciones";

const formatCurrency = (val: bigint) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(val),
  );

const formatDate = (ts: bigint) =>
  new Date(Number(ts) / 1_000_000).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminDashboard({ authUser, onLogout }: Props) {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<
    InsurancePlan | undefined
  >();

  const { data: stats } = useAdminStats();
  const { data: plans = [] } = usePlans();

  const handleViewQuote = (quote: Quote) => {
    const plan = plans.find((p) => p.id === quote.planId);
    setSelectedPlanForModal(plan);
    setSelectedQuote(quote);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        authUser={authUser}
        activeView={activeView}
        onNavigate={(v) => setActiveView(v as View)}
        onLogout={onLogout}
      />

      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "#F3F5F8" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {activeView === "dashboard" && "Panel de Administrador"}
              {activeView === "usuarios" && "Gestión de Usuarios"}
              {activeView === "cotizaciones" && "Todas las Cotizaciones"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-muted-foreground">
              Actualizando en tiempo real
            </span>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeView === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <KpiCard
                    title="Total Usuarios"
                    value={Number(stats?.totalUsers || 0)}
                    icon={Users}
                    delay={0}
                  />
                  <KpiCard
                    title="Usuarios Activos"
                    value={Number(stats?.activeUsers || 0)}
                    icon={UserCheck}
                    delay={0.05}
                  />
                  <KpiCard
                    title="Total Cotizaciones"
                    value={Number(stats?.totalQuotes || 0)}
                    icon={FileText}
                    delay={0.1}
                  />
                  <KpiCard
                    title="Pendientes"
                    value={Number(stats?.pendingQuotes || 0)}
                    icon={Clock}
                    delay={0.15}
                  />
                  <KpiCard
                    title="Pagadas"
                    value={Number(stats?.paidQuotes || 0)}
                    icon={CheckCircle}
                    delay={0.2}
                  />
                </div>
                <AdminRecentView onViewQuote={handleViewQuote} />
              </motion.div>
            )}

            {activeView === "usuarios" && (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UsersTable />
              </motion.div>
            )}

            {activeView === "cotizaciones" && (
              <motion.div
                key="quotes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AllQuotesTable onViewQuote={handleViewQuote} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="px-8 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </main>

      <AnimatePresence>
        {selectedQuote && (
          <QuoteSummaryModal
            quote={selectedQuote}
            plan={selectedPlanForModal}
            onClose={() => setSelectedQuote(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminRecentView({ onViewQuote }: { onViewQuote: (q: Quote) => void }) {
  const { data: quotes = [] } = useAllQuotes();
  const { data: users = [] } = useAllUsers();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent users */}
      <div className="card-premium overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ background: "#0C223A" }}
        >
          <h3 className="text-white font-semibold text-sm flex-1">
            Usuarios Recientes
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">LIVE</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {users.slice(0, 5).map((u, i) => (
            <div
              key={u.username}
              data-ocid={`admin.users.item.${i + 1}`}
              className="px-5 py-3 flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "rgba(200,162,74,0.12)",
                  color: "#C8A24A",
                }}
              >
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? "status-pill-active" : "status-pill-inactive"}`}
                >
                  {u.isActive ? "Activo" : "Inactivo"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{u.role}</p>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div
              className="px-5 py-8 text-center text-muted-foreground"
              data-ocid="admin.users.empty_state"
            >
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent quotes */}
      <div className="card-premium overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ background: "#0C223A" }}
        >
          <h3 className="text-white font-semibold text-sm flex-1">
            Cotizaciones Recientes
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">LIVE</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {quotes.slice(0, 5).map((q, i) => (
            <div
              key={String(q.id)}
              data-ocid={`admin.quotes.item.${i + 1}`}
              className="px-5 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{q.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {q.planName} · {q.agentName}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#C8A24A" }}
                >
                  {formatCurrency(q.monthlyPremium)}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${q.status === "paid" ? "status-pill-paid" : "status-pill-pending"}`}
                >
                  {q.status === "paid" ? "Pagado" : "Pendiente"}
                </span>
              </div>
              <button
                type="button"
                data-ocid={`admin.quotes.view.button.${i + 1}`}
                onClick={() => onViewQuote(q)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
          {quotes.length === 0 && (
            <div
              className="px-5 py-8 text-center text-muted-foreground"
              data-ocid="admin.quotes.empty_state"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay cotizaciones</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTable() {
  const { data: users = [], isLoading } = useAllUsers();
  const setUserActive = useSetUserActive();
  const updateRole = useUpdateUserRole();

  if (isLoading)
    return (
      <div
        className="card-premium p-12 text-center"
        data-ocid="admin.users.loading_state"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Cargando usuarios...</p>
      </div>
    );

  return (
    <div className="card-premium overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: "#0C223A" }}
      >
        <h2 className="text-white font-semibold text-sm">Todos los Usuarios</h2>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-xs font-semibold">LIVE</span>
          <span className="text-white/40 text-xs">
            · {users.length} usuarios
          </span>
        </div>
      </div>
      {users.length === 0 ? (
        <div
          className="px-6 py-12 text-center"
          data-ocid="users.table.empty_state"
        >
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(12,34,58,0.04)" }}>
                {[
                  "Usuario",
                  "Email",
                  "Rol",
                  "Registrado",
                  "Última Actividad",
                  "Estado",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <UserRow
                  key={u.username}
                  user={u}
                  idx={i}
                  onToggleActive={(isActive) =>
                    setUserActive.mutate(
                      { userId: u.username, isActive },
                      {
                        onSuccess: () =>
                          toast.success(
                            `Usuario ${isActive ? "activado" : "desactivado"}`,
                          ),
                      },
                    )
                  }
                  onChangeRole={(role) =>
                    updateRole.mutate(
                      { userId: u.username, newRole: role },
                      { onSuccess: () => toast.success("Rol actualizado") },
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  idx,
  onToggleActive,
  onChangeRole,
}: {
  user: UserProfile;
  idx: number;
  onToggleActive: (v: boolean) => void;
  onChangeRole: (r: string) => void;
}) {
  return (
    <tr
      data-ocid={`users.item.${idx + 1}`}
      className="border-t border-border hover:bg-muted/30 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(200,162,74,0.12)", color: "#C8A24A" }}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{user.username}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <select
          data-ocid={`users.role.select.${idx + 1}`}
          value={user.role}
          onChange={(e) => onChangeRole(e.target.value)}
          className="text-xs px-2 py-1 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="user">Agente</option>
          <option value="admin">Administrador</option>
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(user.registeredAt)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(user.lastActivity)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? "status-pill-active" : "status-pill-inactive"}`}
        >
          {user.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          data-ocid={`users.toggle_active.button.${idx + 1}`}
          onClick={() => onToggleActive(!user.isActive)}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
          style={{
            background: user.isActive ? "#FEE2E2" : "#DCFCE7",
            color: user.isActive ? "#991B1B" : "#166534",
          }}
        >
          {user.isActive ? "Desactivar" : "Activar"}
        </button>
      </td>
    </tr>
  );
}

function AllQuotesTable({ onViewQuote }: { onViewQuote: (q: Quote) => void }) {
  const { data: quotes = [], isLoading } = useAllQuotes();

  if (isLoading)
    return (
      <div
        className="card-premium p-12 text-center"
        data-ocid="admin.allquotes.loading_state"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Cargando cotizaciones...
        </p>
      </div>
    );

  return (
    <div className="card-premium overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: "#0C223A" }}
      >
        <h2 className="text-white font-semibold text-sm">
          Todas las Cotizaciones
        </h2>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-xs font-semibold">LIVE</span>
          <span className="text-white/40 text-xs">
            · {quotes.length} cotizaciones
          </span>
        </div>
      </div>
      {quotes.length === 0 ? (
        <div
          className="px-6 py-12 text-center"
          data-ocid="allquotes.empty_state"
        >
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">
            No hay cotizaciones registradas
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(12,34,58,0.04)" }}>
                {[
                  "Folio",
                  "Agente",
                  "Cliente",
                  "Plan",
                  "Prima",
                  "Cobertura",
                  "Estado",
                  "Fecha",
                  "Ver",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <tr
                  key={String(q.id)}
                  data-ocid={`allquotes.item.${i + 1}`}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    #{Number(q.id)}
                  </td>
                  <td className="px-4 py-3 text-sm">{q.agentName}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{q.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.clientEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{q.planName}</td>
                  <td
                    className="px-4 py-3 text-sm font-semibold"
                    style={{ color: "#C8A24A" }}
                  >
                    {formatCurrency(q.monthlyPremium)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatCurrency(q.coverageAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${q.status === "paid" ? "status-pill-paid" : "status-pill-pending"}`}
                    >
                      {q.status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(q.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      data-ocid={`allquotes.view.button.${i + 1}`}
                      onClick={() => onViewQuote(q)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
