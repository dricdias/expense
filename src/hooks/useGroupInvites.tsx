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

      const { data: invites, error } = await supabase
        .from('group_invites')
        .select('*, group:groups(name)')
        .or(`invited_user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!invites || invites.length === 0) return [];

      // Fetch profiles for inviters
      const inviterIds = invites.map((invite: any) => invite.invited_by);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', inviterIds);

      if (profileError) throw profileError;

      // Combine data
      return invites.map((invite: any) => ({
        ...invite,
        invited_by_profile: profiles?.find((p: any) => p.id === invite.invited_by)
      }));
    },
    enabled: !!user,
  });

  // Set up realtime subscription for invites
  useEffect(() => {
    if (!user) return;

    const channelById = supabase
      .channel('group-invites-by-id')
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

    const channelByEmail = user.email
      ? supabase
          .channel('group-invites-by-email')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'group_invites',
              filter: `invited_email=eq.${user.email}`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['group-invites'] });
            }
          )
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(channelById);
      if (channelByEmail) supabase.removeChannel(channelByEmail);
    };
  }, [user, queryClient]);

  const respondToInvite = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string; status: 'approved' | 'rejected' }) => {
      console.log('Responding to invite:', { inviteId, status });
      
      const { error } = await supabase
        .from('group_invites')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) {
        console.error('Error responding to invite:', error);
        throw error;
      }
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
    mutationFn: async ({ groupId, userId, email }: { groupId: string; userId?: string; email?: string }) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Sending invite:', { groupId, userId, email, invitedBy: user.id });

      const { data: groupCreator } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .maybeSingle();

      const isCreator = groupCreator?.created_by === user.id;

      let isMember = false;
      if (!isCreator) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();
        isMember = !!membership;
      }

      if (!isCreator && !isMember) {
        throw new Error('Você precisa ser membro ou criador do grupo para enviar convites.');
      }

      const { error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          invited_user_id: userId ?? null,
          invited_email: email ? email.toLowerCase() : null,
          invited_by: user.id,
        });

      if (error) {
        console.error('Error sending invite:', error);
        throw error;
      }

      console.log('Invite created');

      // Se for convite por e-mail, enviar webhook (não bloquear em caso de falha)
      if (email) {
        const payload = {
          event: 'group_invite_created',
          group_id: groupId,
          invited_email: email.toLowerCase(),
          invited_by: user.id,
          status: 'pending',
          app_url: typeof window !== 'undefined' ? window.location.origin : undefined,
          timestamp: new Date().toISOString(),
        };

        // Preferir Edge Function em produção; manter proxy em desenvolvimento
        const useEdge = import.meta.env.VITE_USE_EDGE_FUNCTIONS === 'true';
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        const webhookUrl = isLocalhost
          ? '/webhook/expense'
          : 'https://webhook.agilitytecno.com/webhook/expense';

        try {
          if (useEdge) {
            const { error } = await supabase.functions.invoke('invite-webhook', {
              body: payload,
            });
            if (error) throw error;
            console.log('Webhook dispatched via Edge Function', payload);
          } else {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              mode: isLocalhost ? 'cors' : 'no-cors',
              body: JSON.stringify(payload),
            });
            console.log('Webhook dispatched via proxy/direct', { url: webhookUrl, payload });
          }
        } catch (err) {
          console.warn('Falha ao enviar webhook de convite:', err);
          // Fallback: tenta via proxy se a Edge Function falhar
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              mode: isLocalhost ? 'cors' : 'no-cors',
              body: JSON.stringify(payload),
            });
            console.log('Webhook fallback dispatched via proxy/direct', { url: webhookUrl, payload });
          } catch (fallbackErr) {
            console.warn('Fallback também falhou ao enviar webhook:', fallbackErr);
            toast({
              title: 'Aviso',
              description: 'Convite criado, mas o webhook não pôde ser enviado.',
            });
          }
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({
        title: 'Convite enviado!',
        description: variables?.email
          ? 'Webhook enviado para notificar o convite por e-mail.'
          : 'Se for por e-mail, a pessoa verá o convite ao se cadastrar',
      });
    },
    onError: (error: any) => {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('violates') && msg.includes('row level security')) {
        toast({
          title: 'Sem permissão',
          description: 'Você precisa ser membro ou criador do grupo para enviar convites.',
          variant: 'destructive',
        });
      } else if (msg.includes('duplicate')) {
        toast({
          title: "Erro",
          description: "Já existe um convite pendente para este usuário/email neste grupo",
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
