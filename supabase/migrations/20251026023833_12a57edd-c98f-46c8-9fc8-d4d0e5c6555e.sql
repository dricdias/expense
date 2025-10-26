-- Drop todas as políticas de INSERT existentes
DROP POLICY IF EXISTS "Group creators can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Members can invite users to their groups" ON public.group_invites;
DROP POLICY IF EXISTS "Allow group members to create invites" ON public.group_invites;

-- Criar uma política simples e direta sem usar função externa
CREATE POLICY "Group members can send invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verificar diretamente se o usuário é membro do grupo
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_invites.group_id 
    AND group_members.user_id = auth.uid()
  )
);