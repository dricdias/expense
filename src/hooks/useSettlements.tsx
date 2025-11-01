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

  const { data: settlements = [], isLoading } = useQuery<Settlement[]>({
    queryKey: ['settlements', groupId],
    queryFn: async (): Promise<Settlement[]> => {
      if (!groupId) return [];

      // Get all expenses and their splits for the group (only unpaid ones)
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          id,
          paid_by,
          amount,
          profiles:paid_by(id, full_name),
          expense_splits(
            user_id,
            share_amount,
            paid,
            profiles:user_id(id, full_name)
          )
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;

      // Calculate balances: positive means they should receive, negative means they owe
      const balances: { [userId: string]: { amount: number; name: string } } = {};

      expenses?.forEach((expense: any) => {
        const paidBy = expense.profiles;
        
        // Person who paid gets credit
        if (!balances[paidBy.id]) {
          balances[paidBy.id] = { amount: 0, name: paidBy.full_name };
        }
        balances[paidBy.id].amount += Number(expense.amount);

        // Each person owes their share (only unpaid splits)
        expense.expense_splits?.forEach((split: any) => {
          // Skip splits that are already paid
          if (split.paid) return;
          
          const userId = split.profiles.id;
          if (!balances[userId]) {
            balances[userId] = { amount: 0, name: split.profiles.full_name };
          }
          balances[userId].amount -= Number(split.share_amount);
        });
      });

      // Calculate settlements using greedy algorithm
      const debtors = Object.entries(balances)
        .filter(([_, data]) => data.amount < 0)
        .map(([id, data]) => ({ id, name: data.name, amount: Math.abs(data.amount) }))
        .sort((a, b) => b.amount - a.amount);

      const creditors = Object.entries(balances)
        .filter(([_, data]) => data.amount > 0)
        .map(([id, data]) => ({ id, name: data.name, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount);

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

      return pendingResults;
    },
    enabled: !!groupId && !!user,
  });

  // Set up realtime subscription for settlements
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
