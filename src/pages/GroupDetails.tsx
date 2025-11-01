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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
          navigate('/');
        }
      });
    }
  };

  if (!groupId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Grupo não encontrado</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Voltar para Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            {!group ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{group.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {members?.length || 0} {members?.length === 1 ? 'membro' : 'membros'}
                </p>
              </>
            )}
          </div>
          <Button
            onClick={() => setShowEditGroup(true)}
            size="icon"
            variant="outline"
            className="flex-shrink-0"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-md">
            <TabsTrigger value="expenses" className="text-xs sm:text-sm">Despesas</TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs sm:text-sm">Acertos</TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm">Membros</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">Despesas do Grupo</h2>
              <ExpensesList expenses={expenses || []} isLoading={expensesLoading} groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">Quem Deve para Quem</h2>
              <ExpenseSummary groupId={groupId} />
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Membros do Grupo</h2>
                <Button onClick={() => setShowAddMember(true)} className="w-full sm:w-auto">
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
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(member.profiles?.full_name || 'U').split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {member.profiles?.full_name || 'Usuário'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.profiles?.email || 'Email não disponível'}
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

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddExpense(true)}
        size="lg"
        aria-label="Adicionar despesa"
        className="fixed right-4 bottom-24 sm:right-6 md:bottom-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
      </Button>

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
