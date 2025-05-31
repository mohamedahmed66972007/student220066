
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { user, userName, updateUserName, resetPassword, logout } = useAuth();
  const [newName, setNewName] = useState(userName);
  const { toast } = useToast();

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await updateUserName(newName);
      
      if (success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث اسمك بنجاح",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحديث الاسم",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الاسم",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      const success = await resetPassword(user.email);
      
      if (success) {
        toast({
          title: "تم إرسال رابط إعادة تعيين كلمة المرور",
          description: "تحقق من بريدك الإلكتروني",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إرسال رابط إعادة التعيين",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال رابط إعادة التعيين",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "إلى اللقاء!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">حسابي</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="security">الأمان</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              
              <DialogFooter className="justify-end mt-6">
                <Button type="submit">
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>إعادة تعيين كلمة المرور</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                </p>
                <Button onClick={handlePasswordReset} variant="outline" className="w-full">
                  إرسال رابط إعادة التعيين
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>تسجيل الخروج</Label>
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;
