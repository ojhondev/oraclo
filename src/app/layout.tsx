import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
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
const serif = Source_Serif_4({
  variable: "--font-serif-ui",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ArchRay", template: "%s · ArchRay" },
  description:
    "Mapa de danos com IA: aponte os danos sobre fachadas e plantas em escala e receba quantitativos, orçamento do tratamento e laudo prontos.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#262624" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
