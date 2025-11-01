import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromId: string;
  toId: string;
  status?: 'pending' | 'approved' | 'rejected';
  settled_at?: string;
  id?: string;
}

export const useSettlements = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('=== useSettlements hook called ===', { groupId, user: user?.id });

  const { data: settlements = [], isLoading } = useQuery<Settlement[]>({
    queryKey: ['settlements', groupId],
    queryFn: async (): Promise<Settlement[]> => {
      console.log('=== useSettlements queryFn starting ===', { groupId });
      if (!groupId) {
        console.log('No groupId, returning empty');
        return [];
      }

      // Get the last approved settlement date for this group
      const { data: lastSettlement } = await supabase
        .from('settlements')
        .select('settled_at')
        .eq('group_id', groupId)
        .eq('status', 'approved')
        .not('settled_at', 'is', null)
        .order('settled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastSettlementDate = lastSettlement?.settled_at || '1970-01-01';

      console.log('Last settlement date:', lastSettlementDate);

      // Get all expenses and their splits for the group created after the last settlement (only unpaid ones)
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          id,
          paid_by,
          amount,
          created_at,
          profiles:paid_by(id, full_name),
          expense_splits(
            user_id,
            share_amount,
            paid,
            profiles:user_id(id, full_name)
          )
        `)
        .eq('group_id', groupId)
        .gt('created_at', lastSettlementDate);

      console.log('Expenses query completed:', { 
        hasError: !!error, 
        expensesCount: expenses?.length || 0,
        expenses: expenses?.map(e => ({
          id: e.id,
          amount: e.amount,
          splits: e.expense_splits?.length
        }))
      });
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Calculate balances: positive means they should receive, negative means they owe
      const balances: { [userId: string]: { amount: number; name: string } } = {};

      expenses?.forEach((expense: any) => {
        const paidBy = expense.profiles;

        // Creditar ao pagador apenas o total que os outros devem (splits não pagos)
        let creditedAmount = 0;

        expense.expense_splits?.forEach((split: any) => {
          // Ignorar splits já pagos
          if (split.paid) return;

          const splitUserId = split.profiles.id;
          const splitUserName = split.profiles.full_name;

          // Se o usuário do split não for o pagador, ele deve sua parte
          if (splitUserId !== paidBy.id) {
            creditedAmount += Number(split.share_amount);

            if (!balances[splitUserId]) {
              balances[splitUserId] = { amount: 0, name: splitUserName };
            }
            balances[splitUserId].amount -= Number(split.share_amount);
          }
        });

        // Pagador recebe crédito igual ao que os outros devem
        if (!balances[paidBy.id]) {
          balances[paidBy.id] = { amount: 0, name: paidBy.full_name };
        }
        balances[paidBy.id].amount += creditedAmount;
      });

      console.log('Balances calculated:', balances);

      // Calculate settlements using greedy algorithm
      const debtors = Object.entries(balances)
        .filter(([_, data]) => data.amount < 0)
        .map(([id, data]) => ({ id, name: data.name, amount: Math.abs(data.amount) }))
        .sort((a, b) => b.amount - a.amount);

      const creditors = Object.entries(balances)
        .filter(([_, data]) => data.amount > 0)
        .map(([id, data]) => ({ id, name: data.name, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount);

      console.log('Debtors and Creditors:', { debtors, creditors });

      const pendingResults: Settlement[] = [];

      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i].amount;
        const credit = creditors[j].amount;
        const settled = Math.min(debt, credit);

        if (settled > 0.01) {
          pendingResults.push({
            from: debtors[i].name,
            to: creditors[j].name,
            amount: settled,
            fromId: debtors[i].id,
            toId: creditors[j].id,
          });
        }

        debtors[i].amount -= settled;
        creditors[j].amount -= settled;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
      }

      console.log('Settlements result:', pendingResults);
      return pendingResults;
    },
    enabled: !!groupId && !!user,
  });

  // Set up realtime subscription for settlements and expenses
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`settlements-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
          queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_splits',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  const markSettlementsAsPaid = useMutation({
    mutationFn: async (settlementsList: Settlement[]) => {
      if (!groupId) throw new Error('Group ID is required');

      // Insert settlements into the database with pending status
      const settlementsToInsert = settlementsList.map(settlement => ({
        group_id: groupId,
        from_user: settlement.fromId,
        to_user: settlement.toId,
        amount: settlement.amount,
        settled: false, // Not settled yet, waiting for approval
        status: 'pending',
      }));

      const { error } = await supabase
        .from('settlements')
        .insert(settlementsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['pending-settlements'] });
      toast({
        title: "Solicitação enviada!",
        description: "Aguardando aprovação de quem vai receber o pagamento",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settlements: settlements || [],
    isLoading,
    markAsPaid: markSettlementsAsPaid.mutate,
    isMarking: markSettlementsAsPaid.isPending,
  };
};
