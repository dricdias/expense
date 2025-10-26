import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users, Receipt, ArrowRight, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { Navbar } from "@/components/Navbar";
import { useGroups } from "@/hooks/useGroups";
import { useAllGroupsBalance } from "@/hooks/useGroupBalance";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Groups = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { groups, isLoading } = useGroups();
  const { data: balanceData, isLoading: balanceLoading } = useAllGroupsBalance();
  const navigate = useNavigate();

  const totalUnsettled = balanceData?.totalUnsettled || 0;
  const userBalance = balanceData?.totalBalance || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Meus Grupos</h2>
          <Button 
            onClick={() => setShowCreateGroup(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Grupo
          </Button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card shadow-smooth hover:shadow-lg transition-all duration-300 border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupos Ativos</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{groups?.length || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card shadow-smooth hover:shadow-lg transition-all duration-300 border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas Pendentes</p>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">${totalUnsettled.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className={`p-6 shadow-smooth hover:shadow-lg transition-all duration-300 ${
            userBalance >= 0 ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                userBalance >= 0 ? 'bg-accent/10' : 'bg-destructive/10'
              }`}>
                {userBalance >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-accent" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {userBalance >= 0 ? 'A Receber' : 'A Pagar'}
                </p>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className={`text-2xl font-bold ${
                    userBalance >= 0 ? 'text-accent' : 'text-destructive'
                  }`}>
                    ${Math.abs(userBalance).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div>
          
          {isLoading ? (
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
                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {group.name}
                        </h3>
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
