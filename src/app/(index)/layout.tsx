import { SiteShell } from "@/components/site/site-shell";

export const metadata = { title: { default: "Index", template: "%s · ArchRay" } };

/** Index: área pública de publicações sobre o ArchRay, dentro do site (mesmo tema e cabeçalho). */
export default function IndexLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
