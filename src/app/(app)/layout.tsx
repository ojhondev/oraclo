import { requireUser } from "@/lib/auth";
import { AppSidebar, MobileBar } from "@/components/app-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="flex min-h-svh">
      <AppSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar user={user} />
        {children}
      </div>
    </div>
  );
}
