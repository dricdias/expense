import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each group, calculate unsettled expenses
      const groupsWithBalances = await Promise.all(
        (data || []).map(async (group) => {
          // Get the last approved settlement date
          const { data: lastSettlement } = await supabase
            .from('settlements')
            .select('settled_at')
            .eq('group_id', group.id)
            .eq('status', 'approved')
            .not('settled_at', 'is', null)
            .order('settled_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastSettlementDate = lastSettlement?.settled_at || '1970-01-01';

          // Get expenses created after the last settlement
          const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, created_at')
            .eq('group_id', group.id)
            .gt('created_at', lastSettlementDate);

          const unsettledTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

          return {
            ...group,
            unsettledTotal,
          };
        })
      );

      return groupsWithBalances;
    },
    enabled: !!user,
  });

  // Set up realtime subscription for groups
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createGroup = useMutation({
    mutationFn: async ({ name, description, members }: { name: string; description?: string; members: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: membersError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id });

      if (membersError) throw membersError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Group created!",
        description: "Your group has been created successfully",
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

  const updateGroup = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      const { error } = await supabase
        .from('groups')
        .update({ name })
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Group updated!",
        description: "Your group has been updated successfully",
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

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully",
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
    groups,
    isLoading,
    createGroup: createGroup.mutate,
    updateGroup: updateGroup.mutate,
    deleteGroup: deleteGroup.mutate,
    isCreating: createGroup.isPending,
    isUpdating: updateGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
};
