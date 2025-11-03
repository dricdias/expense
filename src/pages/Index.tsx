import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Receipt, TrendingUp, TrendingDown, ArrowRight, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PendingSettlementsNotification } from "@/components/PendingSettlementsNotification";
import { GroupInvitesNotification } from "@/components/GroupInvitesNotification";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useAllGroupsBalance } from "@/hooks/useGroupBalance";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { groups, isLoading: groupsLoading } = useGroups();
  const { data: balanceData, isLoading: balanceLoading } = useAllGroupsBalance();
  const navigate = useNavigate();
  const [createType, setCreateType] = useState<"split" | "reimbursement" | null>(null);

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
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalGroups = groups?.length || 0;
  const totalUnsettled = balanceData?.totalUnsettled || 0;
  const userBalance = balanceData?.totalBalance || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Visão geral das suas despesas e grupos</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setCreateType("split")}
              size="lg"
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo grupo divisão de despesas
            </Button>
            <Button 
              onClick={() => setCreateType("reimbursement")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo grupo de reembolso
            </Button>
          </div>
        </div>

        {/* Pending Settlements */}
        <PendingSettlementsNotification />

        {/* Group Invites Notification */}
        <GroupInvitesNotification />
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card shadow-smooth hover:shadow-lg transition-all duration-300 border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupos Ativos</p>
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
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">${totalUnsettled.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className={`p-6 shadow-smooth hover:shadow-lg transition-all duration-300 ${
            userBalance >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                userBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                {userBalance >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                    userBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    ${Math.abs(userBalance).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* CTA para Grupos */}
        <div className="mt-8">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Atalhos</h3>
                <p className="text-sm text-muted-foreground">Acesse rapidamente áreas do app</p>
              </div>
              <Button onClick={() => navigate('/groups')}>
                Ir para Grupos
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <CreateGroupDialog 
        open={createType !== null} 
        onOpenChange={(open) => setCreateType(open ? (createType ?? "split") : null)} 
        defaultType={createType ?? "split"}
      />
    </div>
  );
};

export default Index;
