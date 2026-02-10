import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareProfileDialog() {
  const { companyId } = useAuth();
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("profiles")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("published", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProfiles(data);
          setSelectedId(data[0].id);
        }
      });
  }, [companyId]);

  const profileUrl = selectedId ? `${window.location.origin}/p/${selectedId}` : "";
  const qrUrl = selectedId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}` : "";

  const copyUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar perfil</DialogTitle>
        </DialogHeader>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum perfil publicado encontrado.</p>
        ) : (
          <div className="space-y-4">
            {profiles.length > 1 && (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {qrUrl && (
              <div className="flex justify-center">
                <img src={qrUrl} alt="QR Code" className="rounded-lg" width={200} height={200} />
              </div>
            )}
            <div className="flex gap-2">
              <Input value={profileUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
