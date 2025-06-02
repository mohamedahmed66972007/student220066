import React from "react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { File } from "@shared/schema";
import { SubjectIcon, getSubjectName, getSubjectColor, getSubjectImage } from "./SubjectIcons";
import { Eye, Download, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFiles } from "@/hooks/useFiles";
import { useToast } from "@/hooks/use-toast";

interface FileCardProps {
  file: File;
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {
  const { isAdmin } = useAuth();
  const { deleteFile } = useFiles();
  const { toast } = useToast();
  
  const handleViewFile = () => {
    window.open(file.filePath, "_blank");
  };
  
  const handleDownloadFile = () => {
    const a = document.createElement("a");
    a.href = file.filePath;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleDeleteFile = async () => {
    try {
      await deleteFile(file.id);
      toast({
        title: "تم حذف الملف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الملف",
        variant: "destructive",
      });
    }
  };
  
  const subjectName = getSubjectName(file.subject as any);
  const subjectColor = getSubjectColor(file.subject as any);
  const subjectImage = getSubjectImage(file.subject as any);
  
  return (
    <Card className="file-card overflow-hidden">
      <CardHeader className="p-4">
        <div className="relative flex flex-col items-center">
          <div className={`${subjectColor} p-4 rounded-full mb-2 flex items-center justify-center`}>
            <SubjectIcon subject={file.subject as any} size={24} className="text-white" />
          </div>
          <div className="text-sm font-medium">
            {subjectName}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2">{file.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {file.semester === "first" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني"} - الصف الثاني عشر
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200"
          onClick={handleViewFile}
        >
          <Eye className="h-4 w-4 ml-1" />
          <span>عرض</span>
        </Button>
        <Button
          variant="outline"
          className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200"
          onClick={handleDownloadFile}
        >
          <Download className="h-4 w-4 ml-1" />
          <span>تحميل</span>
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200"
            onClick={handleDeleteFile}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FileCard;
