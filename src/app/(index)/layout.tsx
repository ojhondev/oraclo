import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata = { title: { default: "Index", template: "%s · ArchRay" } };

/** Index: área pública de publicações sobre o ArchRay, com o cabeçalho do site. */
export default function IndexLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
