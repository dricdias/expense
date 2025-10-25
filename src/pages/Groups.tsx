import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users, Receipt, ArrowRight, LogOut } from "lucide-react";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Groups = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { user, signOut } = useAuth();
  const { groups, isLoading } = useGroups();
  const navigate = useNavigate();

  const totalExpenses = groups?.reduce((sum, group: any) => {
    const groupTotal = group.expenses?.reduce((expSum: number, exp: any) => expSum + Number(exp.amount), 0) || 0;
    return sum + groupTotal;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RachaDespesas</h1>
                <p className="text-sm text-primary-foreground/80">Seus Grupos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateGroup(true)}
                size="lg"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 border"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Grupo
              </Button>
              <Button 
                onClick={signOut}
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <p className="text-sm text-muted-foreground">Total de Despesas</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Groups List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Meus Grupos</h2>
          
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
                const memberCount = group.group_members?.length || 0;
                const expenseCount = group.expenses?.length || 0;
                const totalAmount = group.expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0;

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
                          <div className="flex items-center gap-1">
                            <Receipt className="w-4 h-4" />
                            <span>{expenseCount} {expenseCount === 1 ? 'despesa' : 'despesas'}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-lg font-bold text-foreground">${totalAmount.toFixed(2)}</span>
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
