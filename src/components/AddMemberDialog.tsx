import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendGroupInvite } from "@/hooks/useGroupInvites";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { toast } from "@/hooks/use-toast";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
}

export const AddMemberDialog = ({ open, onOpenChange, groupId }: AddMemberDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { sendInvite, isSending } = useSendGroupInvite();
  const { members } = useGroupMembers(groupId);

  // Get member IDs to check if user is already a member
  const memberIds = members?.map((m: any) => m.user_id) || [];

  const { data: pendingInvitesData, isLoading: pendingLoading } = useQuery({
    queryKey: ['group-pending-invites', groupId],
    queryFn: async () => {
      if (!groupId) return [] as any[];
      const { data, error } = await supabase
        .from('group_invites')
        .select('invited_user_id, invited_email, status')
        .eq('group_id', groupId)
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });

  const pendingUserIds = (pendingInvitesData || [])
    .map((i: any) => i.invited_user_id)
    .filter((v: any) => !!v);
  const pendingEmails = (pendingInvitesData || [])
    .map((i: any) => (i.invited_email ? String(i.invited_email).toLowerCase() : null))
    .filter((v: any) => !!v);

  // Search users by name or email
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });

  const handleInviteUser = (userId: string) => {
    if (!groupId) return;
    
    sendInvite({ groupId, userId }, {
      onSuccess: () => {
        setSearchTerm("");
        onOpenChange(false);
      }
    });
  };

  const isEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleInviteByEmail = () => {
    if (!groupId || !isEmail(searchTerm)) return;
    const email = searchTerm.toLowerCase();
    sendInvite({ groupId, email }, {
      onSuccess: () => {
        // Evitar abrir cliente de e-mail para não escurecer/navegar o preview
        toast({
          title: "Convite enviado",
          description: `Convite enviado para ${email}. Ao se cadastrar, a pessoa verá o convite em Grupos.`
        });
        setSearchTerm("");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Busque por nome ou email para convidar usuários ao grupo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!isLoading && searchResults && searchResults.length > 0 && (
              searchResults.map((user: any) => {
                const initials = (user.full_name || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isAlreadyMember = memberIds.includes(user.id);
                const hasPendingInvite = pendingUserIds.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {isAlreadyMember && (
                          <p className="text-xs text-muted-foreground">Já é membro</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleInviteUser(user.id)}
                      disabled={isSending || isAlreadyMember || hasPendingInvite}
                      size="sm"
                    >
                      {isAlreadyMember ? "Membro" : hasPendingInvite ? "Pendente" : "Convidar"}
                    </Button>
                  </div>
                );
              })
            )}

            {!isLoading && searchTerm.length >= 2 && (!searchResults || searchResults.length === 0) && (
              <div className="space-y-3 py-4">
                <p className="text-center text-muted-foreground">Nenhum usuário encontrado</p>
                {isEmail(searchTerm) && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Convidar por e-mail</p>
                      <p className="text-xs text-muted-foreground">{searchTerm.toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        A pessoa receberá o convite ao se cadastrar com este e-mail.
                      </p>
                    </div>
                    <Button onClick={handleInviteByEmail} disabled={isSending || pendingEmails.includes(searchTerm.toLowerCase())} size="sm">
                      {pendingEmails.includes(searchTerm.toLowerCase()) ? "Pendente" : "Enviar convite"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {searchTerm.length < 2 && (
              <p className="text-center text-muted-foreground py-8">
                Digite ao menos 2 caracteres para buscar
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
