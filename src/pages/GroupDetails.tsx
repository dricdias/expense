import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Users, Settings } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ExpensesList } from "@/components/ExpensesList";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroups } from "@/hooks/useGroups";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { EditGroupDialog } from "@/components/EditGroupDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { expenses, isLoading: expensesLoading } = useExpenses(groupId || null);
  const { groups, deleteGroup } = useGroups();
  const { members, isLoading: membersLoading } = useGroupMembers(groupId || null);
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const group = groups?.find((g: any) => g.id === groupId);

  const handleDeleteGroup = () => {
    if (groupId) {
      deleteGroup(groupId, {
        onSuccess: () => {
          navigate('/groups');
        }
      });
    }
  };

  if (!groupId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Grupo não encontrado</p>
          <Button onClick={() => navigate('/groups')} className="mt-4">
            Voltar para Grupos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/groups')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              {!group ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {members?.length || 0} {members?.length === 1 ? 'membro' : 'membros'}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowAddExpense(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Despesa
            </Button>
            <Button
              onClick={() => setShowEditGroup(true)}
              size="lg"
              variant="outline"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="settlements">Acertos</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Despesas do Grupo</h2>
              <ExpensesList expenses={expenses || []} isLoading={expensesLoading} groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Quem Deve para Quem</h2>
              <ExpenseSummary groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Membros do Grupo</h2>
                <Button onClick={() => setShowAddMember(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>

              {membersLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="p-6 bg-card border-border">
                      <Skeleton className="h-12 w-full" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members?.map((member: any) => (
                    <Card key={member.id} className="p-4 bg-card border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.profiles?.full_name || 'Usuário'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-6 mt-6 border-destructive/50 bg-destructive/5">
                <h3 className="font-semibold text-foreground mb-2">Zona de Perigo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Excluir este grupo removerá todas as despesas e acertos associados.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Excluir Grupo
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        groupId={groupId}
      />
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        groupId={groupId}
      />
      <EditGroupDialog
        open={showEditGroup}
        onOpenChange={setShowEditGroup}
        group={group}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo
              e todas as despesas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupDetails;
