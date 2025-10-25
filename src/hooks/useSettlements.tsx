import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromId: string;
  toId: string;
}

export const useSettlements = (groupId: string | null) => {
  const { user } = useAuth();

  const { data: settlements, isLoading } = useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async (): Promise<Settlement[]> => {
      if (!groupId) return [];

      // Get all expenses and their splits for the group
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

        // Each person owes their share
        expense.expense_splits?.forEach((split: any) => {
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

      const result: Settlement[] = [];

      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i].amount;
        const credit = creditors[j].amount;
        const settled = Math.min(debt, credit);

        if (settled > 0.01) {
          result.push({
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

      return result;
    },
    enabled: !!groupId && !!user,
  });

  return {
    settlements: settlements || [],
    isLoading,
  };
};
