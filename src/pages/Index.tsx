import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Receipt, TrendingUp, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { groups, isLoading: groupsLoading } = useGroups();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user) {
      navigate('/groups');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalGroups = groups?.length || 0;
  const totalExpenses = groups?.reduce((sum, group: any) => {
    const groupTotal = group.expenses?.reduce((expSum: number, exp: any) => expSum + Number(exp.amount), 0) || 0;
    return sum + groupTotal;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo!</h1>
          <p className="text-lg text-muted-foreground">Gerencie suas despesas compartilhadas facilmente</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card shadow-smooth hover:shadow-lg transition-all duration-300 border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Groups</p>
                {groupsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{totalGroups}</p>
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
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                {groupsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card shadow-smooth hover:shadow-lg transition-all duration-300 border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To Receive</p>
                <p className="text-2xl font-bold text-accent">$0.00</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Groups */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Grupos Recentes</h2>
            <Button variant="outline" onClick={() => navigate('/groups')}>
              Ver Todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 bg-card border-border">
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {groups.slice(0, 3).map((group: any) => {
                const memberCount = group.group_members?.length || 0;
                const totalAmount = group.expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0;

                return (
                  <Card
                    key={group.id}
                    className="p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{memberCount}</span>
                      </div>
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
                    Crie seu primeiro grupo para começar
                  </p>
                  <Button onClick={() => navigate('/groups')}>
                    Começar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
