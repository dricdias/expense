import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Users } from "lucide-react";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { Skeleton } from "@/components/ui/skeleton";

export const GroupInvitesNotification = () => {
  const { pendingInvites, isLoading, respondToInvite, isResponding } = useGroupInvites();

  if (isLoading) {
    return (
      <div className="mb-6">
        <Card className="p-4">
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
    );
  }

  if (!pendingInvites || pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {pendingInvites.map((invite: any) => {
        const inviterName = invite.invited_by_profile?.full_name || "Usuário";
        const inviterInitials = inviterName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        
        return (
          <Card key={invite.id} className="p-4 sm:p-6 bg-primary/5 border-primary/20 border-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    Convite para grupo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{inviterName}</span> convidou você para o grupo{" "}
                    <span className="font-medium">{invite.group?.name}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => respondToInvite({ inviteId: invite.id, status: 'approved' })}
                  disabled={isResponding}
                  className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
                <Button
                  onClick={() => respondToInvite({ inviteId: invite.id, status: 'rejected' })}
                  disabled={isResponding}
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                >
                  <X className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
