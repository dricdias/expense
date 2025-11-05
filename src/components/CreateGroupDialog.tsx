import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Users } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "split" | "reimbursement";
}

export const CreateGroupDialog = ({ open, onOpenChange, defaultType = "split" }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [groupType, setGroupType] = useState<"split" | "reimbursement">(defaultType);
  const { createGroup, isCreating } = useGroups();

  const handleSubmit = () => {
    if (!groupName.trim()) return;

    createGroup({ name: groupName, members: [], type: groupType }, {
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
            {groupType === "reimbursement" ? "Criar novo grupo de reembolso" : "Criar novo grupo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-foreground">Nome do grupo</Label>
            <Input id="group-name" placeholder="Ex: Viagem Praia 2025" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Tipo do grupo</Label>
            <RadioGroup value={groupType} onValueChange={(v) => setGroupType(v as "split" | "reimbursement")} className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                <RadioGroupItem value="split" id="type-split" />
                <Label htmlFor="type-split" className="cursor-pointer">Divisão</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                <RadioGroupItem value="reimbursement" id="type-reimbursement" />
                <Label htmlFor="type-reimbursement" className="cursor-pointer">Reembolso</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            {groupType === "reimbursement" ? (
              <>
                <Label className="text-muted-foreground text-sm">Este é um grupo de reembolso</Label>
                <p className="text-xs text-muted-foreground">As despesas não são divididas; o criador deve reembolsar o outro membro. Os acertos funcionam como nos grupos de divisão.</p>
              </>
            ) : (
              <>
                <Label className="text-muted-foreground text-sm">Você será adicionado como criador do grupo</Label>
                <p className="text-xs text-muted-foreground">Outros membros podem ser convidados após criar o grupo</p>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || isCreating} className="bg-primary hover:bg-primary/90">{isCreating ? "Criando..." : "Criar grupo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
