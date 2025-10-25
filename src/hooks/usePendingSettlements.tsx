import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface PendingSettlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  group_id: string;
  status: string;
  created_at: string;
  from_profile: {
    full_name: string;
  };
  group: {
    name: string;
  };
}

export const usePendingSettlements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('usePendingSettlements - user:', user?.id);

  const { data: pendingSettlements, isLoading, error } = useQuery({
    queryKey: ['pending-settlements', user?.id],
    queryFn: async (): Promise<PendingSettlement[]> => {
      if (!user) {
        console.log('No user, returning empty array');
        return [];
      }

      console.log('Fetching pending settlements for user:', user.id);

      const { data, error } = await supabase
        .from('settlements')
        .select(`
          id,
          from_user,
          to_user,
          amount,
          group_id,
          status,
          created_at,
          from_profile:profiles!from_user(full_name),
          group:groups(name)
        `)
        .eq('to_user', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Pending settlements data:', data);
      console.log('Pending settlements error:', error);

      if (error) throw error;
      return data as PendingSettlement[];
    },
    enabled: !!user,
  });

  console.log('Pending settlements result:', pendingSettlements);

  const approveSettlement = useMutation({
    mutationFn: async (settlementId: string) => {
      const { error } = await supabase.rpc('approve_settlement', {
        settlement_id: settlementId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Acerto aprovado!",
        description: "O pagamento foi confirmado com sucesso",
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

  const rejectSettlement = useMutation({
    mutationFn: async (settlementId: string) => {
      const { error } = await supabase
        .from('settlements')
        .update({ status: 'rejected' })
        .eq('id', settlementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-settlements'] });
      toast({
        title: "Acerto rejeitado",
        description: "O pagamento foi rejeitado",
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
    pendingSettlements: pendingSettlements || [],
    isLoading,
    approveSettlement: approveSettlement.mutate,
    rejectSettlement: rejectSettlement.mutate,
    isApproving: approveSettlement.isPending,
    isRejecting: rejectSettlement.isPending,
  };
};
