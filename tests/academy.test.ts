import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOSSARY, LESSONS, TRACKS, imageSrc, lessonsOf, neighbors, type AcademyBlock } from "@/lib/academy";

/** Todos os textos de um bloco, para conferir os links de glossário. */
const textsOf = (b: AcademyBlock): string[] => {
  if ("p" in b) return [b.p];
  if ("tip" in b) return [b.tip];
  if ("warn" in b) return [b.warn];
  if ("list" in b) return b.list;
  if ("steps" in b) return b.steps;
  if ("table" in b) return b.table.rows.flat();
  return [];
};

describe("Academy", () => {
  it("cada aula tem id único e pertence a uma trilha existente", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of LESSONS) expect(TRACKS.map((t) => t.id)).toContain(l.track);
    for (const t of TRACKS) expect(lessonsOf(t.id).length).toBeGreaterThan(0);
  });

  it("toda imagem citada existe em public", () => {
    for (const l of LESSONS)
      for (const b of l.blocks)
        if ("img" in b) expect(existsSync(join("public", imageSrc(b.img.src))), `${l.id}: ${b.img.src}`).toBe(true);
  });

  it("todo link de glossário aponta para um termo existente", () => {
    const ids = new Set(GLOSSARY.map((t) => t.id));
    for (const l of LESSONS)
      for (const b of l.blocks)
        for (const text of textsOf(b))
          for (const m of text.matchAll(/\[\[([^\]|]+)/g)) expect(ids.has(m[1]!), `${l.id}: ${m[1]}`).toBe(true);
  });

  it("os termos do glossário apontam para aulas existentes", () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    for (const t of GLOSSARY) for (const id of t.lessons ?? []) expect(ids.has(id), `${t.id}: ${id}`).toBe(true);
  });

  it("toda pergunta tem a resposta entre as opções", () => {
    for (const l of LESSONS)
      for (const q of l.check ?? []) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
  });

  it("anterior e próxima seguem a ordem das aulas", () => {
    expect(neighbors(LESSONS[0]!.id).prev).toBeUndefined();
    expect(neighbors(LESSONS[0]!.id).next?.id).toBe(LESSONS[1]!.id);
    expect(neighbors(LESSONS.at(-1)!.id).next).toBeUndefined();
  });
});
