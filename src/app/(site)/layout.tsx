import { SiteShell } from "@/components/site/site-shell";

/** Site público do ArchRay (home para visitantes, empresas e histórias). */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
