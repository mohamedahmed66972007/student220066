import React from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useToast } from "@/hooks/use-toast";
import { generateQuizPDF } from "@/lib/utils";
import { 
  Play, 
  BarChart2, 
  FileText, 
  Trash2,
  Copy 
} from "lucide-react";
import { getSubjectLightColor, getSubjectName } from "./SubjectIcons";

interface QuizCardProps {
  quiz: Quiz;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const { deleteQuiz } = useQuizzes();
  const { toast } = useToast();
  
  const handleStartQuiz = () => {
    navigate(`/quiz/${quiz.id}`);
  };
  
  const handleViewResults = () => {
    navigate(`/quiz-results/${quiz.id}`);
  };
  
  const handleExportPDF = () => {
    if (!quiz || !quiz.questions) {
      toast({
        title: "خطأ",
        description: "لا يمكن تصدير الاختبار: البيانات غير متوفرة",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = generateQuizPDF(
        quiz.title,
        getSubjectName(quiz.subject as any),
        quiz.creator,
        quiz.questions as any
      );
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quiz.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم تصدير الاختبار",
        description: "تم تصدير الاختبار بصيغة PDF بنجاح",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير الاختبار",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteQuiz = async () => {
    try {
      await deleteQuiz(quiz.id);
      toast({
        title: "تم حذف الاختبار",
        description: "تم حذف الاختبار بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الاختبار",
        variant: "destructive",
      });
    }
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.code);
    toast({
      title: "تم نسخ الرمز",
      description: "تم نسخ رمز الاختبار إلى الحافظة",
    });
  };
  
  const subjectColorClass = getSubjectLightColor(quiz.subject as any);
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg">{quiz.title}</h3>
          <span className={`${subjectColorClass} text-xs px-2 py-1 rounded-full`}>
            {getSubjectName(quiz.subject as any)}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
          عدد الأسئلة: {Array.isArray(quiz.questions) ? quiz.questions.length : 0} سؤال
        </p>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          المنشئ: {quiz.creator}
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
          <span>رمز الاختبار: </span>
          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mx-2">
            {quiz.code}
          </span>
          <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-6 w-6">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between p-6 pt-0">
        <Button onClick={handleStartQuiz} className="flex items-center space-x-1 space-x-reverse">
          <Play className="h-4 w-4 ml-1" />
          <span>بدء الاختبار</span>
        </Button>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleViewResults}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
          
          
          
          {(isAdmin || (quiz.creator === localStorage.getItem('creatorName'))) && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDeleteQuiz}
              className="bg-red-100 dark:bg-red-900 hover:bg-red-200 text-red-700 dark:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
