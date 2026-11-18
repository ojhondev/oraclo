import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DAMAGE_OVERLAY, blob, crack } from "@/components/eng/damage-overlay-data";

// a biblioteca é server-only: comparamos com o código-fonte dela
const lib = readFileSync("src/lib/damage-library.ts", "utf8");

describe("mapa de danos da primeira dobra", () => {
  it("usa as mesmas siglas, cores e padrões da biblioteca de danos", () => {
    for (const it of DAMAGE_OVERLAY) {
      const row = lib.split("\n").find((l) => l.includes(`code: "${it.code}"`));
      expect(row, it.code).toBeTruthy();
      expect(row).toContain(`color: "${it.color}"`);
      expect(row).toContain(`pattern: "${it.pattern}"`);
      expect(row!.toLowerCase()).toContain(it.name.split(" ")[0]!.toLowerCase());
    }
  });

  it("contornos fechados e fissuras dentro do quadro", () => {
    const d = blob(500, 250, 80, 50, 1);
    expect(d.startsWith("M") && d.endsWith("Z")).toBe(true);
    const nums = crack(100, 100, 400, 200, 2).match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (const v of nums) expect(v).toBeGreaterThan(0);
    expect(blob(500, 250, 80, 50, 1)).toBe(d); // determinístico
  });
});
