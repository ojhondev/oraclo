"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Conteúdo que sobe enquanto a seção entra na tela (ligado à rolagem, como no Scale): começa
 * `amount` px abaixo e chega ao lugar quando o topo da seção alcança ~35% da altura da janela.
 */
export function Rise({ children, className, amount = 140 }: { children: ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const y = useTransform(scrollYProgress, (v) => amount * (1 - v) * (1 - v));
  const opacity = useTransform(scrollYProgress, (v) => Math.min(1, 0.25 + v * 1.4));
  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** Deslocamento contínuo enquanto o elemento atravessa a tela (paralaxe). `speed` em px. */
export function Drift({ children, className, speed = 60 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, (v) => speed * (1 - 2 * v));
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
