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
import { subjectOptions } from "./SubjectIcons";
import dayjs from "dayjs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExamModal: React.FC<AddExamModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [topics, setTopics] = useState("");

  const { addExamWeek, isAdding } = useExams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !date || !topics) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      const topicsArray = topics.split("\n").filter(topic => topic.trim());

      if (topicsArray.length === 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال الدروس المقررة",
          variant: "destructive",
        });
        return;
      }

      const examDate = dayjs(date);
      const weekTitle = `امتحان ${subject} - ${examDate.format("DD/MM/YYYY")}`;

      await addExamWeek({
        weekTitle,
        exam: {
          subject,
          date: examDate.format("YYYY-MM-DD"),
          topics: topicsArray,
          day: examDate.format("dddd"),
        },
      });

      toast({
        title: "تم إضافة الاختبار بنجاح",
      });

      setSubject("");
      setDate(undefined);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">إضافة اختبار جديد</DialogTitle>
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

          <div className="space-y-2">
            <Label>التاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? dayjs(date).format("DD/MM/YYYY") : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    const calendarElement = document.querySelector('.rdp');
                    if (calendarElement) {
                      (calendarElement as HTMLElement).style.display = 'none';
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

export default AddExamModal;