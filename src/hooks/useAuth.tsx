import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  companyId: string | null;
  companyRole: "admin" | "member" | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  companyId: null,
  companyRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<"admin" | "member" | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setCompanyId(null);
        setCompanyRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchMembership = async () => {
      // First, check and accept any pending invitations
      try {
        const { data: pendingInvitations } = await supabase.rpc("get_pending_invitations");
        if (pendingInvitations && pendingInvitations.length > 0) {
          // Auto-accept the first pending invitation
          await supabase.rpc("accept_invitation", { _invitation_id: pendingInvitations[0].id });
        }
      } catch (err) {
        console.error("Error checking invitations:", err);
      }

      // Now fetch membership (may have been just created by invitation acceptance)
      const { data } = await supabase
        .from("company_memberships")
        .select("company_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setCompanyId(data?.company_id ?? null);
      setCompanyRole((data?.role as "admin" | "member") ?? null);
      setLoading(false);
    };
    fetchMembership();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCompanyId(null);
    setCompanyRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, companyId, companyRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
