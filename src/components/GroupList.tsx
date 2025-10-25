import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, DollarSign } from "lucide-react";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { useGroups } from "@/hooks/useGroups";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupListProps {
  onSelectGroup: (groupId: string) => void;
  selectedGroupId: string | null;
}

export const GroupList = ({ onSelectGroup, selectedGroupId }: GroupListProps) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { groups, isLoading } = useGroups();

  const handleAddExpense = (groupId: string) => {
    setSelectedGroup(groupId);
    setShowAddExpense(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-card border-border">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">No groups yet</h3>
            <p className="text-sm text-muted-foreground">Create your first group to start splitting expenses</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group: any) => {
          const memberCount = group.group_members?.[0]?.count || 0;
          const totalExpenses = group.expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0;
          const isSelected = group.id === selectedGroupId;

          return (
            <Card
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`p-6 cursor-pointer transition-all duration-300 ${
                isSelected ? 'bg-primary/10 border-primary shadow-lg' : 'bg-card border-border shadow-smooth hover:shadow-lg hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{group.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Total: ${totalExpenses.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={(e) => { e.stopPropagation(); handleAddExpense(group.id); }} className="w-full bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </Card>
          );
        })}
      </div>
      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} groupId={selectedGroup} />
    </>
  );
};
