import { redirect } from "next/navigation";
import { canAccessProcurement } from "@/lib/eprocurement/auth";

export const dynamic = "force-dynamic";

export default async function LayoutGare({ children }: { children: React.ReactNode }) {
  if (!(await canAccessProcurement())) {
    redirect("/admin");
  }
  return children;
}
