import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  is_active: boolean;
}

interface AdminAuthContext {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAdminAuth(): AdminAuthContext {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    const fetchAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, user_id, role, display_name, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Error fetching admin user:", error);
          setAdminUser(null);
        } else {
          setAdminUser(data as AdminUser | null);
        }
      } catch (err) {
        console.error("Unexpected error fetching admin:", err);
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [user]);

  return { adminUser, isAdmin: !!adminUser, loading };
}
