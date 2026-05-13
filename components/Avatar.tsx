"use client";

import { motion } from "framer-motion";
import { colorByKey } from "@/lib/colors";
import { cn, initials } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({
  name,
  colorKey,
  size = "md",
  active = false,
  className,
}: {
  name: string;
  colorKey: string;
  size?: Size;
  active?: boolean;
  className?: string;
}) {
  const c = colorByKey(colorKey);
  return (
    <motion.span
      layout
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold text-white",
        "bg-gradient-to-br",
        c.gradient,
        "shadow-lg",
        c.glow,
        active && "ring-2 ring-offset-2 ring-offset-[var(--background)]",
        active && c.ring,
        sizeMap[size],
        className
      )}
      whileTap={{ scale: 0.94 }}
    >
      {initials(name)}
    </motion.span>
  );
}
