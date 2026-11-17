import { describe, expect, it } from "vitest";
import { objectHeight, objectSlices, project, ringPath, type ObjectName } from "@/components/eng/contour";

const NAMES: ObjectName[] = ["celular", "igreja", "notebook", "laudo", "fachada", "torre"];

describe("ilustrações em curvas de nível", () => {
  it("cada objeto tem fatias ordenadas de baixo para cima, com contornos fechados válidos", () => {
    for (const n of NAMES) {
      const s = objectSlices(n);
      expect(s.length, n).toBeGreaterThan(10);
      for (let i = 1; i < s.length; i++) expect(s[i]!.z, n).toBeGreaterThanOrEqual(s[i - 1]!.z);
      for (const slice of s) for (const r of slice.rings) for (const [x, y] of r) expect(Number.isFinite(x) && Number.isFinite(y), n).toBe(true);
      expect(objectHeight(n)).toBeGreaterThan(0);
    }
  });

  it("a igreja afina no telhado e termina no coruchéu", () => {
    const s = objectSlices("igreja");
    const top = s[s.length - 1]!;
    expect(top.rings).toHaveLength(1); // só o coruchéu chega lá em cima
    expect(s[0]!.rings.length).toBeGreaterThanOrEqual(2); // nave + torre na base
  });

  it("a projeção sobe com a altura e o caminho SVG fecha", () => {
    const v = { yaw: 0.5, pitch: 0.45, scale: 100, cx: 200, cy: 300 };
    expect(project([0, 0], 1, v)[1]).toBeLessThan(project([0, 0], 0, v)[1]);
    const d = ringPath([[0, 0], [1, 0], [1, 1]], 0, v);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
});
