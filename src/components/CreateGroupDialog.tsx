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
    const validMembers = members.filter(m => m.trim() !== "");
    if (validMembers.length === 0) return;

    createGroup({ name: groupName, members: validMembers }, {
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Members (Email or Name)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setMembers([...members, ""])} className="border-border">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <Input placeholder={`Member ${index + 1}`} value={member} onChange={(e) => { const newMembers = [...members]; newMembers[index] = e.target.value; setMembers(newMembers); }} className="bg-background border-border" />
                  {members.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setMembers(members.filter((_, i) => i !== index))} className="shrink-0"><X className="w-4 h-4" /></Button>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || members.every(m => !m.trim()) || isCreating} className="bg-primary hover:bg-primary/90">{isCreating ? "Creating..." : "Create Group"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
