import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Plus,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "../App";
import type { InsurancePlan, Quote } from "../backend";
import {
  useCreateQuote,
  useMarkPaid,
  useMyQuotes,
  usePlans,
} from "../hooks/useQueries";
import KpiCard from "./KpiCard";
import QuoteSummaryModal from "./QuoteSummaryModal";
import Sidebar from "./Sidebar";

interface Props {
  authUser: AuthUser;
  onLogout: () => void;
}

type View = "dashboard" | "nueva-cotizacion" | "mis-cotizaciones";

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

export default function AgentDashboard({ authUser, onLogout }: Props) {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<
    InsurancePlan | undefined
  >();

  const { data: quotes = [] } = useMyQuotes();
  const { data: plans = [] } = usePlans();

  const pendingCount = quotes.filter((q) => q.status === "pending").length;
  const paidCount = quotes.filter((q) => q.status === "paid").length;

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

      {/* Main content */}
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
              {activeView === "dashboard" && `Bienvenido, ${authUser.username}`}
              {activeView === "nueva-cotizacion" && "Nueva Cotización"}
              {activeView === "mis-cotizaciones" && "Mis Cotizaciones"}
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
          {activeView !== "nueva-cotizacion" && (
            <Button
              data-ocid="agent.nueva_cotizacion.primary_button"
              onClick={() => setActiveView("nueva-cotizacion")}
              className="font-semibold shadow-md"
              style={{ background: "#C8A24A", color: "#0B1F33" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <KpiCard
                    title="Total Cotizaciones"
                    value={quotes.length}
                    icon={FileText}
                    delay={0}
                  />
                  <KpiCard
                    title="Pendientes"
                    value={pendingCount}
                    icon={Clock}
                    subtitle="Pendientes de pago"
                    delay={0.05}
                  />
                  <KpiCard
                    title="Pagadas"
                    value={paidCount}
                    icon={CheckCircle}
                    subtitle="Cotizaciones cobradas"
                    delay={0.1}
                  />
                  <KpiCard
                    title="Planes Disponibles"
                    value={plans.length}
                    icon={DollarSign}
                    delay={0.15}
                  />
                </div>

                {/* Recent quotes */}
                <RecentQuotes
                  quotes={quotes.slice(0, 5)}
                  onView={handleViewQuote}
                />
              </motion.div>
            )}

            {activeView === "nueva-cotizacion" && (
              <motion.div
                key="nueva"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CreateQuoteView
                  plans={plans}
                  onSuccess={(quote) => {
                    const plan = plans.find((p) => p.id === quote.planId);
                    setSelectedPlanForModal(plan);
                    setSelectedQuote(quote);
                    setActiveView("mis-cotizaciones");
                  }}
                />
              </motion.div>
            )}

            {activeView === "mis-cotizaciones" && (
              <motion.div
                key="quotes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MyQuotesList
                  quotes={quotes}
                  plans={plans}
                  onView={handleViewQuote}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
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

function RecentQuotes({
  quotes,
  onView,
}: { quotes: Quote[]; onView: (q: Quote) => void }) {
  const { mutate: markPaid, isPending: markingPaid } = useMarkPaid();

  return (
    <div className="card-premium overflow-hidden">
      <div className="px-6 py-4" style={{ background: "#0C223A" }}>
        <h2 className="text-white font-semibold text-sm">
          Cotizaciones Recientes
        </h2>
      </div>
      {quotes.length === 0 ? (
        <div className="px-6 py-12 text-center" data-ocid="quotes.empty_state">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No hay cotizaciones aún</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea tu primera cotización
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(12,34,58,0.04)" }}>
                {[
                  "Folio",
                  "Cliente",
                  "Plan",
                  "Prima",
                  "Estado",
                  "Fecha",
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
              {quotes.map((q, i) => (
                <tr
                  key={String(q.id)}
                  data-ocid={`quotes.item.${i + 1}`}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    #{Number(q.id)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {q.clientName}
                  </td>
                  <td className="px-4 py-3 text-sm">{q.planName}</td>
                  <td
                    className="px-4 py-3 text-sm font-semibold"
                    style={{ color: "#C8A24A" }}
                  >
                    {formatCurrency(q.monthlyPremium)}
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-ocid={`quotes.view.button.${i + 1}`}
                        onClick={() => onView(q)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Ver resumen"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {q.status === "pending" && (
                        <button
                          type="button"
                          data-ocid={`quotes.mark_paid.button.${i + 1}`}
                          onClick={() =>
                            markPaid(q.id, {
                              onSuccess: () =>
                                toast.success("Cotización marcada como pagada"),
                            })
                          }
                          disabled={markingPaid}
                          className="p-1.5 rounded-md hover:bg-green-50 transition-colors"
                          title="Marcar como pagado"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-green-600" />
                        </button>
                      )}
                    </div>
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

function MyQuotesList({
  quotes,
  plans,
  onView,
}: { quotes: Quote[]; plans: InsurancePlan[]; onView: (q: Quote) => void }) {
  const { mutate: markPaid, isPending: markingPaid } = useMarkPaid();

  return (
    <div className="card-premium overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: "#0C223A" }}
      >
        <h2 className="text-white font-semibold text-sm">Mis Cotizaciones</h2>
        <span className="text-white/50 text-xs">
          {quotes.length} cotizaciones
        </span>
      </div>
      {quotes.length === 0 ? (
        <div
          className="px-6 py-12 text-center"
          data-ocid="myquotes.empty_state"
        >
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No tienes cotizaciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(12,34,58,0.04)" }}>
                {[
                  "Folio",
                  "Cliente",
                  "Plan",
                  "Prima",
                  "Cobertura",
                  "Estado",
                  "Fecha",
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
              {quotes.map((q, i) => (
                <tr
                  key={String(q.id)}
                  data-ocid={`myquotes.item.${i + 1}`}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    #{Number(q.id)}
                  </td>
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-ocid={`myquotes.view.button.${i + 1}`}
                        onClick={() => onView(q)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Ver resumen"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {q.status === "pending" && (
                        <button
                          type="button"
                          data-ocid={`myquotes.mark_paid.button.${i + 1}`}
                          onClick={() =>
                            markPaid(q.id, {
                              onSuccess: () =>
                                toast.success("Marcado como pagado"),
                            })
                          }
                          disabled={markingPaid}
                          className="p-1.5 rounded-md hover:bg-green-50 transition-colors"
                          title="Marcar como pagado"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-green-600" />
                        </button>
                      )}
                      <DownloadImageButton quote={q} idx={i} />
                      <DownloadPdfButton
                        quote={q}
                        plan={plans.find((p) => p.id === q.planId)}
                        idx={i}
                      />
                    </div>
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

function DownloadImageButton({ quote, idx }: { quote: Quote; idx: number }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      // Create a temporary hidden modal div for capture
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:480px;background:#fff;border-radius:16px;overflow:hidden";
      container.innerHTML = `
        <div style="background:linear-gradient(135deg,#0B1F33,#071726);padding:20px;display:flex;align-items:center;gap:12px;">
          <div style="font-weight:bold;color:#C8A24A;font-size:16px;">SEGUROS PREMIUM</div>
          <div style="margin-left:auto;color:#C8A24A;font-weight:bold;">#${Number(quote.id)}</div>
        </div>
        <div style="padding:20px;">
          <div style="font-size:18px;font-weight:bold;color:#0F172A;margin-bottom:4px;">${quote.planName}</div>
          <div style="color:#C8A24A;font-size:22px;font-weight:bold;margin-bottom:12px;">${formatCurrency(quote.monthlyPremium)}/mes</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
            <div><span style="color:#6B7280;">Cliente:</span> ${quote.clientName}</div>
            <div><span style="color:#6B7280;">Email:</span> ${quote.clientEmail}</div>
            <div><span style="color:#6B7280;">Edad:</span> ${Number(quote.clientAge)} años</div>
            <div><span style="color:#6B7280;">Cobertura:</span> ${formatCurrency(quote.coverageAmount)}</div>
          </div>
        </div>
        <div style="background:${quote.status === "paid" ? "#F0FDF4" : "#FFFBEB"};padding:10px 20px;font-size:12px;font-weight:600;color:${quote.status === "paid" ? "#166534" : "#92400E"};">Estado: ${quote.status === "paid" ? "PAGADO" : "PENDIENTE"}</div>
      `;
      document.body.appendChild(container);
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `cotizacion-${Number(quote.id)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      document.body.removeChild(container);
      toast.success("Imagen descargada");
    } catch {
      toast.error("Error al generar imagen");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      data-ocid={`myquotes.download_image.button.${idx + 1}`}
      onClick={handleDownload}
      disabled={loading}
      className="p-1.5 rounded-md hover:bg-muted transition-colors"
      title="Descargar imagen"
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
      ) : (
        <Download className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function DownloadPdfButton({
  quote,
  plan,
  idx,
}: { quote: Quote; plan?: InsurancePlan; idx: number }) {
  const [loading, setLoading] = useState(false);
  const handlePdf = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFillColor(11, 31, 51);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(200, 162, 74);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SEGUROS PREMIUM", 15, 18);
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Plan: ${quote.planName} | Folio #${Number(quote.id)}`, 15, 28);
      let y = 50;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      for (const [k, v] of [
        ["Cliente", quote.clientName],
        ["Email", quote.clientEmail],
        ["Edad", `${Number(quote.clientAge)} años`],
        ["Prima Mensual", formatCurrency(quote.monthlyPremium)],
        ["Cobertura Total", formatCurrency(quote.coverageAmount)],
      ]) {
        doc.setTextColor(107, 114, 128);
        doc.text(`${k}:`, 15, y);
        doc.setTextColor(15, 23, 42);
        doc.text(String(v), 60, y);
        y += 8;
      }
      if (plan?.benefits.length) {
        y += 5;
        doc.setFillColor(11, 31, 51);
        doc.rect(10, y - 4, 190, 10, "F");
        doc.setTextColor(200, 162, 74);
        doc.setFont("helvetica", "bold");
        doc.text("BENEFICIOS", 15, y + 3);
        y += 14;
        for (const b of plan.benefits) {
          doc.setTextColor(200, 162, 74);
          doc.text("✓", 15, y);
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.text(b, 25, y);
          y += 7;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        }
      }
      doc.save(`beneficios-${quote.planName.replace(/\s/g, "-")}.pdf`);
      toast.success("PDF generado");
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      data-ocid={`myquotes.download_pdf.button.${idx + 1}`}
      onClick={handlePdf}
      disabled={loading}
      className="p-1.5 rounded-md hover:bg-muted transition-colors"
      title="Descargar PDF"
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
      ) : (
        <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function CreateQuoteView({
  plans,
  onSuccess,
}: { plans: InsurancePlan[]; onSuccess: (q: Quote) => void }) {
  const [form, setForm] = useState({
    clientName: "",
    clientAge: "",
    clientEmail: "",
    planId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createQuote = useCreateQuote();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clientName.trim()) errs.clientName = "Nombre requerido";
    if (
      !form.clientAge ||
      Number(form.clientAge) < 18 ||
      Number(form.clientAge) > 100
    )
      errs.clientAge = "Edad entre 18 y 100 años";
    if (!form.clientEmail.includes("@")) errs.clientEmail = "Email inválido";
    if (!form.planId) errs.planId = "Selecciona un plan";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const quoteId = await createQuote.mutateAsync({
        clientName: form.clientName,
        clientAge: BigInt(form.clientAge),
        clientEmail: form.clientEmail,
        planId: BigInt(form.planId),
      });
      const selectedPlan = plans.find((p) => String(p.id) === form.planId)!;
      const newQuote: Quote = {
        id: quoteId as bigint,
        status: "pending" as any,
        clientName: form.clientName,
        clientAge: BigInt(form.clientAge),
        clientEmail: form.clientEmail,
        planId: BigInt(form.planId),
        planName: selectedPlan?.name || "",
        agentName: "",
        coverageAmount: selectedPlan?.coverageAmount || BigInt(0),
        monthlyPremium: selectedPlan?.monthlyPremium || BigInt(0),
        userId: {} as any,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      };
      toast.success("¡Cotización creada exitosamente!");
      onSuccess(newQuote);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear cotización",
      );
    }
  };

  const selectedPlan = plans.find((p) => String(p.id) === form.planId);

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client info card */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#C8A24A", color: "#0B1F33" }}
            >
              1
            </span>
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Nombre Completo</Label>
              <Input
                data-ocid="quote.client_name.input"
                placeholder="María García López"
                value={form.clientName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientName: e.target.value }))
                }
                className="mt-1"
              />
              {errors.clientName && (
                <p
                  className="text-destructive text-xs mt-1"
                  data-ocid="quote.client_name.error_state"
                >
                  {errors.clientName}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Edad</Label>
              <Input
                data-ocid="quote.client_age.input"
                type="number"
                placeholder="35"
                min="18"
                max="100"
                value={form.clientAge}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientAge: e.target.value }))
                }
                className="mt-1"
              />
              {errors.clientAge && (
                <p
                  className="text-destructive text-xs mt-1"
                  data-ocid="quote.client_age.error_state"
                >
                  {errors.clientAge}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium">Correo Electrónico</Label>
              <Input
                data-ocid="quote.client_email.input"
                type="email"
                placeholder="maria@empresa.com"
                value={form.clientEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientEmail: e.target.value }))
                }
                className="mt-1"
              />
              {errors.clientEmail && (
                <p
                  className="text-destructive text-xs mt-1"
                  data-ocid="quote.client_email.error_state"
                >
                  {errors.clientEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan selection */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#C8A24A", color: "#0B1F33" }}
            >
              2
            </span>
            Selección de Plan
          </h3>
          {errors.planId && (
            <p
              className="text-destructive text-xs mb-3"
              data-ocid="quote.plan.error_state"
            >
              {errors.planId}
            </p>
          )}
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Cargando planes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {plans.map((plan) => {
                const isSelected = form.planId === String(plan.id);
                return (
                  <button
                    key={String(plan.id)}
                    type="button"
                    data-ocid={`quote.plan.${Number(plan.id)}.card`}
                    onClick={() =>
                      setForm((p) => ({ ...p, planId: String(plan.id) }))
                    }
                    className="text-left p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: isSelected ? "#C8A24A" : "rgba(0,0,0,0.08)",
                      background: isSelected
                        ? "rgba(200,162,74,0.05)"
                        : "white",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Shield
                            className="w-4 h-4"
                            style={{
                              color: isSelected ? "#C8A24A" : "#6B7280",
                            }}
                          />
                          <span className="font-semibold text-foreground">
                            {plan.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: "#C8A24A" }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.benefits.slice(0, 3).map((b) => (
                            <span
                              key={b}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {b}
                            </span>
                          ))}
                          {plan.benefits.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{plan.benefits.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground">
                          Prima mensual
                        </p>
                        <p
                          className="font-bold text-lg"
                          style={{ color: "#C8A24A" }}
                        >
                          {formatCurrency(plan.monthlyPremium)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cobertura: {formatCurrency(plan.coverageAmount)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          data-ocid="quote.submit_button"
          disabled={createQuote.isPending}
          className="w-full py-3 font-semibold text-base shadow-lg"
          style={{ background: "#C8A24A", color: "#0B1F33" }}
        >
          {createQuote.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creando cotización...
            </>
          ) : (
            <>Crear Cotización {selectedPlan ? `— ${selectedPlan.name}` : ""}</>
          )}
        </Button>
      </form>
    </div>
  );
}
