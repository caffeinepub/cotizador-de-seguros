import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: number;
  delay?: number;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  subtitle,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-premium p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(200,162,74,0.12)",
            border: "1px solid rgba(200,162,74,0.2)",
          }}
        >
          <Icon className="w-5 h-5" style={{ color: "#C8A24A" }} />
        </div>
      </div>
      {/* Sparkline decoration */}
      <div
        className="mt-4 h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(200,162,74,0.1)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #C8A24A 0%, #E8C47A 100%)",
            width: `${Math.min(100, Math.max(20, Math.random() * 80 + 20))}%`,
          }}
        />
      </div>
    </motion.div>
  );
}
