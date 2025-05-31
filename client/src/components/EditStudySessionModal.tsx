
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudySession } from "@/pages/StudySchedule";
import { SubjectIcon, getSubjectColor, subjectOptions } from "@/components/SubjectIcons";
import { Plus, X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useToast } from "@/hooks/use-toast";

// Custom TimePicker Component
function TimePicker({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [period, setPeriod] = useState('AM');
  const [step, setStep] = useState<'hours' | 'minutes' | 'period'>('hours');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const periodValue = hour24 >= 12 ? 'PM' : 'AM';
      
      setHours(hour12.toString());
      setMinutes(m);
      setPeriod(periodValue);
    } else {
      // Reset to default values when no value
      setHours('');
      setMinutes('');
      setPeriod('AM');
    }
  }, [value]);

  const handleTimeComplete = () => {
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeValue = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    onChange(timeValue);
    setIsOpen(false);
    setStep('hours');
  };

  const handleHourSelect = (hour: string) => {
    setHours(hour);
    setStep('minutes');
  };

  const handleMinuteSelect = (minute: string) => {
    setMinutes(minute);
    setStep('period');
  };

  const handlePeriodSelect = (selectedPeriod: string) => {
    // Extract AM/PM from the Arabic text
    const actualPeriod = selectedPeriod.includes('AM') ? 'AM' : 'PM';
    setPeriod(actualPeriod);
    
    // Use the extracted period for calculation
    let hour24 = parseInt(hours);
    if (actualPeriod === 'PM' && hour24 !== 12) hour24 += 12;
    if (actualPeriod === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeValue = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    onChange(timeValue);
    setIsOpen(false);
    setStep('hours');
  };

  const formatDisplayTime = (value: string) => {
    if (!value) return placeholder;
    const [h, m] = value.split(':');
    const hour24 = parseInt(h);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const periodValue = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${periodValue}`;
  };

  const timeOptions = {
    hours: Array.from({ length: 12 }, (_, i) => (i + 1).toString()),
    minutes: Array.from({ length: 12 }, (_, i) => (i * 5).toString()),
    periods: ['AM (صباحا)', 'PM (مساء)']
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setStep('hours');
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-right font-normal mt-2 h-11",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="ml-2 h-5 w-5" />
          {formatDisplayTime(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 bg-background border rounded-lg shadow-lg">
          {step === 'hours' && (
            <>
              <div className="text-center mb-4 font-medium">اختر الساعة</div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {timeOptions.hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={cn(
                      "p-3 text-center hover:bg-accent transition-colors border rounded-md",
                      hours === hour && "bg-primary text-primary-foreground"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'minutes' && (
            <>
              <div className="text-center mb-4 font-medium">اختر الدقائق</div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {timeOptions.minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      "p-3 text-center hover:bg-accent transition-colors border rounded-md",
                      minutes === minute && "bg-primary text-primary-foreground"
                    )}
                  >
                    {minute.padStart(2, '0')}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'period' && (
            <>
              <div className="text-center mb-4 font-medium">اختر الفترة</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {timeOptions.periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodSelect(p)}
                    className={cn(
                      "p-3 text-center hover:bg-accent transition-colors border rounded-md",
                      (period === 'AM' && p.includes('AM')) || (period === 'PM' && p.includes('PM')) ? "bg-primary text-primary-foreground" : ""
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}

          {step !== 'hours' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (step === 'minutes') setStep('hours');
                  else if (step === 'period') setStep('minutes');
                }}
                className="flex-1"
              >
                السابق
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setStep('hours');
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface EditStudySessionModalProps {
  session: StudySession;
  open: boolean;
  onClose: () => void;
  onUpdate: (session: StudySession) => void;
}

export default function EditStudySessionModal({ session, open, onClose, onUpdate }: EditStudySessionModalProps) {
  const [subject, setSubject] = useState(session.subject);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lessons, setLessons] = useState(session.lessons.map(l => l.name));
  const [status, setStatus] = useState(session.status);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSubject(session.subject);
    setStatus(session.status);
    setLessons(session.lessons.map(l => l.name));
    
    // Extract date and times from session
    const startDateTime = dayjs(session.startDate);
    const endDateTime = dayjs(session.endDate);
    
    setDate(startDateTime.toDate());
    setStartTime(startDateTime.format("HH:mm"));
    setEndTime(endDateTime.format("HH:mm"));
  }, [session]);

  const addLesson = () => {
    setLessons(prev => [...prev, ""]);
  };

  const removeLesson = (index: number) => {
    setLessons(prev => prev.filter((_, i) => i !== index));
  };

  const updateLesson = (index: number, value: string) => {
    setLessons(prev => prev.map((lesson, i) => i === index ? value : lesson));
  };

  const checkTimeConflict = (newStartTime: string, newEndTime: string, newDate: Date): boolean => {
    const existingSessions = JSON.parse(localStorage.getItem('studySessions') || '[]') as StudySession[];
    const newDateStr = dayjs(newDate).format("YYYY-MM-DD");
    
    for (const existingSession of existingSessions) {
      // Skip checking against the current session being edited
      if (existingSession.id === session.id || existingSession.status !== 'active') {
        continue;
      }
      
      const sessionDate = dayjs(existingSession.startDate).format("YYYY-MM-DD");
      
      if (sessionDate === newDateStr) {
        const sessionStart = dayjs(existingSession.startDate).format("HH:mm");
        const sessionEnd = dayjs(existingSession.endDate).format("HH:mm");
        
        // Check for time overlap
        const newStart = dayjs(`${newDateStr} ${newStartTime}`);
        const newEnd = dayjs(`${newDateStr} ${newEndTime}`);
        const existingStart = dayjs(`${newDateStr} ${sessionStart}`);
        const existingEnd = dayjs(`${newDateStr} ${sessionEnd}`);
        
        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          const subjectName = subjectOptions.find(s => s.value === existingSession.subject)?.label || existingSession.subject;
          const newSubjectName = subjectOptions.find(s => s.value === subject)?.label || subject;
          
          toast({
            title: "تعارض في الوقت",
            description: `مادة ${newSubjectName} تتعارض مع مادة ${subjectName} في نفس الوقت`,
            variant: "destructive",
            duration: 5000,
          });
          return true;
        }
      }
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !date || !startTime || !endTime || lessons.some(l => !l.trim())) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check if end time is after start time
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    
    if (end <= start) {
      toast({
        title: "خطأ في الوقت",
        description: "وقت النهاية يجب أن يكون بعد وقت البداية",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check for time conflicts
    if (checkTimeConflict(startTime, endTime, date)) {
      return;
    }

    const updatedLessons = lessons.filter(l => l.trim()).map((name, index) => ({
      name: name.trim(),
      completed: session.lessons[index]?.completed || false
    }));

    // Combine date with times
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const startDateTime = `${dateStr}T${startTime}`;
    const endDateTime = `${dateStr}T${endTime}`;

    onUpdate({
      ...session,
      subject,
      startDate: startDateTime,
      endDate: endDateTime,
      lessons: updatedLessons,
      status
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل المادة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="subject" className="text-base font-medium">المادة</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((subj) => (
                  <SelectItem key={subj.value} value={subj.value}>
                    <div className="flex items-center gap-2">
                      <SubjectIcon 
                        subject={subj.value as any} 
                        className="h-4 w-4"
                      />
                      {subj.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="text-base font-medium">الحالة</Label>
            <Select value={status} onValueChange={(value: 'active' | 'completed' | 'postponed') => setStatus(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="postponed">مؤجل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium">التاريخ</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal mt-2 h-11",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-5 w-5" />
                  {date ? dayjs(date).format("DD/MM/YYYY") : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">وقت البداية</Label>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="اختر وقت البداية"
              />
            </div>
            
            <div>
              <Label className="text-base font-medium">وقت النهاية</Label>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="اختر وقت النهاية"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">الدروس المطلوب مذاكرتها</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLesson}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`الدرس ${index + 1}`}
                    value={lesson}
                    onChange={(e) => updateLesson(index, e.target.value)}
                    required
                    className="h-11"
                  />
                  {lessons.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLesson(index)}
                      className="h-11 w-11 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1 h-11">
              حفظ التغييرات
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-11">
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
