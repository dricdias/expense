import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(count),
          expenses(amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async ({ name, description, members }: { name: string; description?: string; members: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      // Create group
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

      // Add creator as member
      const memberInserts = [
        { group_id: group.id, user_id: user.id },
        ...members.map(email => ({ group_id: group.id, user_id: email }))
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

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

  return {
    groups,
    isLoading,
    createGroup: createGroup.mutate,
    isCreating: createGroup.isPending,
  };
};
