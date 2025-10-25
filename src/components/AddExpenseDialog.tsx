import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Upload, X } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { toast } from "@/hooks/use-toast";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
}

export const AddExpenseDialog = ({ open, onOpenChange, groupId }: AddExpenseDialogProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createExpense, isCreating } = useExpenses(groupId);

  const handleSubmit = () => {
    if (!groupId || !description.trim() || !amount.trim()) {
      toast({ title: "Missing fields", description: "Please fill description and amount", variant: "destructive" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    createExpense({ groupId, description, amount: numAmount, receiptFile: receiptFile || undefined }, {
      onSuccess: () => {
        setDescription("");
        setAmount("");
        setReceiptFile(null);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Receipt className="w-5 h-5" />
            Add Expense
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea id="description" placeholder="Ex: Dinner at restaurant" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background border-border resize-none" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-background border-border pl-7" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Receipt (optional)</Label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) { if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Receipt must be less than 5MB", variant: "destructive" }); return; } setReceiptFile(file); }}} className="hidden" />
            {receiptFile ? (
              <div className="border border-border rounded-lg p-4 bg-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReceiptFile(null)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full border-dashed border-2 h-24" onClick={() => fileInputRef.current?.click()}>
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Upload receipt</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max 5MB)</p>
                  </div>
                </div>
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!description.trim() || !amount.trim() || isCreating} className="bg-accent hover:bg-accent/90">{isCreating ? "Adding..." : "Add Expense"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
