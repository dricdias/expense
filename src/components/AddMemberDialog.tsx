import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus } from "lucide-react";
import { useSearchUsers, useGroupMembers } from "@/hooks/useGroupMembers";
import { Skeleton } from "@/components/ui/skeleton";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export const AddMemberDialog = ({ open, onOpenChange, groupId }: AddMemberDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, isLoading } = useSearchUsers(searchTerm);
  const { addMember, isAdding, members } = useGroupMembers(groupId);

  console.log('AddMemberDialog - searchTerm:', searchTerm);
  console.log('AddMemberDialog - searchResults:', searchResults);
  console.log('AddMemberDialog - isLoading:', isLoading);

  const handleAddMember = (userId: string) => {
    addMember({ groupId, userId }, {
      onSuccess: () => {
        setSearchTerm("");
        onOpenChange(false);
      }
    });
  };

  const memberIds = members.map((m: any) => m.user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5" />
            Add Member to Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-foreground">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Type at least 3 characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-border pl-9"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {searchTerm.length < 3 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Type at least 3 characters to search
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((user: any) => {
                const isAlreadyMember = memberIds.includes(user.id);
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {user.full_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        {isAlreadyMember && (
                          <p className="text-xs text-muted-foreground">Already a member</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                      disabled={isAdding || isAlreadyMember}
                    >
                      Add
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No users found
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
