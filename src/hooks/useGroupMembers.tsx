import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGroupMembers = (groupId: string | null) => {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles:user_id(id, full_name, avatar_url)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({
        title: "Member added!",
        description: "The member has been added to the group",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the group",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    members: members || [],
    isLoading,
    addMember: addMember.mutate,
    removeMember: removeMember.mutate,
    isAdding: addMember.isPending,
    isRemoving: removeMember.isPending,
  };
};

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: ['search-users', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 3) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 3,
  });
};
