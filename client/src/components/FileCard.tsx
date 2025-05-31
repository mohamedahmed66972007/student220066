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

  const handleViewFile = async () => {
    try {
      // Check if the file path is valid
      if (!file.filePath || file.filePath.trim() === '') {
        toast({
          title: "خطأ",
          description: "رابط الملف غير صالح",
          variant: "destructive",
        });
        return;
      }

      // For Cloudinary URLs, format URL properly
      if (file.filePath.includes('cloudinary.com')) {
        // Create proper Cloudinary URL for viewing
        let viewUrl = file.filePath;
        
        // If it's a raw resource, modify URL to allow inline viewing
        if (viewUrl.includes('/raw/upload/')) {
          viewUrl = viewUrl.replace('/raw/upload/', '/image/upload/fl_attachment/');
        } else if (viewUrl.includes('/upload/')) {
          viewUrl = viewUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        window.open(viewUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For other URLs, open directly
        window.open(file.filePath, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast({
        title: "خطأ",
        description: "فشل في فتح الملف",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async () => {
    try {
      if (!file.filePath || file.filePath.trim() === '') {
        toast({
          title: "خطأ",
          description: "رابط الملف غير صالح",
          variant: "destructive",
        });
        return;
      }

      // Show downloading toast
      toast({
        title: "جاري التحميل...",
        description: "يرجى الانتظار",
      });

      // For Cloudinary, create proper download URL
      if (file.filePath.includes('cloudinary.com')) {
        // Create proper download URL
        let downloadUrl = file.filePath;
        
        // Ensure we use the correct format for download
        if (downloadUrl.includes('/raw/upload/')) {
          downloadUrl = downloadUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
        } else if (downloadUrl.includes('/upload/')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For other files, use direct link
        const link = document.createElement('a');
        link.href = file.filePath;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "تم التحميل",
        description: "تم تحميل الملف بنجاح",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
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