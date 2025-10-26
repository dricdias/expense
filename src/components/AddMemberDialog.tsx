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

  // Search users by name
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchTerm}%`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Busque por nome para convidar usuários ao grupo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Digite o nome..."
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
                        {isAlreadyMember && (
                          <p className="text-xs text-muted-foreground">Já é membro</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleInviteUser(user.id)}
                      disabled={isSending || isAlreadyMember}
                      size="sm"
                    >
                      {isAlreadyMember ? "Membro" : "Convidar"}
                    </Button>
                  </div>
                );
              })
            )}

            {!isLoading && searchTerm.length >= 2 && (!searchResults || searchResults.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
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
