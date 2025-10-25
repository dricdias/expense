import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { usePendingSettlements } from "@/hooks/usePendingSettlements";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PendingSettlementsNotification = () => {
  const { 
    pendingSettlements, 
    isLoading, 
    approveSettlement, 
    rejectSettlement,
    isApproving,
    isRejecting 
  } = usePendingSettlements();

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (!pendingSettlements || pendingSettlements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Acertos Pendentes
        </h3>
        <Badge variant="secondary">{pendingSettlements.length}</Badge>
      </div>

      {pendingSettlements.map((settlement) => (
        <Card
          key={settlement.id}
          className="p-6 bg-card border-border shadow-smooth hover:shadow-lg transition-all duration-300"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-primary border-primary">
                    <Clock className="w-3 h-3 mr-1" />
                    Aguardando aprovação
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">
                  Grupo: <span className="font-medium text-foreground">{settlement.group.name}</span>
                </p>
                
                <p className="text-foreground">
                  <span className="font-semibold">{settlement.from_profile.full_name}</span> confirma que pagou
                </p>
                
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(settlement.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                  <DollarSign className="w-6 h-6" />
                  {Number(settlement.amount).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                onClick={() => approveSettlement(settlement.id)}
                disabled={isApproving || isRejecting}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isApproving ? "Aprovando..." : "Confirmar Recebimento"}
              </Button>
              <Button
                onClick={() => rejectSettlement(settlement.id)}
                disabled={isApproving || isRejecting}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isRejecting ? "Rejeitando..." : "Rejeitar"}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
