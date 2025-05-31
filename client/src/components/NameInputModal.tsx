
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NameInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNameSubmit: (name: string) => void;
  title: string;
}

const NameInputModal: React.FC<NameInputModalProps> = ({ 
  isOpen, 
  onClose, 
  onNameSubmit, 
  title 
}) => {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسمك",
        variant: "destructive",
      });
      return;
    }

    onNameSubmit(name.trim());
    setName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-name">اسمك</Label>
            <Input
              id="guest-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              required
              autoFocus
            />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            سجل حساباً للحصول على تجربة أفضل وحفظ تقدمك
          </p>
          
          <DialogFooter className="justify-end mt-6">
            <Button type="submit">
              متابعة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NameInputModal;
