import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { listRecent } from "@/lib/recent";
import { AppSidebar, MobileBar } from "@/components/app-nav";
import { COLLAPSE_COOKIE } from "@/lib/ui-prefs";
import { HelpCenter } from "@/components/help";
import { Tour } from "@/components/tour";
import { UpdatesBanner } from "@/components/updates-banner";
import { latestPost } from "@/lib/updates";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [recent, jar] = await Promise.all([listRecent(user.orgId), cookies()]);
  return (
    <div className="flex min-h-svh">
      <AppSidebar user={user} recent={recent} initialCollapsed={jar.get(COLLAPSE_COOKIE)?.value === "1"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar user={user} recent={recent} />
        <UpdatesBanner slug={latestPost.slug} text={latestPost.banner} />
        {children}
      </div>
      <HelpCenter />
      <Tour autoStart={!user.onboarded} />
    </div>
  );
}
