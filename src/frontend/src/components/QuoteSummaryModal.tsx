import { Button } from "@/components/ui/button";
import { CheckCircle, Download, FileDown, Shield, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { InsurancePlan, Quote } from "../backend";

interface Props {
  quote: Quote;
  plan?: InsurancePlan;
  onClose: () => void;
}

const formatCurrency = (val: bigint) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(val),
  );

const formatDate = (ts: bigint) =>
  new Date(Number(ts) / 1_000_000).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function QuoteSummaryModal({ quote, plan, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `cotizacion-${Number(quote.id)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Imagen descargada");
    } catch {
      toast.error("Error al generar imagen");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Header
      doc.setFillColor(11, 31, 51);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(200, 162, 74);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SEGUROS PREMIUM", 15, 20);
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("Beneficios del Plan de Seguro", 15, 30);

      // Plan name
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 40, 210, 20, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(quote.planName, 15, 54);

      // Client info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      let y = 75;
      doc.text(`Cliente: ${quote.clientName}`, 15, y);
      y += 8;
      doc.text(`Email: ${quote.clientEmail}`, 15, y);
      y += 8;
      doc.text(`Edad: ${Number(quote.clientAge)} años`, 15, y);
      y += 8;
      doc.text(`Prima Mensual: ${formatCurrency(quote.monthlyPremium)}`, 15, y);
      y += 8;
      doc.text(`Cobertura: ${formatCurrency(quote.coverageAmount)}`, 15, y);
      y += 8;
      doc.text(`Folio: #${Number(quote.id)}`, 15, y);
      y += 8;

      // Benefits
      y += 8;
      doc.setFillColor(11, 31, 51);
      doc.rect(10, y - 4, 190, 10, "F");
      doc.setTextColor(200, 162, 74);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("BENEFICIOS INCLUIDOS", 15, y + 3);
      y += 14;

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const benefits = plan?.benefits || [];
      for (const b of benefits) {
        doc.setTextColor(200, 162, 74);
        doc.text("✓", 15, y);
        doc.setTextColor(15, 23, 42);
        doc.text(b, 25, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Generado el ${new Date().toLocaleDateString("es-MX")} | SEGUROS PREMIUM`,
        15,
        285,
      );

      doc.save(`beneficios-${quote.planName.replace(/\s/g, "-")}.pdf`);
      toast.success("PDF generado");
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg"
        data-ocid="quote.modal"
      >
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Resumen de Cotización</h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="quote.modal.close_button"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exportable card */}
        <div
          ref={cardRef}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5"
            style={{
              background: "linear-gradient(135deg, #0B1F33 0%, #071726 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(200,162,74,0.2)" }}
                >
                  <Shield className="w-4 h-4" style={{ color: "#C8A24A" }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    SEGUROS PREMIUM
                  </p>
                  <p className="text-white/50 text-xs">Cotización Oficial</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs">Folio</p>
                <p className="font-bold" style={{ color: "#C8A24A" }}>
                  #{Number(quote.id)}
                </p>
              </div>
            </div>
          </div>

          {/* Plan highlight */}
          <div
            className="px-6 py-4"
            style={{
              background: "rgba(200,162,74,0.06)",
              borderBottom: "1px solid rgba(200,162,74,0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Plan Seleccionado
                </p>
                <p className="font-bold text-gray-900 text-lg">
                  {quote.planName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Prima Mensual
                </p>
                <p className="font-bold text-2xl" style={{ color: "#C8A24A" }}>
                  {formatCurrency(quote.monthlyPremium)}
                </p>
              </div>
            </div>
          </div>

          {/* Client info */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Cliente" value={quote.clientName} />
              <InfoRow label="Email" value={quote.clientEmail} />
              <InfoRow label="Edad" value={`${Number(quote.clientAge)} años`} />
              <InfoRow
                label="Cobertura"
                value={formatCurrency(quote.coverageAmount)}
              />
              <InfoRow label="Agente" value={quote.agentName} />
              <InfoRow label="Fecha" value={formatDate(quote.createdAt)} />
            </div>
          </div>

          {/* Benefits preview */}
          {plan && plan.benefits.length > 0 && (
            <div className="px-6 pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Beneficios Incluidos
              </p>
              <div className="space-y-1">
                {plan.benefits.slice(0, 4).map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#C8A24A" }}
                    />
                    <span className="text-sm text-gray-700">{b}</span>
                  </div>
                ))}
                {plan.benefits.length > 4 && (
                  <p className="text-xs text-gray-400 pl-5">
                    +{plan.benefits.length - 4} beneficios más en el PDF
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div
            className="px-6 py-3"
            style={{
              background: quote.status === "paid" ? "#F0FDF4" : "#FFFBEB",
              borderTop: "1px solid",
              borderColor: quote.status === "paid" ? "#BBF7D0" : "#FDE68A",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{
                  color: quote.status === "paid" ? "#166534" : "#92400E",
                }}
              >
                Estado:{" "}
                {quote.status === "paid" ? "Pagado" : "Pendiente de Pago"}
              </span>
              <span className="text-xs text-gray-400">
                SEGUROS PREMIUM © {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            data-ocid="quote.download_image.button"
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex-1"
            style={{ background: "#C8A24A", color: "#0B1F33" }}
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Descargar Imagen
          </Button>
          <Button
            data-ocid="quote.download_pdf.button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            variant="outline"
            className="flex-1 border-white/30 text-white hover:bg-white/10"
          >
            {generatingPdf ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            PDF de Beneficios
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
    </div>
  );
}
