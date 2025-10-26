import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const useGroupInvites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get pending invites for current user
  const { data: pendingInvites, isLoading } = useQuery({
    queryKey: ['group-invites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('group_invites')
        .select(`
          *,
          group:groups(name),
          invited_by_profile:profiles!invited_by(full_name, avatar_url)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Set up realtime subscription for invites
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('group-invites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_invites',
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-invites'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const respondToInvite = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('group_invites')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      
      toast({
        title: variables.status === 'approved' ? "Convite aceito!" : "Convite recusado",
        description: variables.status === 'approved' 
          ? "Você agora faz parte do grupo" 
          : "O convite foi recusado",
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
    pendingInvites,
    isLoading,
    respondToInvite: respondToInvite.mutate,
    isResponding: respondToInvite.isPending,
  };
};

export const useSendGroupInvite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const sendInvite = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          invited_user_id: userId,
          invited_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({
        title: "Convite enviado!",
        description: "O usuário receberá uma notificação para aceitar o convite",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast({
          title: "Erro",
          description: "Este usuário já foi convidado para este grupo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  return {
    sendInvite: sendInvite.mutate,
    isSending: sendInvite.isPending,
  };
};
