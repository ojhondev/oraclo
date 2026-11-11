import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme";
import "./globals.css";

// fontes livres no lugar das proprietárias da Anthropic: sem serifa para a interface, serifada para manchetes
const sans = Instrument_Sans({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const serif = Source_Serif_4({
  variable: "--font-serif-ui",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://archray.com.br"),
  title: { default: "ArchRay", template: "%s · ArchRay" },
  applicationName: "ArchRay",
  openGraph: { type: "website", siteName: "ArchRay", locale: "pt_BR", images: ["/site/showcase-fachada.jpg"] },
  twitter: { card: "summary_large_image" },
  // código do Google Search Console (Configurações → Propriedade → Verificação por tag HTML)
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  description:
    "Mapa de danos com IA: aponte os danos sobre fachadas e plantas em escala e receba quantitativos, orçamento do tratamento e laudo prontos.",
  appleWebApp: { capable: true, title: "ArchRay", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // o app desenha até as bordas do aparelho; as barras respeitam as áreas seguras (notch, indicador)
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#262624" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster position="bottom-right" mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
