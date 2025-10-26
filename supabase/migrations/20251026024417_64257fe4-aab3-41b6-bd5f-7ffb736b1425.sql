-- Reativar RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Drop política anterior
DROP POLICY IF EXISTS "Authenticated users can create invites" ON public.group_invites;

-- Criar política funcional: usuários autenticados podem criar convites se forem membros do grupo
CREATE POLICY "Members can create invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (
  -- O usuário deve ser membro do grupo E o invited_by deve ser ele mesmo
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_invites.group_id 
    AND group_members.user_id = auth.uid()
    AND auth.uid() = group_invites.invited_by
  )
);