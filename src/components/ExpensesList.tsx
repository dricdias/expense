import { Card } from "@/components/ui/card";
import { Receipt, Download, Calendar, User, CheckCircle2, DollarSign, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  receipt_url: string | null;
  paid_by: string;
  profiles: {
    full_name: string;
  };
  expense_splits?: Array<{
    paid: boolean;
    user_id?: string;
    share_amount?: number;
    profiles: {
      full_name: string;
      id?: string;
    };
  }>;
}

interface Settlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string;
  from_profile: {
    full_name: string;
  };
  to_profile: {
    full_name: string;
  };
}

interface ExpensesListProps {
  expenses: Expense[];
  isLoading: boolean;
  groupId: string;
}

export const ExpensesList = ({ expenses, isLoading, groupId }: ExpensesListProps) => {
  const { user } = useAuth();
  const { deleteExpense, updateExpense } = useExpenses(groupId);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<{ id: string; description: string; amount: number } | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // Fetch approved settlements for this group
  const { data: settlements } = useQuery({
    queryKey: ['approved-settlements', groupId],
    queryFn: async (): Promise<Settlement[]> => {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          id,
          from_user,
          to_user,
          amount,
          settled_at,
          from_profile:profiles!from_user(full_name),
          to_profile:profiles!to_user(full_name)
        `)
        .eq('group_id', groupId)
        .eq('status', 'approved')
        .not('settled_at', 'is', null);

      if (error) throw error;
      return data as Settlement[];
    },
    enabled: !!groupId,
  });

  const handleDeleteConfirm = () => {
    if (deleteExpenseId) {
      deleteExpense(deleteExpenseId);
      setDeleteExpenseId(null);
    }
  };

  const handleEditSubmit = () => {
    if (editExpense && editDescription && editAmount) {
      updateExpense({
        expenseId: editExpense.id,
        description: editDescription,
        amount: parseFloat(editAmount),
      });
      setEditExpense(null);
    }
  };

  // Combine and sort expenses and settlements chronologically
  const combinedItems = [
    ...(expenses || []).map(exp => ({ 
      type: 'expense' as const, 
      date: new Date(exp.created_at), 
      data: exp 
    })),
    ...(settlements || []).map(settlement => ({ 
      type: 'settlement' as const, 
      date: new Date(settlement.settled_at), 
      data: settlement 
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-card border-border">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (combinedItems.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Nenhuma despesa
            </h3>
            <p className="text-sm text-muted-foreground">
              Adicione despesas ao grupo para começar
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {combinedItems.map((item) => {
          if (item.type === 'settlement') {
            const settlement = item.data as Settlement;
            return (
              <Card key={settlement.id} className="p-6 bg-accent/5 border-accent/20 border-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        <span className="text-primary">{settlement.from_profile.full_name}</span>
                        {' pagou '}
                        <span className="text-accent">{settlement.to_profile.full_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(settlement.settled_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    ${Number(settlement.amount).toFixed(2)}
                  </Badge>
                </div>
              </Card>
            );
          } else {
            const expense = item.data as Expense;
            const allPaid = expense.expense_splits?.every(split => split.paid) ?? false;
            const isCreator = user?.id === expense.paid_by;
            
            return (
              <Card
                key={expense.id}
                className={`p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300 ${
                  allPaid ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${
                        allPaid ? 'bg-accent/10' : 'bg-primary/10'
                      } flex items-center justify-center flex-shrink-0`}>
                        {allPaid ? (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        ) : (
                          <Receipt className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {expense.description}
                          </h3>
                          {allPaid && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pago
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Pago por {expense.profiles.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(expense.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${Number(expense.amount).toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {expense.receipt_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a 
                            href={expense.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Download className="w-4 h-4" />
                            Ver Anexo
                          </a>
                        </Button>
                      )}
                      {isCreator && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditExpense({
                                id: expense.id,
                                description: expense.description,
                                amount: expense.amount,
                              });
                              setEditDescription(expense.description);
                              setEditAmount(expense.amount.toString());
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteExpenseId(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          }
        })}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A despesa será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da despesa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExpense(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
