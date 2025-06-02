
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { useFiles } from "@/hooks/useFiles";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useExams } from "@/hooks/useExams";
import { FileText, BookOpen, GraduationCap, Users } from "lucide-react";

export default function Analytics() {
  const { isAdmin } = useAuth();
  const { files } = useFiles();
  const { quizzes } = useQuizzes();
  const { exams } = useExams();
  
  const [visitorCount, setVisitorCount] = React.useState(0);
  
  React.useEffect(() => {
    fetch('/api/visitors')
      .then(res => res.json())
      .then(data => setVisitorCount(data.visitors))
      .catch(console.error);
  }, []);

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">لوحة التحليلات</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الملفات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاختبارات الإكترونية</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاختبارات القصيرة</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الزوار</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitorCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
