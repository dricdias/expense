import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GroupBalance {
  groupId: string;
  unsettledExpenses: number;
  userBalance: number; // positive = to receive, negative = to pay
}

export const useGroupBalance = (groupId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-balance', groupId, user?.id],
    queryFn: async (): Promise<GroupBalance> => {
      if (!groupId || !user) {
        return { groupId: '', unsettledExpenses: 0, userBalance: 0 };
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

      // Get expenses created after the last settlement
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          paid_by,
          created_at,
          expense_splits(
            user_id,
            share_amount,
            paid
          )
        `)
        .eq('group_id', groupId)
        .gt('created_at', lastSettlementDate);

      if (expensesError) throw expensesError;

      const unsettledExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      // Calculate user balance
      let userBalance = 0;

      expenses?.forEach((expense) => {
        // If user paid, they should receive their share back from others
        if (expense.paid_by === user.id) {
          const userSplit = expense.expense_splits?.find((split: any) => split.user_id === user.id);
          const userShare = Number(userSplit?.share_amount || 0);
          const totalAmount = Number(expense.amount);
          userBalance += (totalAmount - userShare); // They receive everything except their own share
        } else {
          // If user didn't pay, they owe their share
          const userSplit = expense.expense_splits?.find((split: any) => split.user_id === user.id);
          if (userSplit && !userSplit.paid) {
            userBalance -= Number(userSplit.share_amount);
          }
        }
      });

      return {
        groupId,
        unsettledExpenses,
        userBalance,
      };
    },
    enabled: !!groupId && !!user,
  });
};

export const useAllGroupsBalance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-groups-balance', user?.id],
    queryFn: async (): Promise<{ totalUnsettled: number; totalBalance: number }> => {
      if (!user) {
        return { totalUnsettled: 0, totalBalance: 0 };
      }

      // Get all groups the user is part of
      const { data: groups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupsError) throw groupsError;

      let totalUnsettled = 0;
      let totalBalance = 0;

      for (const group of groups || []) {
        // Get the last approved settlement date for this group
        const { data: lastSettlement } = await supabase
          .from('settlements')
          .select('settled_at')
          .eq('group_id', group.group_id)
          .eq('status', 'approved')
          .not('settled_at', 'is', null)
          .order('settled_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastSettlementDate = lastSettlement?.settled_at || '1970-01-01';

        // Get expenses created after the last settlement
        const { data: expenses } = await supabase
          .from('expenses')
          .select(`
            id,
            amount,
            paid_by,
            created_at,
            expense_splits(
              user_id,
              share_amount,
              paid
            )
          `)
          .eq('group_id', group.group_id)
          .gt('created_at', lastSettlementDate);

        const groupUnsettled = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        totalUnsettled += groupUnsettled;

        // Calculate user balance for this group
        expenses?.forEach((expense) => {
          if (expense.paid_by === user.id) {
            const userSplit = expense.expense_splits?.find((split: any) => split.user_id === user.id);
            const userShare = Number(userSplit?.share_amount || 0);
            const totalAmount = Number(expense.amount);
            totalBalance += (totalAmount - userShare);
          } else {
            const userSplit = expense.expense_splits?.find((split: any) => split.user_id === user.id);
            if (userSplit && !userSplit.paid) {
              totalBalance -= Number(userSplit.share_amount);
            }
          }
        });
      }

      return { totalUnsettled, totalBalance };
    },
    enabled: !!user,
  });
};
