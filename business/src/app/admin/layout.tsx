import { BarraAdmin } from "@/components/admin/barra-admin";
import { canAccessProcurement } from "@/lib/eprocurement/auth";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const canAccess = await canAccessProcurement();
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <BarraAdmin canAccess={canAccess} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
