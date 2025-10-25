import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
}

export const EditGroupDialog = ({ open, onOpenChange, group }: EditGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const { updateGroup, isUpdating } = useGroups();

  useEffect(() => {
    if (group) {
      setGroupName(group.name || "");
    }
  }, [group]);

  const handleSubmit = () => {
    if (!groupName.trim() || !group) return;

    updateGroup(
      { groupId: group.id, name: groupName },
      {
        onSuccess: () => {
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Edit className="w-5 h-5" />
            Edit Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-foreground">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Ex: Beach Trip 2025"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="bg-background border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || isUpdating} className="bg-primary hover:bg-primary/90">
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
