import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminGate from "@/components/admin/AdminGate";

// No "inset" variant here on purpose — that mode wraps the whole content
// area in a big rounded, shadowed white panel (so any Card rendered
// inside it just blends into that panel, no visible separation). The
// flatter look actually wanted — gray page background, white cards
// sitting directly on it — comes from the default sidebar variant plus
// an explicit bg-muted on SidebarInset instead. bg-muted reuses the
// --muted token that already exists in the theme and isn't used
// anywhere else yet, so this doesn't touch anything outside admin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <SidebarProvider className="admin-scope">
        <AppSidebar />
        <SidebarInset className="bg-muted">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminGate>
  );
}