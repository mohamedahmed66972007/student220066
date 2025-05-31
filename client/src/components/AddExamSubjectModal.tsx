import React, { useState } from "react";
import { useExams } from "@/hooks/useExams";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subjectOptions, dayOptions } from "./SubjectIcons";

interface AddExamSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: number;
  weekTitle: string;
}

const AddExamSubjectModal: React.FC<AddExamSubjectModalProps> = ({ 
  isOpen, 
  onClose,
  weekId,
  weekTitle
}) => {
  const [day, setDay] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [topics, setTopics] = useState("");

  const { addExamWeek, isAdding } = useExams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!day || !subject || !date || !topics) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      // Split topics by new lines
      const topicsArray = topics.split("\n").filter(topic => topic.trim());

      if (topicsArray.length === 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال الدروس المقررة",
          variant: "destructive",
        });
        return;
      }

      await addExamWeek({
        weekTitle: weekTitle,
        weekId: weekId,
        exam: {
          day,
          subject,
          date,
          topics: topicsArray,
        },
      });

      toast({
        title: "تم إضافة الاختبار بنجاح",
      });

      // Reset form and close modal
      setDay("");
      setSubject("");
      setDate("");
      setTopics("");
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الاختبار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">إضافة مادة للأسبوع</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-muted-foreground mb-2">
            إضافة اختبار لأسبوع: {weekTitle}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">اليوم</Label>
              <Select value={day} onValueChange={setDay} required>
                <SelectTrigger id="day">
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">المادة</Label>
              <Select value={subject} onValueChange={setSubject} required>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">التاريخ</Label>
            <Input
              id="date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              placeholder="مثال: 10 أكتوبر 2023"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">الدروس المقررة</Label>
            <Textarea
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={3}
              placeholder="أدخل الدروس المقررة (درس واحد في كل سطر)"
              required
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
                <>
                  <span className="animate-spin ml-2">◌</span>
                  جاري الإضافة...
                </>
              ) : (
                "إضافة الاختبار"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExamSubjectModal;