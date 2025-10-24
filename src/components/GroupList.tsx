import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface GroupListProps {
  onSelectGroup: (groupId: string) => void;
  selectedGroupId: string | null;
}

export const GroupList = ({ onSelectGroup, selectedGroupId }: GroupListProps) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Mock data - será substituído pelo backend
  const groups = [
    { id: "1", name: "Viagem Floripa", members: 4, totalExpenses: 1247.50 },
    { id: "2", name: "Churrasco Família", members: 8, totalExpenses: 456.00 },
    { id: "3", name: "Despesas Casa", members: 3, totalExpenses: 2843.75 },
  ];

  const handleAddExpense = (groupId: string) => {
    setSelectedGroup(groupId);
    setShowAddExpense(true);
  };

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedGroupId === group.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
            onClick={() => onSelectGroup(group.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.members} membros</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {group.totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAddExpense(group.id);
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Despesa
            </Button>
          </Card>
        ))}
      </div>

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        groupId={selectedGroup}
      />
    </>
  );
};
