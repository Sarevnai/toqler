import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading, companyId } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && companyId) return <Navigate to="/dashboard" replace />;
  if (user && !companyId) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
