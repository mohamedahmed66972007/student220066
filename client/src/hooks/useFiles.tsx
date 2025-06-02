import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { File, InsertFile } from "@shared/schema";
import { Subject } from "@/components/SubjectIcons";

interface FilesFilters {
  subject?: Subject | "all";
  semester?: string;
}

interface FileUpload extends Omit<InsertFile, "filePath"> {
  file: Blob;
}

export const useFiles = (filters: FilesFilters = {}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Construct query parameters
  const queryParams = new URLSearchParams();
  if (filters.subject && filters.subject !== "all") queryParams.append("subject", filters.subject);
  if (filters.semester && filters.semester !== "all") queryParams.append("semester", filters.semester);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  // Fetch files
  const { data: files, isLoading, error, refetch } = useQuery<File[]>({
    queryKey: ["/api/files", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subject && filters.subject !== "all") params.append("subject", filters.subject);
      if (filters.semester && filters.semester !== "all") params.append("semester", filters.semester);
      
      const response = await fetch(`/api/files?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    enabled: true,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  // Upload file
  const uploadFile = async (fileData: FileUpload): Promise<File> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", fileData.title);
      formData.append("subject", fileData.subject);
      formData.append("semester", fileData.semester);
      formData.append("fileName", fileData.fileName);
      formData.append("file", fileData.file);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const newFile = await response.json();

      // Refetch files after upload
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });

      return newFile;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    files,
    isLoading,
    error,
    isUploading,
    refetch,
    deleteFile: deleteMutation.mutateAsync,
    uploadFile,
  };
};