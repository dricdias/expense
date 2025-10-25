import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

  const createExpense = useMutation({
    mutationFn: async ({ 
      groupId, 
      description, 
      amount, 
      receiptFile 
    }: { 
      groupId: string; 
      description: string; 
      amount: number; 
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
          receipt_url: receiptUrl,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
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

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    isCreating: createExpense.isPending,
  };
};
