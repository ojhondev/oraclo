import { describe, expect, it } from "vitest";
import { lasPointCount, odmArgs, odmCommand, photosUsed, qualityOf, stageFromLine, stepDetail } from "../scripts/motor-comum.mjs";
import { judgeFrame, meanDiff, tooFast } from "@/lib/video-frames";

describe("motor 3D", () => {
  it("traduz as etapas do ODM e ignora o resto do log", () => {
    expect(stageFromLine("[INFO]    Running opensfm stage")).toEqual({ odm: "opensfm", stage: "alinhamento", progress: 10 });
    expect(stageFromLine("[INFO]    Running odm_meshing stage")?.stage).toBe("malha");
    expect(stageFromLine("[INFO]    Finished opensfm stage")).toBeNull();
    expect(stageFromLine("Running estrela stage")).toBeNull();
  });

  it("pede modelo 3D real, nuvem LAS e GLB, com o projeto por último", () => {
    const args = odmArgs("abc", "A:\\p");
    expect(args).toEqual(expect.arrayContaining(["--use-3dmesh", "--gltf", "--pc-las", "--no-gpu"]));
    expect(args.at(-1)).toBe("abc");
    expect(args).not.toContain("--skip-3dmodel");
    expect(odmCommand("A:\\ODM", args)).toContain("cd /d A:\\ODM& winrun.bat --project-path A:\\p");
  });

  it("o modo rápido compara só vizinhos e reduz a nuvem; o de alta qualidade não", () => {
    const fast = odmArgs("abc", "A:\\p", "rapido");
    expect(fast).toEqual(expect.arrayContaining(["--matcher-order", "--pc-skip-geometric"]));
    expect(fast[fast.indexOf("--pc-quality") + 1]).toBe("low");
    const high = odmArgs("abc", "A:\\p", "alta");
    expect(high).not.toContain("--matcher-order");
    expect(high[high.indexOf("--pc-quality") + 1]).toBe("medium");
    expect(qualityOf("desconhecida")).toBe(qualityOf("rapido"));
  });

  it("mostra o andamento dentro da etapa, sem passar do total", () => {
    const base = { features: 0, matches: 0, depths: 0, total: 56 };
    expect(stepDetail("opensfm", { ...base, features: 28 })).toEqual({ progress: 18, text: "Analisando a imagem 28 de 56" });
    expect(stepDetail("openmvs", { ...base, depths: 84 })).toEqual({ progress: 58, text: "Calculando a imagem 56 de 56" });
    expect(stepDetail("odm_meshing", base)).toBeNull();
  });

  it("lê a quantidade de pontos nas versões 1.2 e 1.4 do LAS", () => {
    const v12 = Buffer.alloc(227);
    v12[25] = 2;
    v12.writeUInt32LE(1234, 107);
    expect(lasPointCount(v12)).toBe(1234);
    const v14 = Buffer.alloc(375);
    v14[25] = 4;
    v14.writeBigUInt64LE(BigInt(5_000_000_000), 247);
    expect(lasPointCount(v14)).toBe(5_000_000_000);
    expect(lasPointCount(Buffer.alloc(10))).toBeNull();
  });

  it("conta os quadros do maior bloco reconstruído", () => {
    expect(photosUsed([{ shots: { a: {}, b: {} } }, { shots: { c: {} } }])).toBe(2);
    expect(photosUsed([])).toBe(0);
  });
});

describe("quadros do vídeo", () => {
  const recent = [100, 110, 120, 130, 140];

  it("guarda o quadro nítido e novo", () => {
    expect(judgeFrame({ sharpness: 125, recent, diff: 12, gap: 0 })).toBe("guardar");
    expect(judgeFrame({ sharpness: 125, recent: [], diff: null, gap: 0 })).toBe("guardar");
  });

  it("descarta imagem repetida com o celular parado", () => {
    expect(judgeFrame({ sharpness: 125, recent, diff: 0.5, gap: 0 })).toBe("parado");
  });

  it("descarta o tremido, mas não abre buraco na sequência", () => {
    expect(judgeFrame({ sharpness: 20, recent, diff: 12, gap: 0 })).toBe("tremido");
    expect(judgeFrame({ sharpness: 20, recent, diff: 12, gap: 2 })).toBe("guardar");
  });

  it("avisa quando metade das últimas janelas tremeu", () => {
    expect(tooFast(["guardar", "guardar", "guardar", "tremido"])).toBe(false);
    expect(tooFast(["guardar", "tremido", "guardar", "tremido"])).toBe(true);
    expect(tooFast(["tremido"])).toBe(false);
  });

  it("mede a diferença média entre miniaturas", () => {
    expect(meanDiff(new Uint8ClampedArray([10, 20]), new Uint8ClampedArray([20, 20]))).toBe(5);
  });
});
