"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { formatMoney } from "@/lib/utils";

export function AnimatedMoney({
  value,
  currency = "PLN",
  locale = "pl-PL",
  className,
}: {
  value: number;
  currency?: string;
  locale?: string;
  className?: string;
}) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => formatMoney(v, currency, locale));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}
