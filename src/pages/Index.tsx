import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users, Receipt, TrendingUp, LogOut } from "lucide-react";
import { GroupList } from "@/components/GroupList";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const { groups, isLoading: groupsLoading } = useGroups();
  const navigate = useNavigate();

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
  const totalExpenses = groups?.reduce((sum, group: any) => {
    const groupTotal = group.expenses?.reduce((expSum: number, exp: any) => expSum + Number(exp.amount), 0) || 0;
    return sum + groupTotal;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
            <div>
              <h1 className="text-2xl font-bold">RachaDespesas</h1>
              <p className="text-sm text-primary-foreground/80">Split expenses easily</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCreateGroup(true)}
              size="lg"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 border"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Group
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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
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

        {/* Groups and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Your Groups</h2>
            <GroupList onSelectGroup={setSelectedGroupId} selectedGroupId={selectedGroupId} />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Payment Summary</h2>
            <ExpenseSummary groupId={selectedGroupId} />
          </div>
        </div>
      </main>

      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} />
    </div>
  );
};

export default Index;
