import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGate from "@/components/admin/AdminGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </AdminGate>
  );
}