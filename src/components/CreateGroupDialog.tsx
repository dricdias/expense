import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Users } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGroupDialog = ({ open, onOpenChange }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const { createGroup, isCreating } = useGroups();

  const handleSubmit = () => {
    if (!groupName.trim()) return;

    createGroup({ name: groupName, members: [] }, {
      onSuccess: () => {
        setGroupName("");
        setMembers([""]);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-foreground">Group Name</Label>
            <Input id="group-name" placeholder="Ex: Beach Trip 2025" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">You will be added as the group creator</Label>
            <p className="text-xs text-muted-foreground">Other members can be invited after creating the group</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || isCreating} className="bg-primary hover:bg-primary/90">{isCreating ? "Creating..." : "Create Group"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
