import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseSummaryProps {
  groupId: string | null;
}

export const ExpenseSummary = ({ groupId }: ExpenseSummaryProps) => {
  const { settlements, isLoading, markAsPaid, isMarking } = useSettlements(groupId);
  const { user } = useAuth();

  const handleMarkAsPaid = () => {
    if (settlements.length > 0) {
      markAsPaid(settlements);
    }
  };

  // Check if current user has any debts to pay
  const userHasDebts = settlements.some(s => s.fromId === user?.id);

  if (!groupId) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Select a group
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose a group to see payment summary
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6 bg-card border-border">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                All settled!
              </h3>
              <p className="text-sm text-muted-foreground">
                No pending payments in this group
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {settlements.map((settlement, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* From User */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-destructive">
                      {settlement.from[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{settlement.from}</p>
                    <p className="text-sm text-muted-foreground">deve pagar</p>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-muted-foreground mx-auto sm:mx-4 rotate-90 sm:rotate-0 flex-shrink-0" />

                {/* To User */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-accent">
                      {settlement.to[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{settlement.to}</p>
                    <p className="text-sm text-muted-foreground">vai receber</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center sm:text-right sm:ml-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                  <p className="text-2xl sm:text-xl font-bold text-accent">
                    ${settlement.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {userHasDebts && (
            <Button 
              className="w-full mt-6 bg-accent hover:bg-accent/90" 
              size="lg"
              onClick={handleMarkAsPaid}
              disabled={isMarking}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {isMarking ? "Processando..." : "Confirmar que Paguei"}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
