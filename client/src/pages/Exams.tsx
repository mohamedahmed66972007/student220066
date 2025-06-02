import React, { useState } from "react";
import { useExams } from "@/hooks/useExams";
import { useAuth } from "@/hooks/useAuth";
import ExamList from "@/components/ExamWeek";
import AddExamModal from "@/components/AddExamModal";
import { Button } from "@/components/ui/button";
import { PlusIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

const Exams: React.FC = () => {
  const { isAdmin } = useAuth();
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const { exams, examWeeks, isLoading, error, deleteExam } = useExams();
  const { toast } = useToast();

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

  const exportToPDF = async () => {
    if (!examWeeks || examWeeks.length === 0) {
      toast({
        title: "لا يوجد جدول",
        description: "لا توجد امتحانات لتصديرها",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
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
          .week-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            padding: 10px;
            background-color: #f3f4f6;
            border-right: 4px solid #3b82f6;
          }
          .main-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 30px 0;
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
          }
          .lessons-list {
            font-size: 13px;
          }
          .lesson-item {
            margin: 2px 0;
            padding: 2px 0;
          }
        </style>
      `;

      // Create HTML content
      let htmlContent = themeStyles;

      // Get all exams and sort them by date
      const allExams = exams || [];
      const sortedExams = allExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (sortedExams.length > 0) {
        htmlContent += `
          <table class="main-table">
            <thead>
              <tr>
                <th class="table-header" style="width: 25%;">المادة</th>
                <th class="table-header" style="width: 15%;">اليوم</th>
                <th class="table-header" style="width: 20%;">التاريخ</th>
                <th class="table-header" style="width: 40%;">الدروس المقررة</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        sortedExams.forEach(exam => {
          htmlContent += `
            <tr>
              <td class="table-cell">
                <div class="subject-name">
                  ${getSubjectName(exam.subject)}
                </div>
              </td>
              <td class="table-cell" style="text-align: center;">
                ${exam.day}
              </td>
              <td class="table-cell" style="text-align: center;">
                ${dayjs(exam.date).format("DD/MM/YYYY")}
              </td>
              <td class="table-cell">
                <div class="lessons-list">
                  ${exam.topics.map(topic => `
                    <div class="lesson-item">
                      <span style="color: #000000;">●</span> ${topic}
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
      }

      container.innerHTML = htmlContent;

      // PDF options
      const options = {
        margin: [15, 15, 15, 15],
        filename: `جدول_الامتحانات_${dayjs().format("YYYY-MM-DD")}.pdf`,
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
        description: "تم تصدير جدول الامتحانات بصيغة PDF بنجاح",
        duration: 3000,
      });

    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير جدول الامتحانات",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">جدول الاختبارات</h2>

        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          {isAdmin && (
            <Button 
              onClick={() => setShowAddExamModal(true)} 
              className="flex items-center space-x-1 space-x-reverse"
            >
              <PlusIcon className="h-4 w-4 ml-2" />
              <span>إضافة اختبار</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4">جاري تحميل جدول الاختبارات...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">
          <p>حدث خطأ أثناء تحميل جدول الاختبارات. يرجى المحاولة مرة أخرى.</p>
        </div>
      ) : exams && exams.length > 0 ? (
        <ExamList 
          exams={exams} 
          onDelete={deleteExam}
        />
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">لا توجد اختبارات متاحة حالياً</p>
          {isAdmin && (
            <Button onClick={() => setShowAddExamModal(true)} variant="outline" className="mt-4">
              إضافة اختبار
            </Button>
          )}
        </div>
      )}

      <AddExamModal 
        isOpen={showAddExamModal} 
        onClose={() => setShowAddExamModal(false)} 
      />
    </div>
  );
};

export default Exams;