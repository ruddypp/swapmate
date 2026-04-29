"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XOctagon, X } from "lucide-react";
import { useState } from "react";

type Severity = "info" | "warning" | "danger";

const SEVERITY_CONFIG: Record<Severity, {
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  info: {
    icon: <Info className="w-4 h-4 flex-shrink-0" />,
    borderColor: "border-primary/30",
    bgColor: "bg-primary/5",
    textColor: "text-foreground/80",
    iconColor: "text-primary",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/5",
    textColor: "text-amber-200/80",
    iconColor: "text-amber-400",
  },
  danger: {
    icon: <XOctagon className="w-4 h-4 flex-shrink-0" />,
    borderColor: "border-red-500/40",
    bgColor: "bg-red-500/5",
    textColor: "text-red-200/80",
    iconColor: "text-red-400",
  },
};

interface RiskBannerProps {
  message: string;
  severity?: Severity;
  dismissible?: boolean;
}

export function RiskBanner({ message, severity = "warning", dismissible = true }: RiskBannerProps) {
  const [visible, setVisible] = useState(true);
  const cfg = SEVERITY_CONFIG[severity];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs leading-relaxed ${cfg.borderColor} ${cfg.bgColor} ${cfg.textColor}`}
        >
          <span className={cfg.iconColor}>{cfg.icon}</span>
          <span className="flex-1">{message}</span>
          {dismissible && (
            <button
              onClick={() => setVisible(false)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
