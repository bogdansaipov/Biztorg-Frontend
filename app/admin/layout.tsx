import { redirect } from "next/navigation";
import { getAdminMe } from "@/lib/admin-server-api";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getAdminMe();

  // Real trust boundary — same check as the backend's AdminGuard, run
  // fresh on every request rather than trusted from a possibly-stale JWT
  // claim. Kicks out to the public site rather than showing a login form
  // here; the admin panel isn't meant to be a public entry point.
  if (!me || me.role !== "ADMIN") {
    redirect("https://biztorg.uz");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}