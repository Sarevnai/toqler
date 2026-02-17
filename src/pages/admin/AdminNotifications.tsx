import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar notificações", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("platform_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      const { error } = await supabase
        .from("platform_notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "Todas marcadas como lidas" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("platform_notifications").delete().eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Nenhuma notificação pendente"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BellOff className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">Nenhuma notificação</p>
            <p className="text-sm">As notificações da plataforma aparecerão aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={n.is_read ? "opacity-70" : "border-primary/30"}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`mt-0.5 rounded-full p-2 ${n.is_read ? "bg-muted" : "bg-primary/10"}`}>
                    <Bell className={`h-4 w-4 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{n.type}</Badge>
                      {!n.is_read && <Badge className="text-[10px] bg-primary/20 text-primary border-0">Nova</Badge>}
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(n.created_at!).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
