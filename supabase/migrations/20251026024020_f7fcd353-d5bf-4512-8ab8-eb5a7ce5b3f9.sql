-- Vamos criar uma política temporária muito permissiva para identificar o problema
DROP POLICY IF EXISTS "Group members can send invites" ON public.group_invites;

-- Política temporária: qualquer usuário autenticado pode criar convites
-- (vamos refinar depois)
CREATE POLICY "Authenticated users can create invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = invited_by);