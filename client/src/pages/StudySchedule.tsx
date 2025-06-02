import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, CheckCircle, AlertCircle, Copy, Trash2, Edit3, Download } from "lucide-react";
import AddStudySessionModal from "@/components/AddStudySessionModal";
import EditStudySessionModal from "@/components/EditStudySessionModal";
import { SubjectIcon, getSubjectColor } from "@/components/SubjectIcons";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";
import AuthModal from "@/components/AdminLogin";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StudySession {
  id: string;
  subject: string;
  startDate: string;
  endDate: string;
  lessons: { name: string; completed: boolean }[];
  status: 'active' | 'completed' | 'postponed';
  createdAt: string;
}

export default function StudySchedule() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [importSchedule, setImportSchedule] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    // Check for import parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const importParam = urlParams.get('import');
    if (importParam) {
      try {
        const decodedSchedule = JSON.parse(decodeSchedule(importParam));
        setImportSchedule(decodedSchedule);
        setShowImportModal(true);
        // Remove the import parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        toast({
          title: "خطأ في الرابط",
          description: "الرابط المرسل غير صحيح",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }, [toast]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
  }, [sessions]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for notifications and auto-transfer lessons
  useEffect(() => {
    sessions.forEach(session => {
      if (session.status === 'active') {
        const startTime = new Date(session.startDate);
        const endTime = new Date(session.endDate);
        const timeDiff = startTime.getTime() - currentTime.getTime();
        const minutesLeft = Math.floor(timeDiff / (1000 * 60));

        // 5-minute reminder
        if (minutesLeft === 5 && timeDiff > 0) {
          toast({
            title: "تذكير",
            description: `سيبدأ وقت مذاكرة ${getSubjectName(session.subject)} خلال 5 دقائق`,
            duration: 5000,
          });
        }

        // Auto-transfer when session ends
        if (currentTime >= endTime) {
          autoTransferSession(session.id);
        }
      }
    });
  }, [currentTime, sessions, toast]);

  const getSubjectName = (subject: string) => {
    const subjects: Record<string, string> = {
      arabic: "اللغة العربية",
      english: "اللغة الإنجليزية", 
      math: "الرياضيات",
      chemistry: "الكيمياء",
      physics: "الفيزياء",
      biology: "الأحياء",
      geology: "الجيولوجيا",
      constitution: "الدستور",
      islamic: "التربية الإسلامية"
    };
    return subjects[subject] || subject;
  };

  const addSession = (sessionData: Omit<StudySession, 'id' | 'createdAt'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newSessions = [...sessions, newSession];
    setSessions(newSessions);
    saveDataToFirebase(newSessions);
    setShowAddModal(false);
  };

  const updateSession = (updatedSession: StudySession) => {
    const newSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    setSessions(newSessions);
    saveDataToFirebase(newSessions);
    setEditingSession(null);
  };

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    saveDataToFirebase(newSessions);
  };

  const importSharedSchedule = () => {
    if (!importSchedule) return;

    const newSessions: StudySession[] = importSchedule.sessions.map((session: any) => ({
      ...session,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }));

    const updatedSessions = [...sessions, ...newSessions];
    setSessions(updatedSessions);
    saveDataToFirebase(updatedSessions);
    setShowImportModal(false);
    setImportSchedule(null);

    toast({
      title: "تم استيراد الجدول",
      description: `تم إضافة ${newSessions.length} مادة إلى جدولك`,
      duration: 3000,
    });
  };

  const markLessonCompleted = (sessionId: string, lessonIndex: number) => {
    const updatedSessions = [...sessions];
    const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = { ...updatedSessions[sessionIndex] };
    const updatedLessons = [...session.lessons];
    updatedLessons[lessonIndex].completed = !updatedLessons[lessonIndex].completed;

    if (session.status === 'postponed' && updatedLessons[lessonIndex].completed) {
      // Move completed postponed lesson to achievements of the same subject
      const completedLesson = updatedLessons[lessonIndex];

      // Find existing completed session for this subject or create one
      let targetSessionIndex = updatedSessions.findIndex(s => 
        s.subject === session.subject && s.status === 'completed'
      );

      if (targetSessionIndex === -1) {
        // Create new completed session
        const newCompletedSession: StudySession = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          subject: session.subject,
          startDate: session.startDate,
          endDate: session.endDate,
          lessons: [completedLesson],
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        updatedSessions.push(newCompletedSession);
      } else {
        // Add to existing completed session
        updatedSessions[targetSessionIndex].lessons.push(completedLesson);
      }

      // Remove the lesson from postponed session
      updatedLessons.splice(lessonIndex, 1);

      // If no more lessons in postponed session, remove it
      if (updatedLessons.length === 0) {
        updatedSessions.splice(sessionIndex, 1);
      } else {
        updatedSessions[sessionIndex] = { ...session, lessons: updatedLessons };
      }

      toast({
        title: "تم نقل الدرس",
        description: `تم نقل الدرس إلى إنجازات ${getSubjectName(session.subject)}`,
        duration: 3000,
      });

      setSessions(updatedSessions);
      saveDataToFirebase(updatedSessions);
      return;
    }

    // Regular lesson completion for active sessions
    if (session.status === 'active') {
      // Check if all lessons are completed
      const allCompleted = updatedLessons.every(lesson => lesson.completed);

      let newStatus = session.status;
      if (allCompleted) {
        newStatus = 'completed';
        toast({
          title: "تهانينا! 🎉",
          description: `تم إكمال جميع دروس ${getSubjectName(session.subject)} بنجاح`,
          duration: 5000,
        });
      }

      updatedSessions[sessionIndex] = { ...session, lessons: updatedLessons, status: newStatus };
    }

    setSessions(updatedSessions);
    saveDataToFirebase(updatedSessions);
  };

  const autoTransferSession = (sessionId: string) => {
    const updatedSessions = [...sessions];
    const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = updatedSessions[sessionIndex];

    // Only auto-transfer if session is still active
    if (session.status !== 'active') return;

    const incompleteLessons = session.lessons.filter(l => !l.completed);
    const completedLessons = session.lessons.filter(l => l.completed);

    // Remove the original session
    updatedSessions.splice(sessionIndex, 1);

    // Create postponed session for incomplete lessons if any
    if (incompleteLessons.length > 0) {
      const postponedSession: StudySession = {
        ...session,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        lessons: incompleteLessons.map(l => ({ ...l, completed: false })),
        status: 'postponed',
        createdAt: new Date().toISOString(),
      };
      updatedSessions.push(postponedSession);
    }

    // Create completed session for completed lessons if any
    if (completedLessons.length > 0) {
      // Check if there's already a completed session for this subject
      const existingCompletedIndex = updatedSessions.findIndex(s => 
        s.subject === session.subject && s.status === 'completed'
      );

      if (existingCompletedIndex !== -1) {
        // Add to existing completed session
        updatedSessions[existingCompletedIndex].lessons.push(...completedLessons);
      } else {
        // Create new completed session
        const completedSession: StudySession = {
          ...session,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lessons: completedLessons,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        updatedSessions.push(completedSession);
      }
    }

    setSessions(updatedSessions);
    saveDataToFirebase(updatedSessions);

    toast({
      title: "انتهت جلسة المذاكرة",
      description: "تم نقل الدروس تلقائياً - المكتملة إلى الإنجازات والباقية إلى المؤجلات",
      duration: 5000,
    });
  };

  const postponeSession = (sessionId: string) => {
    const updatedSessions = [...sessions];
    const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = updatedSessions[sessionIndex];
    const incompleteLessons = session.lessons.filter(l => !l.completed);
    const completedLessons = session.lessons.filter(l => l.completed);

    // Remove the original session
    updatedSessions.splice(sessionIndex, 1);

    // Create postponed session for incomplete lessons if any
    if (incompleteLessons.length > 0) {
      const postponedSession: StudySession = {
        ...session,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        lessons: incompleteLessons.map(l => ({ ...l, completed: false })),
        status: 'postponed',
        createdAt: new Date().toISOString(),
      };
      updatedSessions.push(postponedSession);
    }

    // Create completed session for completed lessons if any
    if (completedLessons.length > 0) {
      // Check if there's already a completed session for this subject
      const existingCompletedIndex = updatedSessions.findIndex(s => 
        s.subject === session.subject && s.status === 'completed'
      );

      if (existingCompletedIndex !== -1) {
        // Add to existing completed session
        updatedSessions[existingCompletedIndex].lessons.push(...completedLessons);
      } else {
        // Create new completed session
        const completedSession: StudySession = {
          ...session,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lessons: completedLessons,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        updatedSessions.push(completedSession);
      }
    }

    setSessions(updatedSessions);
    saveDataToFirebase(updatedSessions);

    toast({
      title: "تم التأجيل يدوياً",
      description: "تم نقل الدروس المكتملة إلى الإنجازات والغير مكتملة إلى المؤجلات",
      duration: 3000,
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = currentTime;
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const isSessionActive = (session: StudySession) => {
    const now = currentTime;
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    return now >= start && now <= end && session.status === 'active';
  };



  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "arabic":
        return "📖";
      case "english":
        return "🌍";
      case "math":
        return "🔢";
      case "chemistry":
        return "🧪";
      case "physics":
        return "⚛️";
      case "biology":
        return "🧬";
      case "constitution":
        return "🎓";
      case "islamic":
        return "📕";
      case "geology":
        return "🌍";
      default:
        return "📚";
    }
  };

  const exportToPDF = async () => {
    if (activeSessions.length === 0) {
      toast({
        title: "لا يوجد جدول",
        description: "لا توجد جلسات مذاكرة نشطة لتصديرها",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      // Always use light mode for PDF
      const isDarkMode = false;

      // Create a container for PDF content
      const container = document.createElement("div");
      container.style.direction = "rtl";
      container.style.fontFamily = "'Cairo', 'Arial', sans-serif";
      container.style.padding = "20px";
      container.style.backgroundColor = "#ffffff";
      container.style.color = "#000000";

      // Add CSS for table design
      const themeStyles = `
        <style>
          * {
            font-family: 'Cairo', 'Arial', sans-serif;
            line-height: 1.4;
          }
          .main-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
          }
          .table-header {
            background-color: #f9fafb;
            font-weight: 500;
            padding: 8px 6px;
            border: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
          }
          .table-cell {
            padding: 8px 6px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .subject-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .lessons-list {
            font-size: 13px;
          }
          .lesson-item {
            margin: 2px 0;
            padding: 2px 0;
          }
          .completed-lesson {
            text-decoration: line-through;
            color: #6b7280;
          }
        </style>
      `;

      // Create HTML content
      let htmlContent = themeStyles;

      // Add active sessions table only
      htmlContent += `
        <table class="main-table">
          <thead>
            <tr>
              <th class="table-header" style="width: 18%;">المادة</th>
              <th class="table-header" style="width: 12%;">اليوم</th>
              <th class="table-header" style="width: 12%;">التاريخ</th>
              <th class="table-header" style="width: 15%;">وقت البداية</th>
              <th class="table-header" style="width: 15%;">وقت النهاية</th>
              <th class="table-header" style="width: 28%;">الدروس</th>
            </tr>
          </thead>
          <tbody>
      `;

      activeSessions.forEach(session => {
        htmlContent += `
          <tr>
            <td class="table-cell">
              <div class="subject-name">
                ${getSubjectName(session.subject)}
              </div>
            </td>
            <td class="table-cell" style="text-align: center;">
              ${dayjs(session.startDate).format("dddd")}
            </td>
            <td class="table-cell" style="text-align: center;">
              ${dayjs(session.startDate).format("DD/MM/YYYY")}
            </td>
            <td class="table-cell" style="text-align: center;">
              ${dayjs(session.startDate).format("h:mm A")}
            </td>
            <td class="table-cell" style="text-align: center;">
              ${dayjs(session.endDate).format("h:mm A")}
            </td>
            <td class="table-cell">
              <div class="lessons-list">
                ${session.lessons.map(lesson => `
                  <div class="lesson-item ${lesson.completed ? 'completed-lesson' : ''}">
                    <span style="color: #000000;">●</span> ${lesson.name}
                  </div>
                `).join('')}
              </div>
            </td>
          </tr>
        `;
      });

      htmlContent += `
          </tbody>
        </table>
      `;

      container.innerHTML = htmlContent;

      // PDF options
      const options = {
        margin: [15, 15, 15, 15],
        filename: `جدول_المذاكرة_${dayjs().format("YYYY-MM-DD")}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff"
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generate and download PDF
      await html2pdf().from(container).set(options).save();

      toast({
        title: "تم تصدير الجدول",
        description: "تم تصدير جدول المذاكرة بصيغة PDF بنجاح",
        duration: 3000,
      });

    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير جدول المذاكرة",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Helper functions for encoding
  const encodeSchedule = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const decodeSchedule = (str: string): string => {
    return decodeURIComponent(escape(atob(str)));
  };

  const shareSchedule = () => {
    if (activeSessions.length === 0) {
      toast({
        title: "لا يوجد جدول",
        description: "لا توجد مواد نشطة لمشاركتها",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Create a shareable schedule object
    const shareableSchedule = {
      sessions: activeSessions.map(session => ({
        subject: session.subject,
        startDate: session.startDate,
        endDate: session.endDate,
        lessons: session.lessons.map(l => ({ name: l.name, completed: false }))
      })),
      createdAt: new Date().toISOString()
    };

    // Encode the schedule data
    const encodedSchedule = encodeSchedule(JSON.stringify(shareableSchedule));
    const generatedShareUrl = `${window.location.origin}/study-schedule?import=${encodedSchedule}`;

    setShareUrl(generatedShareUrl);
    setShowShareModal(true);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط المشاركة إلى الحافظة",
        duration: 3000,
      });
      setShowShareModal(false);
    }).catch(() => {
      toast({
        title: "خطأ في النسخ",
        description: "حدث خطأ أثناء نسخ الرابط",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const activeSessions = sessions.filter(s => s.status === 'active')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const postponedSessions = sessions.filter(s => s.status === 'postponed');

  const renderSession = (session: StudySession) => {
    const timeRemaining = getTimeRemaining(session.endDate);
    const active = isSessionActive(session);
    const completedLessons = session.lessons.filter(l => l.completed).length;

    return (
      <Card key={session.id} className={`mb-4 ${active ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center gap-2 flex-wrap">
              <SubjectIcon 
                subject={session.subject} 
                className="h-6 w-6 text-current" 
              />
              <CardTitle className="text-lg">{getSubjectName(session.subject)}</CardTitle>
              {active && <Badge variant="destructive">جاري الآن</Badge>}
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              {session.status === 'active' && session.lessons.some(l => !l.completed) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => postponeSession(session.id)}
                  title="تأجيل الدروس غير المكتملة"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSession(session)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSession(session.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>التاريخ: {dayjs(session.startDate).format("DD/MM/YYYY")}</div>
              <div>اليوم: {dayjs(session.startDate).format("dddd")}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>البداية: {dayjs(session.startDate).format("h:mm A")}</div>
              <div>النهاية: {dayjs(session.endDate).format("h:mm A")}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timeRemaining && active && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">الوقت المتبقي:</span>
              </div>
              <div className="text-2xl font-bold text-center">
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">الدروس ({completedLessons}/{session.lessons.length})</span>
              <div className="text-sm text-muted-foreground">
                {Math.round((completedLessons / session.lessons.length) * 100)}%
              </div>
            </div>

            {session.lessons.map((lesson, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded gap-2">
                <span className={`${lesson.completed ? 'line-through text-muted-foreground' : ''} flex-1 text-sm sm:text-base`}>
                  {lesson.name}
                </span>
                {session.status !== 'completed' && (
                  <Button
                    variant={lesson.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => markLessonCompleted(session.id, index)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {session.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // حفظ البيانات في Firebase
  const saveDataToFirebase = async (newSessions: StudySession[]) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "study-schedules", user.uid);
      await setDoc(userDocRef, {
        sessions: newSessions,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }
  };

  // تحميل البيانات من Firebase
  const loadDataFromFirebase = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "study-schedules", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error loading from Firebase:", error);
    }
  };

  // تحميل البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      loadDataFromFirebase();
    } else {
      // إذا لم يكن هناك مستخدم، مسح البيانات المحلية
      setSessions([]);
    }
  }, [user]);

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">جدول المذاكرة</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportToPDF} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          <Button onClick={shareSchedule} variant="outline" className="w-full sm:w-auto">
            <Copy className="h-4 w-4 ml-2" />
            مشاركة الجدول
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 ml-2" />
            إضافة مادة
          </Button>
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">
            الجدول الحالي ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            الإنجازات ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="postponed">
            المؤجلات ({postponedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد مواد مجدولة حالياً</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4">
                  إضافة مادة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeSessions.map(renderSession)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد إنجازات بعد</p>
              </CardContent>
            </Card>
          ) : (
            completedSessions.map(renderSession)
          )}
        </TabsContent>

        <TabsContent value="postponed" className="mt-6">
          {postponedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد مواد مؤجلة</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {postponedSessions.map(renderSession)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddStudySessionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSession}
      />

      {editingSession && (
        <EditStudySessionModal
          session={editingSession}
          open={!!editingSession}
          onClose={() => setEditingSession(null)}
          onUpdate={updateSession}
        />
      )}

      {/* Share Schedule Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-center">مشاركة جدول المذاكرة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground text-center">
              يمكنك مشاركة هذا الرابط مع الآخرين لإضافة جدولك إلى جدولهم
            </p>

            <div className="bg-muted border rounded-lg p-3">
              <div className="space-y-3">
                <div className="text-sm font-mono break-all leading-relaxed">
                  {shareUrl}
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={copyShareUrl}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    نسخ الرابط
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowShareModal(false)}
                className="flex-1"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Schedule Modal */}
      <Dialog open={showImportModal} onOpenChange={(open) => {
        if (!open) {
          setShowImportModal(false);
          setImportSchedule(null);
        }
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة جدول مذاكرة مشترك</DialogTitle>
          </DialogHeader>

          {importSchedule && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                هل تريد إضافة هذا الجدول إلى جدولك الشخصي؟
              </p>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {importSchedule.sessions.map((session: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SubjectIcon 
                        subject={session.subject} 
                        className={`h-5 w-5 ${getSubjectColor(session.subject)}`} 
                      />
                      <span className="font-medium">{getSubjectName(session.subject)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>من: {dayjs(session.startDate).format("DD/MM/YYYY - h:mm A")}</div>
                      <div>إلى: {dayjs(session.endDate).format("DD/MM/YYYY - h:mm A")}</div>
                      <div className="mt-2">
                        <span className="font-medium">الدروس:</span>
                        <ul className="list-disc list-inside mt-1">
                          {session.lessons.map((lesson: any, lessonIndex: number) => (
                            <li key={lessonIndex} className="text-sm">{lesson.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportSchedule(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={importSharedSchedule}>
                  إضافة الجدول
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}