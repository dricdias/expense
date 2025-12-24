import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const useExpenses = (groupId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles:paid_by(full_name),
          expense_splits(
            share_amount,
            paid,
            profiles:user_id(id, full_name)
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!groupId && !!user,
  });

  // Set up realtime subscription for expenses
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`expenses-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
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
          queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  const createExpense = useMutation({
    mutationFn: async ({ 
      groupId, 
      description, 
      amount, 
      expenseDate,
      receiptFile 
    }: { 
      groupId: string; 
      description: string; 
      amount: number; 
      expenseDate: string;
      receiptFile?: File 
    }) => {
      if (!user) throw new Error('Not authenticated');

      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        receiptUrl = publicUrl;
      }

      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          paid_by: user.id,
          description,
          amount,
          expense_date: expenseDate,
          receipt_url: receiptUrl,
        })
        .select()
        .single();

      if (expenseError) {
        const msg = expenseError.message?.toLowerCase() || "";
        const isSchemaCacheIssue = msg.includes("schema cache") || msg.includes("expense_date");
        if (isSchemaCacheIssue) {
          // Retry without expense_date to avoid blocking while migration isn't applied
          const { data: fallbackExpense, error: fallbackError } = await supabase
            .from('expenses')
            .insert({
              group_id: groupId,
              paid_by: user.id,
              description,
              amount,
              receipt_url: receiptUrl,
            })
            .select()
            .single();

          if (fallbackError) throw fallbackError;

          toast({
            title: "Coluna de data indisponível",
            description: "Aplicaremos a migration e atualizaremos a criação de data em seguida.",
          });

          return fallbackExpense;
        }
        throw expenseError;
      }

      return expense;
    },
    onSuccess: (_data, variables) => {
      // Precisamos garantir que as queries específicas do grupo sejam invalidadas
      const gid = (variables as { groupId: string }).groupId;
      if (gid) {
        queryClient.invalidateQueries({ queryKey: ['expenses', gid] });
        queryClient.invalidateQueries({ queryKey: ['settlements', gid] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['settlements'] });
      }
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Expense added!",
        description: "The expense has been recorded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast({
        title: "Despesa excluída!",
        description: "A despesa foi removida com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ 
      expenseId, 
      description, 
      amount 
    }: { 
      expenseId: string; 
      description: string; 
      amount: number; 
    }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ description, amount })
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast({
        title: "Despesa atualizada!",
        description: "A despesa foi atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    isCreating: createExpense.isPending,
    deleteExpense: deleteExpense.mutate,
    isDeleting: deleteExpense.isPending,
    updateExpense: updateExpense.mutate,
    isUpdating: updateExpense.isPending,
  };
};
