import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GroupInvitesNotification } from "@/components/GroupInvitesNotification";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Groups = () => {
  const { user, loading: authLoading } = useAuth();
  const { groups, isLoading: groupsLoading } = useGroups();
  const navigate = useNavigate();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Meus Grupos</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Veja e gerencie seus grupos</p>
          </div>
          <Button 
            onClick={() => setShowCreateGroup(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Grupo
          </Button>
        </div>

        {/* Convites de grupos */}
        <GroupInvitesNotification />

        {/* Lista de grupos */}
        <div className="mt-8">
          {groupsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 bg-card border-border">
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group: any) => {
                const memberCount = group.group_members?.[0]?.count || 0;
                const unsettledTotal = group.unsettledTotal || 0;

                return (
                  <Card
                    key={group.id}
                    className="p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {group.name}
                          </h3>
                          {group.type && (
                            <Badge variant={group.type === 'reimbursement' ? 'destructive' : 'secondary'}>
                              {group.type === 'reimbursement' ? 'Reembolso' : 'Divisão'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Despesas Pendentes</span>
                        <span className="text-lg font-bold text-foreground">${unsettledTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-card border-border">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Nenhum grupo ainda
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro grupo para começar a dividir despesas
                  </p>
                  <Button onClick={() => setShowCreateGroup(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Grupo
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} />
    </div>
  );
};

export default Groups;