import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ExamWeek, Exam, InsertExam, InsertExamWeek } from "@shared/schema";

interface AddExamWeekData {
  weekTitle: string;
  weekId?: number;
  exam: {
    day: string;
    subject: string;
    date: string;
    topics: string[];
  };
}

export const useExams = () => {
  // Fetch exam weeks
  const {
    data: examWeeks,
    isLoading: isLoadingWeeks,
    error: weeksError,
  } = useQuery<ExamWeek[]>({
    queryKey: ["/api/exam-weeks"],
  });

  // Fetch exams
  const {
    data: exams,
    isLoading: isLoadingExams,
    error: examsError,
  } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Add exam week mutation
  const addExamWeekMutation = useMutation({
    mutationFn: async (data: AddExamWeekData) => {
      try {
        // Check if we have a weekId already (adding to existing week)
        let weekId = data.weekId;

        let currentWeekId = weekId;

        if (!currentWeekId) {
          // Create a new exam week
          const examWeekResponse = await apiRequest("POST", "/api/exam-weeks", {
            title: data.weekTitle,
          });

          if (!examWeekResponse.ok) {
            throw new Error('Failed to create exam week');
          }

          const examWeek: ExamWeek = await examWeekResponse.json();
          currentWeekId = examWeek.id;

          // Wait for a short time to ensure week is created
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Add the exam with the current week ID
        const examResponse = await apiRequest("POST", "/api/exams", {
          weekId: currentWeekId,
          day: data.exam.day,
          subject: data.exam.subject,
          date: data.exam.date,
          topics: data.exam.topics,
        });

        if (!examResponse.ok) {
          const errorText = await examResponse.text();
          throw new Error(`Failed to add exam: ${errorText}`);
        }

        return { id: currentWeekId };
      } catch (error) {
        console.error('Error adding exam:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });

  // Delete exam week mutation
  const deleteExamWeekMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exam-weeks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
  });

  return {
    examWeeks: examWeeks || [],
    exams: exams || [],
    isLoading: isLoadingWeeks || isLoadingExams,
    error: weeksError || examsError,
    isAdding: addExamWeekMutation.isPending,
    addExamWeek: addExamWeekMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
    deleteExamWeek: deleteExamWeekMutation.mutateAsync,
  };
};