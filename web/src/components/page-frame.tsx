import { Link } from "@tanstack/react-router";
import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

interface RunningHeadProps {
  section: string;
  folio: string;
}

export function RunningHead({ section, folio }: RunningHeadProps) {
  return (
    <motion.header
      variants={itemVariants}
      className="flex items-baseline justify-between border-b border-rule-soft pb-2"
    >
      <Link to="/" className="kicker hover:text-accent transition-colors flex items-center gap-1.5">
        <span aria-hidden="true" className="icon-[lucide--arrow-left] text-sm" />
        <span>contents</span>
      </Link>
      <span className="kicker text-ink-quiet">{section}</span>
      <span className="font-mono text-xs tabular text-ink-mute">{folio}</span>
    </motion.header>
  );
}

interface FolioMarkProps {
  folio: string;
}

export function FolioMark({ folio }: FolioMarkProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center justify-center gap-3 pt-12 pb-8"
      aria-hidden="true"
    >
      <span className="font-mono text-xs tabular text-ink-faint">─</span>
      <span className="font-mono text-xs tabular text-ink-mute">{folio}</span>
      <span className="font-mono text-xs tabular text-ink-faint">─</span>
    </motion.div>
  );
}

export function PageItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
