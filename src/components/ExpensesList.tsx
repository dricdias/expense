import { Card } from "@/components/ui/card";
import { Receipt, Download, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  receipt_url: string | null;
  profiles: {
    full_name: string;
  };
}

interface ExpensesListProps {
  expenses: Expense[];
  isLoading: boolean;
}

export const ExpensesList = ({ expenses, isLoading }: ExpensesListProps) => {
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

  if (!expenses || expenses.length === 0) {
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
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card
          key={expense.id}
          className="p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {expense.description}
                  </h3>
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
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
