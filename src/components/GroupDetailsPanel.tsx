import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Edit, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./AddMemberDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroups } from "@/hooks/useGroups";
import { Skeleton } from "@/components/ui/skeleton";
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

interface GroupDetailsPanelProps {
  groupId: string | null;
}

export const GroupDetailsPanel = ({ groupId }: GroupDetailsPanelProps) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { members, isLoading: loadingMembers } = useGroupMembers(groupId);
  const { groups, deleteGroup } = useGroups();

  const currentGroup = groups?.find((g: any) => g.id === groupId);

  if (!groupId) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Select a group</h3>
            <p className="text-sm text-muted-foreground">Choose a group to manage members</p>
          </div>
        </div>
      </Card>
    );
  }

  if (loadingMembers || !currentGroup) {
    return (
      <Card className="p-6 bg-card border-border">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 bg-card border-border shadow-smooth">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">{currentGroup.name}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowEditGroup(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={() => setShowAddMember(true)} className="w-full" variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Members ({members.length})</h4>
            <div className="space-y-2">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {member.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {member.profiles?.full_name || 'Unknown User'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} groupId={groupId} />
      <EditGroupDialog open={showEditGroup} onOpenChange={setShowEditGroup} group={currentGroup} />
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All expenses and data associated with this group will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGroup(groupId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
