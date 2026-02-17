import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  companyId: string | null;
  companySlug: string | null;
  companyRole: "admin" | "member" | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  companyId: null,
  companySlug: null,
  companyRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<"admin" | "member" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Safety timeout: if loading is still true after 10s, release the UI
    timeoutRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("Auth loading timeout reached (10s), releasing UI");
          return false;
        }
        return prev;
      });
    }, 10000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setCompanyId(null);
        setCompanySlug(null);
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

    const fetchMembership = async (retry = false) => {
      // First, check and accept any pending invitations
      try {
        const { data: pendingInvitations } = await supabase.rpc("get_pending_invitations");
        if (pendingInvitations && pendingInvitations.length > 0) {
          await supabase.rpc("accept_invitation", { _invitation_id: pendingInvitations[0].id });
        }
      } catch (err) {
        console.error("Error checking invitations:", err);
      }

      // Now fetch membership
      const { data, error } = await supabase
        .from("company_memberships")
        .select("company_id, role, companies(slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching membership:", error);
        if (!retry) {
          // Retry once after 1 second
          setTimeout(() => fetchMembership(true), 1000);
          return;
        }
      }

      setCompanyId(data?.company_id ?? null);
      setCompanySlug((data?.companies as any)?.slug ?? null);
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
    setCompanySlug(null);
    setCompanyRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, companyId, companySlug, companyRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
