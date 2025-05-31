import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cloudinaryStorageService } from "@/lib/storage";
import { FileData } from "@shared/schema";

export function useFiles(subject?: string, semester?: string) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let filesData: FileData[] = [];

      if (subject) {
        filesData = await cloudinaryStorageService.getFilesBySubject(subject);
      } else if (semester) {
        filesData = await cloudinaryStorageService.getFilesBySemester(semester);
      } else {
        filesData = await cloudinaryStorageService.getFiles();
      }

      setFiles(filesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الملفات";
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, title: string, subject: string, semester: string) => {
    try {
      const newFile = await cloudinaryStorageService.uploadFile(file, title, subject, semester);
      setFiles(prev => [newFile, ...prev]);

      toast({
        title: "نجح الرفع",
        description: "تم رفع الملف بنجاح",
      });

      return newFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "فشل في رفع الملف";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      await cloudinaryStorageService.deleteFile(fileId, filePath);
      setFiles(prev => prev.filter(file => file.id !== fileId));

      toast({
        title: "تم الحذف",
        description: "تم حذف الملف بنجاح",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "فشل في حذف الملف";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [subject, semester]);

  return {
    files,
    isLoading,
    error,
    uploadFile,
    deleteFile,
    refetch: fetchFiles
  };
}