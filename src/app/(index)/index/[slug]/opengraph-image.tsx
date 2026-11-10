import { ImageResponse } from "next/og";
import { getPost } from "@/lib/updates";

export const alt = "ArchRay · Index";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// cor de fundo por tema, da paleta das ilustrações
const TONE: Record<string, string> = {
  "Mapa de danos": "#cbcadb",
  "Manifestações patológicas": "#ebcece",
  "Inspeção e laudo": "#e3dacc",
  Tecnologia: "#bcd1ca",
  "Restauro e patrimônio": "#e8e6dc",
};

/** Imagem de compartilhamento (Google, WhatsApp, LinkedIn): tema, título e marca. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.seoTitle ?? post?.title ?? "ArchRay";
  const category = post?.category ?? "Index";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: TONE[category] ?? "#e3dacc", padding: 40 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            background: "#faf9f5",
            borderRadius: 28,
            border: "2px solid #141413",
            padding: "52px 60px",
            color: "#141413",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, color: "#83809a", letterSpacing: 2 }}>{category.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: title.length > 52 ? 60 : 70, lineHeight: 1.06, fontWeight: 700, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#83809a" }} />
            <span style={{ fontWeight: 700 }}>ArchRay</span>
            <span style={{ color: "#6b6a65" }}>· Guias técnicos · archray.com.br</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
